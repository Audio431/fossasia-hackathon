/**
 * Social Media & Chat Monitoring Content Script
 * Uses MutationObserver to detect new posts/messages on social platforms
 * Instagram support prioritized for hackathon
 */

import type { PlasmoCSConfig } from "plasmo";
import { detectPII, DetectionContext } from '../detection/pii-detector';
import { showPrivacyAlert } from '../utils/alert-overlay';

export const config: PlasmoCSConfig = {
  matches: [
    "https://www.instagram.com/*",
    "https://twitter.com/*",
    "https://x.com/*",
    "https://www.facebook.com/*",
    "https://www.tiktok.com/*",
    "https://www.youtube.com/*",
    "https://discord.com/*"
  ],
  run_at: "document_idle"
};

console.log('Privacy Shadow: Social media monitor active');

/**
 * Platform-specific selectors for detecting posts and messages
 * Instagram prioritized for hackathon
 */
const PLATFORM_SELECTORS = {
  instagram: {
    // Instagram post captions and comments
    posts: [
      'div[data-testid="post-comment-root"]',
      'article div[role="button"]',
      'div[aria-label*="Comment"]',
      'textarea[placeholder*="Comment"]',
      'textarea[placeholder*="Add a comment"]',
    ],
    // Instagram bio and profile info
    bio: [
      'div.-qQT3', // Instagram bio class (may change)
      'header section ul li span',
      'h2[class*="username"]',
    ],
    // Instagram DM
    messages: [
      'div[role="log"]',
      'div[data-testid="conversation-panel-messages"]',
    ],
    // Instagram story replies
    stories: [
      'div[role="dialog"] canvas',
      'button[aria-label="Reply"]',
    ],
  },

  twitter: {
    posts: [
      // Tweet compose area (current X/Twitter)
      'div[data-testid="tweetTextarea_0"]',
      'div[data-testid="tweetTextarea_0_label"]',
      'div[aria-label="Tweet text"]',
      'div[aria-label="Post text"]',
      'div[data-testid="tweetText"]',
      'div[lang]',
    ],
    messages: [
      // DM compose
      'div[data-testid="dmComposerTextInput"]',
      'div[data-testid="messageEntry"]',
      'div[data-testid="conversation"]',
    ],
    reply: [
      'div[aria-label*="Reply"]',
      'div[data-testid="reply"]',
    ],
  },

  facebook: {
    posts: [
      // News feed post composer
      'div[contenteditable="true"][aria-label*="mind"]',
      'div[contenteditable="true"][aria-label*="Write something"]',
      // Story / reel captions
      'div[contenteditable="true"][aria-label*="story"]',
      'div[role="feed"] div[role="article"]',
      'div[data-testid="post_message"]',
    ],
    comments: [
      // Comment input boxes
      'div[contenteditable="true"][aria-label*="comment"]',
      'div[contenteditable="true"][aria-label*="Comment"]',
    ],
    messages: [
      // Messenger
      'div[contenteditable="true"][aria-label*="Message"]',
      'div[contenteditable="true"][data-lexical-editor]',
      'div[class*="message"]',
    ],
  },

  tiktok: {
    posts: [
      'div[data-e2e="comment-desc"]',
      'div[class*="comment"]',
      'span[data-e2e="video-desc"]',
    ],
    inputs: [
      // Comment input
      'div[contenteditable="true"][placeholder*="comment"]',
      'div[contenteditable="true"][data-e2e*="comment"]',
      'div[class*="commentInput"]',
    ],
    bio: [
      'h2[class*="author"]',
      'h2[data-e2e="user-bio"]',
      'div[data-e2e="user-bio"]',
      'div[class*="desc"]',
    ],
  },

  discord: {
    messages: [
      // Already-rendered messages
      'div[class*="messageContent"]',
      'li[class*="message"]',
    ],
    inputs: [
      // Message compose area
      'div[contenteditable="true"][data-slate-editor]',
      'div[role="textbox"][aria-multiline="true"]',
      'div[aria-label*="Message"]',
    ],
  },

  youtube: {
    comments: [
      'yt-formatted-string#content-text',
      'ytd-comment-renderer #content-text',
    ],
    inputs: [
      // Comment composer
      'div#contenteditable-root[contenteditable="true"]',
      'ytd-commentbox div[contenteditable="true"]',
    ],
  },
};

/**
 * Detect current platform
 */
function detectPlatform(url: string): keyof typeof PLATFORM_SELECTORS | 'generic' {
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
 * Get detection context for current page
 */
function getDetectionContext(): DetectionContext {
  const url = window.location.href;
  const platform = detectPlatform(url);

  return {
    platform,
    isPublic: !url.includes('/messages/') && !url.includes('/dm/'),
    isDirectMessage: url.includes('/messages/') || url.includes('/dm/'),
    hasMedia: false, // Will be updated dynamically
  };
}

/**
 * Extract text content from an element
 */
function extractTextContent(element: Element): string {
  // Get direct text content, not from child elements
  let text = '';

  if (element.textContent) {
    text = element.textContent.trim();
  }

  // Remove common UI text that's not user content
  const noise = ['reply', 'comment', 'send', 'like', 'share', 'view', 'see more', 'show more'];
  text = text.toLowerCase().split(' ').filter(word => !noise.includes(word)).join(' ');

  return text;
}

/**
 * Check element for PII
 */
async function checkElementForPII(element: Element): Promise<void> {
  const text = extractTextContent(element);

  // Skip if too short or too long (likely not user content)
  if (text.length < 3 || text.length > 5000) return;

  // Skip if it's just navigation text
  if (/^(home|search|notifications|profile|settings|help|log in|sign up)$/i.test(text)) return;

  const context = getDetectionContext();
  const detectedPII = detectPII(text, context);

  if (detectedPII.length > 0) {
    console.log('Privacy Shadow: PII detected in DOM element', { text: text.substring(0, 100), detectedPII });

    // Send to background for risk assessment
    try {
      const response = await chrome.runtime.sendMessage({
        type: 'SOCIAL_POST_DETECTED',
        data: {
          pii: detectedPII,
          context,
          textPreview: text.substring(0, 200),
          elementId: element.id || '',
          elementClass: element.className || '',
        }
      });

      // If high risk, show warning overlay
      if (response && response.block) {
        const reasons = detectedPII.map((p: any) => p.description);
        const score = Math.min(detectedPII.length * 30, 100);
        const level: string = score >= 60 ? 'critical' : score >= 30 ? 'high' : 'medium';
        showPrivacyAlert({
          risk: { level, score, reasons },
          onContinue: () => {},
          onCancel: () => highlightRiskyElement(element, response.risk),
        });
      }
    } catch (error) {
      console.error('Privacy Shadow: Error in social monitoring', error);
    }
  }
}

/**
 * Highlight risky element on page
 */
function highlightRiskyElement(element: Element, risk: any): void {
  const htmlEl = element as HTMLElement;
  htmlEl.setAttribute('data-privacy-shadow-risk', risk.level);
  htmlEl.style.outline = risk.level === 'critical' ? '3px solid red' : '2px solid orange';
  htmlEl.style.outlineOffset = '2px';

  // Remove highlight after 5 seconds
  setTimeout(() => {
    htmlEl.removeAttribute('data-privacy-shadow-risk');
    htmlEl.style.outline = '';
    htmlEl.style.outlineOffset = '';
  }, 5000);
}

/**
 * Monitor for new content using MutationObserver
 */
function initializeDOMMonitoring(): void {
  console.log('Privacy Shadow: Initializing DOM monitoring');

  const context = getDetectionContext();

  // Get selectors for current platform
  const selectors = context.platform !== 'generic'
    ? PLATFORM_SELECTORS[context.platform as keyof typeof PLATFORM_SELECTORS]
    : undefined;

  if (selectors && context.platform !== 'generic') {
    // Check existing content
    const allSelectors = (Object.values(selectors) as string[][]).flat();
    allSelectors.forEach((selector) => {
      try {
        const elements = document.querySelectorAll(selector);
        elements.forEach((element) => {
          checkElementForPII(element);
        });
      } catch (error) {
        console.error('Privacy Shadow: Error with selector', selector, error);
      }
    });
  }

  // Set up MutationObserver for new content
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          const element = node as Element;

          // Check if element matches known selectors
          if (selectors) {
            const allSelectors = (Object.values(selectors) as string[][]).flat();
            allSelectors.forEach((selector) => {
              try {
                if (element.matches(selector)) {
                  checkElementForPII(element);
                }

                // Check child elements
                const children = element.querySelectorAll(selector);
                children.forEach((child) => {
                  checkElementForPII(child);
                });
              } catch (error) {
                // Selector syntax error, skip
              }
            });
          }

          // Special handling for Instagram (hackathon priority)
          if (context.platform === 'instagram') {
            // Monitor all textareas (comment boxes)
            const textareas = element.tagName === 'TEXTAREA'
              ? [element]
              : Array.from(element.querySelectorAll('textarea'));

            textareas.forEach((textarea: Element) => {
              const htmlTextarea = textarea as HTMLTextAreaElement;

              // Check if already monitored by another PS script
              if ((htmlTextarea as HTMLElement).hasAttribute('data-ps-monitoring')) {
                return;
              }

              // ONLY check on blur (when leaving the field), NOT while typing
              htmlTextarea.addEventListener('blur', () => {
                checkElementForPII(htmlTextarea);
              });

              // Mark as monitored
              (htmlTextarea as HTMLElement).setAttribute('data-ps-monitoring', 'dom');
            });

            // Monitor bio edits
            const bioElements = element.querySelectorAll('div[class*="bio"]');
            bioElements.forEach((bio) => {
              checkElementForPII(bio);
            });
          }
        }
      });
    });
  });

  // Start observing
  observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: false,
    characterData: true,
  });

  console.log('Privacy Shadow: DOM monitoring active for platform:', context.platform);
}

/**
 * Debounce function to prevent too many checks
 */
function debounce<T extends (...args: any[]) => void>(func: T, wait: number): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Initialize when DOM is ready
 */
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeDOMMonitoring);
} else {
  // Small delay to ensure platform scripts have loaded
  setTimeout(initializeDOMMonitoring, 1000);
}

/**
 * Handle messages from background script
 */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'SCAN_PAGE') {
    const context = getDetectionContext();
    sendResponse({ platform: context.platform, url: window.location.href });
  }

  if (message.type === 'CHECK_ELEMENT') {
    const element = document.querySelector(message.selector);
    if (element) {
      checkElementForPII(element);
      sendResponse({ checked: true });
    } else {
      sendResponse({ checked: false });
    }
  }

  return true;
});

/**
 * Instagram-specific monitoring (priority for hackathon)
 */
function monitorInstagramSpecific(): void {
  console.log('Privacy Shadow: Instagram-specific monitoring active');

  // Track active input elements
  const monitoredInputs = new Set<Element>();
  let warningOverlay: HTMLElement | null = null;

  // Track acknowledged warnings to prevent repeated warnings for same content
  const acknowledgedWarnings = new Map<Element, string>(); // element -> content hash

  /**
   * Show warning overlay to block PII sharing
   */
  function showWarningOverlay(detectedPII: any[], inputElement: Element, contentHash: string): void {
    console.log('Privacy Shadow: showWarningOverlay called!', detectedPII);

    // Don't show multiple warnings
    if (warningOverlay && warningOverlay.parentNode) {
      console.log('Privacy Shadow: Overlay already exists, skipping');
      return;
    }

    // Create warning overlay
    warningOverlay = document.createElement('div');
    warningOverlay.id = 'privacy-shadow-warning';
    warningOverlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.85);
      z-index: 999999;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    `;

    const riskScore = detectedPII.length * 30;
    const riskLevel = riskScore > 50 ? 'high' : 'medium';

    warningOverlay.innerHTML = `
      <div style="
        background: white;
        border-radius: 16px;
        padding: 24px;
        max-width: 400px;
        box-shadow: 0 20px 60px rgba(0,0,0,0.3);
        animation: slideUp 0.3s ease-out;
      ">
        <div style="text-align: center;">
          <div style="font-size: 48px; margin-bottom: 16px;">
            ${riskLevel === 'high' ? '🛑' : '⚠️'}
          </div>
          <h2 style="
            margin: 0 0 8px 0;
            font-size: 24px;
            font-weight: bold;
            color: ${riskLevel === 'high' ? '#dc2626' : '#f59e0b'};
          ">
            ${riskLevel === 'high' ? 'STOP!' : 'Wait!'}
          </h2>
          <p style="margin: 0 0 16px 0; color: #666; font-size: 14px;">
            You're about to share sensitive information:
          </p>
          <ul style="
            text-align: left;
            background: ${riskLevel === 'high' ? '#fee2e2' : '#fef3c7'};
            padding: 16px;
            border-radius: 8px;
            margin: 0 0 20px 0;
          ">
            ${detectedPII.map(pii => `
              <li style="margin: 4px 0; color: ${riskLevel === 'high' ? '#991b1b' : '#92400e'};">
                • ${pii.description}
              </li>
            `).join('')}
          </ul>
          <p style="margin: 0 0 20px 0; font-size: 13px; color: #666;">
            This could be seen by people you don't know.
          </p>
          <div style="display: flex; gap: 12px;">
            <button id="privacy-shadow-cancel" style="
              flex: 1;
              padding: 12px 20px;
              border: none;
              border-radius: 8px;
              background: #e5e7eb;
              color: #374151;
              font-size: 16px;
              font-weight: 600;
              cursor: pointer;
            ">
              Nevermind
            </button>
            <button id="privacy-shadow-continue" style="
              flex: 1;
              padding: 12px 20px;
              border: none;
              border-radius: 8px;
              background: ${riskLevel === 'high' ? '#dc2626' : '#f59e0b'};
              color: white;
              font-size: 16px;
              font-weight: 600;
              cursor: pointer;
            ">
              I Understand
            </button>
          </div>
        </div>
      </div>
      <style>
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      </style>
    `;

    document.body.appendChild(warningOverlay);
    console.log('Privacy Shadow: Overlay added to DOM!');

    // Add event listeners to buttons
    const cancelButton = document.getElementById('privacy-shadow-cancel');
    const continueButton = document.getElementById('privacy-shadow-continue');

    if (cancelButton) {
      cancelButton.addEventListener('click', () => {
        // Clear the input
        if (inputElement instanceof HTMLTextAreaElement) {
          inputElement.value = '';
        } else if (inputElement instanceof HTMLInputElement) {
          inputElement.value = '';
        } else if (inputElement instanceof HTMLElement) {
          // Handle contenteditable divs (Instagram DMs)
          inputElement.textContent = '';
        }
        // Clear acknowledgement since content is being removed
        acknowledgedWarnings.delete(inputElement);
        removeWarningOverlay();
        // Send alert to background
        sendAlertToBackground(detectedPII, 'cancelled');
      });
    }

    if (continueButton) {
      continueButton.addEventListener('click', () => {
        // Store that user acknowledged this specific content
        acknowledgedWarnings.set(inputElement, contentHash);
        console.log('Privacy Shadow: User acknowledged warning, storing content hash');
        removeWarningOverlay();
        // Send alert to background even if they continue
        sendAlertToBackground(detectedPII, 'acknowledged');
      });
    }
  }

  /**
   * Remove warning overlay
   */
  function removeWarningOverlay(): void {
    if (warningOverlay && warningOverlay.parentNode) {
      warningOverlay.parentNode.removeChild(warningOverlay);
      warningOverlay = null;
    }
  }

  /**
   * Send alert to background script
   */
  function sendAlertToBackground(detectedPII: any[], action: string): void {
    chrome.runtime.sendMessage({
      type: 'SOCIAL_POST_DETECTED',
      data: {
        pii: detectedPII,
        context: {
          platform: 'instagram',
          isPublic: false,
          isDirectMessage: true,
          hasMedia: false
        },
        textPreview: 'PII detected in Instagram DM',
        userAction: action
      }
    }, (response) => {
      console.log('Alert sent to background, response:', response);
    });
  }

  /**
   * Real-time PII check on input
   */
  function checkInputRealTime(inputElement: Element): void {
    console.log('Privacy Shadow: checkInputRealTime called!');

    // Get text content
    let text = '';
    if (inputElement instanceof HTMLTextAreaElement) {
      text = inputElement.value;
    } else if (inputElement instanceof HTMLInputElement) {
      text = inputElement.value;
    } else if (inputElement instanceof HTMLElement) {
      text = inputElement.textContent || '';
    }

    console.log('Privacy Shadow: Checking text:', text.substring(0, 50));

    // Skip if text is too short
    if (text.length < 3) {
      console.log('Privacy Shadow: Text too short, skipping');
      return;
    }

    // Check for PII
    const context = {
      platform: 'instagram' as const,
      isPublic: false,
      isDirectMessage: true,
      hasMedia: false
    };

    const detectedPII = detectPII(text, context);
    console.log('Privacy Shadow: PII detected:', detectedPII.length, 'items');

    // Show warning if PII detected
    if (detectedPII.length > 0) {
      // Create a simple hash of the current content
      const contentHash = text.length + ':' + text.substring(0, 50);
      const previousHash = acknowledgedWarnings.get(inputElement);

      // Only show warning if this is different content than what was acknowledged
      if (previousHash !== contentHash) {
        console.log('Privacy Shadow: New PII content, showing warning!');
        showWarningOverlay(detectedPII, inputElement, contentHash);
      } else {
        console.log('Privacy Shadow: User already acknowledged this content, skipping warning');
      }
    } else {
      console.log('Privacy Shadow: No PII detected');
      // Clear acknowledgement if content changed to non-PII
      acknowledgedWarnings.delete(inputElement);
    }
  }

  // Monitor all textareas and contenteditable divs for real-time checking
  const monitorInput = (element: Element) => {
    if (monitoredInputs.has(element)) {
      return;
    }

    // Check if another Privacy Shadow monitor is already attached
    if ((element as HTMLElement).hasAttribute('data-ps-monitoring')) {
      console.log('Privacy Shadow: Element already monitored by another PS script, skipping');
      return;
    }

    monitoredInputs.add(element);
    (element as HTMLElement).setAttribute('data-ps-monitoring', 'dom');
    console.log('Privacy Shadow: Now monitoring element:', element.tagName, element.className);

    // ONLY check on blur (when leaving the field), NOT while typing
    // This prevents annoying popups while the user is still typing
    element.addEventListener('blur', (e) => {
      const target = e.target as Element;
      console.log('Privacy Shadow: Blur event detected!');
      setTimeout(() => {
        checkInputRealTime(target);
      }, 300); // Increased delay to match form-monitor
    });
  };

  // Monitor comment boxes
  const commentBoxes = document.querySelectorAll('textarea[placeholder*="comment"], textarea[placeholder*="Comment"]');
  commentBoxes.forEach(monitorInput);

  // Monitor DM message boxes (contenteditable divs)
  const messageBoxes = document.querySelectorAll('div[contenteditable="true"], div[role="textbox"]');
  messageBoxes.forEach(monitorInput);

  // Monitor bio section
  const bioSections = document.querySelectorAll('div[class*="bio"], div[role="button"]');
  bioSections.forEach((bio) => {
    checkElementForPII(bio);
  });

  // Monitor for new elements ( MutationObserver )
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          const element = node as Element;

          // Check for new textareas or contenteditable divs
          const textareas = element.tagName === 'TEXTAREA'
            ? [element]
            : Array.from(element.querySelectorAll('textarea'));
          textareas.forEach(monitorInput);

          const contentEditables = element.getAttribute('contenteditable') === 'true'
            ? [element]
            : Array.from(element.querySelectorAll('div[contenteditable="true"]'));
          contentEditables.forEach(monitorInput);
        }
      });
    });
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });

  console.log('Privacy Shadow: Real-time blocking enabled for Instagram DMs');
}

// Initialize Instagram-specific monitoring if on Instagram
// DISABLED: This creates duplicate alerts with form-monitor.ts and stranger-monitor.ts
// Those two monitors already handle Instagram inputs properly with blur events
// if (window.location.hostname.includes('instagram.com')) {
//   if (document.readyState === 'loading') {
//     document.addEventListener('DOMContentLoaded', monitorInstagramSpecific);
//   } else {
//     setTimeout(monitorInstagramSpecific, 2000);
//   }
// }
