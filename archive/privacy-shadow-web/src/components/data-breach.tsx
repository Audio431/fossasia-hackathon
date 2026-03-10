'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Shield, Eye, Lock, Clock, Zap, Database } from 'lucide-react';
import { useSound } from '@/hooks/useSound';

interface BreachScenario {
  id: string;
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  exposedData: string[];
  timeline: string;
  impact: string;
  prevention: string;
}

const breachScenarios: BreachScenario[] = [
  {
    id: 'password-reuse',
    title: 'Password Reuse Attack',
    description: 'You use the same password across multiple sites. One site gets hacked, and attackers try your password everywhere.',
    severity: 'critical',
    exposedData: ['Email', 'Password', 'All accounts with same password'],
    timeline: 'Seconds after a data breach',
    impact: 'Attackers access ALL your accounts using the leaked password',
    prevention: 'Use unique passwords for each site + enable 2FA'
  },
  {
    id: 'public-wifi',
    title: 'Public WiFi Snooping',
    description: 'You check social media at a coffee shop using free WiFi. Someone on the same network is watching.',
    severity: 'high',
    exposedData: ['Unencrypted communications', 'Session cookies', 'Login credentials'],
    timeline: 'Real-time interception',
    impact: 'Attackers see everything you browse and can hijack your sessions',
    prevention: 'Use VPN + avoid sensitive activities on public WiFi'
  },
  {
    id: 'phishing',
    title: 'Sophisticated Phishing Attack',
    description: 'You receive an email that looks exactly like your school\'s login portal. It\'s fake but very convincing.',
    severity: 'critical',
    exposedData: ['Username', 'Password', '2FA codes (if you enter them)'],
    timeline: 'Immediate upon clicking the link',
    impact: 'Attackers gain full access to your real account',
    prevention: 'Always verify URLs + never click suspicious links'
  },
  {
    id: 'third-party-sharing',
    title: 'Third-Party Data Sharing',
    description: 'That fun quiz app asks for access to your profile. You click "Allow" without reading the terms.',
    severity: 'medium',
    exposedData: ['Profile information', 'Friends list', 'Posts', 'Photos'],
    timeline: 'Immediate and ongoing',
    impact: 'Your data is sold to advertisers and data brokers',
    prevention: 'Review app permissions regularly + minimize data sharing'
  },
  {
    id: 'metadata-leak',
    title: 'Photo Metadata Exposure',
    description: 'You post a photo from your phone. The image contains GPS coordinates, showing exactly where you live.',
    severity: 'high',
    exposedData: ['GPS coordinates', 'Device info', 'Timestamp', 'Camera details'],
    timeline: 'Permanently once posted online',
    impact: 'Anyone can find your home location and track your movements',
    prevention: 'Disable GPS tagging + scrub metadata before posting'
  }
];

export function DataBreachSimulator() {
  const [selectedScenario, setSelectedScenario] = useState<number | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationStep, setSimulationStep] = useState(0);
  const [understood, setUnderstood] = useState(false);
  const { playSound } = useSound();

  const simulateBreach = (index: number) => {
    setSelectedScenario(index);
    setIsSimulating(true);
    setSimulationStep(0);
    playSound('warning');

    // Auto-advance through simulation steps
    const steps = [1, 2, 3, 4];
    steps.forEach((step, i) => {
      setTimeout(() => {
        setSimulationStep(step);
        if (step < 4) {
          playSound('click');
        } else {
          playSound('warning');
        }
      }, (i + 1) * 1500);
    });
  };

  const resetSimulation = () => {
    setSelectedScenario(null);
    setIsSimulating(false);
    setSimulationStep(0);
    setUnderstood(false);
  };

  const severityColors = {
    low: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    medium: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    high: 'bg-red-500/20 text-red-400 border-red-500/30',
    critical: 'bg-red-600/20 text-red-500 border-red-600/50'
  };

  const severityIcons = {
    low: <AlertTriangle className="w-5 h-5" />,
    medium: <AlertTriangle className="w-5 h-5" />,
    high: <AlertTriangle className="w-5 h-5" />,
    critical: <Zap className="w-5 h-5" />
  };

  return (
    <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 shadow-xl">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-red-500/20 rounded-lg">
          <Shield className="text-red-400 w-6 h-6" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white">Data Breach Simulator</h2>
          <p className="text-slate-400 text-sm">See how your data could be exposed in real-world attacks</p>
        </div>
      </div>

      {selectedScenario === null ? (
        <div className="space-y-4">
          <div className="p-4 bg-slate-900 rounded-lg border border-slate-700">
            <p className="text-slate-300 text-sm">
              <strong className="text-red-400">⚠️ Warning:</strong> These simulations show real ways that user data gets exposed.
              Understanding these scenarios helps you protect yourself.
            </p>
          </div>

          <div className="grid gap-4">
            {breachScenarios.map((scenario, index) => (
              <motion.div
                key={scenario.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                onClick={() => simulateBreach(index)}
                className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  scenario.severity === 'critical'
                    ? 'bg-red-900/20 border-red-600/50 hover:border-red-500 hover:shadow-lg hover:shadow-red-500/20'
                    : scenario.severity === 'high'
                    ? 'bg-orange-900/20 border-orange-600/50 hover:border-orange-500 hover:shadow-lg hover:shadow-orange-500/20'
                    : 'bg-slate-900 border-slate-700 hover:border-slate-600 hover:shadow-lg'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {severityIcons[scenario.severity]}
                    <h3 className="font-semibold text-white">{scenario.title}</h3>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${severityColors[scenario.severity]}`}>
                    {scenario.severity.toUpperCase()}
                  </span>
                </div>
                <p className="text-slate-300 text-sm mb-3">{scenario.description}</p>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <Clock className="w-3 h-3" />
                  <span>Timeline: {scenario.timeline}</span>
                </div>
                <div className="mt-3 text-xs text-purple-400 font-medium">
                  Click to simulate →
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      ) : (
        <AnimatePresence mode="wait">
          <motion.div
            key="simulation"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="space-y-6"
          >
            {/* Scenario Header */}
            <div className={`p-4 rounded-lg border-2 ${severityColors[breachScenarios[selectedScenario].severity]}`}>
              <div className="flex items-center gap-3 mb-2">
                {severityIcons[breachScenarios[selectedScenario].severity]}
                <h3 className="text-xl font-bold">{breachScenarios[selectedScenario].title}</h3>
              </div>
              <p className="text-sm opacity-90">{breachScenarios[selectedScenario].description}</p>
            </div>

            {/* Simulation Steps */}
            {isSimulating && (
              <div className="space-y-4">
                <h4 className="font-semibold text-white flex items-center gap-2">
                  <Eye className="w-5 h-5 text-red-400" />
                  Breach Progress
                </h4>

                <div className="space-y-3">
                  {/* Step 1: Initial Access */}
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: simulationStep >= 1 ? 1 : 0.3, x: 0 }}
                    className={`p-3 rounded-lg border ${
                      simulationStep >= 1 ? 'bg-red-900/30 border-red-500' : 'bg-slate-900 border-slate-700'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold ${
                        simulationStep >= 1 ? 'bg-red-500 text-white' : 'bg-slate-700 text-slate-500'
                      }`}>
                        1
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-white">Initial Compromise</div>
                        <div className="text-sm text-slate-400 mt-1">
                          Attackers gain access through {breachScenarios[selectedScenario].title.toLowerCase()}
                        </div>
                      </div>
                      {simulationStep >= 1 && <Lock className="text-red-400 w-5 h-5" />}
                    </div>
                  </motion.div>

                  {/* Step 2: Data Extraction */}
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: simulationStep >= 2 ? 1 : 0.3, x: 0 }}
                    transition={{ delay: 0.2 }}
                    className={`p-3 rounded-lg border ${
                      simulationStep >= 2 ? 'bg-orange-900/30 border-orange-500' : 'bg-slate-900 border-slate-700'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold ${
                        simulationStep >= 2 ? 'bg-orange-500 text-white' : 'bg-slate-700 text-slate-500'
                      }`}>
                        2
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-white">Data Extraction</div>
                        <div className="text-sm text-slate-400 mt-1">
                          Exposed: {breachScenarios[selectedScenario].exposedData.join(', ')}
                        </div>
                      </div>
                      {simulationStep >= 2 && <Database className="text-orange-400 w-5 h-5" />}
                    </div>
                  </motion.div>

                  {/* Step 3: Impact */}
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: simulationStep >= 3 ? 1 : 0.3, x: 0 }}
                    transition={{ delay: 0.4 }}
                    className={`p-3 rounded-lg border ${
                      simulationStep >= 3 ? 'bg-red-900/30 border-red-500' : 'bg-slate-900 border-slate-700'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold ${
                        simulationStep >= 3 ? 'bg-red-500 text-white' : 'bg-slate-700 text-slate-500'
                      }`}>
                        3
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-white">Impact Realized</div>
                        <div className="text-sm text-slate-400 mt-1">
                          {breachScenarios[selectedScenario].impact}
                        </div>
                      </div>
                      {simulationStep >= 3 && <Zap className="text-red-400 w-5 h-5" />}
                    </div>
                  </motion.div>

                  {/* Step 4: Prevention */}
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: simulationStep >= 4 ? 1 : 0.3, x: 0 }}
                    transition={{ delay: 0.6 }}
                    className={`p-4 rounded-lg border-2 ${
                      simulationStep >= 4 ? 'bg-green-900/30 border-green-500' : 'bg-slate-900 border-slate-700'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold ${
                        simulationStep >= 4 ? 'bg-green-500 text-white' : 'bg-slate-700 text-slate-500'
                      }`}>
                        4
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-white mb-1">How to Protect Yourself</div>
                        <div className="text-sm text-green-300">
                          {breachScenarios[selectedScenario].prevention}
                        </div>
                      </div>
                      {simulationStep >= 4 && <Shield className="text-green-400 w-5 h-5" />}
                    </div>
                  </motion.div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={resetSimulation}
                className="flex-1 px-4 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors"
              >
                ← Back to Scenarios
              </button>
              {simulationStep === 4 && !understood && (
                <motion.button
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  onClick={() => {
                    playSound('success');
                    setUnderstood(true);
                  }}
                  className="flex-1 px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
                >
                  I understand the risks
                </motion.button>
              )}
            </div>
            {understood && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 bg-green-500/20 border border-green-500/40 rounded-lg text-center"
              >
                <p className="text-green-300 font-semibold">✅ Great! You now understand how data breaches work. Stay vigilant!</p>
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}
