import cssText from "data-text:./chat-monitor.css"
import type { PlasmoCSConfig } from "plasmo"
import React, { useEffect, useState } from "react"

import { calculateHarmScore } from "../lib/harm-scorer"
import { detectPII } from "../lib/pii-detector"
import { detectPlatform } from "../lib/social-media-selectors"
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
}

const ChatMonitor = () => {
  const [warning, setWarning] = useState<WarningState>({
    visible: false,
    detections: [],
    harmScore: null,
    inputElement: null,
  })

  useEffect(() => {
    const platform = detectPlatform(window.location.hostname)
    if (!platform) return

    let debounceTimer: ReturnType<typeof setTimeout>

    const checkInput = (element: HTMLElement) => {
      const text =
        element.textContent || (element as HTMLTextAreaElement).value || ""
      if (text.length < 3) {
        setWarning((prev) => ({ ...prev, visible: false }))
        return
      }

      const detections = detectPII(text)
      if (detections.length > 0) {
        const harmScore = calculateHarmScore(detections)
        setWarning({
          visible: true,
          detections,
          harmScore,
          inputElement: element,
        })

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
        chrome.runtime.sendMessage({ type: "PII_DETECTED", event })
      } else {
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

    // MutationObserver for dynamically loaded chat messages
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
          if (!(node instanceof HTMLElement)) continue

          // Check if new messages contain PII (incoming messages)
          for (const sel of platform.messageSelectors) {
            const messages = node.matches?.(sel)
              ? [node]
              : Array.from(node.querySelectorAll(sel))

            for (const msg of messages) {
              const text = msg.textContent || ""
              const detections = detectPII(text)
              if (detections.length > 0) {
                const harmScore = calculateHarmScore(detections)
                // Highlight messages containing PII from others
                if (
                  harmScore.level === "high" ||
                  harmScore.level === "critical" ||
                  harmScore.level === "medium"
                ) {
                  const el = msg as HTMLElement
                  el.style.outline = "2px solid #ef4444"
                  el.style.borderRadius = "4px"
                  el.title = `Warning: This message contains sensitive info (${detections.map((d) => d.category).join(", ")})`

                  // Send to background for browser notification
                  const incomingEvent: DetectionEvent = {
                    id: crypto.randomUUID(),
                    timestamp: Date.now(),
                    platform: platform.name,
                    url: window.location.href,
                    message: text.substring(0, 200),
                    detections,
                    harmScore,
                    blocked: false,
                  }
                  chrome.runtime.sendMessage({
                    type: "PII_DETECTED",
                    event: incomingEvent,
                  })
                }
              }
            }
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

    startObserving()
    // Re-check for containers periodically (SPAs load content dynamically)
    const containerInterval = setInterval(startObserving, 3000)

    return () => {
      document.removeEventListener("input", handleInput, true)
      document.removeEventListener("keyup", handleInput, true)
      document.removeEventListener("paste", handleInput, true)
      observer.disconnect()
      clearInterval(containerInterval)
      clearTimeout(debounceTimer)
    }
  }, [])

  if (!warning.visible || !warning.harmScore) return null

  const { harmScore, detections } = warning

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
