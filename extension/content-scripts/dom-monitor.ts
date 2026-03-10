/**
 * Social Media & Chat Monitoring Content Script
 * Uses MutationObserver to detect new posts/messages on social platforms
 * Instagram support prioritized for hackathon
 */

import type { PlasmoCSConfig } from "plasmo";
import { detectPII, DetectionContext } from '../detection/pii-detector';

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
      'div[aria-label="Tweet text"]',
      'div[data-testid="tweetText"]',
      'div[lang]', // Tweet content
    ],
    messages: [
      'div[data-testid="messageEntry"]',
      'div[data-testid="conversation"]',
    ],
  },

  facebook: {
    posts: [
      'div[data-testid="post_message"]',
      'div[role="feed"] div[role="article"]',
      'div[class*="text"]',
    ],
    messages: [
      'div[data-pagelet="chattab"]',
      'div[class*="message"]',
    ],
  },

  tiktok: {
    posts: [
      'div[data-e2e="comment-desc"]',
      'div[class*="comment"]',
    ],
    bio: [
      'h2[class*="author"]',
      'div[class*="desc"]',
    ],
  },

  discord: {
    messages: [
      'div[data-slate-node="text"]',
      'div[class*="messageContent"]',
      'li[class*="message"]',
    ],
  },

  youtube: {
    comments: [
      'yt-formatted-string#content-text',
      'ytd-comment-renderer #content-text',
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

      // If high risk, show warning
      if (response && response.block) {
        highlightRiskyElement(element, response.risk);
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

              // Check on input
              htmlTextarea.addEventListener('input', debounce(() => {
                checkElementForPII(htmlTextarea);
              }, 1000));

              // Check on blur
              htmlTextarea.addEventListener('blur', () => {
                checkElementForPII(htmlTextarea);
              });
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

  // Monitor comment boxes
  const commentBoxes = document.querySelectorAll('textarea[placeholder*="comment"], textarea[placeholder*="Comment"]');
  commentBoxes.forEach((box) => {
    const textarea = box as HTMLTextAreaElement;

    const checkComment = () => {
      if (textarea.value.length > 3) {
        checkElementForPII(textarea);
      }
    };

    textarea.addEventListener('input', debounce(checkComment, 1000));
    textarea.addEventListener('blur', checkComment);
  });

  // Monitor bio section
  const bioSections = document.querySelectorAll('div[class*="bio"], div[role="button"]');
  bioSections.forEach((bio) => {
    checkElementForPII(bio);
  });

  // Monitor story replies
  const storyReplyButtons = document.querySelectorAll('button[aria-label*="Reply"], button[aria-label*="reply"]');
  storyReplyButtons.forEach((button) => {
    button.addEventListener('click', () => {
      setTimeout(() => {
        const replyInput = document.querySelector('input[placeholder*="Reply"], textarea[placeholder*="reply"]');
        if (replyInput) {
          checkElementForPII(replyInput);
        }
      }, 500);
    });
  });
}

// Initialize Instagram-specific monitoring if on Instagram
if (window.location.hostname.includes('instagram.com')) {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', monitorInstagramSpecific);
  } else {
    setTimeout(monitorInstagramSpecific, 2000);
  }
}
