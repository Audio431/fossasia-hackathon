'use client';

import { useState } from 'react';
import { useShadow } from '@/lib/shadow-context';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Mail, Phone, Calendar, School, AlertTriangle, Eye } from 'lucide-react';

interface FormField {
  name: string;
  label: string;
  type: string;
  placeholder: string;
  icon: React.ReactNode;
  riskLevel: 'low' | 'medium' | 'high';
  explanation: string;
}

export function FormFiller() {
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [capturedData, setCapturedData] = useState<string[]>([]);
  const [showDataPacket, setShowDataPacket] = useState(false);
  const { addData } = useShadow();

  const formFields: FormField[] = [
    {
      name: 'fullName',
      label: 'Full Name',
      type: 'text',
      placeholder: 'Enter your full name',
      icon: <User className="w-4 h-4" />,
      riskLevel: 'high',
      explanation: 'Identifies who you are',
    },
    {
      name: 'email',
      label: 'Email Address',
      type: 'email',
      placeholder: 'your.email@example.com',
      icon: <Mail className="w-4 h-4" />,
      riskLevel: 'high',
      explanation: 'Can be linked to your other accounts',
    },
    {
      name: 'phone',
      label: 'Phone Number',
      type: 'tel',
      placeholder: '+1 (555) 123-4567',
      icon: <Phone className="w-4 h-4" />,
      riskLevel: 'medium',
      explanation: 'Can be used to contact you directly',
    },
    {
      name: 'birthday',
      label: 'Birthday',
      type: 'date',
      placeholder: 'Select your birthday',
      icon: <Calendar className="w-4 h-4" />,
      riskLevel: 'medium',
      explanation: 'Reveals your age',
    },
    {
      name: 'school',
      label: 'School Name',
      type: 'text',
      placeholder: 'Your school name',
      icon: <School className="w-4 h-4" />,
      riskLevel: 'high',
      explanation: 'Reveals your location',
    },
  ];

  const handleInputChange = (name: string, value: string, field: FormField) => {
    setFormData(prev => ({ ...prev, [name]: value }));

    if (value && !capturedData.includes(name)) {
      setCapturedData(prev => [...prev, name]);

      // Add to shadow based on risk level
      const riskImpact = { low: 5, medium: 10, high: 15 };
      if (field.name === 'fullName' || field.name === 'school') {
        addData('identity', riskImpact[field.riskLevel], `Form: ${field.label}`);
      } else if (field.name === 'email' || field.name === 'phone') {
        addData('contacts', riskImpact[field.riskLevel], `Form: ${field.label}`);
      } else {
        addData('identity', riskImpact[field.riskLevel], `Form: ${field.label}`);
      }
    }
  };

  const resetForm = () => {
    setFormData({});
    setCapturedData([]);
    setShowDataPacket(false);
  };

  const riskColors = {
    low: 'text-green-400 bg-green-500/10 border-green-500/30',
    medium: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30',
    high: 'text-red-400 bg-red-500/10 border-red-500/30',
  };

  return (
    <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 shadow-xl">
      <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
        <span>📝</span>
        <span>Form Filler Simulator</span>
      </h2>
      <p className="text-slate-400 mb-6">
        Fill out this form to see what data gets captured in real-time
      </p>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Form */}
        <div>
          <h3 className="font-semibold mb-4 text-lg">Sample Registration Form</h3>
          <div className="space-y-4">
            {formFields.map(field => (
              <div key={field.name}>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  {field.label}
                </label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                    {field.icon}
                  </div>
                  <input
                    type={field.type}
                    value={formData[field.name] || ''}
                    onChange={e => handleInputChange(field.name, e.target.value, field)}
                    className="w-full pl-10 pr-3 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                    placeholder={field.placeholder}
                  />
                </div>

                {capturedData.includes(field.name) && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="mt-1 text-xs"
                  >
                    <span className={riskColors[field.riskLevel].split(' ')[0]}>
                      ⚠️ Captured
                    </span>
                    <span className="text-slate-400 ml-2">{field.explanation}</span>
                  </motion.div>
                )}
              </div>
            ))}
          </div>

          <div className="flex gap-2 mt-4">
            <button
              onClick={resetForm}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors text-sm"
            >
              Reset Form
            </button>
            <button
              onClick={() => setShowDataPacket(true)}
              disabled={capturedData.length === 0}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-slate-700 disabled:text-slate-500 disabled:cursor-not-allowed rounded-lg transition-colors text-sm"
            >
              Show Data Packet
            </button>
          </div>
        </div>

        {/* Data Packet Visualization */}
        <div>
          <h3 className="font-semibold mb-4 text-lg flex items-center gap-2">
            <Eye className="text-purple-400" />
            <span>Data Packet Created</span>
          </h3>

          {capturedData.length === 0 ? (
            <div className="bg-slate-900 rounded-lg p-6 border border-slate-700 text-center">
              <p className="text-slate-500 text-sm">Fill out the form to see what data is captured...</p>
              <p className="text-xs text-slate-600 mt-2">Your Digital Twin grows with each field</p>
            </div>
          ) : (
            <AnimatePresence mode="wait">
              {showDataPacket && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-slate-900 rounded-lg p-4 border border-slate-700"
                >
                  <div className="mb-3 pb-3 border-b border-slate-700">
                    <p className="text-xs text-slate-400 mb-1">DATA PACKET TRANSMITTED</p>
                    <p className="text-sm text-white font-semibold">{capturedData.length} fields captured</p>
                  </div>

                  <div className="space-y-2">
                    {capturedData.map(fieldName => {
                      const field = formFields.find(f => f.name === fieldName);
                      if (!field) return null;
                      return (
                        <motion.div
                          key={fieldName}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="flex items-center gap-3 p-2 bg-slate-800 rounded border border-slate-600"
                        >
                          <span className={`text-lg`}>{field.icon}</span>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm text-slate-300">{field.label}</div>
                            <div className="text-xs text-white break-words">{formData[fieldName]}</div>
                          </div>
                          <span className={`text-xs px-2 py-0.5 rounded ${riskColors[field.riskLevel].split(' ')[0]}`}>
                            {field.riskLevel}
                          </span>
                        </motion.div>
                      );
                    })}
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-700">
                    <p className="text-xs text-slate-400">
                      💡 <span className="text-purple-400">Remember:</span> This data packet will be stored by the service forever.
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          )}

          {/* Info Box */}
          <div className="mt-4 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertTriangle className="text-blue-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-blue-300 font-semibold mb-1">
                  Your Digital Twin grows with each field!
                </p>
                <p className="text-xs text-blue-200">
                  Every piece of information you enter adds to your permanent digital footprint.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
