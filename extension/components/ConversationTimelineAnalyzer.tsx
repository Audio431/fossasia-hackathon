/**
 * Conversation Timeline Analyzer
 * Analyzes conversation progression and risk escalation over time
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, AlertTriangle, Shield, Clock, MessageSquare, Activity } from 'lucide-react';

interface TimelineMessage {
  id: string;
  timestamp: number;
  text: string;
  sender: 'user' | 'stranger';
  riskScore: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  flags: string[];
  features: {
    groomingLanguage: boolean;
    personalInfoRequest: boolean;
    pressureTactics: boolean;
    secrecyRequest: boolean;
    inappropriateContent: boolean;
  };
}

interface ConversationInsight {
  type: 'escalation' | 'pattern' | 'warning' | 'milestone';
  title: string;
  description: string;
  timestamp: number;
  severity: 'info' | 'warning' | 'critical';
}

export const ConversationTimelineAnalyzer: React.FC = () => {
  const [selectedConversation, setSelectedConversation] = useState('grooming');
  const [timelineView, setTimelineView] = useState<'chronological' | 'risk-based'>('chronological');

  const conversations = {
    grooming: {
      username: 'understand_me',
      platform: 'Instagram',
      startTime: Date.now() - 3600000,
      messages: [
        {
          id: '1',
          timestamp: Date.now() - 3600000,
          text: 'Hey! You seem really cool and mature for your age',
          sender: 'stranger',
          riskScore: 25,
          riskLevel: 'medium',
          flags: ['Mature for age comment'],
          features: { groomingLanguage: true, personalInfoRequest: false, pressureTactics: false, secrecyRequest: false, inappropriateContent: false }
        },
        {
          id: '2',
          timestamp: Date.now() - 3000000,
          text: 'Thanks? Who is this?',
          sender: 'user',
          riskScore: 5,
          riskLevel: 'low',
          flags: [],
          features: { groomingLanguage: false, personalInfoRequest: false, pressureTactics: false, secrecyRequest: false, inappropriateContent: false }
        },
        {
          id: '3',
          timestamp: Date.now() - 2400000,
          text: 'I\'m someone who actually gets you. Unlike your parents...',
          sender: 'stranger',
          riskScore: 45,
          riskLevel: 'medium',
          flags: ['Us vs them mentality', 'Parental alienation'],
          features: { groomingLanguage: true, personalInfoRequest: false, pressureTactics: false, secrecyRequest: false, inappropriateContent: false }
        },
        {
          id: '4',
          timestamp: Date.now() - 1800000,
          text: 'Can you send me a photo? Don\'t tell anyone, this is our secret',
          sender: 'stranger',
          riskScore: 85,
          riskLevel: 'critical',
          flags: ['Photo request', 'Secrecy coercion', 'Secret request'],
          features: { groomingLanguage: true, personalInfoRequest: true, pressureTactics: true, secrecyRequest: true, inappropriateContent: false }
        }
      ],
      insights: [
        {
          type: 'pattern',
          title: 'Grooming Pattern Detected',
          description: 'Classic grooming progression: compliments → alienation → secrecy → explicit requests',
          timestamp: Date.now() - 1800000,
          severity: 'critical'
        },
        {
          type: 'escalation',
          title: 'Rapid Escalation',
          description: 'Conversation escalated from friendly to explicit requests in 20 minutes',
          timestamp: Date.now() - 1800000,
          severity: 'critical'
        },
        {
          type: 'warning',
          title: 'Parental Alienation',
          description: 'Attempt to isolate child from parental support',
          timestamp: Date.now() - 2400000,
          severity: 'warning'
        }
      ]
    },
    personal_info: {
      username: 'coolguy_2024',
      platform: 'Instagram',
      startTime: Date.now() - 1800000,
      messages: [
        {
          id: '1',
          timestamp: Date.now() - 1800000,
          text: 'Hey! Saw your profile, you\'re cool',
          sender: 'stranger',
          riskScore: 15,
          riskLevel: 'low',
          flags: ['New follower'],
          features: { groomingLanguage: false, personalInfoRequest: false, pressureTactics: false, secrecyRequest: false, inappropriateContent: false }
        },
        {
          id: '2',
          timestamp: Date.now() - 1500000,
          text: 'Uh, do I know you?',
          sender: 'user',
          riskScore: 5,
          riskLevel: 'low',
          flags: [],
          features: { groomingLanguage: false, personalInfoRequest: false, pressureTactics: false, secrecyRequest: false, inappropriateContent: false }
        },
        {
          id: '3',
          timestamp: Date.now() - 1200000,
          text: 'No, but I\'d love to get to know you. Where do you live?',
          sender: 'stranger',
          riskScore: 55,
          riskLevel: 'high',
          flags: ['Location inquiry', 'Personal info request'],
          features: { groomingLanguage: false, personalInfoRequest: true, pressureTactics: false, secrecyRequest: false, inappropriateContent: false }
        },
        {
          id: '4',
          timestamp: Date.now() - 900000,
          text: 'I can come visit you! What\'s your address?',
          sender: 'stranger',
          riskScore: 78,
          riskLevel: 'critical',
          flags: ['Address request', 'Meeting suggestion', 'Personal info request'],
          features: { groomingLanguage: false, personalInfoRequest: true, pressureTactics: true, secrecyRequest: false, inappropriateContent: false }
        }
      ],
      insights: [
        {
          type: 'pattern',
          title: 'Information Harvesting Pattern',
          description: 'Systematic collection of personal information with escalating requests',
          timestamp: Date.now() - 900000,
          severity: 'critical'
        },
        {
          type: 'escalation',
          title: 'Fast Escalation to Physical Meeting',
          description: 'Progressed from introduction to meeting suggestion in 15 minutes',
          timestamp: Date.now() - 900000,
          severity: 'critical'
        },
        {
          type: 'warning',
          title: 'No Mutual Friends',
          description: 'Zero social connections to verify identity',
          timestamp: Date.now() - 1800000,
          severity: 'warning'
        }
      ]
    }
  };

  const conversation = conversations[selectedConversation as keyof typeof conversations];
  const sortedMessages = timelineView === 'risk-based'
    ? [...conversation.messages].sort((a, b) => b.riskScore - a.riskScore)
    : conversation.messages;

  const getRiskColor = (level: string) => {
    switch(level) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-slate-500';
    }
  };

  const getRiskBgColor = (level: string) => {
    switch(level) {
      case 'critical': return 'bg-red-50 border-red-200';
      case 'high': return 'bg-orange-50 border-orange-200';
      case 'medium': return 'bg-yellow-50 border-yellow-200';
      case 'low': return 'bg-green-50 border-green-200';
      default: return 'bg-slate-50 border-slate-200';
    }
  };

  const getInsightIcon = (type: string) => {
    switch(type) {
      case 'escalation': return TrendingUp;
      case 'pattern': return Activity;
      case 'warning': return AlertTriangle;
      default: return Shield;
    }
  };

  const calculateEscalationSpeed = () => {
    const messages = conversation.messages;
    if (messages.length < 2) return 0;

    const firstRisk = messages[0].riskScore;
    const lastRisk = messages[messages.length - 1].riskScore;
    const duration = messages[messages.length - 1].timestamp - messages[0].timestamp;
    const durationHours = duration / (1000 * 60 * 60);

    return Math.round(((lastRisk - firstRisk) / durationHours) * 10) / 10;
  };

  const escalationSpeed = calculateEscalationSpeed();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-1">Conversation Timeline Analyzer</h2>
            <p className="text-purple-100">Detailed risk progression and pattern analysis</p>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={selectedConversation}
              onChange={(e) => setSelectedConversation(e.target.value)}
              className="px-4 py-2 bg-white/20 border border-white/30 rounded-lg text-white"
            >
              <option value="grooming">Grooming Pattern</option>
              <option value="personal_info">Personal Info Harvesting</option>
            </select>
            <select
              value={timelineView}
              onChange={(e) => setTimelineView(e.target.value as any)}
              className="px-4 py-2 bg-white/20 border border-white/30 rounded-lg text-white"
            >
              <option value="chronological">Chronological</option>
              <option value="risk-based">Risk-Based</option>
            </select>
          </div>
        </div>
      </div>

      {/* Escalation Speed Banner */}
      <div className={`rounded-xl p-6 border-2 ${
        escalationSpeed > 10 ? 'bg-red-50 border-red-300' :
        escalationSpeed > 5 ? 'bg-orange-50 border-orange-300' :
        'bg-blue-50 border-blue-300'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <TrendingUp className={`w-6 h-6 ${
              escalationSpeed > 10 ? 'text-red-600' :
              escalationSpeed > 5 ? 'text-orange-600' :
              'text-blue-600'
            }`} />
            <div>
              <h3 className="font-bold text-slate-900">Escalation Speed</h3>
              <p className={`text-sm ${
                escalationSpeed > 10 ? 'text-red-700' :
                escalationSpeed > 5 ? 'text-orange-700' :
                'text-blue-700'
              }`}>
                Risk increased {escalationSpeed} points per hour
              </p>
            </div>
          </div>
          <div className={`text-4xl font-bold ${
            escalationSpeed > 10 ? 'text-red-600' :
            escalationSpeed > 5 ? 'text-orange-600' :
            'text-blue-600'
          }`}>
            {escalationSpeed}
            <span className="text-lg"> pts/hr</span>
          </div>
        </div>
      </div>

      {/* Conversation Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border border-slate-200">
          <div className="flex items-center gap-2 mb-2">
            <MessageSquare className="w-5 h-5 text-blue-600" />
            <span className="text-sm text-slate-600">Messages</span>
          </div>
          <p className="text-2xl font-bold text-slate-900">{conversation.messages.length}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-slate-200">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-5 h-5 text-purple-600" />
            <span className="text-sm text-slate-600">Duration</span>
          </div>
          <p className="text-2xl font-bold text-slate-900">
            {Math.round((conversation.messages[conversation.messages.length - 1].timestamp - conversation.messages[0].timestamp) / (1000 * 60))} min
          </p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-slate-200">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="w-5 h-5 text-green-600" />
            <span className="text-sm text-slate-600">Peak Risk</span>
          </div>
          <p className="text-2xl font-bold text-slate-900">
            {Math.max(...conversation.messages.map(m => m.riskScore))}%
          </p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-slate-200">
          <div className="flex items-center gap-2 mb-2">
            <Activity className="w-5 h-5 text-orange-600" />
            <span className="text-sm text-slate-600">Risk Flags</span>
          </div>
          <p className="text-2xl font-bold text-slate-900">
            {conversation.messages.reduce((sum, m) => sum + m.flags.length, 0)}
          </p>
        </div>
      </div>

      {/* Timeline */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
        <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
          <Clock className="w-6 h-6 text-blue-600" />
          Conversation Timeline
        </h3>

        <div className="relative">
          {/* Timeline Line */}
          <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-green-500 via-yellow-500 to-red-500"></div>

          <div className="space-y-6 ml-4">
            <AnimatePresence>
              {sortedMessages.map((message, index) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="relative flex items-start gap-4"
                >
                  {/* Timeline Dot */}
                  <div className={`w-6 h-6 rounded-full border-4 border-white shadow-md ${getRiskColor(message.riskLevel)} z-10`}></div>

                  {/* Message Card */}
                  <div className={`flex-1 p-4 rounded-xl border-2 ${getRiskBgColor(message.riskLevel)}`}>
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                            message.sender === 'stranger' ? 'bg-orange-200 text-orange-800' : 'bg-blue-200 text-blue-800'
                          }`}>
                            {message.sender === 'stranger' ? 'Stranger' : 'User'}
                          </span>
                          <span className="text-xs text-slate-500">
                            {new Date(message.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                        <p className="text-slate-900 font-medium mb-2">{message.text}</p>

                        {/* Risk Flags */}
                        {message.flags.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {message.flags.map((flag, i) => (
                              <span
                                key={i}
                                className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full"
                              >
                                {flag}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Feature Indicators */}
                        <div className="flex gap-2 mt-2">
                          {Object.entries(message.features).filter(([_, v]) => v).map(([key, _]) => (
                            <div key={key} className="text-xs px-2 py-1 bg-slate-200 text-slate-700 rounded-full">
                              {key.replace(/([A-Z])/g, ' $1').trim()}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Risk Score */}
                      <div className="ml-4 text-center">
                        <div className={`w-16 h-16 rounded-full flex items-center justify-center ${getRiskBgColor(message.riskLevel)}`}>
                          <span className={`text-2xl font-bold ${getRiskColor(message.riskLevel).replace('bg-', 'text-')}`}>
                            {message.riskScore}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 mt-1">risk score</p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* AI Insights */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Activity className="w-6 h-6 text-blue-600" />
          AI-Generated Insights
        </h3>

        <div className="space-y-4">
          {conversation.insights.map((insight, index) => {
            const InsightIcon = getInsightIcon(insight.type);
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`p-4 rounded-xl border-2 ${
                  insight.severity === 'critical' ? 'bg-red-50 border-red-300' :
                  insight.severity === 'warning' ? 'bg-orange-50 border-orange-300' :
                  'bg-blue-50 border-blue-300'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg ${
                    insight.severity === 'critical' ? 'bg-red-200' :
                    insight.severity === 'warning' ? 'bg-orange-200' :
                    'bg-blue-200'
                  }`}>
                    <InsightIcon className={`w-5 h-5 ${
                      insight.severity === 'critical' ? 'text-red-700' :
                      insight.severity === 'warning' ? 'text-orange-700' :
                      'text-blue-700'
                    }`} />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-slate-900 mb-1">{insight.title}</h4>
                    <p className="text-sm text-slate-700">{insight.description}</p>
                    <p className="text-xs text-slate-500 mt-1">
                      Detected {new Date(insight.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                    insight.severity === 'critical' ? 'bg-red-600 text-white' :
                    insight.severity === 'warning' ? 'bg-orange-600 text-white' :
                    'bg-blue-600 text-white'
                  }`}>
                    {insight.type}
                  </span>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ConversationTimelineAnalyzer;
