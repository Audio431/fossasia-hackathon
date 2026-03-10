/**
 * Kid Alert Popup Component
 * Real-time warning shown to kids before they share sensitive information
 */

import React from 'react';
import { RiskAssessment } from '../detection/risk-scoring';
import { getRiskEmoji } from '../detection/risk-scoring';

interface KidAlertProps {
  risk: RiskAssessment;
  onContinue: () => void;
  onCancel: () => void;
}

export default function KidAlert({ risk, onContinue, onCancel }: KidAlertProps) {
  const emoji = getRiskEmoji(risk.level);

  const getTitle = () => {
    switch (risk.level) {
      case 'critical': return 'STOP!';
      case 'high': return 'Wait!';
      case 'medium': return 'Are you sure?';
      case 'low': return 'Just checking...';
      default: return 'Wait!';
    }
  };

  const getMainMessage = () => {
    switch (risk.level) {
      case 'critical': return 'This could be dangerous';
      case 'high': return 'This is risky';
      case 'medium': return 'Be careful';
      case 'low': return 'Think about this';
      default: return 'Wait a moment';
    }
  };

  const getButtonColors = () => {
    switch (risk.level) {
      case 'critical':
        return {
          continue: 'bg-red-500 hover:bg-red-600 text-white',
          cancel: 'bg-gray-200 hover:bg-gray-300 text-gray-800',
        };
      case 'high':
        return {
          continue: 'bg-orange-500 hover:bg-orange-600 text-white',
          cancel: 'bg-gray-200 hover:bg-gray-300 text-gray-800',
        };
      default:
        return {
          continue: 'bg-blue-500 hover:bg-blue-600 text-white',
          cancel: 'bg-gray-200 hover:bg-gray-300 text-gray-800',
        };
    }
  };

  const colors = getButtonColors();

  return (
    <div className="fixed inset-0 z-[999999] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div
        className={`bg-white rounded-2xl p-6 max-w-md mx-4 shadow-2xl ${
          risk.level === 'critical' ? 'animate-pulse-slow border-4 border-red-500' : ''
        }`}
      >
        <div className="text-center">
          {/* Risk Level Emoji */}
          <div className="text-6xl mb-4">
            {emoji}
          </div>

          {/* Title */}
          <h2 className="text-2xl font-bold mb-2 text-gray-900">
            {getTitle()}
          </h2>

          {/* Main Message */}
          <p className="text-lg font-semibold mb-4 text-gray-700">
            {getMainMessage()}
          </p>

          {/* What You're Sharing */}
          <div className="text-left mb-4">
            <p className="text-sm font-medium text-gray-600 mb-2">
              You're about to share:
            </p>

            <ul className={`rounded-lg p-4 space-y-2 ${
              risk.level === 'critical' ? 'bg-red-50' :
              risk.level === 'high' ? 'bg-orange-50' :
              risk.level === 'medium' ? 'bg-yellow-50' :
              'bg-blue-50'
            }`}>
              {risk.reasons.map((reason, i) => (
                <li key={i} className="flex items-start text-gray-800">
                  <span className={`mr-2 mt-0.5 ${
                    risk.level === 'critical' ? 'text-red-500' :
                    risk.level === 'high' ? 'text-orange-500' :
                    risk.level === 'medium' ? 'text-yellow-600' :
                    'text-blue-500'
                  }`}>
                    •
                  </span>
                  <span className="text-sm">{reason}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Why It Matters */}
          {risk.level === 'critical' || risk.level === 'high' ? (
            <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
              <p className="text-sm text-gray-700">
                <strong>Why this matters:</strong> This information can be seen by people you don't know and could last forever on the internet.
              </p>
            </div>
          ) : (
            <div className="bg-blue-50 rounded-lg p-4 mb-6 text-left">
              <p className="text-sm text-gray-700">
                This could be seen by people you don't know. Make sure you're okay with that.
              </p>
            </div>
          )}

          {/* Recommendations */}
          {risk.recommendations.length > 0 && (
            <div className="text-left mb-6">
              <p className="text-sm font-medium text-gray-600 mb-2">
                What you can do:
              </p>
              <ul className="text-sm text-gray-700 space-y-1">
                {risk.recommendations.slice(0, 3).map((rec, i) => (
                  <li key={i} className="flex items-start">
                    <span className="mr-2 text-blue-500">💡</span>
                    <span>{rec.replace(/^[🛑⚠️💡❌]\s*/, '')}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-colors ${colors.cancel}`}
            >
              Nevermind
            </button>
            <button
              onClick={onContinue}
              className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-colors ${colors.continue}`}
            >
              I Understand
            </button>
          </div>

          {/* Talk to Parent Link for Critical/High */}
          {(risk.level === 'critical' || risk.level === 'high') && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-600">
                Not sure? <button className="text-blue-600 font-semibold hover:underline">Ask a parent or trusted adult</button>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Inline styles for content script injection
 */
export const inlineStyles = `
  .privacy-shadow-kid-alert-overlay {
    position: fixed !important;
    inset: 0 !important;
    z-index: 999999 !important;
    background: rgba(0, 0, 0, 0.5) !important;
    backdrop-filter: blur(4px) !important;
  }

  @keyframes pulse-slow {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.02); }
  }

  .animate-pulse-slow {
    animation: pulse-slow 3s cubic-bezier(0.4, 0, 0.6, 1) infinite;
  }
`;
