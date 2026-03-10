'use client';

import { useShadow } from '@/lib/shadow-context';
import { motion } from 'framer-motion';
import { MapPin, Camera, Users, Globe, Image as ImageIcon } from 'lucide-react';

export function ShadowVisualizer() {
  const { shadowSize, dataCategories, getSeverity } = useShadow();
  const severity = getSeverity();

  const severityConfig = {
    low: { color: 'bg-green-500', label: 'Low Risk', textColor: 'text-green-400', shadowColor: 'shadow-green-500/50' },
    medium: { color: 'bg-yellow-500', label: 'Medium Risk', textColor: 'text-yellow-400', shadowColor: 'shadow-yellow-500/50' },
    high: { color: 'bg-red-500', label: 'High Risk', textColor: 'text-red-400', shadowColor: 'shadow-red-500/50' },
  }[severity];

  return (
    <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 shadow-xl">
      <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <span>👻</span>
        <span>Your Digital Twin</span>
      </h2>

      {/* Twin Display */}
      <div className="flex items-center justify-center py-12 relative">
        {/* Glow effect */}
        <div className={`absolute inset-0 bg-gradient-radial from-purple-500/20 via-transparent to-transparent animate-pulse-slow`} />

        <motion.div
          className={`relative rounded-full ${severityConfig.color} opacity-30 blur-xl shadow-2xl ${severityConfig.shadowColor}`}
          animate={{
            scale: 1 + (shadowSize / 100),
          }}
          transition={{
            type: 'spring',
            stiffness: 100,
            damping: 15,
          }}
          style={{
            width: 200,
            height: 200,
          }}
        />

        {/* Center icon */}
        <motion.div
          className="absolute text-6xl"
          animate={{ y: [0, -8, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        >
          👻
        </motion.div>
      </div>

      {/* Stats */}
      <div className="text-center mt-6">
        <motion.div
          className={`text-6xl font-bold ${severityConfig.textColor}`}
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 0.5, repeat: Infinity }}
        >
          {shadowSize.toFixed(0)}%
        </motion.div>
        <div className="text-slate-400 mt-2 text-lg">Digital Footprint</div>
        <div className={`inline-block px-4 py-2 rounded-full ${severityConfig.color} text-white font-semibold mt-4`}>
          {severityConfig.label}
        </div>
      </div>

      {/* Data Categories */}
      <div className="mt-8 space-y-3">
        <h3 className="font-semibold text-slate-300 text-lg">Data Categories:</h3>
        <CategoryBar
          label="Location"
          value={dataCategories.location}
          icon={<MapPin className="w-4 h-4" />}
          color="bg-red-500"
        />
        <CategoryBar
          label="Identity"
          value={dataCategories.identity}
          icon={<Camera className="w-4 h-4" />}
          color="bg-purple-500"
        />
        <CategoryBar
          label="Contacts"
          value={dataCategories.contacts}
          icon={<Users className="w-4 h-4" />}
          color="bg-pink-500"
        />
        <CategoryBar
          label="Browsing"
          value={dataCategories.browsing}
          icon={<Globe className="w-4 h-4" />}
          color="bg-orange-500"
        />
        <CategoryBar
          label="Media"
          value={dataCategories.media}
          icon={<ImageIcon className="w-4 h-4" />}
          color="bg-green-500"
        />
      </div>
    </div>
  );
}

interface CategoryBarProps {
  label: string;
  value: number;
  icon: React.ReactNode;
  color: string;
}

function CategoryBar({ label, value, icon, color }: CategoryBarProps) {
  return (
    <div className="flex items-center gap-3">
      <span className="w-28 flex items-center gap-2 text-slate-300 text-sm">
        {icon}
        <span>{label}</span>
      </span>
      <div className="flex-1 bg-slate-700 rounded-full h-3 overflow-hidden">
        <motion.div
          className={`h-full ${color}`}
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(value, 100)}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </div>
      <span className="text-sm text-slate-400 w-12 text-right">{value.toFixed(0)}%</span>
    </div>
  );
}
