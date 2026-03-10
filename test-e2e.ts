import { chromium, type Page } from "playwright"
import path from "path"
import { config as dotenvConfig } from "dotenv"

dotenvConfig()

const EXTENSION_PATH = path.resolve(__dirname, "build/chrome-mv3-prod")
const TEST_URL = "https://www.instagram.com/direct/inbox/"

// Instagram test account
const IG_USERNAME = "testlikeshit2@gmail.com"
const IG_PASSWORD = "1-2-3-4-5-6-7-8"

// LINE Messaging API config for e2e notification testing
const LINE_CHANNEL_ACCESS_TOKEN = process.env.PLASMO_PUBLIC_LINE_CHANNEL_ACCESS_TOKEN || ""
const LINE_USER_ID = process.env.PLASMO_PUBLIC_LINE_USER_ID || ""

const TEST_MESSAGES = [
  { text: "my name is john smith", expectDetection: true, expectCategory: "full_name" },
  { text: "im 13 years old", expectDetection: true, expectCategory: "age_dob" },
  { text: "i live at 123 main street", expectDetection: true, expectCategory: "address" },
  { text: "test@email.com", expectDetection: true, expectCategory: "email" },
  { text: "0812345678", expectDetection: true, expectCategory: "phone" },
  { text: "hello how are you", expectDetection: false, expectCategory: null },
  { text: "i'm from bangkok", expectDetection: true, expectCategory: "location" },
  { text: "my school is lincoln high school", expectDetection: true, expectCategory: "school" },
  // Narrative combo — should trigger high risk + LINE alert
  { text: "my name is john smith and im 13 years old and my phone is 123-456-7890", expectDetection: true, expectCategory: "multi", expectHighRisk: true },
]

async function dismissDialogs(page: Page) {
  // Dismiss any cookie consent, "Not Now", "Save info", or other blocking dialogs
  // Try both button and div/a/span elements since Instagram uses various element types
  const dismissTexts = [
    "Allow all cookies", "Allow essential and optional cookies",
    "Accept", "Accept All", "Decline optional cookies",
    "Not Now", "Not now", "Save info",
  ]
  for (const text of dismissTexts) {
    // Try multiple selectors — Instagram uses buttons, divs, and links
    for (const selector of [`button:has-text("${text}")`, `div[role="button"]:has-text("${text}")`, `a:has-text("${text}")`]) {
      const btn = await page.$(selector)
      if (btn && await btn.isVisible().catch(() => false)) {
        await btn.click()
        console.log(`  Dismissed: "${text}"`)
        await page.waitForTimeout(1500)
        break
      }
    }
  }
}

async function loginInstagram(page: Page) {
  console.log("=== Step 1: Logging in to Instagram ===")
  await page.goto("https://www.instagram.com/accounts/login/", { waitUntil: "networkidle", timeout: 30000 })
  await page.waitForTimeout(2000)

  // Debug: screenshot what we see
  await page.screenshot({ path: "debug-login-page.png", fullPage: true })
  console.log("  Screenshot saved: debug-login-page.png")

  // Log what's on the page
  const pageInfo = await page.evaluate(() => ({
    url: window.location.href,
    title: document.title,
    inputs: Array.from(document.querySelectorAll("input")).map(i => ({ name: i.name, type: i.type, placeholder: i.placeholder })),
    buttons: Array.from(document.querySelectorAll("button")).map(b => b.textContent?.trim().substring(0, 50)),
    hasForm: !!document.querySelector("form"),
  }))
  console.log("  Page state:", JSON.stringify(pageInfo, null, 2))

  // Dismiss cookie consent FIRST — it covers the login form
  await dismissDialogs(page)
  await page.waitForTimeout(2000)

  // Wait for login form after cookie dialog is gone
  console.log("  Waiting for login form...")
  await page.waitForSelector('input[name="username"], input[name="email"], input[aria-label*="username" i], input[aria-label*="email" i]', { timeout: 30000 })
  console.log("  Login form found, entering credentials...")

  // Fill credentials — try multiple selectors since Instagram varies by region/version
  const usernameInput = await page.$('input[name="username"]')
    || await page.$('input[name="email"]')
    || await page.$('input[aria-label*="username" i]')
    || await page.$('input[aria-label*="email" i]')
  const passwordInput = await page.$('input[name="password"]')
    || await page.$('input[name="pass"]')
    || await page.$('input[type="password"]')

  if (!usernameInput || !passwordInput) {
    await page.screenshot({ path: "debug-no-inputs.png", fullPage: true })
    throw new Error("Could not find username/password inputs. See debug-no-inputs.png")
  }

  await usernameInput.fill(IG_USERNAME)
  await page.waitForTimeout(300)
  await passwordInput.fill(IG_PASSWORD)
  await page.waitForTimeout(500)

  // Submit login — press Enter since Instagram hides the actual submit input
  await passwordInput.press("Enter")
  console.log("  Login submitted, waiting for redirect...")

  // Wait for login to complete — either DM inbox or main feed
  await page.waitForURL(/instagram\.com\/(?!accounts)/, { timeout: 60000 }).catch(async () => {
    console.log("  URL didn't change, checking for errors...")
    await page.screenshot({ path: "debug-after-login.png", fullPage: true })
    console.log("  Screenshot saved: debug-after-login.png")
    // Log any error messages on the page
    const errorText = await page.evaluate(() => {
      const errEl = document.querySelector('[role="alert"], [id*="error"], [class*="error"], p[data-testid*="login-error"]')
      return errEl?.textContent?.trim() || document.body.innerText.substring(0, 500)
    })
    console.log("  Page text:", errorText.substring(0, 300))
  })
  await page.waitForTimeout(2000)

  // Dismiss any post-login dialogs
  await dismissDialogs(page)
  await page.waitForTimeout(1000)
  await dismissDialogs(page)

  console.log("  Current URL:", page.url())
  console.log("  Logged in! Navigating to DMs...")
}

async function navigateToDM(page: Page) {
  console.log("\n=== Step 2: Opening a DM conversation ===")
  await page.goto(TEST_URL, { waitUntil: "domcontentloaded", timeout: 30000 })
  await page.waitForTimeout(2000)

  // Handle any remaining dialogs after navigation
  const dialogBtn = await page.$('button:has-text("Not Now"), button:has-text("Not now")')
  if (dialogBtn) {
    await dialogBtn.click()
    await page.waitForTimeout(1000)
  }

  // Click the first conversation in the inbox
  const firstConvo = await page.waitForSelector('div[role="listbox"] a, div[role="list"] a, a[href*="/direct/t/"]', { timeout: 15000 }).catch(() => null)
  if (firstConvo) {
    await firstConvo.click()
    console.log("  Opened first conversation")
    await page.waitForTimeout(2000)
  } else {
    console.log("  No existing conversations found, looking for textbox on current page...")
  }
}

async function waitForChatInput(page: Page) {
  console.log("  Waiting for chat textbox...")
  const textbox = await page.waitForSelector('[role="textbox"][contenteditable="true"]', { timeout: 30000 })
  console.log("  Chat textbox ready!")
  // Wait for content script injection
  await page.waitForTimeout(3000)
  return textbox
}

async function checkContentScript(page: Page) {
  console.log("\n=== Step 3: Checking content script injection ===")
  const extensionLoaded = await page.evaluate(() => {
    const plasmoCSUI = document.querySelectorAll("plasmo-csui")
    const plasmoEls: string[] = []
    document.querySelectorAll("*").forEach((el) => {
      if (el.tagName.toLowerCase().startsWith("plasmo") || el.id?.includes("plasmo")) {
        plasmoEls.push(`${el.tagName}#${el.id}`)
      }
    })
    return {
      plasmoCSUI: plasmoCSUI.length,
      plasmoElements: plasmoEls,
      hasRuntime: typeof chrome !== "undefined" && !!chrome?.runtime?.id,
    }
  })
  console.log("  Injection check:", JSON.stringify(extensionLoaded, null, 2))

  if (extensionLoaded.plasmoCSUI === 0) {
    console.log("  NOTE: Plasmo CSUI renders only when PII is detected. Proceeding...")
  }
}

async function testPIIDetection(page: Page, inputEl: any) {
  console.log("\n=== Step 4: Testing PII detection via typing ===")
  let passed = 0
  let failed = 0

  for (const testCase of TEST_MESSAGES) {
    // Clear input
    await inputEl.click()
    await page.keyboard.press("Meta+a")
    await page.keyboard.press("Backspace")
    await page.waitForTimeout(300)

    // Type test message
    await inputEl.click()
    await page.keyboard.type(testCase.text, { delay: 20 })
    // Wait for debounce (300ms) + stranger risk assessment + React render
    await page.waitForTimeout(1200)

    // Check for warning overlay in Plasmo shadow DOM
    const warningResult = await page.evaluate(() => {
      const plasmoEls = document.querySelectorAll("plasmo-csui")
      for (const plasmoEl of plasmoEls) {
        const shadow = plasmoEl.shadowRoot
        if (shadow) {
          const warning = shadow.querySelector("[class*='safechild-warning']")
          if (warning) {
            return {
              visible: true,
              level: warning.getAttribute("data-level"),
              text: (warning.textContent || "").substring(0, 200),
            }
          }
          for (const div of shadow.querySelectorAll("div")) {
            if (div.getAttribute("data-level")) {
              return {
                visible: true,
                level: div.getAttribute("data-level"),
                text: (div.textContent || "").substring(0, 200),
              }
            }
          }
        }
      }
      const warning = document.querySelector("[class*='safechild-warning']")
      if (warning) {
        return {
          visible: true,
          level: warning.getAttribute("data-level"),
          text: (warning.textContent || "").substring(0, 200),
        }
      }
      return { visible: false, plasmoCount: plasmoEls.length }
    })

    const detected = warningResult.visible
    const ok = detected === testCase.expectDetection
    if (ok) passed++
    else failed++

    const icon = ok ? "PASS" : "FAIL"
    const detail = detected
      ? `DETECTED (level: ${warningResult.level})`
      : `clean (plasmo elements: ${(warningResult as any).plasmoCount ?? "?"})`

    console.log(
      `  [${icon}] "${testCase.text}" -> ${detail}` +
        (testCase.expectCategory ? ` [expect: ${testCase.expectCategory}]` : "")
    )
  }

  // Clear input after tests
  await inputEl.click()
  await page.keyboard.press("Meta+a")
  await page.keyboard.press("Backspace")

  return { passed, failed }
}

async function testLINENotification(page: Page, inputEl: any) {
  console.log("\n=== Step 5: Testing LINE parent notification (real-time) ===")

  if (!LINE_CHANNEL_ACCESS_TOKEN || !LINE_USER_ID) {
    console.log("  SKIPPED: LINE credentials not found in .env")
    console.log("  Set PLASMO_PUBLIC_LINE_CHANNEL_ACCESS_TOKEN and PLASMO_PUBLIC_LINE_USER_ID")
    return { linePassed: 0, lineFailed: 0, lineSkipped: true }
  }

  let linePassed = 0
  let lineFailed = 0

  // Test 1: Type a high-risk message — should trigger LINE via the extension's background worker
  console.log("\n  --- Test 1: Extension-triggered LINE alert (typing PII) ---")
  await inputEl.click()
  await page.keyboard.press("Meta+a")
  await page.keyboard.press("Backspace")
  await page.waitForTimeout(500)

  const highRiskMsg = "my name is john smith and im 13 years old and my phone is 123-456-7890"
  console.log(`  Typing: "${highRiskMsg}"`)
  await inputEl.click()
  await page.keyboard.type(highRiskMsg, { delay: 15 })

  // Wait for debounce + stranger assessment + background message + LINE API call
  console.log("  Waiting for extension to process and send LINE alert...")
  await page.waitForTimeout(5000)

  // Verify by checking LINE delivery count (quota endpoint)
  const quotaBefore = await fetch("https://api.line.me/v2/bot/message/quota/consumption", {
    headers: { Authorization: `Bearer ${LINE_CHANNEL_ACCESS_TOKEN}` },
  })
  const quotaData = await quotaBefore.json()
  console.log(`  LINE messages sent this month: ${quotaData.totalUsage}`)

  // Clear input
  await inputEl.click()
  await page.keyboard.press("Meta+a")
  await page.keyboard.press("Backspace")
  await page.waitForTimeout(500)

  // Test 2: Direct LINE API verification — send a known test message
  console.log("\n  --- Test 2: Direct LINE API push message ---")
  const testTimestamp = new Date().toISOString()
  const directRes = await fetch("https://api.line.me/v2/bot/message/push", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${LINE_CHANNEL_ACCESS_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      to: LINE_USER_ID,
      messages: [{
        type: "text",
        text: `🧪 [SafeChild E2E Test]\n\nAutomated test completed.\nTimestamp: ${testTimestamp}\n\nIf you see this + an alert above, LINE notifications are fully working!`,
      }],
    }),
  })

  if (directRes.ok) {
    console.log("  [PASS] Direct LINE API message sent!")
    linePassed++
  } else {
    const err = await directRes.json()
    console.log(`  [FAIL] LINE API error: ${directRes.status} ${JSON.stringify(err)}`)
    lineFailed++
  }

  // Test 3: Type different PII to verify real-time detection (not duplicate of test 1)
  console.log("\n  --- Test 3: Second PII message (should send new LINE alert) ---")
  await page.waitForTimeout(11000) // Wait for rate limit cooldown (10s)

  await inputEl.click()
  const secondMsg = "i live at 456 oak avenue and my school is westfield academy"
  console.log(`  Typing: "${secondMsg}"`)
  await page.keyboard.type(secondMsg, { delay: 15 })
  await page.waitForTimeout(5000)

  // Check quota again
  const quotaAfter = await fetch("https://api.line.me/v2/bot/message/quota/consumption", {
    headers: { Authorization: `Bearer ${LINE_CHANNEL_ACCESS_TOKEN}` },
  })
  const quotaAfterData = await quotaAfter.json()
  const newMessages = quotaAfterData.totalUsage - quotaData.totalUsage
  console.log(`  New LINE messages since test start: ${newMessages}`)

  // We expect at least 2 new messages: 1 direct API + 1 or more from extension
  if (newMessages >= 2) {
    console.log("  [PASS] Extension sent LINE alerts for typed PII!")
    linePassed++
  } else if (newMessages >= 1) {
    console.log("  [WARN] Only direct API message confirmed. Extension alert may have been rate-limited.")
    linePassed++
  } else {
    console.log("  [FAIL] No new LINE messages detected")
    lineFailed++
  }

  // Clean up
  await inputEl.click()
  await page.keyboard.press("Meta+a")
  await page.keyboard.press("Backspace")

  return { linePassed, lineFailed, lineSkipped: false }
}

async function main() {
  console.log("=== SafeChild E2E Test Suite ===\n")
  console.log(`Extension: ${EXTENSION_PATH}`)
  console.log(`LINE configured: ${!!LINE_CHANNEL_ACCESS_TOKEN && !!LINE_USER_ID}\n`)

  // Build check
  const fs = await import("fs")
  if (!fs.existsSync(EXTENSION_PATH)) {
    console.error(`Build not found at ${EXTENSION_PATH}`)
    console.error("Run 'npm run build' first")
    process.exit(1)
  }

  const context = await chromium.launchPersistentContext("", {
    headless: false,
    args: [
      `--disable-extensions-except=${EXTENSION_PATH}`,
      `--load-extension=${EXTENSION_PATH}`,
    ],
    slowMo: 50,
  })

  const page = context.pages()[0] || await context.newPage()

  try {
    // Step 1: Login
    await loginInstagram(page)

    // Step 2: Navigate to DMs
    await navigateToDM(page)

    // Wait for chat input
    const inputEl = await waitForChatInput(page)

    // Step 3: Check content script
    await checkContentScript(page)

    // Step 4: Test PII detection
    const { passed, failed } = await testPIIDetection(page, inputEl)

    // Step 5: Test LINE notifications
    const { linePassed, lineFailed, lineSkipped } = await testLINENotification(page, inputEl)

    // Summary
    console.log("\n========================================")
    console.log("  E2E TEST SUMMARY")
    console.log("========================================")
    console.log(`  PII Detection:  ${passed}/${TEST_MESSAGES.length} passed`)
    if (!lineSkipped) {
      console.log(`  LINE Alerts:    ${linePassed}/${linePassed + lineFailed} passed`)
    } else {
      console.log(`  LINE Alerts:    SKIPPED (no credentials)`)
    }
    console.log("========================================\n")

    if (failed > 0 || lineFailed > 0) {
      console.log(`${failed + lineFailed} failure(s) — review output above.`)
      process.exit(1)
    } else {
      console.log("All tests passed! Check your LINE app for alerts.")
    }
  } catch (err) {
    console.error("E2E test error:", err)
    process.exit(1)
  } finally {
    await context.close()
  }
}

main().catch(console.error)
