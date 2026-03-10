import type { HarmScore, PIIDetection } from "./types"
import { PII_WEIGHTS } from "./types"

export function calculateHarmScore(detections: PIIDetection[]): HarmScore {
  const breakdown: Record<string, number> = {
    full_name: 0,
    address: 0,
    phone: 0,
    email: 0,
    school: 0,
    age_dob: 0,
    location: 0,
  }

  for (const detection of detections) {
    const weight = PII_WEIGHTS[detection.category]
    const score = weight * detection.confidence
    breakdown[detection.category] = Math.max(
      breakdown[detection.category],
      score
    )
  }

  const total = Math.min(
    100,
    Object.values(breakdown).reduce((sum, val) => sum + val, 0)
  )

  // Multiple PII types together increase risk
  const categoriesDetected = Object.values(breakdown).filter(
    (v) => v > 0
  ).length
  const combinationBonus = categoriesDetected > 1 ? categoriesDetected * 5 : 0
  const finalTotal = Math.min(100, total + combinationBonus)

  return {
    total: Math.round(finalTotal),
    breakdown: breakdown as HarmScore["breakdown"],
    level: getHarmLevel(finalTotal),
  }
}

function getHarmLevel(
  score: number
): "safe" | "low" | "medium" | "high" | "critical" {
  if (score === 0) return "safe"
  if (score < 20) return "low"
  if (score < 45) return "medium"
  if (score < 70) return "high"
  return "critical"
}

export const HARM_LEVEL_COLORS: Record<string, string> = {
  safe: "#22c55e",
  low: "#84cc16",
  medium: "#eab308",
  high: "#f97316",
  critical: "#ef4444",
}
