import React, { useState, useEffect } from 'react';
import { loadSettings, saveSettings, type PrivacyShadowSettings } from '../utils/settings';
import { formatPhoneNumber } from '../utils/whatsapp-notifier';

export default function ParentSettings() {
  const [settings, setSettings] = useState<PrivacyShadowSettings | null>(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  useEffect(() => {
    loadSettings().then(setSettings);
  }, []);

  if (!settings) {
    return (
      <div style={styles.container}>
        <div style={styles.loading}>Loading settings...</div>
      </div>
    );
  }

  const handleSave = async () => {
    setSaveStatus('saving');

    // Format phone number
    const formattedPhone = formatPhoneNumber(phoneNumber);

    if (phoneNumber && !formattedPhone) {
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 2000);
      return;
    }

    // Update settings
    const updatedSettings = {
      ...settings,
      whatsapp: {
        ...settings.whatsapp,
        phoneNumber: formattedPhone || '',
      },
    };

    try {
      await saveSettings(updatedSettings);
      setSettings(updatedSettings);
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (error) {
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 2000);
    }
  };

  const handleTestAlert = async () => {
    const { notifyParentViaWhatsApp } = await import('../utils/whatsapp-notifier');

    await notifyParentViaWhatsApp(
      'Instagram (Demo)',
      ['Address', 'Location'],
      'high',
      'my address is 123 main street',
      'Your child'
    );

    setSaveStatus('saved');
    setTimeout(() => setSaveStatus('idle'), 2000);
  };

  const isEnabled = settings.whatsapp.enabled;
  const hasPhoneNumber = phoneNumber || settings.whatsapp.phoneNumber;

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerIcon}>👪</div>
        <div style={styles.headerText}>
          <h1 style={styles.title}>Parent Notifications</h1>
          <p style={styles.subtitle}>
            Get WhatsApp alerts when your child shares sensitive information
          </p>
        </div>
      </div>

      {/* Main Card */}
      <div style={styles.card}>
        {/* Enable Toggle */}
        <div style={styles.section}>
          <div style={styles.toggleLabel}>
            <div>
              <div style={styles.toggleTitle}>Enable WhatsApp Alerts</div>
              <div style={styles.toggleDescription}>
                Receive instant notifications when PII is detected
              </div>
            </div>
            <label style={styles.switch}>
              <input
                type="checkbox"
                checked={isEnabled}
                onChange={(e) => {
                  const updated = {
                    ...settings,
                    whatsapp: { ...settings.whatsapp, enabled: e.target.checked }
                  };
                  setSettings(updated);
                  saveSettings(updated);
                }}
                style={styles.switchInput}
              />
              <span style={styles.switchSlider}></span>
            </label>
          </div>
        </div>

        {/* Phone Number Input */}
        <div style={styles.section}>
          <label style={styles.label}>
            WhatsApp Phone Number
          </label>
          <div style={styles.inputWrapper}>
            <span style={styles.inputIcon}>📱</span>
            <input
              type="tel"
              placeholder="+1 234 567 8900"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              disabled={!isEnabled}
              style={{
                ...styles.input,
                opacity: isEnabled ? 1 : 0.5,
                cursor: isEnabled ? 'text' : 'not-allowed',
              }}
            />
          </div>
          <div style={styles.hint}>
            Include country code (e.g., +1 for US)
          </div>
        </div>

        {/* Alert Level */}
        <div style={styles.section}>
          <label style={styles.label}>
            Alert Threshold
          </label>
          <div style={styles.options}>
            {[
              { value: 'high', label: 'High & Critical', desc: 'Addresses, phones, emails, locations', recommended: true },
              { value: 'critical', label: 'Critical Only', desc: 'Only most serious PII (SSN, financial)', recommended: false },
            ].map((option) => (
              <label
                key={option.value}
                style={{
                  ...styles.option,
                  borderColor: settings.whatsapp.minAlertLevel === option.value ? '#3b82f6' : '#e5e7eb',
                  backgroundColor: settings.whatsapp.minAlertLevel === option.value ? '#eff6ff' : 'white',
                  opacity: isEnabled ? 1 : 0.5,
                  cursor: isEnabled ? 'pointer' : 'not-allowed',
                }}
              >
                <input
                  type="radio"
                  name="alertLevel"
                  checked={settings.whatsapp.minAlertLevel === option.value}
                  onChange={() => {
                    if (!isEnabled) return;
                    const updated = {
                      ...settings,
                      whatsapp: {
                        ...settings.whatsapp,
                        minAlertLevel: option.value as 'high' | 'critical'
                      }
                    };
                    setSettings(updated);
                    saveSettings(updated);
                  }}
                  disabled={!isEnabled}
                  style={styles.radio}
                />
                <div style={styles.optionContent}>
                  <div style={styles.optionLabel}>
                    {option.label}
                    {option.recommended && (
                      <span style={styles.recommendedBadge}>Recommended</span>
                    )}
                  </div>
                  <div style={styles.optionDesc}>{option.desc}</div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Rate Limiting Info */}
        <div style={styles.infoBox}>
          <div style={styles.infoIcon}>⚡</div>
          <div style={styles.infoText}>
            <div style={styles.infoTitle}>Smart Rate Limiting</div>
            <div style={styles.infoDesc}>
              Maximum {settings.whatsapp.maxAlertsPerHour} alerts per hour to prevent spam.
              Alerts are silenced during quiet hours.
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={styles.buttonGroup}>
          <button
            onClick={handleSave}
            disabled={!isEnabled}
            style={{
              ...styles.button,
              ...styles.primaryButton,
              opacity: isEnabled ? 1 : 0.5,
              cursor: isEnabled ? 'pointer' : 'not-allowed',
            }}
          >
            {saveStatus === 'saving' ? '💾 Saving...' :
             saveStatus === 'saved' ? '✅ Saved!' :
             saveStatus === 'error' ? '❌ Invalid Phone' :
             '💾 Save Settings'}
          </button>

          <button
            onClick={handleTestAlert}
            disabled={!isEnabled || !hasPhoneNumber}
            style={{
              ...styles.button,
              ...styles.secondaryButton,
              opacity: (isEnabled && hasPhoneNumber) ? 1 : 0.5,
              cursor: (isEnabled && hasPhoneNumber) ? 'pointer' : 'not-allowed',
            }}
          >
            🧪 Test Alert
          </button>
        </div>

        {/* How It Works */}
        <div style={styles.guideBox}>
          <h3 style={styles.guideTitle}>💡 How It Works</h3>
          <ol style={styles.guideList}>
            <li style={styles.guideItem}>
              <strong>Add your WhatsApp number</strong> in the field above
            </li>
            <li style={styles.guideItem}>
              <strong>Enable alerts</strong> and choose your sensitivity preference
            </li>
            <li style={styles.guideItem}>
              <strong>Instant notification</strong> when your child shares PII
            </li>
            <li style={styles.guideItem}>
              <strong>Detailed context</strong> including what was detected and where
            </li>
            <li style={styles.guideItem}>
              <strong>Smart rate limiting</strong> prevents spam (max {settings.whatsapp.maxAlertsPerHour}/hour)
            </li>
          </ol>
        </div>
      </div>
    </div>
  );
}

// Modern, clean design system
const styles: Record<string, React.CSSProperties> = {
  container: {
    maxWidth: '700px',
    margin: '0 auto',
    padding: '32px 24px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    minHeight: '100vh',
  },

  loading: {
    textAlign: 'center',
    color: 'white',
    fontSize: '18px',
    padding: '60px 20px',
    background: 'rgba(255,255,255,0.1)',
    backdropFilter: 'blur(10px)',
    borderRadius: '12px',
  },

  header: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: '32px',
    background: 'rgba(255,255,255,0.15)',
    backdropFilter: 'blur(10px)',
    padding: '24px',
    borderRadius: '16px',
    boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
  },

  headerIcon: {
    fontSize: '48px',
    marginRight: '20px',
  },

  headerText: {
    flex: 1,
  },

  title: {
    margin: 0,
    fontSize: '28px',
    fontWeight: '700',
    color: 'white',
    marginBottom: '8px',
  },

  subtitle: {
    margin: 0,
    fontSize: '16px',
    color: 'rgba(255,255,255,0.9)',
    lineHeight: '1.5',
  },

  card: {
    background: 'white',
    borderRadius: '20px',
    padding: '32px',
    boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
  },

  section: {
    marginBottom: '28px',
    paddingBottom: '28px',
    borderBottom: '1px solid #f3f4f6',
  },

  'section:lastChild': {
    borderBottom: 'none',
    paddingBottom: 0,
  },

  // Toggle Switch
  toggleLabel: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  toggleTitle: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#111827',
    marginBottom: '4px',
  },

  toggleDescription: {
    fontSize: '14px',
    color: '#6b7280',
  },

  switch: {
    position: 'relative' as 'relative',
    display: 'inline-block',
    width: '52px',
    height: '28px',
  },

  switchInput: {
    opacity: 0,
    width: 0,
    height: 0,
  },

  switchSlider: {
    position: 'absolute' as 'absolute',
    cursor: 'pointer',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#d1d5db',
    transition: '.3s',
    borderRadius: '28px',

  },

  // Input Fields
  label: {
    display: 'block',
    fontSize: '14px',
    fontWeight: '600',
    color: '#374151',
    marginBottom: '8px',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },

  inputWrapper: {
    position: 'relative' as 'relative',
    display: 'flex',
    alignItems: 'center',
  },

  inputIcon: {
    position: 'absolute' as 'absolute',
    left: '16px',
    fontSize: '18px',
    zIndex: 1,
  },

  input: {
    width: '100%',
    padding: '14px 16px 14px 48px',
    fontSize: '16px',
    border: '2px solid #e5e7eb',
    borderRadius: '12px',
    outline: 'none',
    transition: 'all 0.2s',
    fontFamily: 'inherit',
    background: 'white',

  },

  hint: {
    fontSize: '13px',
    color: '#6b7280',
    marginTop: '8px',
    marginLeft: '4px',
  },

  // Radio Options
  options: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },

  option: {
    display: 'flex',
    alignItems: 'flex-start',
    padding: '16px',
    border: '2px solid #e5e7eb',
    borderRadius: '12px',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },

  radio: {
    marginTop: '2px',
    marginRight: '12px',
    width: '20px',
    height: '20px',
  },

  optionContent: {
    flex: 1,
  },

  optionLabel: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#111827',
    marginBottom: '4px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },

  recommendedBadge: {
    fontSize: '11px',
    fontWeight: '600',
    color: '#059669',
    background: '#d1fae5',
    padding: '2px 8px',
    borderRadius: '12px',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },

  optionDesc: {
    fontSize: '14px',
    color: '#6b7280',
    lineHeight: '1.4',
  },

  // Info Box
  infoBox: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '12px',
    padding: '16px',
    background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
    borderRadius: '12px',
    border: '1px solid #fbbf24',
    marginBottom: '24px',
  },

  infoIcon: {
    fontSize: '24px',
    flexShrink: 0,
  },

  infoText: {
    flex: 1,
  },

  infoTitle: {
    fontSize: '15px',
    fontWeight: '600',
    color: '#92400e',
    marginBottom: '4px',
  },

  infoDesc: {
    fontSize: '14px',
    color: '#78350f',
    lineHeight: '1.5',
  },

  // Buttons
  buttonGroup: {
    display: 'flex',
    gap: '12px',
    marginBottom: '28px',
  },

  button: {
    flex: 1,
    padding: '16px 24px',
    fontSize: '16px',
    fontWeight: '600',
    border: 'none',
    borderRadius: '12px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    fontFamily: 'inherit',
  },

  primaryButton: {
    background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
    color: 'white',
    boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',

  },

  secondaryButton: {
    background: 'white',
    color: '#3b82f6',
    border: '2px solid #3b82f6',

  },

  // Guide Box
  guideBox: {
    padding: '24px',
    background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
    borderRadius: '16px',
    border: '2px solid #3b82f6',
  },

  guideTitle: {
    margin: '0 0 16px 0',
    fontSize: '18px',
    fontWeight: '700',
    color: '#1e40af',
  },

  guideList: {
    margin: 0,
    paddingLeft: '20px',
    color: '#1e3a8a',
    lineHeight: '1.8',
  },

  guideItem: {
    marginBottom: '12px',
    fontSize: '15px',
  },

};
