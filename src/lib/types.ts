export type PIICategory =
  | "full_name"
  | "address"
  | "phone"
  | "email"
  | "school"
  | "age_dob"
  | "location"

export interface PIIDetection {
  category: PIICategory
  match: string
  confidence: number // 0-1
  position: { start: number; end: number }
}

export interface HarmScore {
  total: number // 0-100
  breakdown: Record<PIICategory, number>
  level: "safe" | "low" | "medium" | "high" | "critical"
}

export interface DetectionEvent {
  id: string
  timestamp: number
  platform: string
  url: string
  message: string
  detections: PIIDetection[]
  harmScore: HarmScore
  blocked: boolean
}

export interface ParentNotificationConfig {
  enabled: boolean
  parentPhone: string
  twilioAccountSid: string
  twilioAuthToken: string
  twilioFromNumber: string
}

export interface UserSettings {
  enabled: boolean
  sensitivity: "low" | "medium" | "high"
  blockedCategories: PIICategory[]
  showWarnings: boolean
  parentPin?: string
  parentNotification?: ParentNotificationConfig
}

export const PII_WEIGHTS: Record<PIICategory, number> = {
  full_name: 20,
  address: 30,
  phone: 25,
  email: 15,
  school: 25,
  age_dob: 20,
  location: 20,
}

export const DEFAULT_SETTINGS: UserSettings = {
  enabled: true,
  sensitivity: "medium",
  blockedCategories: ["address", "phone", "school"],
  showWarnings: true,
}
