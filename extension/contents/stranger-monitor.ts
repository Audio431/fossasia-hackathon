/**
 * Privacy Shadow — Stranger Danger Monitor
 *
 * Content script that monitors DM / chat inputs on social platforms for
 * grooming patterns and other high-risk conversation signals, then shows
 * a kid-friendly warning overlay when something concerning is detected.
 */

import { detectStrangerRisk } from '../detection/stranger-detector';

// Platforms where this monitor is most relevant
const CHAT_SELECTORS: string[] = [
  // Instagram DMs
  'div[contenteditable="true"][aria-label*="Message"]',
  'textarea[placeholder*="Message"]',
  // TikTok DMs
  'div[contenteditable="true"][data-e2e*="chat"]',
  'textarea[placeholder*="Send a message"]',
  // Snapchat
  'textarea[placeholder*="Chat"]',
  // Discord
  'div[role="textbox"][class*="slateTextArea"]',
  'div[role="textbox"][aria-label*="message"]',
  // Generic fallback for any chat-like textarea
  'textarea[placeholder*="message" i]',
  'textarea[placeholder*="chat" i]',
  'textarea[placeholder*="reply" i]',
  'div[contenteditable="true"][placeholder*="message" i]',
];

const OVERLAY_ID = 'ps-stranger-overlay';
const MIN_LENGTH = 20; // Don't analyse very short messages

// ─── State ──────────────────────────────────────────────────────────────────

const monitoredInputs = new WeakSet<Element>();
let overlayVisible = false;

// ─── Overlay ─────────────────────────────────────────────────────────────────

function removeOverlay(): void {
  const existing = document.getElementById(OVERLAY_ID);
  if (existing) existing.remove();
  overlayVisible = false;
}

function showStrangerWarning(flags: string[]): void {
  if (overlayVisible) return;
  removeOverlay();

  const overlay = document.createElement('div');
  overlay.id = OVERLAY_ID;
  Object.assign(overlay.style, {
    position: 'fixed',
    top: '0',
    left: '0',
    width: '100%',
    height: '100%',
    zIndex: '2147483647',
    background: 'rgba(0,0,0,0.55)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  });

  const box = document.createElement('div');
  Object.assign(box.style, {
    background: '#fff',
    borderRadius: '16px',
    padding: '28px 28px 22px',
    maxWidth: '380px',
    width: '90%',
    boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
    borderTop: '5px solid #ef4444',
    position: 'relative',
  });

  const flagItems = flags
    .map(f => `<li style="margin-bottom:6px;padding-left:4px">⚠️ ${f}</li>`)
    .join('');

  box.innerHTML = `
    <div style="font-size:42px;text-align:center;margin-bottom:10px">🚨</div>
    <h2 style="margin:0 0 8px;font-size:18px;font-weight:700;color:#dc2626;text-align:center">
      Stranger Danger Alert
    </h2>
    <p style="margin:0 0 14px;font-size:13px;color:#374151;text-align:center;line-height:1.5">
      This conversation has some warning signs.<br>
      <strong>Never share personal information with strangers online.</strong>
    </p>
    <ul style="margin:0 0 18px;padding-left:14px;font-size:12px;color:#6b7280;list-style:none">
      ${flagItems}
    </ul>
    <p style="margin:0 0 18px;padding:10px 14px;background:#fef2f2;border-radius:8px;font-size:12px;color:#991b1b;border:1px solid #fca5a5">
      💡 <strong>Tip:</strong> If anything feels uncomfortable or weird, stop talking and tell a trusted adult right away.
    </p>
    <div style="display:flex;gap:10px">
      <button id="ps-stranger-back"
        style="flex:1;padding:10px;background:#ef4444;color:#fff;border:none;border-radius:8px;font-size:13px;font-weight:600;cursor:pointer">
        ← Go Back
      </button>
      <button id="ps-stranger-continue"
        style="flex:1;padding:10px;background:#f1f5f9;color:#374151;border:none;border-radius:8px;font-size:13px;cursor:pointer">
        Continue Anyway
      </button>
    </div>
  `;

  overlay.appendChild(box);
  document.body.appendChild(overlay);
  overlayVisible = true;

  document.getElementById('ps-stranger-back')?.addEventListener('click', () => {
    removeOverlay();
    // Attempt to focus the chat input the user was in
    const el = document.querySelector<HTMLElement>(CHAT_SELECTORS.join(','));
    if (el) { el.focus(); if ('value' in el) (el as HTMLInputElement).value = ''; }
  });

  document.getElementById('ps-stranger-continue')?.addEventListener('click', removeOverlay);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) removeOverlay(); });
}

// ─── Monitor ─────────────────────────────────────────────────────────────────

function attachMonitor(el: Element): void {
  if (monitoredInputs.has(el)) return;
  monitoredInputs.add(el);

  let debounce: ReturnType<typeof setTimeout>;
  let lastValue = '';
  // Track how many messages were sent in this session (conversation accumulation)
  let conversationBuffer = '';

  el.addEventListener('input', () => {
    clearTimeout(debounce);
    debounce = setTimeout(() => {
      const value =
        el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement
          ? el.value
          : (el as HTMLElement).innerText || '';

      if (value === lastValue || value.length < MIN_LENGTH) return;
      lastValue = value;

      // Accumulate into conversation buffer (last ~500 chars)
      conversationBuffer = (conversationBuffer + ' ' + value).slice(-500);

      const risk = detectStrangerRisk(conversationBuffer);
      if (risk.level === 'warning' || risk.level === 'danger') {
        showStrangerWarning(risk.flags);

        chrome.runtime.sendMessage({
          type: 'STRANGER_RISK_DETECTED',
          data: {
            score: risk.score,
            level: risk.level,
            flags: risk.flags,
            categories: risk.categories,
            url: window.location.href,
          },
        }).catch(() => {});
      }
    }, 800);
  });

  // Reset buffer when message is sent (Enter key or send button)
  el.addEventListener('keydown', (e) => {
    if ((e as KeyboardEvent).key === 'Enter' && !(e as KeyboardEvent).shiftKey) {
      lastValue = '';
      // Keep buffer for context but fade old content
      conversationBuffer = conversationBuffer.slice(-200);
    }
  });
}

function scanAndAttach(): void {
  CHAT_SELECTORS.forEach(selector => {
    try {
      document.querySelectorAll(selector).forEach(el => attachMonitor(el));
    } catch {
      // Invalid selector on this page — skip
    }
  });
}

// ─── Bootstrap ───────────────────────────────────────────────────────────────

scanAndAttach();

// Watch for dynamically injected chat inputs (SPAs)
const observer = new MutationObserver(() => scanAndAttach());
observer.observe(document.body, { childList: true, subtree: true });

console.log('👻 Privacy Shadow: Stranger monitor active');
