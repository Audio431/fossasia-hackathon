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

/**
 * Safely send message to background script with error handling
 */
function safeSendMessage(message: any): void {
  try {
    chrome.runtime.sendMessage(message).catch((error) => {
      // Silently handle context invalidation errors
      if (error.message?.includes('Extension context invalidated')) {
        console.log('Privacy Shadow: Extension reloaded, content script will be reinitialized');
      } else {
        console.error('Privacy Shadow: Error sending message:', error);
      }
    });
  } catch (error) {
    // Extension context already invalidated
    console.log('Privacy Shadow: Extension context invalidated');
  }
}

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
  let acknowledgedValue = ''; // Track what user has acknowledged

  // Only check on BLUR (when user leaves the field), not while typing
  el.addEventListener('blur', async () => {
    clearTimeout(timer);
    timer = setTimeout(async () => {
      const value = el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement
        ? el.value
        : (el as HTMLElement).innerText || '';

      if (value === lastChecked || value.length < 5) return;
      if (value === acknowledgedValue) return; // Already acknowledged this value!
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

      safeSendMessage({
        type: 'FORM_SUBMISSION',
        data: { pii: detected, context: { platform, isPublic: true, isDirectMessage: false, formType: 'realtime' }, formId: (el as HTMLElement).id || '' }
      });

      showPrivacyAlert({
        risk: { level, score, reasons, detectedTypes: detected.map(p => p.type) },
        onContinue: () => {
          // User acknowledged the risk - remember this value
          acknowledgedValue = value;
          lastChecked = value;
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
          acknowledgedValue = '';
        },
      });
    }, 300); // Short delay on blur to prevent immediate popup
  }, true); // Use capture phase to catch blur before other handlers

  // Reset acknowledged value when user changes the text
  el.addEventListener('input', () => {
    const value = el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement
      ? el.value
      : (el as HTMLElement).innerText || '';

    // If the value changed from what was acknowledged, reset
    if (value !== acknowledgedValue) {
      // Don't reset acknowledgedValue immediately - keep it until blur
      // This prevents warnings while typing
    }
  }, true);

  // Clear acknowledged value when focusing (user might be about to edit)
  el.addEventListener('focus', () => {
    clearTimeout(timer);
    // Don't reset acknowledgedValue on focus - only on actual value change
  }, true);
}

function scanAndAttach(): void {
  const sel = 'input[type="text"], input[type="email"], input[type="tel"], input:not([type]), textarea, [contenteditable="true"]';
  document.querySelectorAll(sel).forEach(attachInputMonitor);
}

/**
 * Highlight a message/element containing PII with a red warning box
 */
function highlightPII(element: HTMLElement, detected: any[]): void {
  // Skip if already highlighted
  if (element.hasAttribute('data-pii-highlighted')) return;

  // Mark as highlighted
  element.setAttribute('data-pii-highlighted', 'true');

  // Create warning wrapper
  const wrapper = document.createElement('div');
  wrapper.className = 'privacy-shadow-pii-wrapper';
  wrapper.style.cssText = `
    position: relative;
    display: inline-block;
    width: 100%;
    border: 3px solid #ef4444;
    border-radius: 8px;
    background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
    padding: 12px;
    margin: 8px 0;
    box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
    animation: pii-pulse 2s ease-in-out infinite;
  `;

  // Add dismiss button
  const dismissBtn = document.createElement('button');
  dismissBtn.textContent = '✕';
  dismissBtn.style.cssText = `
    position: absolute;
    top: -8px;
    left: -8px;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background: #ef4444;
    color: white;
    border: 2px solid white;
    cursor: pointer;
    font-size: 12px;
    font-weight: bold;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1001;
    box-shadow: 0 2px 8px rgba(239, 68, 68, 0.4);
  `;
  dismissBtn.title = 'Dismiss warning';
  dismissBtn.onclick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    wrapper.style.border = '2px solid #f59e0b';
    wrapper.style.background = '#fffbeb';
    badge.textContent = '⚠️ PII NOTED';
    badge.style.background = '#f59e0b';
    dismissBtn.remove();
  };
  wrapper.appendChild(dismissBtn);

  // Add warning badge
  const badge = document.createElement('div');
  badge.style.cssText = `
    position: absolute;
    top: -12px;
    right: -12px;
    background: #ef4444;
    color: white;
    padding: 4px 12px;
    border-radius: 20px;
    font-size: 12px;
    font-weight: bold;
    box-shadow: 0 2px 8px rgba(239, 68, 68, 0.4);
    z-index: 1000;
    white-space: nowrap;
  `;
  badge.innerHTML = '⚠️ PII SHARED';
  wrapper.appendChild(badge);

  // Add warning message
  const warning = document.createElement('div');
  warning.className = 'privacy-shadow-pii-warning';
  warning.style.cssText = `
    margin-top: 8px;
    padding: 8px;
    background: rgba(239, 68, 68, 0.1);
    border-radius: 4px;
    font-size: 12px;
    color: #991b1b;
  `;
  const piiTypes = [...new Set(detected.map(p => p.type))].join(', ');
  warning.innerHTML = `<strong>⛔ Warning:</strong> You shared sensitive info: <strong>${piiTypes}</strong>`;
  wrapper.appendChild(warning);

  // Wrap the element
  element.parentNode?.insertBefore(wrapper, element);
  wrapper.appendChild(element);

  // Add pulsing animation
  if (!document.getElementById('privacy-shadow-styles')) {
    const style = document.createElement('style');
    style.id = 'privacy-shadow-styles';
    style.textContent = `
      @keyframes pii-pulse {
        0%, 100% { box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3); }
        50% { box-shadow: 0 4px 20px rgba(239, 68, 68, 0.6); }
      }
    `;
    document.head.appendChild(style);
  }

  console.log('Privacy Shadow: Highlighted PII message', detected);
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
    onContinue: () => {
      // Highlight the form after user confirms
      highlightPII(form, detected);
      form.submit();
    },
    onCancel: () => {},
  });
}

/**
 * Monitor for sent messages in chat interfaces (DM, comments, etc.)
 */
function monitorSentMessages(): void {
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          const element = node as Element;

          // Check for newly sent messages in Instagram DMs
          if (element.classList.contains('x9f619') ||
              element.querySelector('.x9f619') !== null) {

            // Check if this is a user-sent message
            const messageContainer = element.closest('[class*="message"]');
            if (messageContainer) {
              // Look for sent message indicator (right-aligned usually)
              const style = window.getComputedStyle(messageContainer);
              const isSent = style.alignItems === 'flex-end' ||
                             style.justifyContent === 'flex-end';

              if (isSent) {
                const text = element.textContent?.trim() || '';
                if (text.length >= 10) { // Only check substantial messages
                  const platform = detectPlatform(window.location.href);
                  const detected = detectPII(text, {
                    platform,
                    isPublic: false,
                    isDirectMessage: true,
                  });

                  if (detected.length > 0) {
                    // Highlight the sent message
                    setTimeout(() => {
                      highlightPII(messageContainer as HTMLElement, detected);
                    }, 100);
                  }
                }
              }
            }
          }

          // Check for submitted form inputs
          const inputs = element.querySelectorAll('input, textarea');
          inputs.forEach(input => {
            if (input instanceof HTMLInputElement || input instanceof HTMLTextAreaElement) {
              const value = input.value.trim();
              if (value.length >= 10) {
                const platform = detectPlatform(window.location.href);
                const detected = detectPII(value, {
                  platform,
                  isPublic: true,
                  isDirectMessage: false,
                });

                if (detected.length > 0 && !input.hasAttribute('data-pii-checked')) {
                  input.setAttribute('data-pii-checked', 'true');
                  setTimeout(() => {
                    highlightPII(input, detected);
                  }, 100);
                }
              }
            }
          });
        }
      });
    });
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
}

function init(): void {
  document.addEventListener('submit', handleFormSubmit, true);
  scanAndAttach();
  monitorSentMessages(); // NEW: Monitor for sent messages
  new MutationObserver(scanAndAttach).observe(
    document.body || document.documentElement,
    { childList: true, subtree: true }
  );

  // Handle extension reload
  if (chrome.runtime?.id) {
    chrome.runtime.onConnect.addListener((port) => {
      port.onDisconnect.addListener(() => {
        // Extension was reloaded, show notification
        showReloadNotification();
      });
    });
  }

  console.log('Privacy Shadow: Form monitor ready');
}

/**
 * Show notification when extension is reloaded
 */
function showReloadNotification(): void {
  const notification = document.createElement('div');
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: #3b82f6;
    color: white;
    padding: 12px 20px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    z-index: 999999;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-size: 14px;
    animation: slideIn 0.3s ease-out;
  `;
  notification.innerHTML = '🔄 Privacy Shadow extension updated! Refresh the page for latest features.';

  const style = document.createElement('style');
  style.textContent = `
    @keyframes slideIn {
      from { transform: translateX(100%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
  `;

  document.head.appendChild(style);
  document.body.appendChild(notification);

  // Auto-remove after 5 seconds
  setTimeout(() => {
    notification.style.animation = 'slideIn 0.3s ease-out reverse';
    setTimeout(() => notification.remove(), 300);
  }, 5000);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

// Listen for extension unload to handle context invalidation
chrome.runtime.onConnect.addListener((port) => {
  port.onDisconnect.addListener(() => {
    console.log('Privacy Shadow: Extension context invalidated, cleanup needed');
  });
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  try {
    if (message.type === 'CHECK_FORMS') {
      sendResponse({ formCount: document.querySelectorAll('form').length });
    }
  } catch (error) {
    console.log('Privacy Shadow: Error in message listener:', error);
  }
  return true;
});

// Handle page unload
window.addEventListener('unload', () => {
  console.log('Privacy Shadow: Page unloading, cleaning up');
});
