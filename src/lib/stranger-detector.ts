import { Storage } from "@plasmohq/storage"

const storage = new Storage({ area: "local" })

export interface StrangerRiskProfile {
  /** 1.0 = trusted friend, 2.0 = complete stranger */
  multiplier: number
  signals: StrangerSignal[]
  conversationCount: number
}

export interface StrangerSignal {
  name: string
  risky: boolean
  detail: string
}

interface ConversationRecord {
  recipientId: string
  platform: string
  messageCount: number
  firstSeen: number
}

// ── DOM Scraping: extract visible profile signals ──

interface ProfileSignals {
  followerCount: number | null
  postCount: number | null
  isVerified: boolean
  isFollowedByUser: boolean
  isFollowingUser: boolean
  accountName: string | null
}

function scrapeInstagramProfile(): ProfileSignals {
  const signals: ProfileSignals = {
    followerCount: null,
    postCount: null,
    isVerified: false,
    isFollowedByUser: false,
    isFollowingUser: false,
    accountName: null,
  }

  // Get the DM header — the top bar of the conversation
  const header = document.querySelector('div[role="main"] header')
    || document.querySelector('div[role="banner"]')

  if (header) {
    const nameEl = header.querySelector('span[dir="auto"]')
      || header.querySelector('a[role="link"] span')
    if (nameEl) {
      signals.accountName = nameEl.textContent?.trim() || null
    }

    const verified = header.querySelector('svg[aria-label="Verified"]')
      || header.querySelector('[title="Verified"]')
    signals.isVerified = !!verified
  }

  // Instagram DM: scan the entire page for follow-related buttons and text.
  // The info panel (opened via (i) button) or thread header may contain these.
  // Also check for "Follow" / "Following" / "Follow Back" as link text.
  const allElements = document.querySelectorAll('button, a, div[role="button"]')
  let foundFollowSignal = false
  for (const el of allElements) {
    const text = (el.textContent || "").trim()
    const lower = text.toLowerCase()

    // Exact matches to avoid false positives on "Followers" etc.
    if (lower === "following" || lower === "friends" || lower === "message") {
      // "Following" button means we follow them
      if (lower === "following") {
        signals.isFollowedByUser = true
        foundFollowSignal = true
      }
    }
    if (lower === "follow back") {
      signals.isFollowingUser = true
      signals.isFollowedByUser = false
      foundFollowSignal = true
    }
    if (lower === "follow" && el.tagName === "BUTTON") {
      // Standalone "Follow" button means we don't follow them
      signals.isFollowedByUser = false
      foundFollowSignal = true
    }
  }

  // Instagram DM also shows "Followed by..." or "You follow each other" text
  const bodyText = document.body.innerText || ""
  if (bodyText.includes("You follow each other")) {
    signals.isFollowedByUser = true
    signals.isFollowingUser = true
    foundFollowSignal = true
  } else if (/follows?\s+you/i.test(bodyText)) {
    signals.isFollowingUser = true
    foundFollowSignal = true
  }

  // Check the DM thread info panel for follower/post counts
  const statElements = document.querySelectorAll('span[title], span[class*="count"]')
  for (const el of statElements) {
    const title = el.getAttribute("title") || el.textContent || ""
    const num = parseCount(title)
    const context = (el.parentElement?.textContent || "").toLowerCase()
    if (num !== null) {
      if (context.includes("follower")) signals.followerCount = num
      if (context.includes("post")) signals.postCount = num
    }
  }

  // If no follow signal was found from DOM, default to unknown (don't assume stranger)
  if (!foundFollowSignal) {
    signals.isFollowedByUser = true // benefit of the doubt
  }

  return signals
}

function scrapeGenericProfile(): ProfileSignals {
  const signals: ProfileSignals = {
    followerCount: null,
    postCount: null,
    isVerified: false,
    isFollowedByUser: false,
    isFollowingUser: false,
    accountName: null,
  }

  // Generic: look for verified badges
  const verified = document.querySelector('[aria-label*="verified" i], [aria-label*="Verified"]')
  signals.isVerified = !!verified

  // Look for "Following" buttons
  const allButtons = document.querySelectorAll("button")
  for (const btn of allButtons) {
    const text = btn.textContent?.trim().toLowerCase() || ""
    if (text === "following" || text === "friends" || text === "mutual") {
      signals.isFollowedByUser = true
    }
  }

  return signals
}

function parseCount(text: string): number | null {
  const cleaned = text.replace(/,/g, "").trim()
  // Handle "1.2K", "3.5M" etc
  const match = cleaned.match(/^([\d.]+)\s*([KkMm]?)$/)
  if (!match) return null
  let num = parseFloat(match[1])
  if (match[2].toLowerCase() === "k") num *= 1000
  if (match[2].toLowerCase() === "m") num *= 1000000
  return Math.round(num)
}

// ── Conversation tracking ──

function getRecipientId(): string {
  // Use the URL path as a stable conversation identifier
  const path = window.location.pathname
  // Instagram: /direct/t/THREAD_ID
  const igMatch = path.match(/\/direct\/t\/(\d+)/)
  if (igMatch) return `ig:${igMatch[1]}`
  // Messenger: /t/ID
  const fbMatch = path.match(/\/t\/(\d+)/)
  if (fbMatch) return `fb:${fbMatch[1]}`
  // WhatsApp: no URL-based ID, use visible contact name
  const waHeader = document.querySelector('header span[title]')
  if (waHeader) return `wa:${waHeader.getAttribute("title")}`
  // Fallback: use URL hash
  return `chat:${path}`
}

async function getConversationRecord(recipientId: string, platform: string): Promise<ConversationRecord> {
  const key = `conversation:${recipientId}`
  const existing = await storage.get<ConversationRecord>(key)
  if (existing) return existing
  // New conversation
  const record: ConversationRecord = {
    recipientId,
    platform,
    messageCount: 0,
    firstSeen: Date.now(),
  }
  await storage.set(key, record)
  return record
}

async function incrementConversation(recipientId: string, platform: string): Promise<ConversationRecord> {
  const record = await getConversationRecord(recipientId, platform)
  record.messageCount++
  await storage.set(`conversation:${recipientId}`, record)
  return record
}

// ── Main: assess stranger risk ──

export async function assessStrangerRisk(platform: string): Promise<StrangerRiskProfile> {
  const signals: StrangerSignal[] = []

  // 1. DOM scraping
  const profile = platform === "Instagram"
    ? scrapeInstagramProfile()
    : scrapeGenericProfile()

  // Following relationship
  if (profile.isFollowedByUser) {
    signals.push({ name: "following", risky: false, detail: "You follow this person" })
  } else {
    signals.push({ name: "following", risky: true, detail: "You don't follow this person" })
  }

  // Verified status
  if (profile.isVerified) {
    signals.push({ name: "verified", risky: false, detail: "Verified account" })
  }

  // Follower count
  if (profile.followerCount !== null) {
    if (profile.followerCount < 50) {
      signals.push({ name: "low_followers", risky: true, detail: `Only ${profile.followerCount} followers` })
    } else {
      signals.push({ name: "followers", risky: false, detail: `${profile.followerCount} followers` })
    }
  }

  // Post count
  if (profile.postCount !== null) {
    if (profile.postCount < 5) {
      signals.push({ name: "low_posts", risky: true, detail: `Only ${profile.postCount} posts` })
    }
  }

  // 2. Conversation history
  const recipientId = getRecipientId()
  const conversation = await getConversationRecord(recipientId, platform)

  const daysSinceFirst = (Date.now() - conversation.firstSeen) / (1000 * 60 * 60 * 24)

  if (conversation.messageCount < 5) {
    signals.push({ name: "new_conversation", risky: true, detail: `Only ${conversation.messageCount} messages exchanged` })
  } else if (conversation.messageCount < 20) {
    signals.push({ name: "recent_conversation", risky: false, detail: `${conversation.messageCount} messages exchanged` })
  } else {
    signals.push({ name: "established_conversation", risky: false, detail: `${conversation.messageCount}+ messages exchanged` })
  }

  if (daysSinceFirst < 1) {
    signals.push({ name: "first_day", risky: true, detail: "First conversation today" })
  } else if (daysSinceFirst < 7) {
    signals.push({ name: "recent_contact", risky: true, detail: `Known for ${Math.ceil(daysSinceFirst)} days` })
  } else {
    signals.push({ name: "known_contact", risky: false, detail: `Known for ${Math.ceil(daysSinceFirst)} days` })
  }

  // 3. Calculate multiplier
  const riskyCount = signals.filter((s) => s.risky).length
  const safeCount = signals.filter((s) => !s.risky).length

  // Base multiplier starts at 1.0 (safe)
  // Each risky signal adds 0.2, each safe signal subtracts 0.1
  // Clamped between 1.0 and 2.0
  let multiplier = 1.0 + riskyCount * 0.2 - safeCount * 0.1
  multiplier = Math.max(1.0, Math.min(2.0, multiplier))

  return {
    multiplier,
    signals,
    conversationCount: conversation.messageCount,
  }
}

export { incrementConversation, getRecipientId }
