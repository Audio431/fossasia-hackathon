'use client';

import { useState } from 'react';
import { Search, Lock, Eye, MapPin, Users, Camera, Phone, Info, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Permission {
  id: string;
  technical: string;
  simple: string;
  riskLevel: 1 | 2 | 3;
  whatItMeans: string;
  whyTheyNeedIt: string;
  whenToDeny: string;
  icon: React.ReactNode;
}

export function PrivacyTranslator() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPermission, setSelectedPermission] = useState<Permission | null>(null);

  const permissions: Permission[] = [
    {
      id: 'location-fine',
      technical: 'ACCESS_FINE_LOCATION',
      simple: 'See your exact location',
      riskLevel: 3,
      whatItMeans: 'This app can see where you are right now, accurate to within a few meters. It can track your movements in real-time.',
      whyTheyNeedIt: 'Navigation apps need this for directions. Weather apps use it for local forecasts. Some apps use it to find things near you.',
      whenToDeny: 'If the app doesn\'t need to know where you are (calculator, game, reading app), deny it.',
      icon: <MapPin className="w-5 h-5" />,
    },
    {
      id: 'location-coarse',
      technical: 'ACCESS_COARSE_LOCATION',
      simple: 'See your approximate location',
      riskLevel: 2,
      whatItMeans: 'This app can see what city/neighborhood you\'re in, but not your exact address. It\'s roughly accurate to within a few city blocks.',
      whyTheyNeedIt: 'Weather apps, local news, and apps that show content for your area. More privacy-friendly than exact location.',
      whenToDeny: 'If the app works fine without knowing your region at all.',
      icon: <MapPin className="w-5 h-5" />,
    },
    {
      id: 'read-contacts',
      technical: 'READ_CONTACTS',
      simple: 'See who your friends are',
      riskLevel: 3,
      whatItMeans: 'This app can see all your contacts\' names, phone numbers, email addresses, and other information. It can see your entire social network.',
      whyTheyNeedIt: 'Social apps and messaging apps use this to help you connect with friends. Communication apps need it to function.',
      whenToDeny: 'Be VERY careful granting this. Most apps don\'t genuinely need your entire contact list.',
      icon: <Users className="w-5 h-5" />,
    },
    {
      id: 'read-storage',
      technical: 'READ_EXTERNAL_STORAGE',
      simple: 'Look at your files and photos',
      riskLevel: 3,
      whatItMeans: 'This app can see all your photos, videos, documents, and files stored on your device. It can scan your entire media library.',
      whyTheyNeedIt: 'Photo editors, file managers, and gallery apps need this to function. Backup apps use this to protect your data.',
      whenToDeny: 'If the app isn\'t specifically for managing or editing files/photos.',
      icon: <Eye className="w-5 h-5" />,
    },
    {
      id: 'camera',
      technical: 'CAMERA',
      simple: 'Take photos and videos',
      riskLevel: 2,
      whatItMeans: 'This app can use your camera to take pictures and record video through your device\'s camera.',
      whyTheyNeedIt: 'Camera apps, video chat apps (like Zoom/Skype), and apps that let you post photos.',
      whenToDeny: 'If the app doesn\'t involve taking photos or video.',
      icon: <Camera className="w-5 h-5" />,
    },
    {
      id: 'phone-state',
      technical: 'READ_PHONE_STATE',
      simple: 'Know if you\'re on a call',
      riskLevel: 2,
      whatItMeans: 'This app can see your phone number and whether you\'re currently on a phone call. It can also read your device information.',
      whyTheyNeedIt: 'Apps need this to pause audio/video when you get a phone call. Some dialer apps use it.',
      whenToDeny: 'Most apps don\'t genuinely need this information.',
      icon: <Phone className="w-5 h-5" />,
    },
  ];

  const filteredPermissions = permissions.filter(permission =>
    permission.technical.toLowerCase().includes(searchQuery.toLowerCase()) ||
    permission.simple.toLowerCase().includes(searchQuery.toLowerCase()) ||
    permission.whatItMeans.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getRiskConfig = (level: number) => {
    if (level === 1) return {
      color: 'text-green-400',
      bgColor: 'bg-green-500/10',
      borderColor: 'border-green-500/30',
      label: 'Low Risk',
    };
    if (level === 2) return {
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-500/10',
      borderColor: 'border-yellow-500/30',
      label: 'Medium Risk',
    };
    return {
      color: 'text-red-400',
      bgColor: 'bg-red-500/10',
      borderColor: 'border-red-500/30',
      label: 'High Risk',
    };
  };

  return (
    <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 shadow-xl">
      <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
        <span>🔍</span>
        <span>Privacy Translator</span>
      </h2>
      <p className="text-slate-400 mb-6">
        Translate confusing permission requests into plain English
      </p>

      {/* Search Bar */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
        <input
          type="text"
          placeholder="Search permissions (e.g., 'location', 'contacts', 'camera')..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-3 bg-slate-900 border border-slate-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white placeholder:text-slate-500"
        />
      </div>

      {/* Permission List */}
      <div className="grid gap-3 mb-6">
        {filteredPermissions.map((permission, index) => {
          const config = getRiskConfig(permission.riskLevel);
          return (
            <motion.div
              key={permission.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => setSelectedPermission(
                selectedPermission?.id === permission.id ? null : permission
              )}
              className={`p-4 rounded-lg border transition-all cursor-pointer ${
                selectedPermission?.id === permission.id
                  ? 'bg-slate-700 border-purple-500'
                  : 'bg-slate-900 border-slate-700 hover:border-slate-600'
              }`}
            >
              <div className="flex items-start gap-4">
                <div className={`p-2 rounded-lg ${config.bgColor} ${config.borderColor} border`}>
                  {permission.icon}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-white font-medium">{permission.simple}</span>
                    <span className={`text-xs px-2 py-0.5 rounded ${config.bgColor} ${config.color} ${config.borderColor} border`}>
                      {config.label}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 font-mono mb-2">{permission.technical}</p>
                </div>
              </div>

              {/* Expanded View */}
              <AnimatePresence>
                {selectedPermission?.id === permission.id && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-3 pt-3 border-t border-slate-600 space-y-3"
                  >
                    <div className="flex items-start gap-2">
                      <Info className="text-purple-400 flex-shrink-0 w-4 h-4 mt-0.5" />
                      <div>
                        <p className="text-sm text-purple-300 font-semibold">What it means:</p>
                        <p className="text-xs text-slate-300">{permission.whatItMeans}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2">
                      <Lock className="text-green-400 flex-shrink-0 w-4 h-4 mt-0.5" />
                      <div>
                        <p className="text-sm text-green-300 font-semibold">When apps might need it:</p>
                        <p className="text-xs text-slate-300">{permission.whyTheyNeedIt}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2">
                      <AlertTriangle className="text-red-400 flex-shrink-0 w-4 h-4 mt-0.5" />
                      <div>
                        <p className="text-sm text-red-300 font-semibold">When to deny it:</p>
                        <p className="text-xs text-slate-300">{permission.whenToDeny}</p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>

      {filteredPermissions.length === 0 && (
        <div className="text-center py-12 text-slate-500">
          <p className="text-lg">No permissions found matching "{searchQuery}"</p>
          <p className="text-sm mt-2">Try searching for "location", "contacts", or "camera"</p>
        </div>
      )}

      {/* Tips */}
      <div className="mt-6 p-4 bg-slate-900 rounded-lg border border-slate-700">
        <p className="text-sm text-slate-300 font-semibold mb-2">💡 Pro Tips:</p>
        <ul className="text-xs text-slate-400 space-y-1">
          <li>• If an app asks for permissions you don't understand, deny it and see if it still works</li>
          <li>• "Need" ≠ "Want" - apps often ask for more than they need</li>
          <li>• You can always grant permissions later if the app won't work without them</li>
          <li>• Regularly audit your app permissions in your device settings</li>
        </ul>
      </div>
    </div>
  );
}
