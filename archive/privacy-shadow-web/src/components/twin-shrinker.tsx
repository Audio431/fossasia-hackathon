'use client';

import { useState, useEffect, useRef } from 'react';
import { useShadow } from '@/lib/shadow-context';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Scissors, MapPin, User, Mail, Shield, Sparkles } from 'lucide-react';
import { useSound } from '@/hooks/useSound';

interface Recommendation {
  id: string;
  title: string;
  description: string;
  impact: number;
  icon: React.ReactNode;
  category: 'location' | 'identity' | 'contacts' | 'browsing' | 'media';
  applied: boolean;
}

const initialRecommendations: Recommendation[] = [
  {
    id: 'remove-location',
    title: 'Remove Location from Photos',
    description: 'Turn off GPS tagging in your camera settings before posting photos',
    impact: 20,
    icon: <MapPin className="w-5 h-5" />,
    category: 'location',
    applied: false,
  },
  {
    id: 'use-nickname',
    title: 'Use a Nickname Online',
    description: 'Use a consistent nickname instead of your real name on social platforms',
    impact: 15,
    icon: <User className="w-5 h-5" />,
    category: 'identity',
    applied: false,
  },
  {
    id: 'check-permissions',
    title: 'Audit App Permissions',
    description: 'Review your installed apps and revoke unnecessary permissions',
    impact: 25,
    icon: <Shield className="w-5 h-5" />,
    category: 'contacts',
    applied: false,
  },
  {
    id: 'clean-friends',
    title: 'Clean Up Friends List',
    description: 'Remove people you do not actually know from your social media friends list',
    impact: 15,
    icon: <User className="w-5 h-5" />,
    category: 'contacts',
    applied: false,
  },
  {
    id: 'disable-location-sharing',
    title: 'Turn Off Location Sharing',
    description: 'Disable location access for all apps that do not need it',
    impact: 30,
    icon: <MapPin className="w-5 h-5" />,
    category: 'location',
    applied: false,
  },
  {
    id: 'review-posts',
    title: 'Review Old Posts',
    description: 'Delete or privatize old posts that might be embarrassing',
    impact: 10,
    icon: <Mail className="w-5 h-5" />,
    category: 'identity',
    applied: false,
  },
];

export function TwinShrinker() {
  const [recommendations, setRecommendations] = useState<Recommendation[]>(initialRecommendations);

  const { shadowSize, removeData, dataCategories } = useShadow();
  const { playSound } = useSound();
  const lastMilestoneRef = useRef(0);

  const applyRecommendation = (id: string, category: 'location' | 'identity' | 'contacts' | 'browsing' | 'media', impact: number) => {
    playSound('click');
    playSound('success');

    setRecommendations(prev =>
      prev.map(rec =>
        rec.id === id ? { ...rec, applied: true } : rec
      )
    );

    // Remove from shadow
    removeData(category, impact, `Twin Diet: ${recommendations.find(r => r.id === id)?.title}`);
  };

  const totalImpact = recommendations.reduce((sum, rec) => sum + (rec.applied ? rec.impact : 0), 0);

  // Play achievement sound only when crossing a milestone threshold
  useEffect(() => {
    const milestones = [10, 30, 50, 70];
    const crossed = milestones.filter(m => totalImpact >= m && lastMilestoneRef.current < m);
    if (crossed.length > 0) {
      playSound('achievement');
      lastMilestoneRef.current = Math.max(...crossed);
    }
  }, [totalImpact]); // eslint-disable-line react-hooks/exhaustive-deps

  const categoryIcons = {
    location: <MapPin className="w-4 h-4" />,
    identity: <User className="w-4 h-4" />,
    contacts: <User className="w-4 h-4" />,
    browsing: <Shield className="w-4 h-4" />,
    media: <Mail className="w-4 h-4" />,
  };

  const getMilestone = () => {
    if (totalImpact >= 70) return { title: 'Ghost Master', icon: '👻', message: 'Your twin is practically invisible!' };
    if (totalImpact >= 50) return { title: 'Twin Whisperer', icon: '🤫', message: 'Your twin is very healthy!' };
    if (totalImpact >= 30) return { title: 'Data Minimalist', icon: '🎯', message: 'Great progress!' };
    if (totalImpact >= 10) return { title: 'First Steps', icon: '👣', message: 'You are on the right track!' };
    return { title: 'Start Here', icon: '🚀', message: 'Apply recommendations to begin!' };
  };

  const milestone = getMilestone();

  return (
    <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 shadow-xl">
      <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
        <span>✂️</span>
        <span>Twin Diet</span>
      </h2>
      <p className="text-slate-400 mb-6">
        Put your Digital Twin on a diet with these actionable recommendations
      </p>

      {/* Progress Overview */}
      <div className="mb-6 p-4 bg-slate-900 rounded-lg border border-slate-700">
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="text-sm text-slate-400">Twin Weight Loss</div>
            <div className="text-2xl font-bold text-purple-400">-{totalImpact}%</div>
          </div>
          <div className="text-right">
            <div className="text-sm text-slate-400">Recommendations Applied</div>
            <div className="text-2xl font-bold text-white">
              {recommendations.filter(r => r.applied).length}/{recommendations.length}
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-700 rounded-full h-3 overflow-hidden">
          <motion.div
            className="bg-gradient-to-r from-purple-500 to-pink-500 h-full"
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(totalImpact, 100)}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>

        {/* Milestone */}
        <AnimatePresence mode="wait">
          {totalImpact >= 10 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mt-3 pt-3 border-t border-slate-600 flex items-center gap-2"
            >
              <span className="text-2xl">{milestone.icon}</span>
              <div>
                <div className="text-sm text-purple-300 font-semibold">{milestone.title}</div>
                <div className="text-xs text-slate-400">{milestone.message}</div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Recommendations */}
      <div className="space-y-3">
        {recommendations.map((recommendation, index) => (
          <motion.div
            key={recommendation.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className={`p-4 rounded-lg border transition-all ${
              recommendation.applied
                ? 'bg-green-500/10 border-green-500/30'
                : 'bg-slate-900 border-slate-700 hover:border-slate-600'
            }`}
          >
            <div className="flex items-start gap-4">
              <div className={`p-2 rounded-lg ${
                recommendation.applied
                  ? 'bg-green-500/20 text-green-400'
                  : 'bg-slate-700 text-slate-400'
              }`}>
                {recommendation.icon}
              </div>
              <div className="flex-1">
                <h3 className={`font-semibold mb-1 ${recommendation.applied ? 'text-green-400 line-through' : 'text-white'}`}>
                  {recommendation.title}
                </h3>
                <p className="text-sm text-slate-300 mb-2">{recommendation.description}</p>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400">Impact:</span>
                  <span className="text-xs font-bold text-purple-400">-{recommendation.impact}%</span>
                  <span className="text-xs text-slate-500">to your Digital Twin</span>
                </div>
              </div>
              <div className="flex items-center">
                {recommendation.applied ? (
                  <CheckCircle2 className="text-green-400 w-6 h-6" />
                ) : (
                  <button
                    onClick={() => applyRecommendation(recommendation.id, recommendation.category, recommendation.impact)}
                    disabled={recommendation.applied}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      recommendation.applied
                        ? 'bg-green-600 text-white cursor-default'
                        : 'bg-purple-600 hover:bg-purple-700 text-white cursor-pointer'
                    }`}
                  >
                    Apply
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Success Message */}
      <AnimatePresence mode="wait">
        {totalImpact >= 50 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="mt-6 p-4 bg-gradient-to-r from-purple-500/20 via-pink-500/20 to-blue-500/20 rounded-lg border border-purple-500/30 text-center"
          >
            <div className="flex items-center justify-center gap-2 mb-2">
              <Sparkles className="text-yellow-400 w-5 h-5" />
              <p className="text-lg font-bold text-white">Congratulations!</p>
            </div>
            <p className="text-sm text-slate-300">
              Your Digital Twin is getting healthier! You have reduced your digital footprint by {totalImpact}%.
            </p>
            <p className="text-xs text-slate-400 mt-2">
              Keep up the good work to maintain a healthy digital footprint.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Info Box */}
      <div className="mt-6 p-4 bg-slate-900 rounded-lg border border-slate-700">
        <div className="flex items-start gap-3">
          <Scissors className="text-purple-400 flex-shrink-0 w-5 h-5 mt-0.5" />
          <div>
            <p className="text-sm text-slate-300 font-semibold mb-1">How the Twin Diet Works:</p>
            <p className="text-xs text-slate-400 leading-relaxed">
              Each recommendation reduces your Digital Twin data exposure by a specific percentage.
              As you apply recommendations, your twin becomes lighter and less exposed. The goal is to have
              a healthy, minimal twin that protects your privacy while still allowing you to enjoy digital life.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
