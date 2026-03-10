'use client';

import { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { MapPin, AlertCircle } from 'lucide-react';

interface LocationData {
  latitude: number;
  longitude: number;
  timestamp: string;
  source: string;
}

interface InteractiveMapProps {
  locations: LocationData[];
}

export function InteractiveMap({ locations }: InteractiveMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const [isClient, setIsClient] = useState(false);
  const [mapReady, setMapReady] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient || !mapRef.current || locations.length === 0) return;

    const initializeMap = async () => {
      try {
        // Dynamically import Leaflet to avoid SSR issues
        const L = await import('leaflet');

        // Fix for default marker icons in Next.js
        delete (L.Icon.Default.prototype as any)._getIconUrl;
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
          iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
          shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
        });

        // Clear previous map instance
        if (mapInstanceRef.current) {
          mapInstanceRef.current.remove();
        }

        // Create new map instance
        const map = L.map(mapRef.current!).setView(
          [locations[0].latitude, locations[0].longitude],
          13
        );

        // Add tile layer with a dark theme
        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
          subdomains: 'abcd',
          maxZoom: 20
        }).addTo(map);

        // Add markers for each location
        locations.forEach((location, index) => {
          const marker = L.marker([location.latitude, location.longitude]).addTo(map);

          // Create popup with location info
          const popupContent = `
            <div style="color: #1a202c; min-width: 200px;">
              <h3 style="margin: 0 0 8px 0; font-weight: bold; font-size: 14px;">
                📍 Location ${index + 1}
              </h3>
              <p style="margin: 4px 0; font-size: 12px;">
                <strong>Lat:</strong> ${location.latitude.toFixed(6)}<br/>
                <strong>Lng:</strong> ${location.longitude.toFixed(6)}
              </p>
              <p style="margin: 4px 0; font-size: 11px; color: #718096;">
                <strong>Source:</strong> ${location.source}<br/>
                <strong>Time:</strong> ${location.timestamp}
              </p>
            </div>
          `;

          marker.bindPopup(popupContent);
        });

        // Fit bounds to show all markers
        if (locations.length > 1) {
          const bounds = L.latLngBounds(
            locations.map(loc => [loc.latitude, loc.longitude])
          );
          map.fitBounds(bounds, { padding: [50, 50] });
        }

        mapInstanceRef.current = map;
        setMapReady(true);
      } catch (error) {
        console.error('Failed to initialize map:', error);
      }
    };

    initializeMap();

    // Cleanup
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [isClient, locations]);

  if (!isClient) {
    return (
      <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 shadow-xl">
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
          <MapPin className="text-red-400" />
          <span>Location Map</span>
        </h2>
        <div className="flex items-center justify-center py-12 text-slate-400">
          <div className="animate-pulse">Loading map...</div>
        </div>
      </div>
    );
  }

  if (locations.length === 0) {
    return (
      <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 shadow-xl">
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
          <MapPin className="text-red-400" />
          <span>Location Map</span>
        </h2>
        <div className="flex items-center justify-center py-12 text-slate-500">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="text-lg">No location data yet</p>
            <p className="text-sm mt-2">Upload a photo with GPS data to see it on the map</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-slate-800 rounded-xl p-6 border border-slate-700 shadow-xl"
    >
      <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
        <MapPin className="text-red-400" />
        <span>Location Map</span>
        {mapReady && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="ml-2 px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-full"
          >
            Live
          </motion.span>
        )}
      </h2>

      <div className="mb-4 p-3 bg-slate-900 rounded-lg border border-slate-700">
        <div className="flex items-center gap-2 text-sm">
          <AlertCircle className="text-red-400 w-4 h-4" />
          <span className="text-slate-300">
            Your photos have revealed <strong className="text-red-400">{locations.length}</strong> location(s)
          </span>
        </div>
      </div>

      <div
        ref={mapRef}
        className="rounded-lg overflow-hidden border border-slate-700"
        style={{ height: '400px', width: '100%' }}
      />

      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
        {locations.map((location, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="p-3 bg-slate-900 rounded-lg border border-slate-700"
          >
            <div className="flex items-start gap-3">
              <MapPin className="text-red-400 w-5 h-5 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-slate-300">
                  Location {index + 1}
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
                </div>
                <div className="text-xs text-slate-600 mt-1">
                  {location.source}
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
