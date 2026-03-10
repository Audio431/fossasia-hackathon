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
  type?: string;
  risk: {
    level: string;
    score: number;
    reasons: string[];
    detectedTypes?: string[];
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
    piiCount: 0,
    strangerCount: 0,
  });

  useEffect(() => {
    setLoading(false);

    // Clear badge when popup opens
    chrome.runtime.sendMessage({ type: 'CLEAR_BADGE' }).catch(() => {});

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
          piiCount:      response.piiCount ?? allAlerts.filter(a => a.type !== 'stranger_risk').length,
          strangerCount: response.strangerCount ?? allAlerts.filter(a => a.type === 'stranger_risk').length,
        });
        setAlerts(allAlerts.slice(0, 20));
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

  const handleClearAlerts = useCallback(() => {
    chrome.runtime.sendMessage({ type: 'CLEAR_ALL_ALERTS' }, () => {
      setAlerts([]);
      setStats(s => ({ ...s, todayCount: 0, weekCount: 0, piiCount: 0, strangerCount: 0 }));
    });
  }, []);

  const formatTime = (timestamp: number): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
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

  const PII_TYPE_ICONS: Record<string, string> = {
    name: '👤', routine: '🕐', location: '📍', birthdate: '🎂',
    contact: '📞', address: '🏠', school: '🏫', financial: '💳',
    identity: '🪪', image: '📸',
  };

  const getPIITypeLabel = (types?: string[]): string => {
    if (!types || types.length === 0) return '🔒 PII';
    const unique = [...new Set(types)].slice(0, 3);
    return unique.map(t => PII_TYPE_ICONS[t] ?? '🔒').join('') + ' ' + unique.map(t =>
      t.charAt(0).toUpperCase() + t.slice(1)
    ).join(', ');
  };

  const Toggle = ({ value, onChange }: { value: boolean; onChange: () => void }) => (
    <button
      onClick={onChange}
      className={`relative flex-shrink-0 w-9 h-5 rounded-full transition-colors ${value ? 'bg-blue-500' : 'bg-gray-300'}`}
    >
      <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${value ? 'translate-x-4' : 'translate-x-0.5'}`} />
    </button>
  );

  if (loading) {
    return (
      <div className="w-[350px] h-[500px] bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-3"></div>
          <p className="text-gray-600">Loading Privacy Shadow...</p>
        </div>
      </div>
    );
  }

  const isEnabled = settings.enabled !== false; // default true

  return (
    <div className="w-[350px] h-[500px] bg-gray-50 flex flex-col font-sans">
      {/* Header */}
      <header className={`text-white p-4 shadow-lg transition-colors ${isEnabled ? 'bg-gradient-to-r from-blue-600 to-purple-600' : 'bg-gray-500'}`}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-3xl">👻</span>
            <div>
              <h1 className="text-xl font-bold leading-tight">Privacy Shadow</h1>
              <p className="text-xs opacity-80">
                {isEnabled ? 'Actively protecting' : '⏸ Monitoring paused'}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[10px] opacity-70 mb-0.5">Protection</p>
            <Toggle
              value={isEnabled}
              onChange={() => {
                const next = { ...settings, enabled: !isEnabled };
                setSettings(next);
                chrome.runtime.sendMessage({ type: 'SAVE_SETTINGS', settings: next });
              }}
            />
          </div>
        </div>

        {/* Stats grid — 2×2 */}
        <div className="grid grid-cols-2 gap-2 text-center">
          <div className="bg-white/20 rounded-lg p-2">
            <p className="text-lg font-bold">{stats.todayCount}</p>
            <p className="text-[10px] opacity-90">Today's alerts</p>
          </div>
          <div className="bg-white/20 rounded-lg p-2">
            <p className="text-lg font-bold">{stats.weekCount}</p>
            <p className="text-[10px] opacity-90">This week</p>
          </div>
          <div className="bg-white/15 rounded-lg p-2">
            <p className="text-lg font-bold">{stats.piiCount}</p>
            <p className="text-[10px] opacity-90">🔒 PII blocked</p>
          </div>
          <div className="bg-white/15 rounded-lg p-2">
            <p className="text-lg font-bold">{stats.strangerCount}</p>
            <p className="text-[10px] opacity-90">🚨 Stranger flags</p>
          </div>
        </div>
      </header>

      {/* View Toggle */}
      <div className="flex border-b bg-white">
        <button
          onClick={() => setCurrentView('parent')}
          className={`flex-1 py-2.5 px-2 text-xs font-semibold transition-colors ${
            currentView === 'parent' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50' : 'text-gray-500 hover:text-gray-700'
          }`}
        >👨‍👩‍👧 Parent</button>
        <button
          onClick={() => setCurrentView('kid')}
          className={`flex-1 py-2.5 px-2 text-xs font-semibold transition-colors ${
            currentView === 'kid' ? 'text-purple-600 border-b-2 border-purple-600 bg-purple-50' : 'text-gray-500 hover:text-gray-700'
          }`}
        >🧒 Kid</button>
        <button
          onClick={() => setCurrentView('settings')}
          className={`flex-1 py-2.5 px-2 text-xs font-semibold transition-colors ${
            currentView === 'settings' ? 'text-green-600 border-b-2 border-green-600 bg-green-50' : 'text-gray-500 hover:text-gray-700'
          }`}
        >⚙️ Settings</button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {currentView === 'parent' ? (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-gray-700">Recent Alerts</h2>
              {alerts.length > 0 && (
                <button
                  onClick={handleClearAlerts}
                  className="text-[10px] text-gray-400 hover:text-red-500 transition-colors"
                >Clear all</button>
              )}
            </div>

            {alerts.length === 0 ? (
              <div className="text-center py-10">
                <div className="text-5xl mb-3">🎉</div>
                <p className="text-gray-700 font-semibold text-sm">All clear!</p>
                <p className="text-xs text-gray-500 mt-1">No privacy alerts detected yet.<br/>Your child is browsing safely.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {alerts.map((alert) => {
                  const isStranger = alert.type === 'stranger_risk';
                  return (
                    <div
                      key={alert.id}
                      className={`bg-white rounded-lg p-3 shadow-sm border-l-4 ${
                        alert.risk.level === 'critical' ? 'border-red-500' :
                        alert.risk.level === 'high'     ? 'border-orange-500' :
                        alert.risk.level === 'medium'   ? 'border-yellow-500' :
                        'border-blue-400'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{getEmoji(alert.risk.level)}</span>
                          <div>
                            <p className="font-semibold text-gray-900 text-xs">
                              {alert.context.website || alert.context.platform}
                            </p>
                            <p className="text-[10px] text-gray-400">{formatTime(alert.timestamp)}</p>
                          </div>
                        </div>
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                          isStranger ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                        }`}>
                          {isStranger ? '🚨 Stranger' : getPIITypeLabel(alert.risk.detectedTypes)}
                        </span>
                      </div>
                      <ul className="space-y-0.5">
                        {alert.risk.reasons.slice(0, 2).map((reason, i) => (
                          <li key={i} className="text-[10px] text-gray-500 flex items-start gap-1">
                            <span className="text-gray-300 mt-px">•</span>
                            <span className="line-clamp-1">{reason}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : currentView === 'kid' ? (
          <div>
            <h2 className="text-sm font-semibold text-gray-700 mb-3">Your Privacy Score</h2>

            <div className="bg-white rounded-lg p-4 shadow-sm mb-4 text-center">
              <div className="text-5xl mb-2">
                {stats.weekCount === 0 ? '🏆' : stats.weekCount < 3 ? '🛡️' : '⚠️'}
              </div>
              <p className="text-3xl font-bold text-blue-600">{Math.max(0, 100 - (stats.weekCount * 8))}</p>
              <p className="text-[10px] text-gray-400 mb-2">privacy score out of 100</p>
              <p className="text-xs text-gray-600">
                {stats.weekCount === 0
                  ? "Perfect! You're a privacy pro! 🎉"
                  : `You had ${stats.weekCount} close call${stats.weekCount !== 1 ? 's' : ''} this week.`}
              </p>
            </div>

            <div className="bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg p-4 text-white shadow-sm">
              <h3 className="font-semibold mb-2 text-sm">💡 Stay Safe Online</h3>
              <ul className="text-xs space-y-1.5 opacity-95">
                <li>• Never share your school name or address</li>
                <li>• Don't give your phone number to strangers</li>
                <li>• Keep your birthday private</li>
                <li>• Tell a parent if someone makes you uncomfortable</li>
              </ul>
            </div>
          </div>
        ) : (
          <div>
            <h2 className="text-sm font-semibold text-gray-700 mb-4">Protection Settings</h2>

            {/* Master enable/disable */}
            <div className={`rounded-lg p-3 shadow-sm mb-3 border ${isEnabled ? 'bg-white border-gray-100' : 'bg-orange-50 border-orange-200'}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-gray-700">🛡️ Active Protection</p>
                  <p className="text-[11px] text-gray-500">
                    {isEnabled ? 'Extension is monitoring all sites' : 'All monitoring is paused'}
                  </p>
                </div>
                <Toggle
                  value={isEnabled}
                  onChange={() => setSettings(s => ({ ...s, enabled: !s.enabled }))}
                />
              </div>
            </div>

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
                        : 'bg-gray-50 border-gray-200 text-gray-400'
                    }`}
                  >{level}</button>
                ))}
              </div>
              <p className="text-[10px] text-gray-400 mt-1.5">
                {settings.sensitivity === 'high'   ? 'Alert on any detected PII'
                : settings.sensitivity === 'medium' ? 'Alert on confirmed matches (recommended)'
                :                                     'Alert only on high-risk combinations'}
              </p>
            </div>

            {/* Quiet Hours */}
            <div className="bg-white rounded-lg p-3 shadow-sm mb-3">
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs font-bold text-gray-700">🌙 Quiet Hours</p>
                <Toggle
                  value={settings.quietHours.enabled}
                  onChange={() => setSettings(s => ({ ...s, quietHours: { ...s.quietHours, enabled: !s.quietHours.enabled } }))}
                />
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
                  <span className="text-gray-300 text-xs mt-3">→</span>
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

            {/* Show Tips */}
            <div className="bg-white rounded-lg p-3 shadow-sm mb-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-gray-700">💡 Educational Tips</p>
                  <p className="text-[11px] text-gray-500">Show kid-friendly tips in alerts.</p>
                </div>
                <Toggle
                  value={settings.showTips}
                  onChange={() => setSettings(s => ({ ...s, showTips: !s.showTips }))}
                />
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
      <footer className="bg-white border-t px-4 py-2 text-center">
        <p className="text-[10px] text-gray-400">Privacy Shadow · Keeping kids safe online 👻</p>
      </footer>
    </div>
  );
}

export default IndexPopup;

