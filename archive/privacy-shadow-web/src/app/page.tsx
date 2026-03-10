'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { useShadow } from '@/lib/shadow-context';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { useSound } from '@/hooks/useSound';

// Import all components
import { ShadowVisualizer } from '@/components/shadow-visualizer';
import { DataBreakdown } from '@/components/data-breakdown';
import { ParticleSystem } from '@/components/particle-system';
import { DigitalTwin3D } from '@/components/3d-twin';
import { PhotoUploader } from '@/components/photo-uploader';
import { FormFiller } from '@/components/form-filler';
import { SocialRisks } from '@/components/social-risks';
import { PrivacyTranslator } from '@/components/privacy-translator';
import { TwinShrinker } from '@/components/twin-shrinker';
import { InteractiveMap } from '@/components/interactive-map';
import { DataBreachSimulator } from '@/components/data-breach';
import { SpotTheRisk } from '@/components/spot-the-risk';
import { DataCharts } from '@/components/data-charts';

export default function Home() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'photo' | 'form' | 'social' | 'translator' | 'shrinker' | 'map' | 'breach' | 'game'>('dashboard');
  const { shadowSize, dataCategories, getSeverity, history, addData } = useShadow();
  const { playSound } = useSound();
  const severity = getSeverity();
  const [konamiActivated, setKonamiActivated] = useState(false);
  // Track which tabs have been visited to fire a one-time data exposure event
  const visitedTabs = useRef(new Set<string>(['dashboard']));

  // Konami Code: ↑ ↑ ↓ ↓ ← → ← → B A
  useEffect(() => {
    const konamiCode = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'KeyB', 'KeyA'];
    let currentIndex = 0;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === konamiCode[currentIndex]) {
        currentIndex++;
        if (currentIndex === konamiCode.length) {
          setKonamiActivated(true);
          playSound('achievement');

          // Reset after 5 seconds
          setTimeout(() => setKonamiActivated(false), 5000);
          currentIndex = 0;
        }
      } else {
        currentIndex = 0;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [playSound]);

  // Extract location data from history for the map — seeded by event ID to avoid re-randomizing on render
  const locationData = useMemo(() => {
    return history
      .filter(event => event.category === 'location' && event.type === 'add')
      .map(event => {
        // Derive stable pseudo-random offset from the event ID instead of Math.random()
        const seed = parseInt(event.id.replace(/\D/g, '').slice(0, 8), 10) || 0;
        const latOffset = ((seed % 1000) / 1000 - 0.5) * 0.1;
        const lngOffset = (((seed >> 3) % 1000) / 1000 - 0.5) * 0.1;
        return {
          latitude: 13.7563 + latOffset,
          longitude: 100.5018 + lngOffset,
          timestamp: event.timestamp.toLocaleString(),
          source: event.source,
        };
      });
  }, [history]);

  // Data exposure events fired on first visit to each tab
  const TAB_EXPOSURE: Partial<Record<typeof activeTab, { category: Parameters<typeof addData>[0]; amount: number; source: string }>> = {
    photo:      { category: 'location', amount: 12, source: '📸 Photo GPS detected' },
    form:       { category: 'identity', amount: 15, source: '📝 Form data captured' },
    social:     { category: 'contacts', amount: 18, source: '👥 Friend tagged you in a photo' },
    map:        { category: 'location', amount: 8,  source: '🗺️ Location history visualized' },
    breach:     { category: 'browsing', amount: 10, source: '🛡️ Breach data matched your profile' },
    game:       { category: 'identity', amount: 5,  source: '🕵️ Risk patterns identified' },
  };

  const handleTabChange = (tab: typeof activeTab) => {
    playSound('whoosh');
    playSound('click');
    setActiveTab(tab);
    // First-visit passive data exposure — makes the twin grow just from exploring
    if (!visitedTabs.current.has(tab)) {
      visitedTabs.current.add(tab);
      const exposure = TAB_EXPOSURE[tab];
      if (exposure) {
        addData(exposure.category, exposure.amount, exposure.source);
      }
    }
  };

  const severityConfig = {
    low: { color: 'bg-green-500', label: 'Low Risk', textColor: 'text-green-400' },
    medium: { color: 'bg-yellow-500', label: 'Medium Risk', textColor: 'text-yellow-400' },
    high: { color: 'bg-red-500', label: 'High Risk', textColor: 'text-red-400' },
  }[severity];

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      {/* Konami Code Easter Egg Effect */}
      {konamiActivated && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center bg-gradient-to-br from-purple-600/30 via-pink-600/30 to-blue-600/30"
        >
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, rotate: 180 }}
            className="text-center"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="text-9xl mb-4"
            >
              🎮
            </motion.div>
            <motion.h2
              className="text-4xl font-bold bg-gradient-to-r from-yellow-400 via-pink-400 to-purple-400 bg-clip-text text-transparent"
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 0.5, repeat: Infinity }}
            >
              KONAMI CODE ACTIVATED!
            </motion.h2>
            <p className="text-white text-lg mt-2">🌟 You found the secret! 🌟</p>
            <p className="text-white/70 text-sm mt-4">+∞ Privacy Points</p>
          </motion.div>
        </motion.div>
      )}

      {/* Animated background particles */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className={`absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(139,92,246,0.1),transparent_50%)] ${konamiActivated ? 'animate-pulse-fast' : 'animate-pulse-slow'}`} />
      </div>

      {/* Header */}
      <header className="border-b border-slate-700 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
                👻 Privacy Shadow
              </h1>
              <p className="text-slate-400 text-sm mt-1">Meet Your Digital Twin</p>
            </div>
            <div className="flex items-center gap-2">
              <Sparkles className="text-purple-400 animate-pulse" />
              <span className="text-sm text-slate-400">Live Demo</span>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="border-b border-slate-700 bg-slate-800/50 backdrop-blur-sm">
        <div className="container mx-auto px-4">
          <div className="flex gap-2 py-3 overflow-x-auto scrollbar-thin">
            <TabButton
              active={activeTab === 'dashboard'}
              onClick={() => handleTabChange('dashboard')}
              icon="📊"
            >
              Dashboard
            </TabButton>
            <TabButton
              active={activeTab === 'photo'}
              onClick={() => handleTabChange('photo')}
              icon="📸"
            >
              Photo Upload
            </TabButton>
            <TabButton
              active={activeTab === 'form'}
              onClick={() => handleTabChange('form')}
              icon="📝"
            >
              Form Filler
            </TabButton>
            <TabButton
              active={activeTab === 'social'}
              onClick={() => handleTabChange('social')}
              icon="👥"
            >
              Social Risks
            </TabButton>
            <TabButton
              active={activeTab === 'translator'}
              onClick={() => handleTabChange('translator')}
              icon="🔍"
            >
              Translator
            </TabButton>
            <TabButton
              active={activeTab === 'map'}
              onClick={() => handleTabChange('map')}
              icon="🗺️"
            >
              Map
            </TabButton>
            <TabButton
              active={activeTab === 'breach'}
              onClick={() => handleTabChange('breach')}
              icon="🛡️"
            >
              Breach Sim
            </TabButton>
            <TabButton
              active={activeTab === 'game'}
              onClick={() => handleTabChange('game')}
              icon="🕵️"
            >
              Spot the Risk
            </TabButton>
            <TabButton
              active={activeTab === 'shrinker'}
              onClick={() => handleTabChange('shrinker')}
              icon="✂️"
            >
              Twin Diet
            </TabButton>
          </div>
        </div>
      </nav>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        {activeTab === 'dashboard' && (
          <div className="space-y-8">
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <span>👻</span>
                  <span>Your 3D Digital Twin</span>
                </h3>
                <DigitalTwin3D exposure={shadowSize} dataCategories={dataCategories} />
              </div>
              <ParticleSystem dataCategories={dataCategories} />
            </div>
            <DataCharts dataCategories={dataCategories} shadowSize={shadowSize} history={history} />
            <div className="grid md:grid-cols-2 gap-8">
              <ShadowVisualizer />
              <DataBreakdown />
            </div>
          </div>
        )}
        {activeTab === 'photo' && <PhotoUploader />}
        {activeTab === 'form' && <FormFiller />}
        {activeTab === 'social' && <SocialRisks />}
        {activeTab === 'translator' && <PrivacyTranslator />}
        {activeTab === 'map' && <InteractiveMap locations={locationData} />}
        {activeTab === 'breach' && <DataBreachSimulator />}
        {activeTab === 'game' && <SpotTheRisk />}
        {activeTab === 'shrinker' && <TwinShrinker />}
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-700 bg-slate-900/50 mt-16 py-8">
        <div className="container mx-auto px-4 text-center text-slate-400 text-sm">
          <p>Built with ❤️ for FOSSASIA Hackathon 2026</p>
          <p className="mt-2">Zero data collection. Privacy by design.</p>
          <p className="mt-2">
            <a href="https://github.com/privacy-shadow" className="text-purple-400 hover:text-purple-300">
              GitHub
            </a>
          </p>
        </div>
      </footer>
    </main>
  );
}

function TabButton({
  active,
  onClick,
  children,
  icon,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  icon: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-3 min-h-[44px] rounded-lg whitespace-nowrap transition-all flex items-center gap-2 ${
        active
          ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/50'
          : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700 hover:text-white'
      }`}
    >
      <span className="text-lg">{icon}</span>
      <span>{children}</span>
    </button>
  );
}
