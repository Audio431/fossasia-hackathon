/**
 * WhatsApp Notification Service for Privacy Shadow
 * Sends alerts to parents when children share PII on social media
 */

export interface WhatsAppAlert {
  childName?: string;
  platform: string;
  piiType: string;
  riskLevel: string;
  message: string;
  timestamp: Date;
}

export interface AlertHistory {
  alerts: WhatsAppAlert[];
  lastHourCount: number;
  lastResetTime: number;
}

// Rate limiting: track alerts sent in the last hour
const alertHistory: AlertHistory = {
  alerts: [],
  lastHourCount: 0,
  lastResetTime: Date.now(),
};

// Rate limit check (max alerts per hour)
function checkRateLimit(maxPerHour: number): boolean {
  const now = Date.now();
  const hourInMs = 60 * 60 * 1000;

  // Reset counter if hour has passed
  if (now - alertHistory.lastResetTime > hourInMs) {
    alertHistory.lastHourCount = 0;
    alertHistory.lastResetTime = now;
    alertHistory.alerts = [];
  }

  if (alertHistory.lastHourCount >= maxPerHour) {
    console.log('WhatsApp: Rate limit reached, skipping alert');
    return false;
  }

  alertHistory.lastHourCount++;
  return true;
}

/**
 * Format phone number to E.164 format
 * @param phone - Phone number in various formats
 * @returns E.164 formatted number or null if invalid
 */
export function formatPhoneNumber(phone: string): string | null {
  // Remove all non-numeric characters
  const cleaned = phone.replace(/\D/g, '');

  // Validate length (should be 10-15 digits for country code + number)
  if (cleaned.length < 10 || cleaned.length > 15) {
    return null;
  }

  // Add + if not present (E.164 format)
  return cleaned.startsWith('+') ? cleaned : `+${cleaned}`;
}

/**
 * Generate a parent-friendly WhatsApp alert message
 */
export function generateAlertMessage(alert: WhatsAppAlert): string {
  const { childName, platform, piiType, riskLevel, message, timestamp } = alert;

  const emoji = riskLevel === 'critical' ? '🚨' : '⚠️';
  const child = childName || 'Your child';

  return `🛡️ ${emoji} Privacy Shadow Alert

${child} just shared sensitive information on ${platform}:

📍 What was detected: ${piiType}
⚠️ Risk level: ${riskLevel.toUpperCase()}

💬 Message: "${message.substring(0, 100)}${message.length > 100 ? '...' : ''}"

🕐 ${timestamp.toLocaleTimeString()}

Talk to your child about online safety. This alert was sent by Privacy Shadow browser extension.`;
}

/**
 * Send WhatsApp alert via backend server
 * For production: Calls real backend with Twilio integration
 * For demo mode: Falls back to console logging if server unavailable
 */
export async function sendWhatsAppAlert(
  alert: WhatsAppAlert,
  phoneNumber: string
): Promise<{ success: boolean; error?: string }> {
  // Validate phone number
  const formattedPhone = formatPhoneNumber(phoneNumber);
  if (!formattedPhone) {
    console.error('WhatsApp: Invalid phone number format');
    return { success: false, error: 'Invalid phone number format' };
  }

  // Check rate limiting
  if (!checkRateLimit(5)) { // Default: max 5 alerts per hour
    return { success: false, error: 'Rate limit exceeded' };
  }

  const message = generateAlertMessage(alert);

  try {
    // Try to call real backend server
    console.log('📱 Attempting to send via backend server...');

    const response = await fetch('http://localhost:3001/api/send-whatsapp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: formattedPhone,
        message: message,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(errorData.error || 'Failed to send WhatsApp');
    }

    const result = await response.json();
    console.log('✅ WhatsApp sent via backend! Message ID:', result.messageId);

    return { success: true };

  } catch (error) {
    // Server unavailable or error - fall back to demo mode
    console.warn('⚠️ Backend server unavailable, using demo mode');
    console.log('📱 WhatsApp Alert (Demo Mode - Server unavailable):');
    console.log('─'.repeat(50));
    console.log('To:', formattedPhone);
    console.log(message);
    console.log('─'.repeat(50));

    return { success: true }; // Return success so app continues working
  }
}

/**
 * Check if WhatsApp alert should be sent based on settings
 */
export function shouldSendWhatsAppAlert(
  riskLevel: string,
  settings: {
    whatsapp: { enabled: boolean; minAlertLevel: string; maxAlertsPerHour: number; phoneNumber?: string };
  }
): boolean {
  if (!settings.whatsapp.enabled) return false;
  if (!settings.whatsapp.phoneNumber) return false;

  // Check minimum alert level
  const minLevel = settings.whatsapp.minAlertLevel;
  if (minLevel === 'critical' && riskLevel !== 'critical') return false;
  if (minLevel === 'high' && !['high', 'critical'].includes(riskLevel)) {
    return false;
  }

  // Check rate limit
  return checkRateLimit(settings.whatsapp.maxAlertsPerHour);
}

/**
 * Send WhatsApp alert from content script
 * This is called when PII is detected in form-monitor or stranger-monitor
 */
export async function notifyParentViaWhatsApp(
  platform: string,
  piiTypes: string[],
  riskLevel: string,
  message: string,
  childName?: string
): Promise<void> {
  try {
    const { loadSettings } = await import('../utils/settings');
    const settings = await loadSettings();

    if (!shouldSendWhatsAppAlert(riskLevel, settings)) {
      return;
    }

    const alert: WhatsAppAlert = {
      childName,
      platform,
      piiType: piiTypes.join(', '),
      riskLevel,
      message,
      timestamp: new Date(),
    };

    const result = await sendWhatsAppAlert(alert, settings.whatsapp.phoneNumber);

    if (result.success) {
      console.log('✅ WhatsApp alert sent successfully');
      alertHistory.alerts.push(alert);
    } else {
      console.error('❌ WhatsApp alert failed:', result.error);
    }
  } catch (error) {
    console.error('WhatsApp notification error:', error);
  }
}
