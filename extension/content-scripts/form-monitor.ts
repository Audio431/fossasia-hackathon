/**
 * Form Submission Monitoring Content Script
 * Intercepts form submissions before they happen to detect PII
 */

import type { PlasmoCSConfig } from "plasmo";
import { detectPII } from '../detection/pii-detector';

export const config: PlasmoCSConfig = {
  matches: ["<all_urls>"],
  run_at: "document_start"
};

console.log('Privacy Shadow: Form monitor active');

/**
 * Detect platform from URL
 */
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

/**
 * Extract text from form inputs
 */
function extractFormData(form: HTMLFormElement): string {
  const formData = new FormData(form);
  const textParts: string[] = [];

  // Get all form fields
  for (const [key, value] of formData.entries()) {
    if (typeof value === 'string') {
      textParts.push(value);
    }
  }

  // Also check textareas and inputs not in FormData
  const textInputs = form.querySelectorAll('input[type="text"], input[type="email"], input[type="tel"], textarea');
  textInputs.forEach((input: Element) => {
    const htmlInput = input as HTMLInputElement | HTMLTextAreaElement;
    if (htmlInput.value && !textParts.includes(htmlInput.value)) {
      textParts.push(htmlInput.value);
    }
  });

  return textParts.join(' ');
}

/**
 * Get context information about the form
 */
function getFormContext(form: HTMLFormElement) {
  const url = window.location.href;
  const platform = detectPlatform(url);

  // Check if form is for registration, comment, post, etc.
  const formId = form.id || '';
  const formClass = form.className || '';
  const formAction = form.action || '';

  let formType = 'unknown';
  if (formId.includes('comment') || formClass.includes('comment')) formType = 'comment';
  else if (formId.includes('post') || formClass.includes('post')) formType = 'post';
  else if (formId.includes('signup') || formClass.includes('signup') || formId.includes('register')) formType = 'registration';
  else if (formId.includes('message') || formClass.includes('message') || formId.includes('dm')) formType = 'message';
  else if (formId.includes('profile') || formClass.includes('profile')) formType = 'profile';

  // Check if it's a public form
  const isPublic = formType === 'post' || formType === 'comment' || formType === 'profile';

  return {
    platform,
    isPublic,
    isDirectMessage: formType === 'message',
    formType,
    url,
    formId,
    formClass,
    formAction,
  };
}

/**
 * Handle form submission
 */
async function handleFormSubmit(event: Event): Promise<boolean> {
  const form = event.target as HTMLFormElement;
  if (!form) return false;

  // Extract form data
  const formData = extractFormData(form);

  // Skip if no text data
  if (!formData || formData.trim().length < 3) return false;

  // Get context
  const context = getFormContext(form);

  // Detect PII
  const detectedPII = detectPII(formData, context);

  // If PII detected, send to background service worker
  if (detectedPII.length > 0) {
    console.log('Privacy Shadow: PII detected in form', { detectedPII, context });

    // Prevent default submission
    event.preventDefault();
    event.stopImmediatePropagation();

    // Send to background for risk assessment
    try {
      const response = await chrome.runtime.sendMessage({
        type: 'FORM_SUBMISSION',
        data: {
          pii: detectedPII,
          context,
          formData: formData.substring(0, 500), // Truncate for privacy
          formId: context.formId,
          formType: context.formType,
        }
      });

      if (response && response.block) {
        // Show kid alert
        showKidAlert(response.risk);
        return false; // Don't allow submission
      } else {
        // Allow submission
        form.submit();
        return true;
      }
    } catch (error) {
      console.error('Privacy Shadow: Error communicating with background', error);
      // Allow submission if error occurs
      form.submit();
      return true;
    }
  }

  return false; // No PII, allow normal submission
}

/**
 * Show kid alert overlay
 */
function showKidAlert(risk: any): void {
  // This will be handled by the background script injecting the alert component
  console.log('Showing kid alert for risk:', risk);
}

/**
 * Initialize form monitoring
 */
function initializeFormMonitor(): void {
  console.log('Privacy Shadow: Initializing form monitor');

  // Use capture phase to intercept before other handlers
  document.addEventListener('submit', handleFormSubmit, true);

  // Also monitor for dynamically added forms
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          const element = node as Element;

          // Check if it's a form
          if (element.tagName === 'FORM') {
            console.log('Privacy Shadow: New form detected');
          }

          // Check for forms within added elements
          const forms = element.querySelectorAll('form');
          if (forms.length > 0) {
            console.log(`Privacy Shadow: ${forms.length} form(s) detected in new content`);
          }
        }
      });
    });
  });

  // Start observing
  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });

  console.log('Privacy Shadow: Form monitor ready');
}

/**
 * Start monitoring when DOM is ready
 */
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeFormMonitor);
} else {
  initializeFormMonitor();
}

/**
 * Handle messages from background script
 */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'CHECK_FORMS') {
    const forms = document.querySelectorAll('form');
    sendResponse({ formCount: forms.length });
  }

  if (message.type === 'GET_FORM_DATA') {
    const form = document.getElementById(message.formId) as HTMLFormElement;
    if (form) {
      const data = extractFormData(form);
      sendResponse({ formData: data });
    }
  }

  return true;
});
