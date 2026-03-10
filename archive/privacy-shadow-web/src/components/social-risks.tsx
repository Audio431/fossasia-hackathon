'use client';

import { useState } from 'react';
import { useShadow } from '@/lib/shadow-context';
import { motion, AnimatePresence } from 'framer-motion';
import { UserPlus, Tag, AlertTriangle, User, Image as ImageIcon, Share2, Eye } from 'lucide-react';

interface SocialScenario {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  riskLevel: 'medium' | 'high';
  impact: string;
  action: string;
}

export function SocialRisks() {
  const [activeScenario, setActiveScenario] = useState<string | null>(null);
  const [demonstrated, setDemonstrated] = useState<string[]>([]);
  const { addData } = useShadow();

  const scenarios: SocialScenario[] = [
    {
      id: 'tagged',
      title: 'Friend Tags You in Photo',
      description: 'Your friend posts a group photo and tags you in it. You didn\'t post it, but now it\'s part of YOUR digital footprint too.',
      icon: <Tag className="w-5 h-5" />,
      riskLevel: 'high',
      impact: 'Your face is now public, associated with your name, and reveals your social connections.',
      action: 'Even if you don\'t post, friends can expose your data',
    },
    {
      id: 'shared',
      title: 'Friend Shares Your Photo',
      description: 'You sent a photo to a friend privately. They share it publicly without asking. Now it\'s online forever.',
      icon: <Share2 className="w-5 h-5" />,
      riskLevel: 'high',
      impact: 'Your private photo is now public, can be screenshotted, shared, and archived by others.',
      action: 'You can\'t control what friends do with content you share',
    },
    {
      id: 'mentioned',
      title: 'Friend Mentions You',
      description: 'A friend writes a post that mentions your name and where you are. Even without a photo, you\'re exposed.',
      icon: <User className="w-5 h-5" />,
      riskLevel: 'medium',
      impact: 'Your name is now linked to that location, activity, and context in a permanent public record.',
      action: 'Mentions can expose your location and activities even without photos',
    },
    {
      id: 'group-chat',
      title: 'Group Chat Screenshots',
      description: 'You\'re in a group chat. Someone takes a screenshot of a conversation and shares it.',
      icon: <Eye className="w-5 h-5" />,
      riskLevel: 'medium',
      impact: 'Private conversations become public. Your messages, opinions, and context are exposed.',
      action: 'Nothing in digital spaces is truly private if others can see it',
    },
    {
      id: 'check-in',
      title: 'Location Check-In',
      description: 'A friend checks in at a location and tags you. Now you\'re associated with that place and time.',
      icon: <ImageIcon className="w-5 h-5" />,
      riskLevel: 'high',
      impact: 'Your location history is revealed, showing patterns of where you go and when.',
      action: 'Location tagging by others reveals your movements even if you don\'t post',
    },
  ];

  const demonstrate = (scenarioId: string) => {
    if (!demonstrated.includes(scenarioId)) {
      setDemonstrated([...demonstrated, scenarioId]);

      // Add to shadow
      addData('contacts', 15, 'Social: Friend exposed you');
      addData('location', 10, 'Social: Tagged location');
    }
    setActiveScenario(scenarioId);
  };

  const riskColors = {
    medium: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30',
    high: 'text-red-400 bg-red-500/10 border-red-500/30',
  };

  return (
    <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 shadow-xl">
      <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
        <span>👥</span>
        <span>Social Risk Simulator</span>
      </h2>
      <p className="text-slate-400 mb-6">
        Discover how your friends can expose YOUR data even if you're being careful
      </p>

      {/* Info Box */}
      <div className="mb-6 p-4 bg-orange-500/10 border border-orange-500/30 rounded-lg">
        <div className="flex items-start gap-3">
          <AlertTriangle className="text-orange-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-orange-300 font-semibold mb-1">
              You can't control what friends share
            </p>
            <p className="text-xs text-orange-200">
              Even if you don't post anything, your friends can still expose your data through photos, tags, and mentions.
            </p>
          </div>
        </div>
      </div>

      {/* Scenario Grid */}
      <div className="grid gap-4">
        {scenarios.map((scenario, index) => (
          <motion.div
            key={scenario.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`p-4 rounded-lg border transition-all cursor-pointer ${
              activeScenario === scenario.id
                ? 'bg-slate-700 border-purple-500'
                : 'bg-slate-900 border-slate-700 hover:border-slate-600'
            }`}
            onClick={() => demonstrate(scenario.id)}
          >
            <div className="flex items-start gap-4">
              <div className={`p-3 rounded-lg ${riskColors[scenario.riskLevel].split(' ')[0]} bg-opacity-20`}>
                {scenario.icon}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-white mb-1">{scenario.title}</h3>
                <p className="text-sm text-slate-300 mb-2">{scenario.description}</p>
                <div className={`inline-block px-2 py-1 rounded text-xs font-semibold ${riskColors[scenario.riskLevel]}`}>
                  {scenario.riskLevel.toUpperCase()} RISK
                </div>
              </div>
            </div>

            {/* Impact revealed when active */}
            <AnimatePresence>
              {activeScenario === scenario.id && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-3 pt-3 border-t border-slate-600"
                >
                  <div className="flex items-start gap-2 mb-2">
                    <AlertTriangle className="text-red-400 flex-shrink-0 w-4 h-4 mt-0.5" />
                    <div>
                      <p className="text-sm text-red-300 font-semibold">Impact:</p>
                      <p className="text-xs text-slate-300">{scenario.impact}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <UserPlus className="text-purple-400 flex-shrink-0 w-4 h-4 mt-0.5" />
                    <div>
                      <p className="text-sm text-purple-300 font-semibold">The Problem:</p>
                      <p className="text-xs text-slate-300">{scenario.action}</p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </div>

      {/* Stats */}
      <div className="mt-6 p-4 bg-slate-900 rounded-lg border border-slate-700">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-slate-400">Scenarios Demonstrated</div>
            <div className="text-2xl font-bold text-white">{demonstrated.length}/5</div>
          </div>
          <div>
            <div className="text-sm text-slate-400">Your Twin Grew By</div>
            <div className="text-2xl font-bold text-purple-400">+{demonstrated.length * 5}%</div>
          </div>
        </div>
      </div>

      {/* Key Insight */}
      <div className="mt-4 p-4 bg-slate-900 rounded-lg border border-slate-700">
        <p className="text-sm text-slate-300">
          💡 <span className="text-purple-400 font-semibold">Key Insight:</span> Your digital footprint is not just about what YOU post.
          It includes content others post about you, photos they take, and information they share.
        </p>
        <p className="text-xs text-slate-500 mt-2">
          This is why even privacy-conscious people can have large digital footprints.
        </p>
      </div>
    </div>
  );
}
