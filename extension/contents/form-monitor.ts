/**
 * Form Submission Monitoring Content Script
 * Intercepts form submissions and monitors real-time input for PII
 */

import type { PlasmoCSConfig } from "plasmo";
import { detectPII } from '../detection/pii-detector';
import { showPrivacyAlert } from '../utils/alert-overlay';
import { loadSettings, isQuietHours, SENSITIVITY_THRESHOLDS } from '../utils/settings';

export const config: PlasmoCSConfig = {
  matches: ["<all_urls>"],
  run_at: "document_idle"
};

console.log('Privacy Shadow: Form monitor active');

function detectPlatform(url: string): 'instagram' | 'twitter' | 'facebook' | 'tiktok' | 'youtube' | 'discord' | 'generic' {
  const hostname = new URL(url).hostname.toLowerCase();
  if (hostname.includes('instagram.com')) return 'instagram';
  if (hostname.includes('twitter.com') || hostname.includes('x.com')) return 'twitter';
  if (hostname.includes('facebook.com') || hostname.includes('fb.com')) return 'facebook';
  if (hostname.includes('tiktok.com')) return 'tiktok';
  if (hostname.includes('youtube.com')) return 'youtube';
  if (hostname.includes('discord.com')) return 'discord';
  return 'generic';
}

function extractFormData(form: HTMLFormElement): string {
  const formData = new FormData(form);
  const textParts: string[] = [];
  for (const [, value] of formData.entries()) {
    if (typeof value === 'string') textParts.push(value);
  }
  form.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>(
    'input[type="text"], input[type="email"], input[type="tel"], textarea'
  ).forEach(input => {
    if (input.value && !textParts.includes(input.value)) textParts.push(input.value);
  });
  return textParts.join(' ');
}

const monitoredInputs = new WeakSet<Element>();

function attachInputMonitor(el: Element): void {
  if (monitoredInputs.has(el)) return;
  monitoredInputs.add(el);

  let timer: ReturnType<typeof setTimeout>;
  let lastChecked = '';
  let lastWarnedValue = '';

  // Only check on BLUR (when user leaves the field), not while typing
  el.addEventListener('blur', async () => {
    clearTimeout(timer);
    timer = setTimeout(async () => {
      const value = el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement
        ? el.value
        : (el as HTMLElement).innerText || '';

      if (value === lastChecked || value.length < 5) return;
      if (value === lastWarnedValue) return; // Don't warn again for same value
      if (value.length < 10) return; // Require at least 10 characters

      lastChecked = value;

      const platform = detectPlatform(window.location.href);
      const detected = detectPII(value, {
        platform,
        isPublic: true,
        isDirectMessage: window.location.href.includes('/messages/') || window.location.href.includes('/dm/'),
      });

      if (detected.length === 0) return;

      // Check settings: enabled flag, quiet hours, sensitivity threshold
      const settings = await loadSettings();
      if (settings.enabled === false) return;
      if (isQuietHours(settings)) return;

      const threshold = SENSITIVITY_THRESHOLDS[settings.sensitivity];
      const score = Math.min(detected.length * 30, 100);

      const reasons = [...new Set(detected.map(p => p.description))];
      const level: string = score >= 60 ? 'critical' : score >= 30 ? 'high' : 'medium';

      chrome.runtime.sendMessage({
        type: 'FORM_SUBMISSION',
        data: { pii: detected, context: { platform, isPublic: true, isDirectMessage: false, formType: 'realtime' }, formId: (el as HTMLElement).id || '' }
      }).catch(() => {});

      lastWarnedValue = value; // Remember we warned about this value

      showPrivacyAlert({
        risk: { level, score, reasons, detectedTypes: detected.map(p => p.type) },
        onContinue: () => {
          lastChecked = value;
          // Don't clear lastWarnedValue on continue - user acknowledged the risk
        },
        onCancel: () => {
          if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
            el.value = '';
            el.focus();
          } else {
            (el as HTMLElement).innerText = '';
            (el as HTMLElement).focus();
          }
          lastChecked = '';
          lastWarnedValue = '';
        },
      });
    }, 300); // Short delay on blur to prevent immediate popup
  }, true); // Use capture phase to catch blur before other handlers

  // Store value on focus to detect if it changed
  el.addEventListener('focus', () => {
    clearTimeout(timer);
  }, true);
}

function scanAndAttach(): void {
  const sel = 'input[type="text"], input[type="email"], input[type="tel"], input:not([type]), textarea, [contenteditable="true"]';
  document.querySelectorAll(sel).forEach(attachInputMonitor);
}

async function handleFormSubmit(event: Event): Promise<void> {
  const form = event.target as HTMLFormElement;
  if (!form) return;
  const text = extractFormData(form);
  if (!text || text.trim().length < 3) return;

  const platform = detectPlatform(window.location.href);
  const detected = detectPII(text, { platform, isPublic: true, isDirectMessage: false });
  if (detected.length === 0) return;

  event.preventDefault();
  event.stopImmediatePropagation();

  const reasons = [...new Set(detected.map(p => p.description))];
  const score = Math.min(detected.length * 30, 100);
  const level: string = score >= 60 ? 'critical' : score >= 30 ? 'high' : 'medium';

  showPrivacyAlert({
    risk: { level, score, reasons },
    onContinue: () => form.submit(),
    onCancel: () => {},
  });
}

function init(): void {
  document.addEventListener('submit', handleFormSubmit, true);
  scanAndAttach();
  new MutationObserver(scanAndAttach).observe(
    document.body || document.documentElement,
    { childList: true, subtree: true }
  );
  console.log('Privacy Shadow: Form monitor ready');
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === 'CHECK_FORMS') sendResponse({ formCount: document.querySelectorAll('form').length });
  return true;
});
