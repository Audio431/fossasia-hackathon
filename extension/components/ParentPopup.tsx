/**
 * Parent Dashboard Popup Component
 * Shows recent alerts, risk levels, and provides management controls
 */

import React, { useState, useEffect } from 'react';
import { RiskAssessment, getRiskEmoji, getRiskColor } from '../detection/risk-scoring';

interface Alert {
  id: string;
  timestamp: number;
  risk: RiskAssessment;
  context: {
    platform: string;
    website: string;
    isPublic: boolean;
  };
  url: string;
  acknowledged: boolean;
}

interface ParentPopupProps {
  onDismiss: (alertId: string) => void;
  onViewFullDashboard: () => void;
  onSubmitFeedback: (alertId: string, isStranger: boolean) => void;
}

export default function ParentPopup({ onDismiss, onViewFullDashboard, onSubmitFeedback }: ParentPopupProps) {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unacknowledged' | 'high'>('all');

  useEffect(() => {
    loadAlerts();
  }, []);

  const loadAlerts = async () => {
    try {
      const response = await chrome.runtime.sendMessage({ type: 'GET_ALERTS' });
      setAlerts(response.alerts || []);
    } catch (error) {
      console.error('Failed to load alerts', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDismiss = async (alertId: string) => {
    await chrome.runtime.sendMessage({ type: 'DISMISS_ALERT', alertId });
    setAlerts(alerts.map(alert =>
      alert.id === alertId ? { ...alert, acknowledged: true } : alert
    ));
    onDismiss(alertId);
  };

  const handleFeedback = async (alertId: string, isStranger: boolean) => {
    try {
      await chrome.runtime.sendMessage({
        type: 'SUBMIT_FEEDBACK',
        alertId,
        isStranger,
      });
      onSubmitFeedback(alertId, isStranger);
      alert('Thank you for your feedback! This helps improve our protection.');
    } catch (error) {
      console.error('Failed to submit feedback', error);
    }
  };

  const formatTime = (timestamp: number): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const filteredAlerts = alerts.filter(alert => {
    if (filter === 'unacknowledged') return !alert.acknowledged;
    if (filter === 'high') return alert.risk.level === 'critical' || alert.risk.level === 'high';
    return true;
  });

  const criticalAlerts = alerts.filter(a => !a.acknowledged && a.risk.level === 'critical').length;
  const highAlerts = alerts.filter(a => !a.acknowledged && a.risk.level === 'high').length;

  return (
    <div className="w-[400px] h-[600px] bg-gray-50 flex flex-col font-sans">
      {/* Header */}
      <header className="bg-blue-600 text-white p-4 shrink-0">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-2xl">👻</span>
            <h1 className="text-xl font-bold">Privacy Shadow</h1>
          </div>
          <div className="text-right">
            <p className="text-sm opacity-90">Parent Dashboard</p>
            {(criticalAlerts > 0 || highAlerts > 0) && (
              <p className="text-xs font-semibold text-yellow-300">
                {criticalAlerts > 0 && `${criticalAlerts} Critical `}
                {highAlerts > 0 && `${highAlerts} High`}
              </p>
            )}
          </div>
        </div>
      </header>

      {/* Filters */}
      <div className="bg-white border-b px-4 py-3 shrink-0">
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
              filter === 'all'
                ? 'bg-blue-100 text-blue-700'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            All ({alerts.length})
          </button>
          <button
            onClick={() => setFilter('unacknowledged')}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
              filter === 'unacknowledged'
                ? 'bg-blue-100 text-blue-700'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            New ({alerts.filter(a => !a.acknowledged).length})
          </button>
          <button
            onClick={() => setFilter('high')}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
              filter === 'high'
                ? 'bg-red-100 text-red-700'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            High Risk
          </button>
        </div>
      </div>

      {/* Alerts List */}
      <div className="flex-1 overflow-y-auto p-4">
        {loading ? (
          <div className="text-center py-8 text-gray-500">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            Loading alerts...
          </div>
        ) : filteredAlerts.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🎉</div>
            <p className="text-gray-700 font-medium">No alerts yet!</p>
            <p className="text-sm text-gray-500 mt-2">
              Your child is browsing safely
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredAlerts.map((alert) => (
              <AlertCard
                key={alert.id}
                alert={alert}
                onDismiss={() => handleDismiss(alert.id)}
                onSubmitFeedback={(isStranger) => handleFeedback(alert.id, isStranger)}
                formatTime={formatTime}
              />
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="bg-white border-t p-4 shrink-0 space-y-2">
        <button
          onClick={onViewFullDashboard}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg font-semibold transition-colors"
        >
          View Full Dashboard
        </button>
        <button
          onClick={() => {
            // Open WhatsApp settings in a new tab
            chrome.tabs.create({
              url: chrome.runtime.getURL('tabs/parent-settings.html')
            });
          }}
          className="w-full bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
        >
          <span>📱</span>
          <span>WhatsApp Settings</span>
        </button>
        <p className="text-xs text-gray-500 text-center mt-2">
          Alerts are stored locally on your device
        </p>
      </footer>
    </div>
  );
}

interface AlertCardProps {
  alert: Alert;
  onDismiss: () => void;
  onSubmitFeedback: (isStranger: boolean) => void;
  formatTime: (timestamp: number) => string;
}

function AlertCard({ alert, onDismiss, onSubmitFeedback, formatTime }: AlertCardProps) {
  const [showFeedback, setShowFeedback] = useState(false);
  const emoji = getRiskEmoji(alert.risk.level);

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'critical': return 'bg-red-50 border-red-200';
      case 'high': return 'bg-orange-50 border-orange-200';
      case 'medium': return 'bg-yellow-50 border-yellow-200';
      default: return 'bg-blue-50 border-blue-200';
    }
  };

  return (
    <div className={`bg-white rounded-lg p-4 shadow-sm border-2 ${getRiskColor(alert.risk.level)} ${
      alert.risk.level === 'critical' && !alert.acknowledged ? 'animate-pulse-slow' : ''
    }`}>
      {/* Alert Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{emoji}</span>
          <div>
            <p className="font-semibold text-gray-900">{alert.context.website}</p>
            <p className="text-xs text-gray-500">
              {alert.context.platform} • {formatTime(alert.timestamp)}
            </p>
          </div>
        </div>

        {!alert.acknowledged && (
          <button
            onClick={onDismiss}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            title="Dismiss alert"
          >
            ✕
          </button>
        )}
      </div>

      {/* Risk Level Badge */}
      <div className="mb-3">
        <span className={`inline-block px-2 py-1 rounded text-xs font-semibold uppercase ${
          alert.risk.level === 'critical' ? 'bg-red-100 text-red-700' :
          alert.risk.level === 'high' ? 'bg-orange-100 text-orange-700' :
          alert.risk.level === 'medium' ? 'bg-yellow-100 text-yellow-700' :
          'bg-blue-100 text-blue-700'
        }`}>
          {alert.risk.level} Risk ({alert.risk.score}/100)
        </span>
      </div>

      {/* Reasons */}
      <div className="mb-3">
        <p className="text-sm font-medium text-gray-700 mb-1">Detected:</p>
        <ul className="text-sm text-gray-600 space-y-1">
          {alert.risk.reasons.map((reason, i) => (
            <li key={i} className="flex items-start">
              <span className="mr-1.5 text-gray-400">•</span>
              <span>{reason}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Public/Private Indicator */}
      {alert.context.isPublic && (
        <div className="mb-3 flex items-center gap-1.5 text-xs text-orange-600 font-medium">
          <span>🌐</span>
          <span>Public post (visible to everyone)</span>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2 mt-4 pt-3 border-t border-gray-200">
        <button
          onClick={() => setShowFeedback(!showFeedback)}
          className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-3 rounded-lg text-sm font-medium transition-colors"
        >
          {showFeedback ? 'Hide' : 'Feedback'}
        </button>
        <a
          href={alert.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 bg-blue-100 hover:bg-blue-200 text-blue-700 py-2 px-3 rounded-lg text-sm font-medium text-center transition-colors"
        >
          View
        </a>
      </div>

      {/* Feedback Section */}
      {showFeedback && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <p className="text-xs text-gray-600 mb-2">
            Help us improve: Was this person a stranger?
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => onSubmitFeedback(true)}
              className="flex-1 bg-red-100 hover:bg-red-200 text-red-700 py-2 px-3 rounded-lg text-sm font-medium transition-colors"
            >
              Yes, stranger
            </button>
            <button
              onClick={() => onSubmitFeedback(false)}
              className="flex-1 bg-green-100 hover:bg-green-200 text-green-700 py-2 px-3 rounded-lg text-sm font-medium transition-colors"
            >
              No, I know them
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
