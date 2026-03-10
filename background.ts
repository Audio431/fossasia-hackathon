/**
 * Privacy Shadow Background Service Worker
 */

import { loadSettings, SENSITIVITY_THRESHOLDS } from './extension/utils/settings';

console.log('👻 Privacy Shadow: Starting...');

const alerts: any[] = [];

function calculateRiskScore(detectedPII: any[]): { score: number; level: string; reasons: string[] } {
  const reasons = detectedPII.map(pii => pii.description);
  let score = detectedPII.length * 30;

  return {
    score: Math.min(score, 100),
    level: score >= 60 ? 'critical' : score >= 30 ? 'high' : score >= 15 ? 'medium' : 'low',
    reasons: [...new Set(reasons)]
  };
}

/**
 * Store alert in memory
 */
function storeAlert(alert: any): void {
  const alertWithTimestamp = {
    id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    timestamp: Date.now(),
    ...alert
  };

  alerts.unshift(alertWithTimestamp); // Add to beginning of array

  // Keep only last 100 alerts
  if (alerts.length > 100) {
    alerts.pop();
  }

  console.log('👻 Alert stored:', alertWithTimestamp);
}

/**
 * Handle messages from popup and content scripts
 */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('👻 Message received:', message.type);

  if (message.type === 'GET_ALERTS') {
    // Return stored alerts
    console.log('👻 GET_ALERTS: Returning', alerts.length, 'alerts');
    sendResponse({ alerts: alerts.slice(0, 10) }); // Return last 10 alerts
    return false; // Synchronous response
  }

  if (message.type === 'DETECT_PII') {
    // Used by demo page and popup to test detection
    const text = message.text || '';
    const hasBirthday = /\d{1,2}\/\d{1,2}\/\d{4}/.test(text);
    const hasPhone = /\d{3}[-.\s]?\d{3}[-.\s]?\d{4}/.test(text);
    const hasEmail = /[\w\.-]+@[\w\.-]+\.\w{2,}/.test(text);

    const detected: any[] = [];
    const reasons: string[] = [];

    if (hasBirthday) { detected.push({ type: 'birthdate', description: 'Birth date' }); reasons.push('Birth date'); }
    if (hasPhone)    { detected.push({ type: 'contact',   description: 'Phone number' }); reasons.push('Phone number'); }
    if (hasEmail)    { detected.push({ type: 'contact',   description: 'Email address' }); reasons.push('Email address'); }

    const riskScore = detected.length * 30;
    const risk = {
      score: Math.min(riskScore, 100),
      level: riskScore >= 60 ? 'critical' : riskScore >= 30 ? 'high' : riskScore >= 15 ? 'medium' : 'low',
      reasons,
      shouldAlertKid: riskScore >= 25,
      shouldAlertParent: riskScore >= 50,
    };

    sendResponse({ detected, risk });
    return false;
  }

  if (message.type === 'GET_SETTINGS') {
    loadSettings().then(settings => sendResponse({ settings }));
    return true; // async
  }

  if (message.type === 'SAVE_SETTINGS') {
    const { saveSettings } = require('./extension/utils/settings');
    saveSettings(message.settings).then(() => sendResponse({ ok: true })).catch(() => sendResponse({ ok: false }));
    return true;
  }

  if (message.type === 'SOCIAL_POST_DETECTED') {
    console.log('👻 Social post PII detected:', message.data);

    const { pii, context, textPreview } = message.data;
    const risk = calculateRiskScore(pii);

    loadSettings().then(settings => {
      const threshold = SENSITIVITY_THRESHOLDS[settings.sensitivity];
      const alert = {
        type: 'social_post',
        risk,
        context: {
          platform: context.platform,
          website: context.platform,
          url: sender.tab?.url || 'unknown'
        },
        pii: pii.map((p: any) => ({ type: p.type, description: p.description })),
        preview: textPreview
      };

      storeAlert(alert);

      sendResponse({
        block: risk.score >= threshold,
        risk,
        threshold,
      });
    });

    return true;

  }

  if (message.type === 'FORM_SUBMISSION') {
    console.log('👻 Form submission PII detected:', message.data);

    const { pii, context } = message.data;
    const risk = calculateRiskScore(pii);

    loadSettings().then(settings => {
      const threshold = SENSITIVITY_THRESHOLDS[settings.sensitivity];
      const alert = {
        type: 'form_submission',
        risk,
        context: {
          platform: context.platform,
          website: context.platform,
          url: sender.tab?.url || 'unknown',
          formType: context.formType
        },
        pii: pii.map((p: any) => ({ type: p.type, description: p.description }))
      };

      storeAlert(alert);

      sendResponse({
        block: risk.score >= threshold,
        risk,
        threshold,
      });
    });

    return true;
  }

  if (message.type === 'IMAGE_UPLOAD') {
    // Handle image upload with GPS data
    console.log('👻 Image upload with GPS detected:', message.data);

    const risk = {
      score: 40,
      level: 'medium',
      reasons: ['Image contains GPS location data']
    };

    const alert = {
      type: 'image_upload',
      risk,
      context: {
        platform: 'generic',
        website: new URL(sender.tab?.url || '').hostname,
        url: sender.tab?.url || 'unknown'
      },
      pii: [{ type: 'location', description: 'GPS location data in image' }],
      fileName: message.data.fileName
    };

    storeAlert(alert);

    sendResponse({
      block: true,
      risk
    });

    return true;
  }

  if (message.type === 'DISMISS_ALERT') {
    // Remove alert from storage
    const alertId = message.alertId;
    const index = alerts.findIndex(a => a.id === alertId);

    if (index !== -1) {
      alerts.splice(index, 1);
      sendResponse({ success: true });
    } else {
      sendResponse({ success: false, error: 'Alert not found' });
    }

    return true;
  }

  console.log('👻 Unknown message type:', message.type);
  sendResponse({ error: 'Unknown message type' });
  return false;
});

/**
 * Extension installation
 */
chrome.runtime.onInstalled.addListener(() => {
  console.log('👻 Privacy Shadow: Installed!');
});

console.log('👻 Privacy Shadow: Ready!');
