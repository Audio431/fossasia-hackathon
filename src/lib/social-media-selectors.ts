export interface PlatformConfig {
  name: string
  hostPatterns: string[]
  inputSelectors: string[]
  messageSelectors: string[]
  chatContainerSelectors: string[]
}

// Generic selectors that work as fallbacks across all platforms
const GENERIC_INPUT_SELECTORS = [
  'div[contenteditable="true"]',
  'div[role="textbox"]',
  '[contenteditable="true"]',
]

const GENERIC_MESSAGE_SELECTORS = [
  'div[dir="auto"] span',
  'span[dir="auto"]',
]

export const PLATFORMS: PlatformConfig[] = [
  {
    name: "Instagram",
    hostPatterns: ["instagram.com"],
    inputSelectors: [
      'div[role="textbox"][contenteditable="true"]',
      'div[contenteditable="true"][role="textbox"]',
      // Instagram uses paragraphs inside contenteditable
      'p[contenteditable="true"]',
      ...GENERIC_INPUT_SELECTORS,
    ],
    messageSelectors: [
      // Instagram messages are in spans with dir="auto" inside rows
      'div[role="row"] span[dir="auto"]',
      'div[role="listbox"] span[dir="auto"]',
      'div[role="row"] div[dir="auto"]',
      // Fallback: any span inside a role="row" or role="listitem"
      'div[role="row"] span',
      'div[role="listitem"] span[dir="auto"]',
      ...GENERIC_MESSAGE_SELECTORS,
    ],
    chatContainerSelectors: [
      'div[role="main"]',
      'div[role="listbox"]',
      'section',
    ],
  },
  {
    name: "Facebook Messenger",
    hostPatterns: ["messenger.com", "facebook.com/messages"],
    inputSelectors: [
      'div[role="textbox"][contenteditable="true"]',
      'div[aria-label*="Message"][contenteditable="true"]',
      ...GENERIC_INPUT_SELECTORS,
    ],
    messageSelectors: [
      'div[dir="auto"] span',
      'div[role="row"] div[dir="auto"]',
      ...GENERIC_MESSAGE_SELECTORS,
    ],
    chatContainerSelectors: [
      'div[role="main"]',
    ],
  },
  {
    name: "WhatsApp Web",
    hostPatterns: ["web.whatsapp.com"],
    inputSelectors: [
      'div[contenteditable="true"][data-tab="10"]',
      'footer div[contenteditable="true"]',
      ...GENERIC_INPUT_SELECTORS,
    ],
    messageSelectors: [
      'div.message-in span.selectable-text span',
      'div.message-out span.selectable-text span',
      'span[dir="ltr"]',
      ...GENERIC_MESSAGE_SELECTORS,
    ],
    chatContainerSelectors: [
      'div#main div[role="application"]',
      'div#main',
    ],
  },
  {
    name: "TikTok",
    hostPatterns: ["tiktok.com"],
    inputSelectors: [
      'div[contenteditable="true"][data-e2e*="message"]',
      'div[class*="chat-input"] div[contenteditable="true"]',
      ...GENERIC_INPUT_SELECTORS,
    ],
    messageSelectors: [
      'div[class*="chat-message"] p',
      'div[class*="message-content"] span',
      ...GENERIC_MESSAGE_SELECTORS,
    ],
    chatContainerSelectors: [
      'div[class*="chat-room"]',
      'div[class*="chat"]',
    ],
  },
  {
    name: "Discord",
    hostPatterns: ["discord.com"],
    inputSelectors: [
      'div[role="textbox"][contenteditable="true"]',
      'div[class*="textArea"] div[contenteditable="true"]',
      ...GENERIC_INPUT_SELECTORS,
    ],
    messageSelectors: [
      'div[id^="message-content-"]',
      'div[class*="messageContent"] span',
      ...GENERIC_MESSAGE_SELECTORS,
    ],
    chatContainerSelectors: [
      'ol[class*="scrollerInner"]',
      'div[class*="chat-"] main',
    ],
  },
]

export function detectPlatform(hostname: string): PlatformConfig | null {
  return (
    PLATFORMS.find((platform) =>
      platform.hostPatterns.some((pattern) => hostname.includes(pattern))
    ) ?? null
  )
}
