import React, { useEffect, useState } from "react"

import { HARM_LEVEL_COLORS } from "../lib/harm-scorer"
import { getSettings, saveSettings } from "../lib/storage"
import type { DetectionEvent, ParentNotificationConfig } from "../lib/types"

import "./popup.css"

interface Stats {
  totalToday: number
  blockedToday: number
  averageScore: number
  topCategories: { category: string; count: number }[]
}

const DEFAULT_PARENT_CONFIG: ParentNotificationConfig = {
  enabled: false,
  lineChannelAccessToken: "",
  lineUserId: "",
}

const Popup = () => {
  const [stats, setStats] = useState<Stats | null>(null)
  const [events, setEvents] = useState<DetectionEvent[]>([])
  const [tab, setTab] = useState<"dashboard" | "log" | "settings">("dashboard")
  const [parentConfig, setParentConfig] = useState<ParentNotificationConfig>(DEFAULT_PARENT_CONFIG)
  const [saveStatus, setSaveStatus] = useState<string>("")

  useEffect(() => {
    chrome.runtime.sendMessage({ type: "GET_STATS" }, (response) => {
      if (response?.stats) setStats(response.stats)
    })
    chrome.runtime.sendMessage({ type: "GET_EVENTS" }, (response) => {
      if (response?.events) setEvents(response.events)
    })
    getSettings().then((settings) => {
      if (settings.parentNotification) {
        setParentConfig(settings.parentNotification)
      }
    })
  }, [])

  const handleSaveParentConfig = async () => {
    await saveSettings({ parentNotification: parentConfig })
    setSaveStatus("Saved!")
    setTimeout(() => setSaveStatus(""), 2000)
  }

  const handleTestLINE = () => {
    setSaveStatus("Sending...")
    chrome.runtime.sendMessage({ type: "TEST_LINE" }, (response) => {
      if (response?.success) {
        setSaveStatus("Test message sent!")
      } else {
        setSaveStatus("Failed: " + (response?.error || "check LINE config"))
      }
      setTimeout(() => setSaveStatus(""), 3000)
    })
  }

  const getScoreColor = (score: number) => {
    if (score === 0) return HARM_LEVEL_COLORS.safe
    if (score < 20) return HARM_LEVEL_COLORS.low
    if (score < 45) return HARM_LEVEL_COLORS.medium
    if (score < 70) return HARM_LEVEL_COLORS.high
    return HARM_LEVEL_COLORS.critical
  }

  return (
    <div className="popup-container">
      <header className="popup-header">
        <h1>SafeChild</h1>
        <p className="subtitle">Protecting kids online</p>
      </header>

      <nav className="popup-tabs">
        <button
          className={tab === "dashboard" ? "active" : ""}
          onClick={() => setTab("dashboard")}>
          Dashboard
        </button>
        <button
          className={tab === "log" ? "active" : ""}
          onClick={() => setTab("log")}>
          Activity Log
        </button>
        <button
          className={tab === "settings" ? "active" : ""}
          onClick={() => setTab("settings")}>
          Settings
        </button>
      </nav>

      {tab === "dashboard" && stats && (
        <div className="dashboard">
          <div className="stats-grid">
            <div className="stat-card">
              <span className="stat-value">{stats.totalToday}</span>
              <span className="stat-label">Detections Today</span>
            </div>
            <div className="stat-card warning">
              <span className="stat-value">{stats.blockedToday}</span>
              <span className="stat-label">Blocked</span>
            </div>
            <div className="stat-card">
              <span
                className="stat-value"
                style={{ color: getScoreColor(stats.averageScore) }}>
                {stats.averageScore}
              </span>
              <span className="stat-label">Avg Risk Score</span>
            </div>
          </div>

          {stats.topCategories.length > 0 && (
            <div className="section">
              <h3>Most Detected PII Types</h3>
              <div className="category-list">
                {stats.topCategories.map((cat) => (
                  <div key={cat.category} className="category-item">
                    <span className="category-name">
                      {cat.category.replace("_", " ")}
                    </span>
                    <div className="category-bar-wrapper">
                      <div
                        className="category-bar"
                        style={{
                          width: `${Math.min(100, (cat.count / Math.max(...stats.topCategories.map((c) => c.count))) * 100)}%`,
                        }}
                      />
                    </div>
                    <span className="category-count">{cat.count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {tab === "log" && (
        <div className="log-container">
          {events.length === 0 ? (
            <p className="empty-state">No detections yet. Stay safe!</p>
          ) : (
            events.slice(0, 20).map((event) => (
              <div key={event.id} className="log-item" data-level={event.harmScore.level}>
                <div className="log-header">
                  <span className="log-platform">{event.platform}</span>
                  <span
                    className="log-score"
                    style={{ color: getScoreColor(event.harmScore.total) }}>
                    {event.harmScore.total}/100
                  </span>
                </div>
                <div className="log-categories">
                  {event.detections.map((d, i) => (
                    <span key={i} className="log-tag">
                      {d.category.replace("_", " ")}
                    </span>
                  ))}
                </div>
                <span className="log-time">
                  {new Date(event.timestamp).toLocaleString()}
                </span>
              </div>
            ))
          )}
        </div>
      )}
      {tab === "settings" && (
        <div className="settings-container">
          <h3>Parent LINE Notifications</h3>
          <p className="settings-desc">
            Get a LINE message when your child shares high-risk personal information.
          </p>

          <label className="setting-toggle">
            <input
              type="checkbox"
              checked={parentConfig.enabled}
              onChange={(e) =>
                setParentConfig({ ...parentConfig, enabled: e.target.checked })
              }
            />
            <span>Enable LINE alerts</span>
          </label>

          {parentConfig.enabled && (
            <div className="settings-fields">
              <label className="setting-field">
                <span>LINE Channel Access Token</span>
                <input
                  type="password"
                  placeholder="Your channel access token"
                  value={parentConfig.lineChannelAccessToken}
                  onChange={(e) =>
                    setParentConfig({ ...parentConfig, lineChannelAccessToken: e.target.value })
                  }
                />
              </label>
              <label className="setting-field">
                <span>LINE User ID</span>
                <input
                  type="text"
                  placeholder="Uxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                  value={parentConfig.lineUserId}
                  onChange={(e) =>
                    setParentConfig({ ...parentConfig, lineUserId: e.target.value })
                  }
                />
              </label>
            </div>
          )}

          <button className="save-btn" onClick={handleSaveParentConfig}>
            Save Settings
          </button>
          {parentConfig.enabled && parentConfig.lineUserId && (
            <button className="test-btn" onClick={handleTestLINE}>
              Send Test LINE Message
            </button>
          )}
          {saveStatus && <span className="save-status">{saveStatus}</span>}
        </div>
      )}
    </div>
  )
}

export default Popup
