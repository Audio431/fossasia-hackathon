import { config as dotenvConfig } from "dotenv"
import { detectPII } from "./src/lib/pii-detector"
import { calculateHarmScore } from "./src/lib/harm-scorer"
import type { DetectionEvent } from "./src/lib/types"

dotenvConfig()

const channelAccessToken = process.env.PLASMO_PUBLIC_LINE_CHANNEL_ACCESS_TOKEN || ""
const userId = process.env.PLASMO_PUBLIC_LINE_USER_ID || ""

// E2E test messages — real user input that goes through actual PII detection + harm scoring
const testInputs = [
  // Critical: multi-PII narrative
  { input: "my name is john smith and im 13 years old and my phone is 123-456-7890", platform: "Instagram", expectLevel: "high" },
  // Critical: address + school + location combo (3 categories = high combo bonus)
  { input: "i live at 123 main street and i go to lincoln high school", platform: "TikTok", expectLevel: "critical" },
  // Low: single email (weight 15 * 0.95 = 14)
  { input: "my email is kid123@gmail.com", platform: "Discord", expectLevel: "low" },
  // Medium: phone only
  { input: "call me at 0812345678", platform: "WhatsApp Web", expectLevel: "medium" },
  // Low: just a name
  { input: "my name is john smith", platform: "Instagram", expectLevel: "low" },
  // Low: birthday only
  { input: "my birthday is 05/12/2012", platform: "Facebook Messenger", expectLevel: "low" },
  // Safe: no PII
  { input: "hello how are you doing today", platform: "Instagram", expectLevel: "safe" },
  // Critical: address + school + location combo
  { input: "i live at 456 oak avenue and my school is westfield academy", platform: "Instagram", expectLevel: "critical" },
]

async function sendLINE(event: DetectionEvent): Promise<boolean> {
  const level = event.harmScore.level
  const icon = level === "critical" ? "🚨" : level === "high" ? "🚨" : "⚠️"
  const header = level === "critical" || level === "high" ? "SafeChild Alert" : "SafeChild Warning"
  const action =
    level === "critical"
      ? "Please check in with your child immediately."
      : level === "high"
        ? "Please check in with your child."
        : "Consider talking to your child about online safety."

  const categories = event.detections
    .map((d) => d.category.replace("_", " "))
    .join(", ")

  const text =
    `${icon} [${header}]\n\n` +
    `Your child shared personal information:\n` +
    `• ${categories}\n` +
    `• Platform: ${event.platform}\n` +
    `• Risk: ${event.harmScore.total}/100 (${level.toUpperCase()})\n\n` +
    action

  const res = await fetch("https://api.line.me/v2/bot/message/push", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${channelAccessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      to: userId,
      messages: [{ type: "text", text }],
    }),
  })

  return res.ok
}

async function main() {
  if (!channelAccessToken || !userId) {
    console.error("Missing LINE credentials in .env")
    console.error("Set PLASMO_PUBLIC_LINE_CHANNEL_ACCESS_TOKEN and PLASMO_PUBLIC_LINE_USER_ID")
    process.exit(1)
  }

  // Step 1: Verify bot
  console.log("=== Step 1: Bot Info ===")
  const botRes = await fetch("https://api.line.me/v2/bot/info", {
    headers: { Authorization: `Bearer ${channelAccessToken}` },
  })
  const botInfo = await botRes.json()
  console.log(`Bot: ${botInfo.displayName} (${botInfo.basicId})\n`)

  // Step 2: Run PII detection + harm scoring on each input
  console.log("=== Step 2: PII Detection & Harm Scoring ===")
  let detectionPass = 0
  let detectionFail = 0
  const eventsToSend: { event: DetectionEvent; input: string }[] = []

  for (const test of testInputs) {
    const detections = detectPII(test.input)
    const harmScore = detections.length > 0 ? calculateHarmScore(detections) : { total: 0, breakdown: {} as any, level: "safe" as const }

    const levelMatch = harmScore.level === test.expectLevel
    const icon = levelMatch ? "PASS" : "FAIL"
    if (levelMatch) detectionPass++
    else detectionFail++

    const categories = detections.map((d) => d.category).join(", ") || "none"
    console.log(
      `  [${icon}] "${test.input.substring(0, 50)}${test.input.length > 50 ? "..." : ""}"` +
      `\n         Detected: ${categories} | Score: ${harmScore.total}/100 | Level: ${harmScore.level} (expected: ${test.expectLevel})`
    )

    // Queue medium+ for LINE sending
    if (harmScore.level === "medium" || harmScore.level === "high" || harmScore.level === "critical") {
      eventsToSend.push({
        input: test.input,
        event: {
          id: `test-${Date.now()}-${Math.random().toString(36).slice(2)}`,
          timestamp: Date.now(),
          platform: test.platform,
          url: `https://${test.platform.toLowerCase().replace(/\s/g, "")}.com/dm/test`,
          message: test.input.substring(0, 200),
          detections,
          harmScore,
          blocked: harmScore.level === "high" || harmScore.level === "critical",
        },
      })
    }
  }

  console.log(`\n  Detection results: ${detectionPass}/${testInputs.length} passed\n`)

  // Step 3: Send LINE alerts for medium+ events
  console.log("=== Step 3: Sending LINE Alerts (medium+ only) ===")
  let linePassed = 0
  let lineFailed = 0

  for (const { event, input } of eventsToSend) {
    const shortInput = input.substring(0, 40) + (input.length > 40 ? "..." : "")
    console.log(`  Sending [${event.harmScore.level.toUpperCase()}] "${shortInput}"...`)

    const ok = await sendLINE(event)
    if (ok) {
      console.log(`  [PASS] Sent to LINE!`)
      linePassed++
    } else {
      console.log(`  [FAIL] LINE delivery failed`)
      lineFailed++
    }

    await new Promise((r) => setTimeout(r, 500))
  }

  // Step 4: Quota check
  console.log("\n=== Step 4: Message Quota ===")
  const quotaRes = await fetch("https://api.line.me/v2/bot/message/quota/consumption", {
    headers: { Authorization: `Bearer ${channelAccessToken}` },
  })
  const quota = await quotaRes.json()
  console.log(`Messages sent this month: ${quota.totalUsage}`)

  // Summary
  console.log("\n=== Summary ===")
  console.log(`PII Detection: ${detectionPass}/${testInputs.length} passed`)
  console.log(`LINE Alerts:   ${linePassed}/${eventsToSend.length} sent (${testInputs.length - eventsToSend.length} skipped — below medium threshold)`)

  if (detectionFail > 0 || lineFailed > 0) {
    console.log(`\n${detectionFail + lineFailed} total failures — review output above.`)
    process.exit(1)
  } else {
    console.log("\nAll tests passed! Check your LINE app for the alerts.")
  }
}

main()
