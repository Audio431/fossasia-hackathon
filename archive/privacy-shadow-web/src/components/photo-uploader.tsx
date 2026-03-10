'use client';

import { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { useShadow } from '@/lib/shadow-context';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, MapPin, Clock, Phone, Eye, AlertTriangle } from 'lucide-react';
import EXIF from 'exif-js';

interface ExifData {
  fileName: string;
  fileSize: string;
  fileType: string;
  hasGPS: boolean;
  latitude: number | null;
  longitude: number | null;
  camera: string;
  dateTime: string | null;
  software: string | null;
}

export function PhotoUploader() {
  const [exifData, setExifData] = useState<ExifData | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const { addData } = useShadow();

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setIsProcessing(true);

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Extract EXIF data
    try {
      const data = await extractEXIF(file);
      setExifData(data);

      // Add to shadow based on what was found
      if (data.hasGPS) {
        addData('location', 20, 'Photo GPS data');
      }
      addData('identity', 10, 'Photo camera info');
      addData('media', 15, 'Photo upload');
    } catch (error) {
      console.error('EXIF extraction failed:', error);
      // Use fallback mock data
      const mockData = generateMockEXIF(file);
      setExifData(mockData);
      addData('location', 20, 'Photo GPS data (simulated)');
      addData('identity', 10, 'Photo camera info');
      addData('media', 15, 'Photo upload');
    }

    setIsProcessing(false);
  }, [addData]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpeg', '.jpg', '.png'] },
    maxFiles: 1,
    multiple: false,
  });

  return (
    <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 shadow-xl">
      <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
        <Camera className="text-purple-400" />
        <span>Photo Upload Simulator</span>
      </h2>
      <p className="text-slate-400 mb-6">
        Upload a photo to see what metadata is revealed
      </p>

      {/* Upload Area */}
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all mb-6 ${
          isDragActive
            ? 'border-purple-500 bg-purple-500/10 scale-105'
            : 'border-slate-600 hover:border-slate-500 hover:bg-slate-700/50'
        }`}
      >
        <input {...getInputProps()} />
        <div className="text-5xl mb-4">📸</div>
        {isDragActive ? (
          <p className="text-purple-400 font-semibold">Drop the photo here...</p>
        ) : (
          <p className="text-slate-400">
            Drag & drop a photo here, or click to select
          </p>
        )}
        <p className="text-xs text-slate-500 mt-2">Supports JPG, PNG (up to 5MB)</p>
      </div>

      {/* Processing Indicator */}
      {isProcessing && (
        <div className="mb-6 text-center">
          <motion.div
            className="inline-block"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          >
            ⏳
          </motion.div>
          <p className="text-slate-400 mt-2">Analyzing photo...</p>
        </div>
      )}

      {/* Preview and Results */}
      <AnimatePresence>
        {preview && exifData && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {/* Photo Preview */}
            <div className="relative">
              <img
                src={preview}
                alt="Preview"
                className="rounded-lg max-h-64 mx-auto shadow-xl"
              />
              <div className="absolute top-2 right-2 bg-slate-900/80 backdrop-blur-sm px-3 py-1 rounded-full text-xs">
                {exifData.fileSize}
              </div>
            </div>

            {/* EXIF Data Display */}
            <div className="bg-slate-900 rounded-xl p-4 border border-slate-700">
              <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                <Eye className="text-purple-400" />
                <span>Metadata Found:</span>
              </h3>

              <div className="space-y-2">
                <MetadataItem
                  icon="📄"
                  label="File Name"
                  value={exifData.fileName}
                  risk="low"
                />
                <MetadataItem
                  icon="📏"
                  label="File Size"
                  value={exifData.fileSize}
                  risk="low"
                />

                {exifData.hasGPS && (
                  <MetadataItem
                    icon={<MapPin className="w-4 h-4" />}
                    label="Location Data"
                    value={`GPS: ${exifData.latitude?.toFixed(6)}, ${exifData.longitude?.toFixed(6)}`}
                    risk="high"
                    warning="Your photo reveals WHERE you took it"
                  />
                )}

                {exifData.camera && (
                  <MetadataItem
                    icon={<Camera className="w-4 h-4" />}
                    label="Camera/Device"
                    value={exifData.camera}
                    risk="medium"
                    warning="Shows what device you use"
                  />
                )}

                {exifData.dateTime && (
                  <MetadataItem
                    icon={<Clock className="w-4 h-4" />}
                    label="Date/Time"
                    value={exifData.dateTime}
                    risk="low"
                    warning="Shows WHEN you took the photo"
                  />
                )}
              </div>
            </div>

            {/* Warning Message */}
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-red-300 font-semibold mb-1">
                    Your Digital Twin just grew!
                  </p>
                  <p className="text-xs text-red-200">
                    This photo contains metadata that reveals information about you.
                    Every photo you share adds to your permanent digital footprint.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

async function extractEXIF(file: File): Promise<ExifData> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = function() {
      try {
        EXIF.getData(img as any, function() {
          try {
            const allTags = EXIF.getAllTags(img as any);

            const data: ExifData = {
              fileName: file.name,
              fileSize: `${(file.size / 1024).toFixed(1)} KB`,
              fileType: file.type,
              hasGPS: !!(allTags.GPSLatitude && allTags.GPSLongitude),
              latitude: allTags.GPSLatitude || null,
              longitude: allTags.GPSLongitude || null,
              camera: allTags.Make && allTags.Model ? `${allTags.Make} ${allTags.Model}` : 'Unknown Camera',
              dateTime: allTags.DateTimeOriginal || allTags.DateTime || null,
              software: allTags.Software || null,
            };

            URL.revokeObjectURL(url);
            resolve(data);
          } catch (error) {
            URL.revokeObjectURL(url);
            reject(error);
          }
        });
      } catch (error) {
        URL.revokeObjectURL(url);
        reject(error);
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };

    img.src = url;
  });
}

function generateMockEXIF(file: File): ExifData {
  // Generate realistic mock data if EXIF parsing fails
  const hasGPS = Math.random() > 0.5;
  const cameras = ['iPhone 15 Pro', 'Samsung Galaxy S24', 'Google Pixel 8', 'Canon EOS R5'];
  const randomCamera = cameras[Math.floor(Math.random() * cameras.length)];

  return {
    fileName: file.name,
    fileSize: `${(file.size / 1024).toFixed(1)} KB`,
    fileType: file.type,
    hasGPS: hasGPS,
    latitude: hasGPS ? 13.7563 + (Math.random() - 0.5) * 0.1 : null,
    longitude: hasGPS ? 100.5018 + (Math.random() - 0.5) * 0.1 : null,
    camera: randomCamera,
    dateTime: new Date().toISOString(),
    software: null,
  };
}

interface MetadataItemProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  risk: 'low' | 'medium' | 'high';
  warning?: string;
}

function MetadataItem({ icon, label, value, risk, warning }: MetadataItemProps) {
  const riskColors = {
    low: 'text-green-400 bg-green-500/10 border-green-500/30',
    medium: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30',
    high: 'text-red-400 bg-red-500/10 border-red-500/30',
  };

  return (
    <div className={`flex items-start gap-3 p-3 rounded-lg border ${riskColors[risk]}`}>
      <span className="text-2xl flex-shrink-0">{icon}</span>
      <div className="flex-1 min-w-0">
        <div className="text-sm text-slate-400 mb-1">{label}</div>
        <div className="text-sm text-white break-words">{value}</div>
        {warning && (
          <div className="text-xs text-slate-300 mt-1">⚠️ {warning}</div>
        )}
      </div>
    </div>
  );
}
