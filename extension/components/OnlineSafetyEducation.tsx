/**
 * Online Safety Education Component
 * Educational content for parents and children about online stranger danger
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Lightbulb, AlertCircle, Shield, Users, Target } from 'lucide-react';

interface SafetyTip {
  icon: string;
  title: string;
  description: string;
  category: 'for-kids' | 'for-parents' | 'warning-signs';
}

const safetyTips: SafetyTip[] = [
  {
    icon: '👤',
    title: 'Not Everyone Is Who They Say They Are',
    description: 'People online can pretend to be anyone. A "14-year-old girl" could actually be an adult predator.',
    category: 'for-kids'
  },
  {
    icon: '🔒',
    title: 'Keep Personal Information Private',
    description: 'Never share your full name, address, school, phone number, or location with strangers online.',
    category: 'for-kids'
  },
  {
    icon: '📸',
    title: 'Think Before You Share Photos',
    description: 'Once you share a photo, you can\'t take it back. Others can save and share it too.',
    category: 'for-kids'
  },
  {
    icon: '🤫',
    title: 'Secrets Are a Red Flag',
    description: 'If someone asks you to keep your conversation a secret from your parents, that\'s a warning sign.',
    category: 'for-kids'
  },
  {
    icon: '🎁',
    title: 'Gifts and Favors Can Be Tricks',
    description: 'Be careful if strangers offer to buy you things or give you gifts. They may want something in return.',
    category: 'for-kids'
  },
  {
    icon: '👨‍👩‍👧‍👦',
    title: 'Talk to a Trusted Adult',
    description: 'If something feels weird or scary online, tell your parents, teacher, or another trusted adult right away.',
    category: 'for-kids'
  },
  {
    icon: '👀',
    title: 'Monitor Your Child\'s Online Activity',
    description: 'Know which apps and websites your children use. Set up parental controls and privacy settings together.',
    category: 'for-parents'
  },
  {
    icon: '💬',
    title: 'Keep Communication Open',
    description: 'Create an environment where your child feels safe talking to you about their online experiences without fear of punishment.',
    category: 'for-parents'
  },
  {
    icon: '📚',
    title: 'Educate Yourself About Platforms',
    description: 'Learn about the social media platforms your children use. Understand their features, risks, and privacy settings.',
    category: 'for-parents'
  },
  {
    icon: '⏰',
    title: 'Set Screen Time Limits',
    description: 'Establish rules for when and how long your children can be online. More time online = more exposure to risks.',
    category: 'for-parents'
  },
  {
    icon: '🚩',
    title: 'Your Child Wants Privacy',
    description: 'While privacy is normal, excessive secrecy about online activities could be a warning sign.',
    category: 'warning-signs'
  },
  {
    icon: '📱',
    title: 'Unknown Contacts or Apps',
    description: 'New contacts, especially from adults, or unfamiliar apps on your child\'s device could be risky.',
    category: 'warning-signs'
  },
  {
    icon: '😔',
    title: 'Changes in Behavior',
    description: 'If your child becomes withdrawn, anxious, or secretive after using devices, investigate further.',
    category: 'warning-signs'
  },
  {
    icon: '🎮',
    title: 'In-Game Purchases or Requests',
    description: 'Sudden requests for money, gift cards, or in-game items could indicate grooming or financial exploitation.',
    category: 'warning-signs'
  },
  {
    icon: '🌙',
    title: 'Late Night Online Activity',
    description: 'Predators often target children late at night when parents are asleep.',
    category: 'warning-signs'
  }
];

const groomingStages = [
  {
    stage: 1,
    title: 'Bonding',
    description: 'Stranger builds trust by pretending to share interests, giving compliments, or offering gifts.',
    timeline: 'Days to weeks',
    warning: 'Seems friendly and harmless'
  },
  {
    stage: 2,
    title: 'Testing Boundaries',
    description: 'Slowly introduces inappropriate topics or asks minor questions that push boundaries.',
    timeline: 'Weeks to months',
    warning: 'Subtle boundary testing'
  },
  {
    stage: 3,
    title: 'Isolation',
    description: 'Encourages secrecy from parents and friends, creating an exclusive relationship.',
    timeline: 'Months',
    warning: 'Requests secrecy, "us vs them"'
  },
  {
    stage: 4,
    title: 'Abuse',
    description: 'Escalates to inappropriate requests, explicit content, or attempts to meet in person.',
    timeline: 'Can happen quickly',
    warning: 'Immediate danger!'
  }
];

export const OnlineSafetyEducation: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState<'for-kids' | 'for-parents' | 'warning-signs'>('for-kids');
  const [showGrooming, setShowGrooming] = useState(false);

  const filteredTips = safetyTips.filter(tip => tip.category === activeCategory);

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-8 text-white">
        <div className="flex items-center gap-4 mb-4">
          <BookOpen className="w-12 h-12" />
          <div>
            <h2 className="text-3xl font-bold">Online Safety Education</h2>
            <p className="text-blue-100">Knowledge is your best protection</p>
          </div>
        </div>
        <p className="text-lg leading-relaxed">
          Understanding online dangers is the first step to staying safe. Learn the warning signs,
          protect your personal information, and know when to ask for help.
        </p>
      </div>

      {/* Category Tabs */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setActiveCategory('for-kids')}
            className={`px-6 py-3 rounded-lg font-medium transition-all ${
              activeCategory === 'for-kids'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            🧒 For Kids
          </button>
          <button
            onClick={() => setActiveCategory('for-parents')}
            className={`px-6 py-3 rounded-lg font-medium transition-all ${
              activeCategory === 'for-parents'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            👨‍👩‍👧 For Parents
          </button>
          <button
            onClick={() => setActiveCategory('warning-signs')}
            className={`px-6 py-3 rounded-lg font-medium transition-all ${
              activeCategory === 'warning-signs'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            🚩 Warning Signs
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredTips.map((tip, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="p-6 bg-slate-50 rounded-xl border border-slate-200 hover:shadow-md transition-all"
            >
              <div className="flex items-start gap-4">
                <div className="text-4xl">{tip.icon}</div>
                <div>
                  <h3 className="font-bold text-slate-900 mb-2">{tip.title}</h3>
                  <p className="text-sm text-slate-700 leading-relaxed">{tip.description}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Grooming Pattern Education */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Target className="w-8 h-8 text-red-600" />
            <div>
              <h3 className="text-2xl font-bold text-slate-900">Understanding Grooming</h3>
              <p className="text-slate-600">How predators manipulate children online</p>
            </div>
          </div>
          <button
            onClick={() => setShowGrooming(!showGrooming)}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            {showGrooming ? 'Hide' : 'Show'} Details
          </button>
        </div>

        {!showGrooming && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <p className="text-red-900 font-medium mb-2">
              ⚠️ Grooming is a process predators use to gain trust and exploit children
            </p>
            <p className="text-red-700 text-sm">
              Understanding how grooming works can help you recognize warning signs and protect children.
              Click "Show Details" above to learn about the stages of online grooming.
            </p>
          </div>
        )}

        {showGrooming && (
          <div className="space-y-4">
            {groomingStages.map((stage, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`p-6 rounded-xl border-2 ${
                  index === 3 ? 'bg-red-50 border-red-300' :
                  index === 2 ? 'bg-orange-50 border-orange-300' :
                  index === 1 ? 'bg-yellow-50 border-yellow-300' :
                  'bg-blue-50 border-blue-300'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg ${
                    index === 3 ? 'bg-red-600' :
                    index === 2 ? 'bg-orange-600' :
                    index === 1 ? 'bg-yellow-600' :
                    'bg-blue-600'
                  }`}>
                    {stage.stage}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-bold text-lg text-slate-900">{stage.title}</h4>
                      <span className="text-sm text-slate-600">{stage.timeline}</span>
                    </div>
                    <p className="text-slate-700 mb-2">{stage.description}</p>
                    <div className={`text-sm font-medium ${
                      index === 3 ? 'text-red-700' :
                      index === 2 ? 'text-orange-700' :
                      index === 1 ? 'text-yellow-700' :
                      'text-blue-700'
                    }`}>
                      ⚠️ {stage.warning}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Action Steps */}
      <div className="bg-gradient-to-r from-green-600 to-teal-600 rounded-xl p-8 text-white">
        <div className="flex items-center gap-4 mb-6">
          <Shield className="w-12 h-12" />
          <div>
            <h3 className="text-2xl font-bold">Take Action Now</h3>
            <p className="text-green-100">Immediate steps to protect yourself or your child</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
            <h4 className="font-bold mb-3 flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              If You're a Kid
            </h4>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <span className="text-green-200">✓</span>
                <span>Stop responding if someone makes you uncomfortable</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-200">✓</span>
                <span>Take screenshots of the conversation</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-200">✓</span>
                <span>Tell a trusted adult immediately</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-200">✓</span>
                <span>Block and report the person</span>
              </li>
            </ul>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
            <h4 className="font-bold mb-3 flex items-center gap-2">
              <Users className="w-5 h-5" />
              If You're a Parent
            </h4>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <span className="text-green-200">✓</span>
                <span>Stay calm and don't blame your child</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-200">✓</span>
                <span>Document all evidence (screenshots, messages)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-200">✓</span>
                <span>Report to the platform and law enforcement if needed</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-200">✓</span>
                <span>Get professional help if your child is distressed</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Resources Section */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
        <h3 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
          <Lightbulb className="w-6 h-6 text-yellow-600" />
          Additional Resources
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-slate-50 rounded-lg">
            <h4 className="font-semibold mb-2">📞 Helplines</h4>
            <ul className="text-sm text-slate-700 space-y-1">
              <li>• National Center for Missing & Exploited Children: 1-800-843-5678</li>
              <li>• CyberTipline: www.cybertipline.com</li>
              <li>• Crisis Text Line: Text HOME to 741741</li>
            </ul>
          </div>
          <div className="p-4 bg-slate-50 rounded-lg">
            <h4 className="font-semibold mb-2">📚 Educational Websites</h4>
            <ul className="text-sm text-slate-700 space-y-1">
              <li>• Netsmartz.org</li>
              <li>• StopBullying.gov</li>
              <li>• Common Sense Media</li>
              <li>• FOSI (Family Online Safety Institute)</li>
            </ul>
          </div>
          <div className="p-4 bg-slate-50 rounded-lg">
            <h4 className="font-semibold mb-2">🛡️ Reporting Platforms</h4>
            <ul className="text-sm text-slate-700 space-y-1">
              <li>• Report abuse directly to social platforms</li>
              <li>• FBI Internet Crime Complaint Center</li>
              <li>• Local law enforcement</li>
              <li>• School administrators</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnlineSafetyEducation;
