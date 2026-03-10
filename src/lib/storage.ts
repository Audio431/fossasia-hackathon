import { Storage } from "@plasmohq/storage"
import type { DetectionEvent, UserSettings } from "./types"
import { DEFAULT_SETTINGS } from "./types"

const storage = new Storage({ area: "local" })

export async function getSettings(): Promise<UserSettings> {
  const settings = await storage.get<UserSettings>("settings")
  return settings ?? DEFAULT_SETTINGS
}

export async function saveSettings(
  settings: Partial<UserSettings>
): Promise<void> {
  const current = await getSettings()
  await storage.set("settings", { ...current, ...settings })
}

export async function getDetectionEvents(): Promise<DetectionEvent[]> {
  const events = await storage.get<DetectionEvent[]>("detection_events")
  return events ?? []
}

export async function addDetectionEvent(
  event: DetectionEvent
): Promise<void> {
  const events = await getDetectionEvents()
  events.unshift(event)
  // Keep only the last 100 events
  const trimmed = events.slice(0, 100)
  await storage.set("detection_events", trimmed)
}

export async function clearDetectionEvents(): Promise<void> {
  await storage.set("detection_events", [])
}

export { storage }
