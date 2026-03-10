/**
 * Privacy Shadow - Alert Overlay Utility
 * Injects a kid-friendly warning dialog directly into the page DOM.
 * Uses only inline styles so it works in any content script context.
 */

export interface AlertOptions {
  risk: {
    level: string;
    score: number;
    reasons: string[];
    /** PII types detected — used to pick educational tip */
    detectedTypes?: string[];
    recommendations?: string[];
  };
  onContinue: () => void;
  onCancel: () => void;
}

const OVERLAY_ID = 'privacy-shadow-overlay';

const COLORS: Record<string, { bg: string; border: string; emoji: string; title: string }> = {
  critical: { bg: '#fef2f2', border: '#ef4444', emoji: '🛑', title: 'STOP!' },
  high:     { bg: '#fff7ed', border: '#f97316', emoji: '⚠️', title: 'Wait!' },
  medium:   { bg: '#fefce8', border: '#eab308', emoji: '🔶', title: 'Are you sure?' },
  low:      { bg: '#eff6ff', border: '#3b82f6', emoji: '💡', title: 'Just checking...' },
};

/** Kid-friendly educational tips keyed by detected PII type. */
const EDU_TIPS: Record<string, string> = {
  name:       '👤 Sharing your full name makes it easy for strangers to look you up online.',
  routine:    '🕐 Telling people when you\'re home alone or your schedule can put you in danger.',
  birthdate:  '🎂 Sharing your birthday or age helps strangers figure out who you are.',
  location:   '📍 Telling people where you are right now can let strangers find you in real life.',
  contact:    '📞 Only share your phone number or username with people you already know and trust.',
  address:    '🏠 Your home address is private — sharing it can put your whole family at risk.',
  school:     '🏫 Your school name can help strangers find you — keep it between close friends.',
  financial:  '💳 Never share credit card or bank numbers online. Even with friends!',
  identity:   '🪪 ID numbers like SSNs can be used to steal your identity. Keep them secret.',
  image:      '📸 Photos can contain hidden GPS data that reveals exactly where you were.',
};

function pickTip(detectedTypes: string[]): string {
  for (const t of detectedTypes) {
    if (EDU_TIPS[t]) return EDU_TIPS[t];
  }
  return '💡 Think before you share — information posted online can last forever.';
}

export function showPrivacyAlert(options: AlertOptions): void {
  dismissPrivacyAlert();

  const { risk, onContinue, onCancel } = options;
  const c = COLORS[risk.level] || COLORS.medium;
  const tip = pickTip(risk.detectedTypes || []);

  const overlay = document.createElement('div');
  overlay.id = OVERLAY_ID;
  overlay.style.cssText = `
    position: fixed !important;
    inset: 0 !important;
    z-index: 2147483647 !important;
    background: rgba(0,0,0,0.6) !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif !important;
  `;

  const reasonsHTML = risk.reasons.slice(0, 5).map(r =>
    `<li style="padding:4px 0;color:#374151;font-size:14px;">• ${r}</li>`
  ).join('');

  const recsHTML = (risk.recommendations || []).slice(0, 2).map(r =>
    `<li style="padding:3px 0;color:#6b7280;font-size:13px;">💡 ${r.replace(/^[🛑⚠️💡❌]\s*/u, '')}</li>`
  ).join('');

  overlay.innerHTML = `
    <div style="
      background:white;
      border-radius:16px;
      padding:24px;
      max-width:400px;
      width:90%;
      box-shadow:0 20px 60px rgba(0,0,0,0.4);
      border-top:5px solid ${c.border};
      animation:psSlideIn 0.2s ease-out;
    ">
      <style>
        @keyframes psSlideIn {
          from { transform: translateY(-20px); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }
      </style>

      <div style="text-align:center;margin-bottom:16px;">
        <div style="font-size:48px;margin-bottom:8px;">${c.emoji}</div>
        <h2 style="margin:0;font-size:22px;font-weight:700;color:#111827;">${c.title}</h2>
        <p style="margin:6px 0 0;font-size:14px;color:#6b7280;">Privacy Shadow detected sensitive info</p>
      </div>

      <div style="background:${c.bg};border-radius:10px;padding:12px 16px;margin-bottom:12px;">
        <p style="margin:0 0 8px;font-size:13px;font-weight:600;color:#374151;">You're about to share:</p>
        <ul style="margin:0;padding:0;list-style:none;">${reasonsHTML}</ul>
      </div>

      ${recsHTML ? `
      <div style="margin-bottom:12px;">
        <ul style="margin:0;padding:0;list-style:none;">${recsHTML}</ul>
      </div>` : ''}

      <div style="padding:10px 12px;background:#f0fdf4;border-radius:8px;margin-bottom:14px;border-left:3px solid #22c55e;">
        <p style="font-size:13px;color:#166534;margin:0;line-height:1.5;">${tip}</p>
      </div>

      <p style="font-size:12px;color:#9ca3af;margin:0 0 14px;text-align:center;">
        This info can be seen by people you don't know and could last forever online.
      </p>

      <div style="display:flex;gap:10px;">
        <button id="ps-cancel-btn" style="
          flex:1;padding:12px;border-radius:10px;border:none;
          background:#e5e7eb;color:#374151;font-size:15px;
          font-weight:600;cursor:pointer;
        ">← Nevermind</button>
        <button id="ps-continue-btn" style="
          flex:1;padding:12px;border-radius:10px;border:none;
          background:${c.border};color:white;font-size:15px;
          font-weight:600;cursor:pointer;
        ">Send Anyway</button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  document.getElementById('ps-cancel-btn')?.addEventListener('click', () => {
    dismissPrivacyAlert();
    onCancel();
  });

  document.getElementById('ps-continue-btn')?.addEventListener('click', () => {
    dismissPrivacyAlert();
    onContinue();
  });

  // Click outside to cancel
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      dismissPrivacyAlert();
      onCancel();
    }
  });
}

export function dismissPrivacyAlert(): void {
  document.getElementById(OVERLAY_ID)?.remove();
}
