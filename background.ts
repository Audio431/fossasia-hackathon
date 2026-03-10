/**
 * Privacy Shadow Background Service Worker
 */

import { loadSettings, saveSettings, SENSITIVITY_THRESHOLDS } from './extension/utils/settings';
import { detectPII } from './extension/detection/pii-detector';

console.log('👻 Privacy Shadow: Starting...');

// ─── Alert storage (persisted via chrome.storage.local) ─────────────────────

let cachedAlerts: any[] = [];
let unreadCount = 0;
let storageReady = false;

async function loadAlerts(): Promise<any[]> {
  return new Promise(resolve => {
    chrome.storage.local.get(['ps_alerts', 'ps_unread'], result => {
      cachedAlerts = result.ps_alerts || [];
      unreadCount  = result.ps_unread  || 0;
      storageReady = true;
      resolve(cachedAlerts);
    });
  });
}

async function persistAlerts(): Promise<void> {
  return new Promise(resolve => {
    chrome.storage.local.set({ ps_alerts: cachedAlerts, ps_unread: unreadCount }, resolve);
  });
}

// Bootstrap — restore alerts on service worker start
loadAlerts().then(() => updateBadge());

// ─── Badge ───────────────────────────────────────────────────────────────────

function updateBadge(): void {
  const text = unreadCount > 0 ? String(unreadCount > 99 ? '99+' : unreadCount) : '';
  chrome.action.setBadgeText({ text });
  chrome.action.setBadgeBackgroundColor({ color: '#ef4444' });
}

// ─── Risk scoring ─────────────────────────────────────────────────────────────

function calculateRiskScore(detectedPII: any[]): { score: number; level: string; reasons: string[] } {
  const reasons = detectedPII.map(pii => pii.description);
  const score = Math.min(detectedPII.length * 30, 100);
  return {
    score,
    level: score >= 60 ? 'critical' : score >= 30 ? 'high' : score >= 15 ? 'medium' : 'low',
    reasons: [...new Set(reasons)]
  };
}

// ─── Alert store ─────────────────────────────────────────────────────────────

function storeAlert(alert: any): void {
  const alertWithTimestamp = {
    id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    timestamp: Date.now(),
    acknowledged: false,
    ...alert
  };

  cachedAlerts.unshift(alertWithTimestamp);
  unreadCount++;
  updateBadge();

  // Cap at 50 alerts
  if (cachedAlerts.length > 50) cachedAlerts.pop();

  persistAlerts();
  console.log('👻 Alert stored:', alertWithTimestamp.id, alertWithTimestamp.type);
}

// ─── Message handlers ─────────────────────────────────────────────────────────

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('👻 Message received:', message.type);

  if (message.type === 'GET_ALERTS') {
    // Ensure storage is loaded before responding
    const respond = () => {
      const piiAlerts      = cachedAlerts.filter(a => a.type !== 'stranger_risk');
      const strangerAlerts = cachedAlerts.filter(a => a.type === 'stranger_risk');
      sendResponse({
        alerts: cachedAlerts.slice(0, 20),
        piiCount:      piiAlerts.length,
        strangerCount: strangerAlerts.length,
      });
    };
    if (storageReady) {
      respond();
    } else {
      loadAlerts().then(respond);
    }
    return true;
  }

  if (message.type === 'DETECT_PII') {
    const text = message.text || '';
    const detected = detectPII(text, { platform: 'generic', isPublic: true, isDirectMessage: false });
    const score = Math.min(detected.length * 30, 100);
    const reasons = [...new Set(detected.map((p: any) => p.description))];
    const risk = {
      score,
      level: score >= 60 ? 'critical' : score >= 30 ? 'high' : score >= 15 ? 'medium' : 'low',
      reasons,
      shouldAlertKid: score >= 25,
      shouldAlertParent: score >= 50,
    };
    sendResponse({ detected, risk });
    return false;
  }

  if (message.type === 'GET_SETTINGS') {
    loadSettings().then(settings => sendResponse({ settings }));
    return true;
  }

  if (message.type === 'SAVE_SETTINGS') {
    saveSettings(message.settings).then(() => sendResponse({ ok: true })).catch(() => sendResponse({ ok: false }));
    return true;
  }

  if (message.type === 'CLEAR_BADGE') {
    unreadCount = 0;
    updateBadge();
    persistAlerts();
    sendResponse({ ok: true });
    return false;
  }

  if (message.type === 'DISMISS_ALERT') {
    const index = cachedAlerts.findIndex(a => a.id === message.alertId);
    if (index !== -1) {
      cachedAlerts.splice(index, 1);
      persistAlerts();
      sendResponse({ success: true });
    } else {
      sendResponse({ success: false, error: 'Alert not found' });
    }
    return false;
  }

  if (message.type === 'CLEAR_ALL_ALERTS') {
    cachedAlerts = [];
    unreadCount = 0;
    updateBadge();
    persistAlerts();
    sendResponse({ ok: true });
    return false;
  }

  if (message.type === 'SOCIAL_POST_DETECTED') {
    const { pii, context, textPreview } = message.data;
    const risk = calculateRiskScore(pii);

    loadSettings().then(settings => {
      const threshold = SENSITIVITY_THRESHOLDS[settings.sensitivity];
      if (!settings.enabled) { sendResponse({ block: false, risk, threshold }); return; }

      storeAlert({
        type: 'social_post',
        risk,
        context: { platform: context.platform, website: context.platform, url: sender.tab?.url || 'unknown' },
        pii: pii.map((p: any) => ({ type: p.type, description: p.description })),
        preview: textPreview
      });
      sendResponse({ block: risk.score >= threshold, risk, threshold });
    });
    return true;
  }

  if (message.type === 'FORM_SUBMISSION') {
    const { pii, context } = message.data;
    const risk = calculateRiskScore(pii);

    loadSettings().then(settings => {
      const threshold = SENSITIVITY_THRESHOLDS[settings.sensitivity];
      if (!settings.enabled) { sendResponse({ block: false, risk, threshold }); return; }

      storeAlert({
        type: 'form_submission',
        risk,
        context: { platform: context.platform, website: context.platform, url: sender.tab?.url || 'unknown', formType: context.formType },
        pii: pii.map((p: any) => ({ type: p.type, description: p.description }))
      });
      sendResponse({ block: risk.score >= threshold, risk, threshold });
    });
    return true;
  }

  if (message.type === 'IMAGE_UPLOAD') {
    const risk = { score: 40, level: 'medium', reasons: ['Image contains GPS location data'] };
    loadSettings().then(settings => {
      if (!settings.enabled) { sendResponse({ block: false, risk }); return; }
      storeAlert({
        type: 'image_upload',
        risk,
        context: { platform: 'generic', website: new URL(sender.tab?.url || 'https://unknown').hostname, url: sender.tab?.url || 'unknown' },
        pii: [{ type: 'location', description: 'GPS location data in image' }],
        fileName: message.data?.fileName
      });
      sendResponse({ block: true, risk });
    });
    return true;
  }

  if (message.type === 'STRANGER_RISK_DETECTED') {
    const { score, level, flags, url } = message.data;
    loadSettings().then(settings => {
      if (!settings.enabled) { sendResponse({ ok: false }); return; }
      storeAlert({
        type: 'stranger_risk',
        risk: {
          score,
          level: level === 'danger' ? 'critical' : level === 'warning' ? 'high' : 'medium',
          reasons: flags,
        },
        context: { platform: 'social', website: new URL(url || 'https://unknown').hostname, url: url || 'unknown' },
        pii: flags.map((f: string) => ({ type: 'stranger', description: f })),
      });
      sendResponse({ ok: true });
    });
    return true;
  }

  console.log('👻 Unknown message type:', message.type);
  sendResponse({ error: 'Unknown message type' });
  return false;
});

chrome.runtime.onInstalled.addListener(() => {
  console.log('👻 Privacy Shadow: Installed!');
});

console.log('👻 Privacy Shadow: Ready!');

