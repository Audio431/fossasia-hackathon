import { addDetectionEvent, getDetectionEvents, getSettings } from "../lib/storage"
import type { DetectionEvent } from "../lib/types"

// Rate limit LINE alerts: cooldown per platform, dedup by detection fingerprint
let lastLineSent = 0
let lastLineFingerprint = ""
const LINE_COOLDOWN_MS = 10_000

/** Build a fingerprint from detected PII categories + matched strings (not the full message) */
function detectionFingerprint(event: DetectionEvent): string {
  return event.platform + "|" + event.detections
    .map((d) => `${d.category}:${d.match.trim().toLowerCase()}`)
    .sort()
    .join(",")
}

// Listen for PII detection events from content scripts
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === "PII_DETECTED") {
    const event: DetectionEvent = message.event
    addDetectionEvent(event).then(async () => {
      updateBadge()
      showNotification(event)
      // Send LINE message to parent for any detected PII (rate limited + deduped)
      if (event.harmScore.level !== "safe") {
        const now = Date.now()
        const fingerprint = detectionFingerprint(event)
        if (fingerprint === lastLineFingerprint) {
          console.log("SafeChild LINE: same PII already reported, skipping")
        } else if (now - lastLineSent >= LINE_COOLDOWN_MS) {
          lastLineSent = now
          lastLineFingerprint = fingerprint
          await sendParentLINE(event)
        } else {
          console.log("SafeChild LINE: rate limited, skipping alert")
        }
      }
      sendResponse({ success: true })
    })
    return true // async response
  }

  if (message.type === "TEST_LINE") {
    const testEvent: DetectionEvent = {
      id: "test-" + Date.now(),
      timestamp: Date.now(),
      platform: "Test",
      url: "https://example.com",
      message: "This is a test alert",
      detections: [{ category: "full_name", match: "John Smith", confidence: 0.9, position: { start: 0, end: 10 } }],
      harmScore: { total: 75, breakdown: { full_name: 20, address: 0, phone: 25, email: 0, school: 25, age_dob: 0, location: 0 }, level: "high" },
      blocked: true,
    }
    sendParentLINE(testEvent).then(() => {
      sendResponse({ success: true })
    }).catch((err) => {
      sendResponse({ success: false, error: String(err) })
    })
    return true
  }

  if (message.type === "GET_EVENTS") {
    getDetectionEvents().then((events) => {
      sendResponse({ events })
    })
    return true
  }

  if (message.type === "GET_STATS") {
    getDetectionEvents().then((events) => {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const todayTimestamp = today.getTime()

      const todayEvents = events.filter((e) => e.timestamp >= todayTimestamp)
      const stats = {
        totalToday: todayEvents.length,
        blockedToday: todayEvents.filter((e) => e.blocked).length,
        averageScore:
          todayEvents.length > 0
            ? Math.round(
                todayEvents.reduce((sum, e) => sum + e.harmScore.total, 0) /
                  todayEvents.length
              )
            : 0,
        topCategories: getTopCategories(todayEvents),
      }
      sendResponse({ stats })
    })
    return true
  }
})

function getTopCategories(
  events: DetectionEvent[]
): { category: string; count: number }[] {
  const counts: Record<string, number> = {}
  for (const event of events) {
    for (const detection of event.detections) {
      counts[detection.category] = (counts[detection.category] || 0) + 1
    }
  }
  return Object.entries(counts)
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)
}

async function updateBadge() {
  const events = await getDetectionEvents()
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const todayHighRisk = events.filter(
    (e) =>
      e.timestamp >= today.getTime() &&
      (e.harmScore.level === "high" || e.harmScore.level === "critical")
  ).length

  if (todayHighRisk > 0) {
    chrome.action.setBadgeText({ text: String(todayHighRisk) })
    chrome.action.setBadgeBackgroundColor({ color: "#ef4444" })
  } else {
    chrome.action.setBadgeText({ text: "" })
  }
}

function showNotification(event: DetectionEvent) {
  const categories = event.detections
    .map((d) => d.category.replace("_", " "))
    .join(", ")

  const levelLabels: Record<string, string> = {
    safe: "Safe",
    low: "Low Risk",
    medium: "Medium Risk",
    high: "High Risk",
    critical: "Critical Risk",
  }

  const title =
    event.harmScore.level === "critical" || event.harmScore.level === "high"
      ? `SafeChild - ${levelLabels[event.harmScore.level]}!`
      : `SafeChild - ${levelLabels[event.harmScore.level]}`

  chrome.notifications.create(event.id, {
    type: "basic",
    iconUrl: chrome.runtime.getURL(chrome.runtime.getManifest().icons?.["128"] || "icon128.png"),
    title,
    message: `Personal info detected on ${event.platform}: ${categories} (Score: ${event.harmScore.total}/100)`,
    priority: event.harmScore.level === "critical" ? 2 : 1,
    requireInteraction:
      event.harmScore.level === "critical" ||
      event.harmScore.level === "high",
  })
}

async function sendParentLINE(event: DetectionEvent) {
  const settings = await getSettings()
  const config = settings.parentNotification

  // Use settings from popup UI, or fall back to build-time env vars
  const accessToken = config?.lineChannelAccessToken || process.env.PLASMO_PUBLIC_LINE_CHANNEL_ACCESS_TOKEN || ""
  const userId = config?.lineUserId || process.env.PLASMO_PUBLIC_LINE_USER_ID || ""

  // Only skip if user explicitly configured LINE credentials in settings AND disabled it
  if (config && config.enabled === false && config.lineChannelAccessToken) return

  if (!accessToken || !userId) {
    console.warn("SafeChild LINE: missing accessToken or userId, skipping")
    return
  }

  const detectionDetails = event.detections
    .map((d) => `${d.category.replace("_", " ")}: "${d.match.substring(0, 50)}"`)
    .join("\n• ")

  const level = event.harmScore.level
  const icon = level === "critical" ? "🚨" : level === "high" ? "🚨" : "⚠️"
  const header = level === "critical" || level === "high" ? "SafeChild Alert" : "SafeChild Warning"
  const action =
    level === "critical"
      ? "Please check in with your child immediately."
      : level === "high"
        ? "Please check in with your child."
        : "Consider talking to your child about online safety."

  const multiplier = event.harmScore.strangerMultiplier ?? 1.0
  const strangerNote = multiplier > 1.0
    ? `\n⚠ Stranger risk detected (score multiplied x${multiplier.toFixed(1)})`
    : ""

  const text =
    `${icon} [${header}]\n\n` +
    `Your child tried to share:\n` +
    `• ${detectionDetails}\n\n` +
    `Platform: ${event.platform}\n` +
    `Risk score: ${event.harmScore.total}/100 (${level.toUpperCase()})` +
    strangerNote +
    `\n\n` +
    action

  try {
    const res = await fetch("https://api.line.me/v2/bot/message/push", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        to: userId,
        messages: [{ type: "text", text }],
      }),
    })

    if (!res.ok) {
      const body = await res.text()
      console.error("SafeChild LINE failed:", res.status, body)
      throw new Error(`LINE API ${res.status}: ${body}`)
    } else {
      console.log("SafeChild LINE alert sent to parent:", level, event.platform)
    }
  } catch (err) {
    console.error("SafeChild LINE error:", err)
  }
}

// Initialize badge on install/update
chrome.runtime.onInstalled.addListener(() => {
  updateBadge()
})
