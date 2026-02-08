import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { API_BASE } from '../config';

interface RecycleMapViewProps {
  onBack: () => void;
  analysisData: {
    items?: Array<{ name: string; materials?: string[]; confidence?: string }>;
    summary?: string;
  };
  location: {
    lat: number;
    lng: number;
  };
}

const RecycleMapView: React.FC<RecycleMapViewProps> = ({ onBack, analysisData, location }) => {
  const [zipCode, setZipCode] = useState<string | null>(null);
  const [mapUrl, setMapUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLocationAndMap = async () => {
      try {
        // First, get the ZIP code from coordinates
        const geocodeRes = await fetch(`${API_BASE}/api/ai/geocode`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ lat: location.lat, lng: location.lng })
        });

        if (!geocodeRes.ok) throw new Error('Failed to get location info');
        const geocodeData = await geocodeRes.json();
        setZipCode(geocodeData.zip);

        // Get primary material from analysis
        const primaryMaterial = analysisData.items?.[0]?.materials?.[0] || 'recycling';

        // Get nearby recycling centers map
        const mapRes = await fetch(
          `${API_BASE}/api/ai/nearby-recycling?lat=${location.lat}&lng=${location.lng}&material=${encodeURIComponent(primaryMaterial)}&zip=${geocodeData.zip}`
        );

        if (!mapRes.ok) throw new Error('Failed to load map');
        const mapData = await mapRes.json();
        setMapUrl(mapData.mapEmbedUrl);
        setLoading(false);
      } catch (err) {
        console.error('Error loading map:', err);
        setError(err instanceof Error ? err.message : 'Failed to load recycling locations');
        setLoading(false);
      }
    };

    fetchLocationAndMap();
  }, [location.lat, location.lng, analysisData.items]);

  return (
    <div className="relative min-h-screen flex flex-col p-6">
      <div className="flex justify-between items-center mb-6">
        <button 
          onClick={onBack}
          className="flex items-center space-x-2 text-white/60 hover:text-white transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
          </svg>
          <span className="uppercase text-sm tracking-widest font-bold font-mono">Back to Scanner</span>
        </button>
        <div className="flex flex-col items-end">
          <div className="text-green-400 font-mono text-xs">
            {zipCode ? `ZIP: ${zipCode}` : 'LOCATING...'}
          </div>
          <div className="text-[8px] text-white/20 uppercase tracking-widest">Recycling Locator v1.0</div>
        </div>
      </div>

      {/* Analysis Summary */}
      {analysisData.items && analysisData.items.length > 0 && (
        <div className="mb-6 rounded-2xl border border-green-400/20 bg-black/40 p-4 backdrop-blur-sm">
          <div className="text-xs text-green-400 font-mono mb-2 uppercase">Detected Items:</div>
          <div className="space-y-2">
            {analysisData.items.map((item, idx) => (
              <div key={idx} className="text-sm text-white/80">
                <span className="text-green-300 font-bold">{item.name}</span>
                {item.materials && item.materials.length > 0 && (
                  <span className="text-white/60 ml-2">
                    ({item.materials.join(', ')})
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Map Container */}
      <div className="flex-1 relative rounded-[40px] overflow-hidden border-2 border-green-400/30 glow-green bg-black min-h-[500px]">
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-green-400 font-mono text-sm animate-pulse">
              🌍 SCANNING FOR RECYCLING FACILITIES...
            </div>
          </div>
        ) : error ? (
          <div className="absolute inset-0 flex items-center justify-center text-center p-8">
            <div className="text-red-400 font-mono text-sm">{error}</div>
          </div>
        ) : mapUrl ? (
          <iframe
            src={mapUrl}
            className="absolute inset-0 w-full h-full"
            style={{ border: 0 }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-white/60 font-mono text-sm">No map available</div>
          </div>
        )}
      </div>

      {/* Location Info Footer */}
      <div className="mt-6 flex justify-between items-center text-xs font-mono">
        <div className="text-white/40">
          <span className="text-green-400">LAT:</span> {location.lat.toFixed(4)} 
          <span className="text-green-400 ml-4">LNG:</span> {location.lng.toFixed(4)}
        </div>
        {zipCode && (
          <div className="text-white/60">
            <span className="text-green-400">Area:</span> {zipCode}
          </div>
        )}
      </div>
    </div>
  );
};

export default RecycleMapView;
