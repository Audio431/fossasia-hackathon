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

  // Get the DM header — contains recipient name and sometimes follow status
  const header = document.querySelector('div[role="main"] header')
    || document.querySelector('div[role="banner"]')

  if (header) {
    // Recipient name from DM thread header
    const nameEl = header.querySelector('span[dir="auto"]')
      || header.querySelector('a[role="link"] span')
    if (nameEl) {
      signals.accountName = nameEl.textContent?.trim() || null
    }

    // Verified badge (blue checkmark SVG)
    const verified = header.querySelector('svg[aria-label="Verified"]')
      || header.querySelector('[title="Verified"]')
    signals.isVerified = !!verified
  }

  // "Following" / "Follow" button indicates relationship
  const followBtn = document.querySelector('button:has(div)')
  const allButtons = document.querySelectorAll('button')
  for (const btn of allButtons) {
    const text = btn.textContent?.trim().toLowerCase() || ""
    if (text === "following" || text === "friends") {
      signals.isFollowedByUser = true
    }
    if (text === "follow back") {
      signals.isFollowingUser = true
      signals.isFollowedByUser = false
    }
    if (text === "follow" && !text.includes("following")) {
      // They show "Follow" — we're NOT following them
      signals.isFollowedByUser = false
    }
  }

  // Try to extract follower/post counts from any visible profile info
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
