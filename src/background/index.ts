import { addDetectionEvent, getDetectionEvents, getSettings } from "../lib/storage"
import type { DetectionEvent, ParentNotificationConfig } from "../lib/types"

// Listen for PII detection events from content scripts
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === "PII_DETECTED") {
    const event: DetectionEvent = message.event
    addDetectionEvent(event).then(async () => {
      updateBadge()
      showNotification(event)
      // Send SMS to parent if high/critical
      if (event.harmScore.level === "high" || event.harmScore.level === "critical") {
        await sendParentSMS(event)
      }
      sendResponse({ success: true })
    })
    return true // async response
  }

  if (message.type === "TEST_SMS") {
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
    sendParentSMS(testEvent).then(() => {
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

async function sendParentSMS(event: DetectionEvent) {
  const settings = await getSettings()
  const config = settings.parentNotification
  if (!config?.enabled || !config.parentPhone) return

  // Use env vars as fallback for Twilio credentials
  const accountSid = config.twilioAccountSid || process.env.PLASMO_PUBLIC_TWILIO_ACCOUNT_SID || ""
  const authToken = config.twilioAuthToken || process.env.PLASMO_PUBLIC_TWILIO_AUTH_TOKEN || ""
  const fromNumber = config.twilioFromNumber || process.env.PLASMO_PUBLIC_TWILIO_FROM_NUMBER || ""

  if (!accountSid || !authToken || !fromNumber) return

  const categories = event.detections
    .map((d) => d.category.replace("_", " "))
    .join(", ")

  const body =
    `[SafeChild Alert] Your child shared sensitive info (${categories}) ` +
    `on ${event.platform}. Risk: ${event.harmScore.total}/100 (${event.harmScore.level}). ` +
    `Please check in with them.`

  const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`
  const auth = btoa(`${accountSid}:${authToken}`)

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        To: config.parentPhone,
        From: fromNumber,
        Body: body,
      }),
    })

    if (!res.ok) {
      console.error("SafeChild SMS failed:", res.status, await res.text())
    } else {
      console.log("SafeChild SMS sent to parent:", config.parentPhone)
    }
  } catch (err) {
    console.error("SafeChild SMS error:", err)
  }
}

// Initialize badge on install/update
chrome.runtime.onInstalled.addListener(() => {
  updateBadge()
})
