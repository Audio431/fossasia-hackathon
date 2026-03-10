import { chromium, type Page } from "playwright"
import path from "path"
import readline from "readline"

const EXTENSION_PATH = path.resolve(__dirname, "build/chrome-mv3-prod")
const TEST_URL = "https://www.instagram.com/direct/inbox/"

const TEST_MESSAGES = [
  { text: "my name is john smith", expectDetection: true, expectCategory: "full_name" },
  { text: "im 13 years old", expectDetection: true, expectCategory: "age_dob" },
  { text: "i live at 123 main street", expectDetection: true, expectCategory: "address" },
  { text: "test@email.com", expectDetection: true, expectCategory: "email" },
  { text: "0812345678", expectDetection: true, expectCategory: "phone" },
  { text: "hello how are you", expectDetection: false, expectCategory: null },
  { text: "i'm from bangkok", expectDetection: true, expectCategory: "location" },
  { text: "my school is lincoln high school", expectDetection: true, expectCategory: "school" },
]

async function main() {
  console.log("Launching Chrome with extension loaded (headed mode)...")
  console.log(`Extension path: ${EXTENSION_PATH}`)

  const context = await chromium.launchPersistentContext("", {
    headless: false,
    args: [
      `--disable-extensions-except=${EXTENSION_PATH}`,
      `--load-extension=${EXTENSION_PATH}`,
    ],
    slowMo: 50,
  })

  // Navigate to Instagram
  const igPage = context.pages()[0] || await context.newPage()
  console.log(`Navigating to ${TEST_URL}...`)
  await igPage.goto(TEST_URL, { waitUntil: "domcontentloaded", timeout: 30000 })

  // Wait for user to log in and open a DM conversation
  console.log("\n========================================")
  console.log("  Please log in to Instagram and open")
  console.log("  a DM conversation in the browser.")
  console.log("  Press ENTER here when ready...")
  console.log("========================================\n")
  await new Promise<void>((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
    rl.question("", () => { rl.close(); resolve() })
  })

  console.log("Continuing... Waiting for content script injection...")
  await igPage.waitForTimeout(3000) // Wait for content script init

  // Step 2: Verify content script is injected
  console.log("\n=== Step 2: Checking content script injection ===")
  const extensionLoaded = await igPage.evaluate(() => {
    const plasmoCSUI = document.querySelectorAll("plasmo-csui")
    // Also check if the content script's JS is running by looking for injected elements
    const allEls = document.querySelectorAll("*")
    const plasmoEls: string[] = []
    allEls.forEach((el) => {
      if (
        el.tagName.toLowerCase().startsWith("plasmo") ||
        el.id?.includes("plasmo")
      ) {
        plasmoEls.push(`${el.tagName}#${el.id}`)
      }
    })
    return {
      plasmoCSUI: plasmoCSUI.length,
      plasmoElements: plasmoEls,
      // Check if content script's event listeners are active by checking chrome.runtime
      hasRuntime: typeof chrome !== "undefined" && !!chrome?.runtime?.id,
    }
  })
  console.log("Injection check:", JSON.stringify(extensionLoaded, null, 2))

  if (extensionLoaded.plasmoCSUI === 0) {
    console.log("WARNING: Plasmo CSUI not found yet. Content script may not have rendered.")
    console.log("The script is injected but the React component only renders when PII is detected.")
    console.log("Proceeding with typing tests...\n")
  }

  // Step 3: Find the chat input
  console.log("=== Step 3: Finding chat input ===")
  // Wait for the textbox to appear (Instagram loads DM UI dynamically)
  await igPage.waitForSelector('[role="textbox"][contenteditable="true"]', { timeout: 10000 }).catch(() => null)

  let inputEl = await igPage.$('[role="textbox"][contenteditable="true"]')
  if (!inputEl) {
    inputEl = await igPage.$('[contenteditable="true"]')
  }
  if (!inputEl) {
    console.error("No chat input found!")
    process.exit(1)
  }

  const inputInfo = await inputEl.evaluate((el) => ({
    tag: el.tagName,
    role: el.getAttribute("role"),
    ariaLabel: el.getAttribute("aria-label"),
  }))
  console.log("Found input:", JSON.stringify(inputInfo))

  // Step 4: Test PII detection
  console.log("\n=== Step 4: Testing PII detection via typing ===")
  let passed = 0
  let failed = 0

  for (const testCase of TEST_MESSAGES) {
    // Clear input
    await inputEl.click()
    await igPage.keyboard.press("Meta+a")
    await igPage.keyboard.press("Backspace")
    await igPage.waitForTimeout(300)

    // Type test message
    await inputEl.click()
    await igPage.keyboard.type(testCase.text, { delay: 20 })
    // Wait for debounce (300ms) + React render
    await igPage.waitForTimeout(800)

    // Check for warning overlay in Plasmo shadow DOM
    const warningResult = await igPage.evaluate(() => {
      // Plasmo CSUI uses <plasmo-csui> with shadow DOM
      const plasmoEls = document.querySelectorAll("plasmo-csui")
      for (const plasmoEl of plasmoEls) {
        const shadow = plasmoEl.shadowRoot
        if (shadow) {
          const warning = shadow.querySelector("[class*='safechild-warning']")
          if (warning) {
            return {
              visible: true,
              level: warning.getAttribute("data-level"),
              text: (warning.textContent || "").substring(0, 150),
            }
          }
          // Also check all children in shadow root
          const allDivs = shadow.querySelectorAll("div")
          for (const div of allDivs) {
            if (div.getAttribute("data-level")) {
              return {
                visible: true,
                level: div.getAttribute("data-level"),
                text: (div.textContent || "").substring(0, 150),
              }
            }
          }
        }
      }

      // Fallback: check main document
      const warning = document.querySelector("[class*='safechild-warning']")
      if (warning) {
        return {
          visible: true,
          level: warning.getAttribute("data-level"),
          text: (warning.textContent || "").substring(0, 150),
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

  // Clean up input
  await inputEl.click()
  await igPage.keyboard.press("Meta+a")
  await igPage.keyboard.press("Backspace")

  console.log(`\n=== Results: ${passed}/${TEST_MESSAGES.length} passed ===`)

  if (failed > 0) {
    // Debug: check if the content script JS is actually executing
    console.log("\n=== Debug: Content script execution check ===")
    const debugInfo = await igPage.evaluate(() => {
      // Try to manually trigger detection to see if the JS is loaded
      const scripts = document.querySelectorAll('script[src*="chat-monitor"]')
      const plasmoAll = document.querySelectorAll("plasmo-csui")

      // Check if any event listeners fire
      const textbox = document.querySelector('[role="textbox"]')
      return {
        chatMonitorScripts: scripts.length,
        plasmoCSUI: plasmoAll.length,
        textboxExists: !!textbox,
        textboxContent: textbox?.textContent?.substring(0, 50) || "",
        documentReadyState: document.readyState,
      }
    })
    console.log("Debug info:", JSON.stringify(debugInfo, null, 2))
  }

  await context.close()
  console.log("\nDone!")
}

main().catch(console.error)
