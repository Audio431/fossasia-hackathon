import cssText from "data-text:./chat-monitor.css"
import type { PlasmoCSConfig } from "plasmo"
import React, { useEffect, useState } from "react"

import { calculateHarmScore } from "../lib/harm-scorer"
import { detectPII } from "../lib/pii-detector"
import { detectPlatform } from "../lib/social-media-selectors"
import { assessStrangerRisk, incrementConversation, getRecipientId, type StrangerRiskProfile } from "../lib/stranger-detector"
import type { DetectionEvent, HarmScore, PIIDetection } from "../lib/types"

export const config: PlasmoCSConfig = {
  matches: [
    "https://*.instagram.com/*",
    "https://*.facebook.com/messages/*",
    "https://messenger.com/*",
    "https://web.whatsapp.com/*",
    "https://*.tiktok.com/*",
    "https://*.discord.com/*",
  ],
  all_frames: true,
}

export const getStyle = () => {
  const style = document.createElement("style")
  style.textContent = cssText
  return style
}

interface WarningState {
  visible: boolean
  detections: PIIDetection[]
  harmScore: HarmScore | null
  inputElement: HTMLElement | null
  strangerRisk: StrangerRiskProfile | null
}

const ChatMonitor = () => {
  const [warning, setWarning] = useState<WarningState>({
    visible: false,
    detections: [],
    harmScore: null,
    inputElement: null,
    strangerRisk: null,
  })

  useEffect(() => {
    const platform = detectPlatform(window.location.hostname)
    if (!platform) return

    let debounceTimer: ReturnType<typeof setTimeout>
    let lastSentKey = ""

    // Cache stranger risk so we don't re-scrape on every keystroke
    let cachedStrangerRisk: StrangerRiskProfile | null = null
    let strangerRiskExpiry = 0

    const getStrangerRisk = async (): Promise<StrangerRiskProfile> => {
      if (cachedStrangerRisk && Date.now() < strangerRiskExpiry) {
        return cachedStrangerRisk
      }
      cachedStrangerRisk = await assessStrangerRisk(platform.name)
      strangerRiskExpiry = Date.now() + 30000 // cache for 30s
      return cachedStrangerRisk
    }

    const checkInput = async (element: HTMLElement) => {
      const text =
        element.textContent || (element as HTMLTextAreaElement).value || ""
      if (text.length < 3) {
        setWarning((prev) => ({ ...prev, visible: false }))
        return
      }

      const detections = detectPII(text)
      if (detections.length > 0) {
        const strangerRisk = await getStrangerRisk()
        const harmScore = calculateHarmScore(detections, strangerRisk.multiplier)

        // Track conversation activity
        await incrementConversation(getRecipientId(), platform.name)

        setWarning({
          visible: true,
          detections,
          harmScore,
          inputElement: element,
          strangerRisk,
        })

        // Deduplicate: don't re-send if same detections on same platform
        const dedupKey = detections
          .map((d) => `${d.category}:${d.match}`)
          .sort()
          .join("|")
        if (dedupKey === lastSentKey) return
        lastSentKey = dedupKey

        // Send event to background
        const event: DetectionEvent = {
          id: crypto.randomUUID(),
          timestamp: Date.now(),
          platform: platform.name,
          url: window.location.href,
          message: text.substring(0, 200),
          detections,
          harmScore,
          blocked: harmScore.level === "critical" || harmScore.level === "high",
        }
        if (!chrome.runtime?.id) {
          console.warn("SafeChild: extension context invalidated, skipping")
          return
        }
        chrome.runtime.sendMessage({ type: "PII_DETECTED", event }, () => {
          if (chrome.runtime.lastError) {
            console.warn("SafeChild:", chrome.runtime.lastError.message)
          }
        })
      } else {
        lastSentKey = ""
        setWarning((prev) => ({ ...prev, visible: false }))
      }
    }

    const findInputElement = (target: HTMLElement): HTMLElement | null => {
      // First try platform-specific selectors
      for (const sel of platform.inputSelectors) {
        if (target.matches?.(sel)) return target
        const closest = target.closest?.(sel) as HTMLElement | null
        if (closest) return closest
      }
      // Fallback: walk up to find any contenteditable element
      let el: HTMLElement | null = target
      while (el) {
        if (
          el.isContentEditable ||
          el.getAttribute?.("contenteditable") === "true" ||
          el.getAttribute?.("role") === "textbox"
        ) {
          return el
        }
        el = el.parentElement
      }
      return null
    }

    const handleInput = (e: Event) => {
      const target = e.target as HTMLElement
      const inputEl = findInputElement(target)
      if (!inputEl) return

      clearTimeout(debounceTimer)
      debounceTimer = setTimeout(() => checkInput(inputEl), 300)
    }

    // Listen for input events on the page
    document.addEventListener("input", handleInput, true)
    document.addEventListener("keyup", handleInput, true)
    document.addEventListener("paste", handleInput, true)

    // Track already-scanned elements to avoid duplicate alerts
    const scannedElements = new WeakSet<Element>()

    const scanMessage = (msg: Element) => {
      if (scannedElements.has(msg)) return
      scannedElements.add(msg)

      const text = msg.textContent || ""
      if (text.length < 3) return

      const detections = detectPII(text)
      if (detections.length === 0) return

      const harmScore = calculateHarmScore(detections)
      if (harmScore.level === "safe") return

      const el = msg as HTMLElement
      const outlineColor =
        harmScore.level === "critical" || harmScore.level === "high"
          ? "#ef4444"
          : harmScore.level === "medium"
            ? "#eab308"
            : "#84cc16"
      el.style.outline = `2px solid ${outlineColor}`
      el.style.borderRadius = "4px"
      el.title = `Warning: This message contains sensitive info (${detections.map((d) => d.category).join(", ")})`
    }

    // Scan all visible messages on the page
    const scanAllMessages = () => {
      for (const sel of platform.messageSelectors) {
        const messages = document.querySelectorAll(sel)
        messages.forEach(scanMessage)
      }
    }

    // MutationObserver for dynamically loaded chat messages
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
          if (!(node instanceof HTMLElement)) continue
          for (const sel of platform.messageSelectors) {
            const messages = node.matches?.(sel)
              ? [node]
              : Array.from(node.querySelectorAll(sel))
            messages.forEach(scanMessage)
          }
        }
      }
    })

    // Observe chat containers for new messages
    const startObserving = () => {
      for (const sel of platform.chatContainerSelectors) {
        const containers = document.querySelectorAll(sel)
        containers.forEach((container) => {
          observer.observe(container, {
            childList: true,
            subtree: true,
          })
        })
      }
    }

    // Initial scan of existing messages
    scanAllMessages()
    startObserving()

    // Periodic re-scan: catches messages loaded by SPA navigation, scrolling, etc.
    const scanInterval = setInterval(() => {
      scanAllMessages()
      startObserving()
    }, 2000)

    return () => {
      document.removeEventListener("input", handleInput, true)
      document.removeEventListener("keyup", handleInput, true)
      document.removeEventListener("paste", handleInput, true)
      observer.disconnect()
      clearInterval(scanInterval)
      clearTimeout(debounceTimer)
    }
  }, [])

  if (!warning.visible || !warning.harmScore) return null

  const { harmScore, detections, strangerRisk } = warning
  const isStranger = strangerRisk && strangerRisk.multiplier > 1.2

  return (
    <div className="safechild-warning-overlay" data-level={harmScore.level}>
      <div className="safechild-warning-header">
        <span className="safechild-warning-icon">
          {harmScore.level === "critical" || harmScore.level === "high"
            ? "STOP"
            : "Warning"}
        </span>
        <span className="safechild-warning-title">
          Personal Information Detected!
        </span>
        <span className="safechild-score">Risk: {harmScore.total}/100</span>
      </div>
      {isStranger && (
        <div className="safechild-stranger-badge">
          Stranger Alert — this person may not be someone you know
          <ul className="safechild-stranger-signals">
            {strangerRisk.signals.filter((s) => s.risky).map((s, i) => (
              <li key={i}>{s.detail}</li>
            ))}
          </ul>
        </div>
      )}
      <div className="safechild-warning-body">
        <p>You are about to share sensitive information:</p>
        <ul>
          {detections.map((d, i) => (
            <li key={i}>
              <strong>{d.category.replace("_", " ")}:</strong>{" "}
              {d.match.substring(0, 30)}
              {d.match.length > 30 ? "..." : ""}
            </li>
          ))}
        </ul>
        {(harmScore.level === "critical" || harmScore.level === "high") && (
          <p className="safechild-block-msg">
            This message has been flagged as high risk. Please remove personal
            information before sending.
          </p>
        )}
      </div>
      <button
        className="safechild-dismiss-btn"
        onClick={() => setWarning((prev) => ({ ...prev, visible: false }))}>
        I understand
      </button>
    </div>
  )
}

export default ChatMonitor