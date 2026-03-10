/**
 * Instagram-Specific Form Monitor
 * Targets Instagram's unique DOM structure for DMs and comments
 */

import type { PlasmoCSConfig } from "plasmo";
import { detectPII, calculatePIIRiskScore } from '../detection/pii-detector';
import { showPrivacyAlert } from '../utils/alert-overlay';
import { loadSettings, isQuietHours, SENSITIVITY_THRESHOLDS } from '../utils/settings';
import { notifyParentViaWhatsApp } from '../utils/whatsapp-notifier';
import { showNotificationSimulator } from '../utils/notification-simulator';
import { generateAlertMessage } from '../utils/whatsapp-notifier';

export const config: PlasmoCSConfig = {
  matches: ["*://*.instagram.com/*"],
  run_at: "document_idle"
};

console.log('Privacy Shadow: Instagram form monitor active');

/**
 * Check if we're on a DM page
 */
function isDMPage(): boolean {
  return window.location.pathname.includes('/direct/') ||
         window.location.pathname.includes('/messages/') ||
         window.location.pathname.includes('/t/');
}

/**
 * Find Instagram's actual input elements
 * Instagram uses specific CSS classes that change frequently
 */
function findInstagramInputs(): Element[] {
  const inputs: Element[] = [];

  // DM text input - Instagram uses various selectors
  const dmSelectors = [
    'textarea[placeholder="Message..."]',
    'textarea[placeholder*="Message"]',
    'div[contenteditable="true"][role="textbox"]',
    'div[role="textbox"]',
    'textarea',
    'input[type="text"]'
  ];

  dmSelectors.forEach(selector => {
    try {
      document.querySelectorAll(selector).forEach(el => {
        // Check if it's actually visible and part of Instagram
        if (el.offsetWidth > 0 && el.offsetHeight > 0) {
          inputs.push(el);
        }
      });
    } catch (e) {
      // Selector might be invalid, continue
    }
  });

  return inputs;
}

/**
 * Monitor for message sends in Instagram DMs
 */
function monitorInstagramDMs(): void {
  if (!isDMPage()) {
    console.log('Privacy Shadow: Not on DM page, skipping DM monitoring');
    return;
  }

  console.log('Privacy Shadow: Monitoring Instagram DMs');

  // Find the message input
  const findAndAttachMonitor = () => {
    const inputs = findInstagramInputs();
    console.log(`Privacy Shadow: Found ${inputs.length} potential input elements`);

    inputs.forEach((input, index) => {
      // Skip if already monitored
      if ((input as HTMLElement).hasAttribute('data-ps-instagram-monitoring')) {
        return;
      }

      console.log(`Privacy Shadow: Attaching monitor to input ${index + 1}`);
      (input as HTMLElement).setAttribute('data-ps-instagram-monitoring', 'true');

      // For contenteditable divs
      if (input.getAttribute('contenteditable') === 'true') {
        attachContentEditableMonitor(input as HTMLElement);
      }
      // For textarea and input elements
      else if (input instanceof HTMLTextAreaElement || input instanceof HTMLInputElement) {
        attachInputMonitor(input);
      }
    });
  };

  // Initial scan
  findAndAttachMonitor();

  // Keep scanning for new inputs (Instagram is a SPA)
  setInterval(findAndAttachMonitor, 2000);

  // Also scan on DOM changes
  const observer = new MutationObserver(() => {
    findAndAttachMonitor();
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
}

/**
 * Monitor contenteditable divs (used by Instagram DMs)
 */
function attachContentEditableMonitor(el: HTMLElement): void {
  let lastText = '';
  let lastCheckTime = 0;

  const checkForPII = () => {
    const text = el.innerText?.trim() || el.textContent?.trim() || '';

    if (!text || text === lastText || text.length < 10) {
      lastText = text;
      return;
    }

    const now = Date.now();
    if (now - lastCheckTime < 1000) return; // Don't check more than once per second

    lastText = text;
    lastCheckTime = now;

    console.log('Privacy Shadow: Checking Instagram message:', text.substring(0, 50));

    const detected = detectPII(text, {
      platform: 'instagram',
      isPublic: false,
      isDirectMessage: true,
    });

    if (detected.length > 0) {
      console.log('Privacy Shadow: PII detected in Instagram DM', detected);
      handlePIIDetection(el, detected, text);
    }
  };

  // Monitor for blur/focus events
  el.addEventListener('blur', checkForPII, true);

  // Also monitor for send button clicks (Instagram sends on Enter)
  el.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      // Check for PII before sending
      setTimeout(checkForPII, 100);
    }
  }, true);
}

/**
 * Monitor input elements (textarea, input)
 */
function attachInputMonitor(el: HTMLTextAreaElement | HTMLInputElement): void {
  let lastText = '';
  let lastCheckTime = 0;

  const checkForPII = () => {
    const text = el.value?.trim() || '';

    if (!text || text === lastText || text.length < 10) {
      lastText = text;
      return;
    }

    const now = Date.now();
    if (now - lastCheckTime < 1000) return;

    lastText = text;
    lastCheckTime = now;

    console.log('Privacy Shadow: Checking Instagram input:', text.substring(0, 50));

    const detected = detectPII(text, {
      platform: 'instagram',
      isPublic: false,
      isDirectMessage: true,
    });

    if (detected.length > 0) {
      console.log('Privacy Shadow: PII detected in Instagram input', detected);
      handlePIIDetection(el, detected, text);
    }
  };

  el.addEventListener('blur', checkForPII, true);
  el.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      setTimeout(checkForPII, 100);
    }
  }, true);
}

/**
 * Handle PII detection with alerts and notifications
 */
async function handlePIIDetection(
  element: HTMLElement | HTMLInputElement | HTMLTextAreaElement,
  detected: ReturnType<typeof detectPII>,
  text: string
): Promise<void> {
  const settings = await loadSettings();

  if (settings.enabled === false) {
    console.log('Privacy Shadow: Extension disabled, skipping alert');
    return;
  }

  if (isQuietHours(settings)) {
    console.log('Privacy Shadow: Quiet hours, skipping alert');
    return;
  }

  const score = calculatePIIRiskScore(detected);
  const threshold = SENSITIVITY_THRESHOLDS[settings.sensitivity];

  if (score < threshold) {
    console.log(`Privacy Shadow: Score ${score} below threshold ${threshold}, skipping alert`);
    return;
  }

  const level: string = score >= 70 ? 'critical' : score >= 45 ? 'high' : score >= 25 ? 'medium' : 'low';
  const reasons = [...new Set(detected.map(p => p.description))];

  console.log('Privacy Shadow: Showing alert - Level:', level, 'Score:', score);

  // Show alert to user
  showPrivacyAlert({
    risk: {
      level,
      score,
      reasons,
      detectedTypes: detected.map(p => p.type)
    },
    onContinue: () => {
      console.log('Privacy Shadow: User acknowledged risk');
    },
    onCancel: () => {
      console.log('Privacy Shadow: User cancelled, clearing input');
      // Clear the input
      if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
        element.value = '';
      } else {
        element.innerText = '';
        element.textContent = '';
      }
    },
  });

  // Send WhatsApp notification
  notifyParentViaWhatsApp(
    'instagram',
    detected.map(p => p.type),
    level,
    text
  ).catch((error) => {
    console.error('Privacy Shadow: WhatsApp notification failed:', error);
  });

  // Show visual notification simulator
  const alertData = {
    message: generateAlertMessage({
      platform: 'Instagram',
      piiType: detected.map(p => p.type).join(', '),
      riskLevel: level,
      message: text,
      timestamp: new Date(),
    }),
    platform: 'Instagram',
    piiType: detected.map(p => p.type).join(', '),
  };
  showNotificationSimulator(alertData);
}

// Start monitoring when page loads
function init(): void {
  console.log('Privacy Shadow: Initializing Instagram form monitor');

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(monitorInstagramDMs, 1000);
    });
  } else {
    setTimeout(monitorInstagramDMs, 1000);
  }
}

init();
