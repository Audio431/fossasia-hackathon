/**
 * Stranger Alert Component
 * Real-time stranger detection alert with risk visualization
 * Displays ML-based predictions with confidence levels and actionable recommendations
 */

import React, { useState, useEffect } from 'react';
import { StrangerPrediction, StrangerFeatures } from '../detection/ml-model';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Shield, X, User, AlertCircle, TrendingUp, Eye } from 'lucide-react';

interface StrangerAlertProps {
  prediction: StrangerPrediction;
  features: StrangerFeatures;
  onBlock?: () => void;
  onContinue?: () => void;
  onLearnMore?: () => void;
}

export const StrangerAlert: React.FC<StrangerAlertProps> = ({
  prediction,
  features,
  onBlock,
  onContinue,
  onLearnMore,
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  const riskLevel = prediction.probability > 0.7 ? 'critical' :
                   prediction.probability > 0.4 ? 'high' :
                   prediction.probability > 0.2 ? 'medium' : 'low';

  const riskColors = {
    critical: 'from-red-500 to-red-600',
    high: 'from-orange-500 to-orange-600',
    medium: 'from-yellow-500 to-yellow-600',
    low: 'from-blue-500 to-blue-600',
  };

  const riskIcons = {
    critical: AlertCircle,
    high: AlertTriangle,
    medium: AlertTriangle,
    low: Shield,
  };

  const RiskIcon = riskIcons[riskLevel];

  const handleClose = () => {
    setIsVisible(false);
    // Also call onContinue to acknowledge the risk when closing
    if (onContinue) {
      onContinue();
    }
  };

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -50 }}
        className="fixed top-4 right-4 z-50 max-w-md w-full"
      >
        <div className={`bg-gradient-to-br ${riskColors[riskLevel]} rounded-lg shadow-2xl p-6 text-white`}>
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-full">
                <RiskIcon className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-lg">Stranger Alert</h3>
                <p className="text-sm opacity-90 capitalize">{riskLevel} Risk Detected</p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="text-white/80 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Risk Meter */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium">Stranger Probability</span>
              <span className="text-sm font-bold">{(prediction.probability * 100).toFixed(0)}%</span>
            </div>
            <div className="bg-white/20 rounded-full h-3 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${prediction.probability * 100}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                className="h-full bg-white rounded-full"
              />
            </div>
            <div className="flex justify-between items-center mt-2">
              <span className="text-xs opacity-80">Confidence: {prediction.confidence.toUpperCase()}</span>
              <span className="text-xs opacity-80">
                {(prediction.confidenceScore * 100).toFixed(0)}% confidence score
              </span>
            </div>
          </div>

          {/* Recommendation */}
          <div className="bg-white/10 rounded-lg p-4 mb-4">
            <p className="text-sm font-medium leading-relaxed">{prediction.recommendation}</p>
          </div>

          {/* Risk Factors */}
          <div className="mb-4">
            <button
              onClick={() => toggleSection('factors')}
              className="w-full flex items-center justify-between text-left font-medium mb-2"
            >
              <span className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Risk Factors ({prediction.factors.length})
              </span>
              <motion.span
                animate={{ rotate: expandedSection === 'factors' ? 180 : 0 }}
                className="text-sm"
              >
                ▼
              </motion.span>
            </button>

            <AnimatePresence>
              {expandedSection === 'factors' && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="space-y-2 overflow-hidden"
                >
                  {prediction.factors.slice(0, 5).map((factor, index) => (
                    <motion.div
                      key={index}
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: index * 0.1 }}
                      className="bg-white/10 rounded p-2 text-sm"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <p className="font-medium">{factor.factor}</p>
                          <p className="text-xs opacity-80">{factor.description}</p>
                        </div>
                        <div className="ml-2 bg-white/20 px-2 py-1 rounded text-xs">
                          {factor.impact}%
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Profile Analysis */}
          <div className="mb-4">
            <button
              onClick={() => toggleSection('profile')}
              className="w-full flex items-center justify-between text-left font-medium mb-2"
            >
              <span className="flex items-center gap-2">
                <User className="w-4 h-4" />
                Profile Analysis
              </span>
              <motion.span
                animate={{ rotate: expandedSection === 'profile' ? 180 : 0 }}
                className="text-sm"
              >
                ▼
              </motion.span>
            </button>

            <AnimatePresence>
              {expandedSection === 'profile' && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="bg-white/10 rounded p-3 space-y-2 overflow-hidden"
                >
                  <ProfileItem label="Account Age" value={`${features.accountAgeDays} days`} />
                  <ProfileItem label="Followers" value={features.followerRatio.toFixed(2)} />
                  <ProfileItem label="Mutual Friends" value={features.mutualFriends} />
                  <ProfileItem label="Previous Interactions" value={features.previousInteractions} />
                  <ProfileItem label="Profile Complete" value={`${(features.profileCompleteness * 100).toFixed(0)}%`} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            {onBlock && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onBlock}
                className="flex-1 bg-white text-red-600 font-medium py-3 px-4 rounded-lg hover:bg-white/90 transition-colors"
              >
                Block & Report
              </motion.button>
            )}
            {onContinue && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onContinue}
                className="flex-1 bg-white/20 font-medium py-3 px-4 rounded-lg hover:bg-white/30 transition-colors"
              >
                I Know This Person
              </motion.button>
            )}
          </div>

          {onLearnMore && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onLearnMore}
              className="w-full mt-3 text-sm underline text-white/80 hover:text-white"
            >
              Learn why this is risky
            </motion.button>
          )}

          {/* Detection Info Footer */}
          <div className="mt-4 pt-4 border-t border-white/20">
            <div className="flex items-center gap-2 text-xs opacity-80">
              <Eye className="w-3 h-3" />
              <span>
                ML Detection • {features.platformType} • {new Date().toLocaleTimeString()}
              </span>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

// Helper component for profile items
interface ProfileItemProps {
  label: string;
  value: string | number;
}

const ProfileItem: React.FC<ProfileItemProps> = ({ label, value }) => (
  <div className="flex justify-between items-center text-sm">
    <span className="opacity-80">{label}:</span>
    <span className="font-medium">{value}</span>
  </div>
);

export default StrangerAlert;
