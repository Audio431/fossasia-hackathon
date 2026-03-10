/**
 * Notification Simulator for Demo Mode
 * Creates beautiful visual notifications to show what would be sent to parents
 */

export interface NotificationData {
  message: string;
  platform: string;
  piiType: string;
}

/**
 * Simulates WhatsApp notification with beautiful UI
 */
export function showNotificationSimulator(alert: NotificationData): void {
  // Create modal to show "sent" notification
  const modal = document.createElement('div');
  modal.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: linear-gradient(135deg, #25D366 0%, #128C7E 100%);
    color: white;
    padding: 20px;
    border-radius: 16px;
    box-shadow: 0 8px 32px rgba(0,0,0,0.3);
    z-index: 2147483647;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    animation: slideIn 0.3s ease-out;
    max-width: 400px;
  `;

  modal.innerHTML = `
    <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px;">
      <span style="font-size: 32px;">📱</span>
      <div>
        <div style="font-weight: 700; font-size: 16px;">WhatsApp Sent!</div>
        <div style="font-size: 13px; opacity: 0.9;">Parent notified successfully</div>
      </div>
    </div>
    <div style="background: rgba(255,255,255,0.2); padding: 12px; border-radius: 8px; font-size: 13px;">
      <strong>Platform:</strong> ${alert.platform}<br/>
      <strong>Detected:</strong> ${alert.piiType}<br/>
      <strong style="display: block; margin-top: 8px;">Parent would receive:</strong>
      "${alert.message.substring(0, 80)}${alert.message.length > 80 ? '...' : ''}"
    </div>
  `;

  document.body.appendChild(modal);

  // Auto-dismiss after 4 seconds
  setTimeout(() => {
    modal.style.animation = 'slideOut 0.3s ease-out';
    setTimeout(() => modal.remove(), 300);
  }, 4000);

  // Add slideOut animation if not already present
  if (!document.getElementById('notification-simulator-styles')) {
    const style = document.createElement('style');
    style.id = 'notification-simulator-styles';
    style.textContent = `
      @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
      @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
      }
    `;
    document.head.appendChild(style);
  }
}
