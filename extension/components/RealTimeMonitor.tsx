/**
 * Real-Time Threat Monitor Component
 * Shows live monitoring of conversations with risk assessment
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, AlertTriangle, Activity, Clock, Eye, Zap } from 'lucide-react';

interface LiveMessage {
  id: string;
  text: string;
  sender: 'user' | 'stranger';
  timestamp: number;
  riskScore: number;
  flags: string[];
}

interface MonitoringSession {
  platform: string;
  username: string;
  startTime: number;
  messageCount: number;
  currentRisk: number;
  peakRisk: number;
  riskTrend: 'increasing' | 'decreasing' | 'stable';
}

export const RealTimeMonitor: React.FC = () => {
  const [activeSessions, setActiveSessions] = useState<MonitoringSession[]>([
    {
      platform: 'Instagram',
      username: 'coolguy_2024',
      startTime: Date.now() - 300000,
      messageCount: 8,
      currentRisk: 78,
      peakRisk: 85,
      riskTrend: 'increasing'
    },
    {
      platform: 'Discord',
      username: 'gamer_xyz',
      startTime: Date.now() - 600000,
      messageCount: 15,
      currentRisk: 45,
      peakRisk: 52,
      riskTrend: 'stable'
    }
  ]);

  const [liveMessages, setLiveMessages] = useState<LiveMessage[]>([]);
  const [selectedSession, setSelectedSession] = useState<number>(0);

  useEffect(() => {
    // Simulate live messages
    const interval = setInterval(() => {
      const newMessage: LiveMessage = {
        id: Date.now().toString(),
        text: getRandomMessage(),
        sender: Math.random() > 0.5 ? 'stranger' : 'user',
        timestamp: Date.now(),
        riskScore: Math.random() * 100,
        flags: []
      };

      // Add risk flags based on content
      if (newMessage.riskScore > 70) {
        newMessage.flags.push('High risk content');
      }
      if (newMessage.text.toLowerCase().includes('where')) {
        newMessage.flags.push('Location inquiry');
      }
      if (newMessage.text.toLowerCase().includes('secret')) {
        newMessage.flags.push('Secrecy request');
      }

      setLiveMessages(prev => [newMessage, ...prev].slice(0, 10));

      // Update session risk
      setActiveSessions(prev => prev.map((session, i) => {
        if (i === selectedSession) {
          const newRisk = Math.max(0, Math.min(100, session.currentRisk + (Math.random() - 0.3) * 10));
          return {
            ...session,
            currentRisk: newRisk,
            peakRisk: Math.max(session.peakRisk, newRisk),
            riskTrend: newRisk > session.currentRisk ? 'increasing' : 'decreasing'
          };
        }
        return session;
      }));
    }, 3000);

    return () => clearInterval(interval);
  }, [selectedSession]);

  const getRiskColor = (score: number) => {
    if (score >= 70) return 'text-red-600 bg-red-50';
    if (score >= 40) return 'text-orange-600 bg-orange-50';
    if (score >= 20) return 'text-yellow-600 bg-yellow-50';
    return 'text-green-600 bg-green-50';
  };

  const getRiskIcon = (score: number) => {
    if (score >= 70) return AlertTriangle;
    if (score >= 40) return AlertTriangle;
    return Shield;
  };

  const getRandomMessage = () => {
    const messages = [
      'Hey, how are you?',
      'Where do you live?',
      'Can you send me a photo?',
      'I have a secret to tell you',
      'Your parents don\'t understand you',
      'You\'re really mature for your age',
      'Want to play games together?',
      'I can buy you that game you want',
      'Don\'t tell anyone about our conversation',
      'What school do you go to?'
    ];
    return messages[Math.floor(Math.random() * messages.length)];
  };

  const currentSession = activeSessions[selectedSession] || activeSessions[0];

  return (
    <div className="space-y-6">
      {/* Live Monitor Header */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-lg">
              <Eye className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Live Threat Monitor</h2>
              <p className="text-slate-400">Real-time conversation monitoring</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium">Live</span>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-slate-800/50 rounded-lg p-4">
            <div className="text-2xl font-bold">{activeSessions.length}</div>
            <div className="text-sm text-slate-400">Active Sessions</div>
          </div>
          <div className="bg-slate-800/50 rounded-lg p-4">
            <div className="text-2xl font-bold">{currentSession?.messageCount || 0}</div>
            <div className="text-sm text-slate-400">Messages</div>
          </div>
          <div className="bg-slate-800/50 rounded-lg p-4">
            <div className="text-2xl font-bold">{Math.round(currentSession?.currentRisk || 0)}%</div>
            <div className="text-sm text-slate-400">Current Risk</div>
          </div>
          <div className="bg-slate-800/50 rounded-lg p-4">
            <div className="text-2xl font-bold">{Math.round(currentSession?.peakRisk || 0)}%</div>
            <div className="text-sm text-slate-400">Peak Risk</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Sessions */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-600" />
            Active Conversations
          </h3>
          <div className="space-y-3">
            {activeSessions.map((session, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                onClick={() => setSelectedSession(index)}
                className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  selectedSession === index
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center">
                      <span className="text-lg">👤</span>
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900">{session.username}</p>
                      <p className="text-xs text-slate-600">{session.platform}</p>
                    </div>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-sm font-bold ${getRiskColor(session.currentRisk)}`}>
                    {Math.round(session.currentRisk)}%
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-600">
                  <span>{session.messageCount} messages</span>
                  <span className={`flex items-center gap-1 ${
                    session.riskTrend === 'increasing' ? 'text-red-600' :
                    session.riskTrend === 'decreasing' ? 'text-green-600' :
                    'text-slate-600'
                  }`}>
                    {session.riskTrend === 'increasing' && <span>↑</span>}
                    {session.riskTrend === 'decreasing' && <span>↓</span>}
                    {session.riskTrend}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Live Messages Feed */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-600" />
            Live Message Feed
          </h3>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            <AnimatePresence>
              {liveMessages.map((message) => {
                const RiskIcon = getRiskIcon(message.riskScore);
                return (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: 100 }}
                    className={`p-4 rounded-lg border-2 ${
                      message.sender === 'stranger'
                        ? 'border-orange-200 bg-orange-50'
                        : 'border-blue-200 bg-blue-50'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        message.sender === 'stranger'
                          ? 'bg-orange-500'
                          : 'bg-blue-500'
                      } text-white text-sm`}>
                        {message.sender === 'stranger' ? 'S' : 'U'}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-medium text-slate-600">
                            {message.sender === 'stranger' ? 'Stranger' : 'User'}
                          </span>
                          <span className="text-xs text-slate-400">
                            {new Date(message.timestamp).toLocaleTimeString()}
                          </span>
                          {message.riskScore > 50 && (
                            <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold ${getRiskColor(message.riskScore)}`}>
                              <RiskIcon className="w-3 h-3" />
                              {Math.round(message.riskScore)}%
                            </div>
                          )}
                        </div>
                        <p className="text-sm text-slate-900">{message.text}</p>
                        {message.flags.length > 0 && (
                          <div className="flex gap-1 mt-2">
                            {message.flags.map((flag, i) => (
                              <span
                                key={i}
                                className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full"
                              >
                                {flag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Risk Analysis Panel */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
          <Zap className="w-5 h-5 text-blue-600" />
          Real-Time Risk Analysis
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-3">
            <h4 className="font-semibold text-slate-900">Risk Factors Detected</h4>
            <div className="space-y-2">
              {['No mutual friends', 'New account', 'Late night messaging', 'Personal info requests'].map((factor, i) => (
                <div key={i} className="flex items-center gap-2 p-2 bg-red-50 rounded-lg">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  <span className="text-sm text-slate-700">{factor}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="space-y-3">
            <h4 className="font-semibold text-slate-900">Conversation Patterns</h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-2 bg-slate-50 rounded-lg">
                <span className="text-sm text-slate-700">Escalation Speed</span>
                <span className="text-sm font-bold text-red-600">Fast</span>
              </div>
              <div className="flex items-center justify-between p-2 bg-slate-50 rounded-lg">
                <span className="text-sm text-slate-700">Message Frequency</span>
                <span className="text-sm font-bold text-orange-600">High</span>
              </div>
              <div className="flex items-center justify-between p-2 bg-slate-50 rounded-lg">
                <span className="text-sm text-slate-700">Response Time</span>
                <span className="text-sm font-bold text-yellow-600">Rapid</span>
              </div>
            </div>
          </div>
          <div className="space-y-3">
            <h4 className="font-semibold text-slate-900">Recommendations</h4>
            <div className="space-y-2">
              <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                <p className="text-sm font-medium text-red-900 mb-1">⚠️ Immediate Attention</p>
                <p className="text-xs text-red-700">Consider blocking this user and reporting to platform</p>
              </div>
              <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                <p className="text-sm font-medium text-yellow-900 mb-1">📚 Educate Child</p>
                <p className="text-xs text-yellow-700">Discuss online safety and stranger danger</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RealTimeMonitor;