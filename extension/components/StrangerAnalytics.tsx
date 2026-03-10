/**
 * Parent Dashboard - Stranger Analytics
 * Comprehensive dashboard for parents to monitor stranger interactions and risks
 * Shows real-time threat monitoring, stranger profiles, and risk trends
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Shield, AlertTriangle, User, TrendingUp, Calendar,
  Clock, MessageSquare, Eye, AlertCircle, Activity,
  BarChart3, PieChart, Target, Zap, Home
} from 'lucide-react';

interface StrangerData {
  id: string;
  username: string;
  avatar?: string;
  riskScore: number;
  platform: 'instagram' | 'twitter' | 'tiktok' | 'youtube' | 'discord';
  interactionCount: number;
  lastMessage: string;
  lastContact: Date;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  isBlocked: boolean;
}

interface RiskTrend {
  date: Date;
  riskScore: number;
  strangerInteractions: number;
  platform: string;
}

interface ConversationDetail {
  strangerId: string;
  messages: Array<{
    text: string;
    timestamp: Date;
    sender: 'user' | 'stranger';
    riskFlagged: boolean;
  }>;
  escalationSpeed: number;
  groomingPatterns: string[];
  personalInfoRequests: number;
}

export const StrangerAnalytics: React.FC = () => {
  const [strangerInteractions, setStrangerInteractions] = useState<StrangerData[]>([]);
  const [riskTrends, setRiskTrends] = useState<RiskTrend[]>([]);
  const [selectedStranger, setSelectedStranger] = useState<StrangerData | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'strangers' | 'trends' | 'analysis'>('overview');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      const result = await chrome.storage.local.get([
        'strangerInteractions',
        'riskTrends',
        'conversationDetails'
      ]);

      setStrangerInteractions(result.strangerInteractions || []);
      setRiskTrends(result.riskTrends || []);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateStats = () => {
    const totalInteractions = strangerInteractions.length;
    const highRiskCount = strangerInteractions.filter(s =>
      s.riskLevel === 'high' || s.riskLevel === 'critical'
    ).length;
    const avgRiskScore = strangerInteractions.reduce((sum, s) =>
      sum + s.riskScore, 0
    ) / (totalInteractions || 1);

    return { totalInteractions, highRiskCount, avgRiskScore };
  };

  const stats = calculateStats();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading safety dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <header className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-blue-600 p-2 rounded-lg">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Privacy Shadow</h1>
                <p className="text-sm text-slate-600">Parent Safety Dashboard</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <nav className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {[
              { id: 'overview', label: 'Overview', icon: Activity },
              { id: 'strangers', label: 'Strangers', icon: User },
              { id: 'trends', label: 'Trends', icon: TrendingUp },
              { id: 'analysis', label: 'Analysis', icon: BarChart3 },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-4 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <StatsCard
                title="Total Stranger Contacts"
                value={stats.totalInteractions}
                icon={User}
                color="blue"
                change="+2 this week"
              />
              <StatsCard
                title="High Risk Interactions"
                value={stats.highRiskCount}
                icon={AlertTriangle}
                color="red"
                change="Requires attention"
              />
              <StatsCard
                title="Average Risk Score"
                value={`${stats.avgRiskScore.toFixed(1)}%`}
                icon={Shield}
                color="green"
                change="-5% from last week"
              />
              <StatsCard
                title="Active Conversations"
                value={strangerInteractions.filter(s => !s.isBlocked).length}
                icon={MessageSquare}
                color="purple"
                change="3 ongoing"
              />
            </div>
          </div>
        )}

        {activeTab === 'strangers' && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-slate-900">Stranger Profiles</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {strangerInteractions.map(stranger => (
                <StrangerProfileCard
                  key={stranger.id}
                  stranger={stranger}
                  onClick={() => setSelectedStranger(stranger)}
                />
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

// Helper Components
interface StatsCardProps {
  title: string;
  value: number | string;
  icon: React.ComponentType<{ className?: string }>;
  color: 'blue' | 'red' | 'green' | 'purple';
  change: string;
}

const StatsCard: React.FC<StatsCardProps> = ({ title, value, icon: Icon, color, change }) => {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    red: 'bg-red-50 text-red-600',
    green: 'bg-green-50 text-green-600',
    purple: 'bg-purple-50 text-purple-600',
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
      <h3 className="text-sm font-medium text-slate-600 mb-1">{title}</h3>
      <p className="text-3xl font-bold text-slate-900 mb-2">{value}</p>
      <p className="text-xs text-slate-500">{change}</p>
    </div>
  );
};

interface StrangerProfileCardProps {
  stranger: StrangerData;
  onClick: () => void;
}

const StrangerProfileCard: React.FC<StrangerProfileCardProps> = ({ stranger, onClick }) => {
  const RiskIcon = stranger.riskLevel === 'critical' ? AlertCircle :
                   stranger.riskLevel === 'high' ? AlertTriangle :
                   stranger.riskLevel === 'medium' ? AlertTriangle : Shield;

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      onClick={onClick}
      className="bg-white rounded-xl shadow-sm p-6 cursor-pointer border-2 transition-all hover:shadow-md"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-slate-200 rounded-full flex items-center justify-center">
            <User className="w-6 h-6 text-slate-600" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900">{stranger.username}</h3>
            <p className="text-sm text-slate-500 capitalize">{stranger.platform}</p>
          </div>
        </div>
        <RiskIcon className={`w-6 h-6 ${
          stranger.riskLevel === 'critical' ? 'text-red-600' :
          stranger.riskLevel === 'high' ? 'text-orange-600' :
          stranger.riskLevel === 'medium' ? 'text-yellow-600' :
          'text-green-600'
        }`} />
      </div>

      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-sm text-slate-600">Risk Score</span>
          <span className="font-bold">{stranger.riskScore.toFixed(0)}%</span>
        </div>
        <div className="flex justify-between items-center text-sm">
          <span className="text-slate-600">Interactions</span>
          <span className="font-medium">{stranger.interactionCount}</span>
        </div>
      </div>

      <button className="w-full mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
        View Details
      </button>
    </motion.div>
  );
};

export default StrangerAnalytics;
