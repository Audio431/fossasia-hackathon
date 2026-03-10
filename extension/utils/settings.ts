/**
 * Privacy Shadow — User Settings
 * Persisted via chrome.storage.sync so settings follow the user across devices.
 */

export type SensitivityLevel = 'low' | 'medium' | 'high';

export interface QuietHours {
  enabled: boolean;
  /** 24-hour "HH:MM" e.g. "22:00" */
  start: string;
  end: string;
}

export interface WhatsAppSettings {
  /** Parent's WhatsApp phone number (E.164 format: +1234567890) */
  phoneNumber: string;
  /** Enable WhatsApp alerts */
  enabled: boolean;
  /** Minimum risk level to trigger WhatsApp alert */
  minAlertLevel: 'high' | 'critical';
  /** Rate limiting: max alerts per hour */
  maxAlertsPerHour: number;
}

export interface PrivacyShadowSettings {
  /** Master kill-switch — when false all monitoring is paused */
  enabled: boolean;
  sensitivity: SensitivityLevel;
  quietHours: QuietHours;
  /** Show educational tip in alert overlay */
  showTips: boolean;
  /** Notify parent when critical PII is detected */
  notifyParent: boolean;
  /** WhatsApp notification settings */
  whatsapp: WhatsAppSettings;
}

export const DEFAULT_SETTINGS: PrivacyShadowSettings = {
  enabled: true,
  sensitivity: 'medium',
  quietHours: {
    enabled: false,
    start: '21:00',
    end: '07:00',
  },
  showTips: true,
  notifyParent: false,
  whatsapp: {
    phoneNumber: '',
    enabled: false,
    minAlertLevel: 'high',
    maxAlertsPerHour: 5,
  },
};

/**
 * Minimum risk score required to show an alert, per sensitivity level.
 * high sensitivity = alert on anything (score >= 1)
 * medium          = alert on a confirmed PII match (score >= 25)
 * low             = alert only on high/critical combos (score >= 50)
 */
export const SENSITIVITY_THRESHOLDS: Record<SensitivityLevel, number> = {
  high:   1,
  medium: 25,
  low:    50,
};

/** Load settings from chrome.storage.sync, falling back to defaults. */
export async function loadSettings(): Promise<PrivacyShadowSettings> {
  return new Promise((resolve) => {
    if (typeof chrome === 'undefined' || !chrome.storage) {
      resolve({ ...DEFAULT_SETTINGS });
      return;
    }
    chrome.storage.sync.get('privacyShadowSettings', (result) => {
      if (chrome.runtime.lastError || !result.privacyShadowSettings) {
        resolve({ ...DEFAULT_SETTINGS });
      } else {
        resolve({ ...DEFAULT_SETTINGS, ...result.privacyShadowSettings });
      }
    });
  });
}

/** Persist settings to chrome.storage.sync. */
export async function saveSettings(settings: PrivacyShadowSettings): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof chrome === 'undefined' || !chrome.storage) {
      resolve();
      return;
    }
    chrome.storage.sync.set({ privacyShadowSettings: settings }, () => {
      if (chrome.runtime.lastError) reject(chrome.runtime.lastError);
      else resolve();
    });
  });
}

/** Returns true if the current time is within quiet hours. */
export function isQuietHours(settings: PrivacyShadowSettings): boolean {
  if (!settings.quietHours.enabled) return false;

  const now = new Date();
  const [sh, sm] = settings.quietHours.start.split(':').map(Number);
  const [eh, em] = settings.quietHours.end.split(':').map(Number);
  const nowMins = now.getHours() * 60 + now.getMinutes();
  const startMins = sh * 60 + sm;
  const endMins = eh * 60 + em;

  // Handles overnight ranges e.g. 22:00 → 07:00
  if (startMins > endMins) {
    return nowMins >= startMins || nowMins < endMins;
  }
  return nowMins >= startMins && nowMins < endMins;
}
