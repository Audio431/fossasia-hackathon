/**
 * Privacy Shadow Extension Popup
 */

import React, { useState, useEffect, useCallback } from 'react';
import './style.css';
import {
  PrivacyShadowSettings,
  DEFAULT_SETTINGS,
  SensitivityLevel,
} from './extension/utils/settings';

interface Alert {
  id: string;
  timestamp: number;
  risk: {
    level: string;
    score: number;
    reasons: string[];
  };
  context: {
    website: string;
    platform: string;
  };
  acknowledged: boolean;
}

function IndexPopup() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState<'parent' | 'kid' | 'settings'>('parent');
  const [settings, setSettings] = useState<PrivacyShadowSettings>(DEFAULT_SETTINGS);
  const [settingsSaved, setSettingsSaved] = useState(false);
  const [stats, setStats] = useState({
    todayCount: 0,
    weekCount: 0,
    highRiskCount: 0,
  });

  useEffect(() => {
    setLoading(false);

    chrome.runtime.sendMessage({ type: 'GET_ALERTS' }, (response) => {
      if (chrome.runtime.lastError) return;
      if (response?.alerts) {
        const allAlerts: Alert[] = response.alerts;
        const now = Date.now();
        const dayAgo  = now - 24 * 60 * 60 * 1000;
        const weekAgo = now - 7  * 24 * 60 * 60 * 1000;
        setStats({
          todayCount:    allAlerts.filter(a => a.timestamp > dayAgo).length,
          weekCount:     allAlerts.filter(a => a.timestamp > weekAgo).length,
          highRiskCount: allAlerts.filter(a => !a.acknowledged && (a.risk.level === 'critical' || a.risk.level === 'high')).length,
        });
        setAlerts(allAlerts.slice(0, 10));
      }
    });

    // Load persisted settings
    chrome.runtime.sendMessage({ type: 'GET_SETTINGS' }, (response) => {
      if (chrome.runtime.lastError) return;
      if (response?.settings) setSettings(response.settings);
    });
  }, []);

  const handleSaveSettings = useCallback(() => {
    chrome.runtime.sendMessage({ type: 'SAVE_SETTINGS', settings }, () => {
      setSettingsSaved(true);
      setTimeout(() => setSettingsSaved(false), 2000);
    });
  }, [settings]);

  const formatTime = (timestamp: number): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    return date.toLocaleDateString();
  };

  const getEmoji = (level: string): string => {
    switch (level) {
      case 'critical': return '🛑';
      case 'high': return '⚠️';
      case 'medium': return '🔶';
      default: return '💡';
    }
  };

  if (loading) {
    return (
      <div className="w-[350px] h-[450px] bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-3"></div>
          <p className="text-gray-600">Loading Privacy Shadow...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-[350px] h-[450px] bg-gradient-to-br from-blue-50 to-purple-50 flex flex-col font-sans">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 shadow-lg">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-3xl">👻</span>
            <div>
              <h1 className="text-xl font-bold leading-tight">Privacy Shadow</h1>
              <p className="text-xs opacity-90">Protect Kids Online</p>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="bg-white/20 rounded-lg p-2">
            <p className="text-lg font-bold">{stats.todayCount}</p>
            <p className="text-[10px] opacity-90">Today</p>
          </div>
          <div className="bg-white/20 rounded-lg p-2">
            <p className="text-lg font-bold">{stats.weekCount}</p>
            <p className="text-[10px] opacity-90">This Week</p>
          </div>
          <div className="bg-white/20 rounded-lg p-2">
            <p className="text-lg font-bold">{stats.highRiskCount}</p>
            <p className="text-[10px] opacity-90">High Risk</p>
          </div>
        </div>
      </header>

      {/* View Toggle */}
      <div className="flex border-b bg-white">
        <button
          onClick={() => setCurrentView('parent')}
          className={`flex-1 py-2.5 px-2 text-xs font-semibold transition-colors ${
            currentView === 'parent'
              ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          👨‍👩‍👧 Parent
        </button>
        <button
          onClick={() => setCurrentView('kid')}
          className={`flex-1 py-2.5 px-2 text-xs font-semibold transition-colors ${
            currentView === 'kid'
              ? 'text-purple-600 border-b-2 border-purple-600 bg-purple-50'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          🧒 Kid
        </button>
        <button
          onClick={() => setCurrentView('settings')}
          className={`flex-1 py-2.5 px-2 text-xs font-semibold transition-colors ${
            currentView === 'settings'
              ? 'text-green-600 border-b-2 border-green-600 bg-green-50'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          ⚙️ Settings
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {currentView === 'parent' ? (
          // Parent View
          <div>
            <h2 className="text-sm font-semibold text-gray-700 mb-3">Recent Activity</h2>

            {alerts.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-5xl mb-3">🎉</div>
                <p className="text-gray-700 font-medium text-sm">No alerts yet!</p>
                <p className="text-xs text-gray-500 mt-1">
                  Your child is browsing safely
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {alerts.map((alert) => (
                  <div
                    key={alert.id}
                    className={`bg-white rounded-lg p-3 shadow-sm border-l-4 ${
                      alert.risk.level === 'critical' ? 'border-red-500' :
                      alert.risk.level === 'high' ? 'border-orange-500' :
                      alert.risk.level === 'medium' ? 'border-yellow-500' :
                      'border-blue-500'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{getEmoji(alert.risk.level)}</span>
                        <div>
                          <p className="font-semibold text-gray-900 text-sm">{alert.context.website}</p>
                          <p className="text-xs text-gray-500">
                            {alert.context.platform} • {formatTime(alert.timestamp)}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="text-xs text-gray-600">
                      <p className="font-medium mb-1">Detected:</p>
                      <ul className="space-y-0.5">
                        {alert.risk.reasons.slice(0, 2).map((reason, i) => (
                          <li key={i} className="flex items-start">
                            <span className="mr-1.5 text-gray-400">•</span>
                            <span className="line-clamp-1">{reason}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : currentView === 'kid' ? (
          // Kid View
          <div>
            <h2 className="text-sm font-semibold text-gray-700 mb-3">Your Privacy Score</h2>

            <div className="bg-white rounded-lg p-4 shadow-sm mb-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-4xl">🛡️</span>
                <div className="text-right">
                  <p className="text-3xl font-bold text-blue-600">
                    {Math.max(0, 100 - (stats.weekCount * 5))}
                  </p>
                  <p className="text-xs text-gray-500">out of 100</p>
                </div>
              </div>
              <p className="text-xs text-gray-600 text-center">
                {stats.weekCount === 0
                  ? "Perfect! You're protecting your privacy well! 🎉"
                  : `You had ${stats.weekCount} close call${stats.weekCount > 1 ? 's' : ''} this week. Keep being careful!`
                }
              </p>
            </div>

            <div className="bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg p-4 text-white shadow-sm">
              <h3 className="font-semibold mb-2">💡 Quick Tips</h3>
              <ul className="text-xs space-y-1.5">
                <li>• Think before you post online</li>
                <li>• Don't share your location or school name</li>
                <li>• Never give your phone number to strangers</li>
                <li>• Ask a parent if you're unsure about something</li>
              </ul>
            </div>
          </div>
        ) : (
          // Settings View
          <div>
            <h2 className="text-sm font-semibold text-gray-700 mb-4">Protection Settings</h2>

            {/* Sensitivity */}
            <div className="bg-white rounded-lg p-3 shadow-sm mb-3">
              <p className="text-xs font-bold text-gray-700 mb-1">🎚️ Sensitivity Level</p>
              <p className="text-[11px] text-gray-500 mb-2">How aggressively Privacy Shadow alerts.</p>
              <div className="flex gap-2">
                {(['low', 'medium', 'high'] as SensitivityLevel[]).map(level => (
                  <button
                    key={level}
                    onClick={() => setSettings(s => ({ ...s, sensitivity: level }))}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-semibold capitalize border transition-colors ${
                      settings.sensitivity === level
                        ? level === 'high'   ? 'bg-red-100 border-red-400 text-red-700'
                        : level === 'medium' ? 'bg-yellow-100 border-yellow-400 text-yellow-700'
                        :                     'bg-green-100 border-green-400 text-green-700'
                        : 'bg-gray-50 border-gray-200 text-gray-500'
                    }`}
                  >{level}</button>
                ))}
              </div>
              <p className="text-[10px] text-gray-400 mt-1.5">
                {settings.sensitivity === 'high'   ? 'Alert on any detected PII'
                : settings.sensitivity === 'medium' ? 'Alert on confirmed matches (default)'
                :                                     'Alert only on high-risk combinations'}
              </p>
            </div>

            {/* Quiet Hours */}
            <div className="bg-white rounded-lg p-3 shadow-sm mb-3">
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs font-bold text-gray-700">🌙 Quiet Hours</p>
                <button
                  onClick={() => setSettings(s => ({ ...s, quietHours: { ...s.quietHours, enabled: !s.quietHours.enabled } }))}
                  className={`relative w-9 h-5 rounded-full transition-colors ${settings.quietHours.enabled ? 'bg-blue-500' : 'bg-gray-300'}`}
                >
                  <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${settings.quietHours.enabled ? 'translate-x-4' : 'translate-x-0.5'}`} />
                </button>
              </div>
              <p className="text-[11px] text-gray-500 mb-2">Pause alerts during sleep hours.</p>
              {settings.quietHours.enabled && (
                <div className="flex gap-2 items-center">
                  <div className="flex-1">
                    <p className="text-[10px] text-gray-400 mb-0.5">Start</p>
                    <input
                      type="time"
                      value={settings.quietHours.start}
                      onChange={e => setSettings(s => ({ ...s, quietHours: { ...s.quietHours, start: e.target.value } }))}
                      className="w-full text-xs border border-gray-200 rounded px-2 py-1"
                    />
                  </div>
                  <span className="text-gray-400 text-xs mt-3">→</span>
                  <div className="flex-1">
                    <p className="text-[10px] text-gray-400 mb-0.5">End</p>
                    <input
                      type="time"
                      value={settings.quietHours.end}
                      onChange={e => setSettings(s => ({ ...s, quietHours: { ...s.quietHours, end: e.target.value } }))}
                      className="w-full text-xs border border-gray-200 rounded px-2 py-1"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Show Tips toggle */}
            <div className="bg-white rounded-lg p-3 shadow-sm mb-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-gray-700">💡 Educational Tips</p>
                  <p className="text-[11px] text-gray-500">Show kid-friendly tips in alerts.</p>
                </div>
                <button
                  onClick={() => setSettings(s => ({ ...s, showTips: !s.showTips }))}
                  className={`relative w-9 h-5 rounded-full transition-colors ${settings.showTips ? 'bg-blue-500' : 'bg-gray-300'}`}
                >
                  <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${settings.showTips ? 'translate-x-4' : 'translate-x-0.5'}`} />
                </button>
              </div>
            </div>

            <button
              onClick={handleSaveSettings}
              className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm font-semibold rounded-lg shadow transition-opacity hover:opacity-90"
            >
              {settingsSaved ? '✅ Saved!' : 'Save Settings'}
            </button>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="bg-white border-t p-3 text-center">
        <p className="text-[10px] text-gray-500">
          Keeping your digital footprint safe 👻
        </p>
      </footer>
    </div>
  );
}

export default IndexPopup;
