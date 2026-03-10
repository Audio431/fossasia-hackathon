import { chromium, type Browser, type Page } from "playwright"

const CDP_URL = "http://localhost:9222"

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
  console.log("Connecting to Chrome via CDP...")
  const browser: Browser = await chromium.connectOverCDP(CDP_URL)
  const contexts = browser.contexts()
  console.log(`Found ${contexts.length} browser context(s)`)

  const context = contexts[0]
  const pages = context.pages()
  console.log(`Found ${pages.length} page(s)`)

  // Find the Instagram DM page
  let igPage: Page | undefined
  for (const page of pages) {
    const url = page.url()
    if (url.includes("instagram.com/direct")) {
      igPage = page
      break
    }
  }

  if (!igPage) {
    console.error("No Instagram DM page found. Available pages:")
    for (const p of pages) console.log(" -", p.url())
    process.exit(1)
  }

  console.log(`Using Instagram page: ${igPage.url()}\n`)

  // Step 1: Check if our content script is loaded
  console.log("=== Step 1: Checking content script injection ===")
  const extensionLoaded = await igPage.evaluate(() => {
    // Plasmo injects a shadow root container
    const plasmoContainers = document.querySelectorAll("[id^='plasmo']")
    const shadowRoots = document.querySelectorAll("plasmo-csui")
    return {
      plasmoContainers: plasmoContainers.length,
      shadowRoots: shadowRoots.length,
      allIds: Array.from(document.querySelectorAll("[id]"))
        .map((el) => el.id)
        .filter((id) => id.includes("plasmo") || id.includes("safechild") || id.includes("chat-monitor"))
        .slice(0, 10),
    }
  })
  console.log("Extension containers:", JSON.stringify(extensionLoaded, null, 2))

  // Step 2: Check DOM for input elements
  console.log("\n=== Step 2: Checking DOM for chat input elements ===")
  const domInfo = await igPage.evaluate(() => {
    const editables = document.querySelectorAll('[contenteditable="true"]')
    const textboxes = document.querySelectorAll('[role="textbox"]')
    return {
      contenteditable: Array.from(editables).map((el) => ({
        tag: el.tagName,
        role: el.getAttribute("role"),
        ariaLabel: el.getAttribute("aria-label"),
        classes: (el.className || "").substring(0, 80),
        text: (el.textContent || "").substring(0, 50),
        parentTag: el.parentElement?.tagName,
      })),
      textboxes: Array.from(textboxes).map((el) => ({
        tag: el.tagName,
        editable: el.getAttribute("contenteditable"),
        ariaLabel: el.getAttribute("aria-label"),
        classes: (el.className || "").substring(0, 80),
      })),
    }
  })
  console.log("Contenteditable elements:", JSON.stringify(domInfo.contenteditable, null, 2))
  console.log("Textbox elements:", JSON.stringify(domInfo.textboxes, null, 2))

  // Step 3: Find the actual message input
  console.log("\n=== Step 3: Finding message input ===")
  const inputSelector = '[role="textbox"][contenteditable="true"]'
  let fallbackSelector = '[contenteditable="true"]'

  let inputEl = await igPage.$(inputSelector)
  if (!inputEl) {
    console.log(`Primary selector '${inputSelector}' not found, trying fallback...`)
    inputEl = await igPage.$(fallbackSelector)
  }

  if (!inputEl) {
    console.error("No input element found!")
    // Try clicking on message area to activate it
    console.log("Trying to click on a paragraph element to activate input...")
    const pEl = await igPage.$('p[contenteditable="true"]')
    if (pEl) {
      await pEl.click()
      await igPage.waitForTimeout(500)
      inputEl = await igPage.$('[contenteditable="true"]')
    }
  }

  if (!inputEl) {
    console.error("Still no input found. Dumping page structure around main content...")
    const mainContent = await igPage.evaluate(() => {
      const main = document.querySelector('[role="main"]') || document.body
      return main.innerHTML.substring(0, 2000)
    })
    console.log(mainContent.substring(0, 500))
    process.exit(1)
  }

  const inputInfo = await inputEl.evaluate((el) => ({
    tag: el.tagName,
    role: el.getAttribute("role"),
    ariaLabel: el.getAttribute("aria-label"),
    editable: el.getAttribute("contenteditable"),
  }))
  console.log("Found input:", JSON.stringify(inputInfo))

  // Step 4: Test PII detection by typing into the input
  console.log("\n=== Step 4: Testing PII detection via typing ===")
  let passed = 0
  let failed = 0

  for (const testCase of TEST_MESSAGES) {
    // Clear the input
    await inputEl.click()
    await igPage.keyboard.press("Meta+a")
    await igPage.keyboard.press("Backspace")
    await igPage.waitForTimeout(200)

    // Type the test message
    await inputEl.click()
    await igPage.keyboard.type(testCase.text, { delay: 30 })
    await igPage.waitForTimeout(500) // Wait for debounce (300ms) + processing

    // Check if warning overlay appeared
    const warningVisible = await igPage.evaluate(() => {
      // Check inside Plasmo shadow DOMs
      const plasmoEls = document.querySelectorAll("plasmo-csui")
      for (const plasmoEl of plasmoEls) {
        const shadow = plasmoEl.shadowRoot
        if (shadow) {
          const warning = shadow.querySelector(".safechild-warning-overlay")
          if (warning) {
            const style = window.getComputedStyle(warning)
            if (style.display !== "none") {
              return {
                visible: true,
                level: warning.getAttribute("data-level"),
                text: warning.textContent?.substring(0, 200),
              }
            }
          }
        }
      }
      // Also check in main document
      const warning = document.querySelector(".safechild-warning-overlay")
      if (warning) {
        return {
          visible: true,
          level: warning.getAttribute("data-level"),
          text: warning.textContent?.substring(0, 200),
        }
      }
      return { visible: false }
    })

    const detected = warningVisible.visible
    const statusIcon = detected === testCase.expectDetection ? "PASS" : "FAIL"

    if (detected === testCase.expectDetection) {
      passed++
    } else {
      failed++
    }

    console.log(
      `  [${statusIcon}] "${testCase.text}" -> ${detected ? `DETECTED (level: ${warningVisible.level})` : "clean"}` +
        (testCase.expectCategory ? ` (expected: ${testCase.expectCategory})` : "")
    )
  }

  // Clean up: clear the input
  await inputEl.click()
  await igPage.keyboard.press("Meta+a")
  await igPage.keyboard.press("Backspace")

  console.log(`\n=== Results: ${passed} passed, ${failed} failed out of ${TEST_MESSAGES.length} tests ===`)

  // Step 5: Check extension popup/badge
  console.log("\n=== Step 5: Checking extension service worker ===")
  const swInfo = await igPage.evaluate(async () => {
    try {
      const response = await new Promise<any>((resolve) => {
        chrome.runtime.sendMessage({ type: "GET_STATS" }, resolve)
      })
      return response
    } catch (e) {
      return { error: String(e) }
    }
  })
  console.log("Service worker stats:", JSON.stringify(swInfo, null, 2))

  browser.disconnect()
  console.log("\nDone!")
}

main().catch(console.error)
