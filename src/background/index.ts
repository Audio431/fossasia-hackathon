import { addDetectionEvent, getDetectionEvents } from "../lib/storage"
import type { DetectionEvent } from "../lib/types"

// Listen for PII detection events from content scripts
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === "PII_DETECTED") {
    const event: DetectionEvent = message.event
    addDetectionEvent(event).then(() => {
      updateBadge()
      showNotification(event)
      sendResponse({ success: true })
    })
    return true // async response
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
    iconUrl: chrome.runtime.getURL("icon128.plasmo.png"),
    title,
    message: `Personal info detected on ${event.platform}: ${categories} (Score: ${event.harmScore.total}/100)`,
    priority: event.harmScore.level === "critical" ? 2 : 1,
    requireInteraction:
      event.harmScore.level === "critical" ||
      event.harmScore.level === "high",
  })
}

// Initialize badge on install/update
chrome.runtime.onInstalled.addListener(() => {
  updateBadge()
})
