
import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';

interface ScannerViewProps {
  onBack: () => void;
  onShowMap: (analysisData: any, location: { lat: number; lng: number }) => void;
}

const ScannerView: React.FC<ScannerViewProps> = ({ onBack, onShowMap }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const scanFrameRef = useRef<number | null>(null);
  const scanStartRef = useRef<number | null>(null);
  const barcodeCountsRef = useRef<Record<string, number>>({});
  const zxingStopRef = useRef<(() => void) | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(true);
  const [isBarcodeScanning, setIsBarcodeScanning] = useState(false);
  const [barcodeStatus, setBarcodeStatus] = useState<string | null>(null);
  const [barcodeResult, setBarcodeResult] = useState<string | null>(null);
  const [materialResult, setMaterialResult] = useState<string | null>(null);
  const [imageStatus, setImageStatus] = useState<string | null>(null);
  const [imageResult, setImageResult] = useState<string | null>(null);

  useEffect(() => {
    const startCamera = async () => {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'environment' } 
        });
        setStream(mediaStream);
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      } catch (err) {
        console.error("Error accessing camera:", err);
        setError("Failed to access camera. Please ensure permissions are granted.");
      }
    };

    startCamera();

    return () => {
      if (scanFrameRef.current) {
        cancelAnimationFrame(scanFrameRef.current);
      }
      if (zxingStopRef.current) {
        zxingStopRef.current();
      }
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const getMostFrequentBarcode = () => {
    const entries = Object.entries(barcodeCountsRef.current);
    if (entries.length === 0) return null;
    entries.sort((a, b) => b[1] - a[1]);
    return entries[0][0];
  };

  const fetchMaterialsForItem = async (itemName: string, itemDetails: string) => {
    const prompt = `Return ONLY valid JSON in this exact format: { "items": [ { "name": "...", "materials": ["..."], "confidence": "high" } ] }.\n\nItem: ${itemName}\nDetails: ${itemDetails}`;
    const response = await fetch('http://localhost:3000/api/ai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: prompt })
    });

    if (!response.ok) {
      throw new Error('Failed to get AI materials response');
    }

    const data = await response.json();
    return data.response as string;
  };

  const handleScanForBarcode = async () => {
    if (!videoRef.current) return;

    if (!('BarcodeDetector' in window)) {
      await handleZxingScan();
      return;
    }

    setIsBarcodeScanning(true);
    setBarcodeStatus('Scanning for barcode (10s)...');
    setBarcodeResult(null);
    setMaterialResult(null);
    barcodeCountsRef.current = {};
    scanStartRef.current = performance.now();

    const detector = new (window as any).BarcodeDetector({ formats: ['ean_13', 'upc_a', 'upc_e', 'ean_8'] });

    // Scan frames for 10 seconds and keep the most frequent barcode.
    const scanLoop = async () => {
      if (!videoRef.current) return;
      const now = performance.now();

      if (scanStartRef.current && now - scanStartRef.current > 10000) {
        setIsBarcodeScanning(false);
        const best = getMostFrequentBarcode();
        if (!best) {
          setBarcodeStatus('No barcode found. Try again with better lighting.');
          return;
        }

        setBarcodeResult(best);
        setBarcodeStatus(`Barcode locked: ${best}`);

        try {
          const lookupUrl = `http://localhost:3000/api/ai/upc-lookup?upc=${encodeURIComponent(best)}`;
          const upcRes = await fetch(lookupUrl);
          if (!upcRes.ok) throw new Error('UPC lookup failed');
          const upcData = await upcRes.json();
          const item = upcData.items && upcData.items[0];
          const itemName = item?.title || item?.description || item?.brand || 'unknown item';
          const itemDetails = item ? JSON.stringify(item) : 'No details found';

          const aiMaterials = await fetchMaterialsForItem(itemName, itemDetails);
          setMaterialResult(aiMaterials);
        } catch (err) {
          console.error('Barcode flow error:', err);
          setMaterialResult('Failed to fetch item materials.');
        }
        return;
      }

      try {
        const barcodes = await detector.detect(videoRef.current);
        barcodes.forEach((barcode: any) => {
          if (!barcode?.rawValue) return;
          const value = String(barcode.rawValue).trim();
          if (!value) return;
          barcodeCountsRef.current[value] = (barcodeCountsRef.current[value] || 0) + 1;
        });
      } catch (err) {
        console.error('Barcode detection error:', err);
      }

      scanFrameRef.current = requestAnimationFrame(scanLoop);
    };

    scanFrameRef.current = requestAnimationFrame(scanLoop);
  };

  const handleZxingScan = async () => {
    if (!videoRef.current) return;

    try {
      const zxing = await import('@zxing/browser');
      const reader = new (zxing as any).BrowserMultiFormatReader();

      setIsBarcodeScanning(true);
      setBarcodeStatus('Scanning for barcode (10s)...');
      setBarcodeResult(null);
      setMaterialResult(null);
      barcodeCountsRef.current = {};

      const controls = await reader.decodeFromVideoElement(
        videoRef.current,
        (result: any) => {
          if (!result) return;
          const value = String(result.getText ? result.getText() : result.text || result).trim();
          if (!value) return;
          barcodeCountsRef.current[value] = (barcodeCountsRef.current[value] || 0) + 1;
        }
      );

      zxingStopRef.current = () => {
        try {
          if (controls && typeof controls.stop === 'function') {
            controls.stop();
          }
          if (typeof reader.reset === 'function') {
            reader.reset();
          }
        } catch (_) {
          // Ignore cleanup errors
        }
      };

      setTimeout(async () => {
        setIsBarcodeScanning(false);
        if (zxingStopRef.current) {
          zxingStopRef.current();
        }

        const best = getMostFrequentBarcode();
        if (!best) {
          setBarcodeStatus('No barcode found. Try again with better lighting.');
          return;
        }

        setBarcodeResult(best);
        setBarcodeStatus(`Barcode locked: ${best}`);

        try {
          const lookupUrl = `http://localhost:3000/api/ai/upc-lookup?upc=${encodeURIComponent(best)}`;
          const upcRes = await fetch(lookupUrl);
          if (!upcRes.ok) throw new Error('UPC lookup failed');
          const upcData = await upcRes.json();
          const item = upcData.items && upcData.items[0];
          const itemName = item?.title || item?.description || item?.brand || 'unknown item';
          const itemDetails = item ? JSON.stringify(item) : 'No details found';

          const aiMaterials = await fetchMaterialsForItem(itemName, itemDetails);
          setMaterialResult(aiMaterials);
        } catch (err) {
          console.error('Barcode flow error:', err);
          setMaterialResult('Failed to fetch item materials.');
        }
      }, 10000);
    } catch (err) {
      console.error('ZXing init failed:', err);
      setBarcodeStatus('Failed to initialize barcode scanner.');
    }
  };

  const handleIdentifyItem = async () => {
    if (!videoRef.current) return;

    setImageStatus('Capturing image...');
    setImageResult(null);

    // Get user's location
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;

        const canvas = document.createElement('canvas');
        canvas.width = videoRef.current!.videoWidth || 1280;
        canvas.height = videoRef.current!.videoHeight || 720;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          setImageStatus('Failed to capture image.');
          return;
        }

        ctx.drawImage(videoRef.current!, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
        const base64 = dataUrl.split(',')[1];

        try {
          const response = await fetch('http://localhost:3000/api/ai/analyze-image', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              image: base64,
              lat: latitude,
              lng: longitude
            })
          });

          if (!response.ok) {
            throw new Error('Image analysis failed');
          }

          const data = await response.json();
          setImageStatus('Analysis complete. Opening map...');
          setImageResult(JSON.stringify(data.analysis, null, 2));
          
          // Navigate to map view with results
          setTimeout(() => {
            onShowMap(data.analysis, { lat: latitude, lng: longitude });
          }, 1000);
        } catch (err) {
          console.error('Analyze image error:', err);
          setImageStatus('Failed to analyze image.');
        }
      },
      (error) => {
        console.error('Geolocation error:', error);
        setImageStatus('Location access denied. Please enable location to find recycling centers.');
      }
    );
  };

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
          <span className="uppercase text-sm tracking-widest font-bold font-mono">Abort Mission</span>
        </button>
        <div className="flex flex-col items-end">
            <div className="text-green-400 font-mono text-xs animate-pulse">
                SCANNING_FOR_TRANSMUTABLES...
            </div>
            <div className="text-[8px] text-white/20 uppercase tracking-widest">Waverly Tech Mod v4.2</div>
        </div>
      </div>

      <div className="flex-1 relative rounded-[40px] overflow-hidden border-2 border-white/10 glow-green bg-black">
        {error ? (
          <div className="absolute inset-0 flex items-center justify-center text-center p-8 text-red-400 font-mono">
            {error}
          </div>
        ) : (
          <>
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              className="absolute inset-0 w-full h-full object-cover opacity-60 grayscale-[0.5] contrast-125"
            />
            {/* HUD Overlay */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div className="w-72 h-72 border border-green-500/20 relative">
                <div className="absolute -top-1 -left-1 w-8 h-8 border-t-2 border-l-2 border-green-400" />
                <div className="absolute -top-1 -right-1 w-8 h-8 border-t-2 border-r-2 border-green-400" />
                <div className="absolute -bottom-1 -left-1 w-8 h-8 border-b-2 border-l-2 border-green-400" />
                <div className="absolute -bottom-1 -right-1 w-8 h-8 border-b-2 border-r-2 border-green-400" />
                
                {/* Crosshairs */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 border border-white/20 rounded-full" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 w-[1px] h-10 bg-white/10" />
                <div className="absolute top-1/2 left-1/2 -translate-y-1/2 w-10 h-[1px] bg-white/10" />

                {/* Scanning line */}
                {scanning && (
                  <motion.div 
                    animate={{ top: ['0%', '100%'] }}
                    transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}
                    className="absolute left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-green-400 to-transparent shadow-[0_0_15px_rgba(74,222,128,0.8)] z-20"
                  />
                )}
              </div>
            </div>

            {/* Sidebar Data */}
            <div className="absolute right-6 top-1/2 -translate-y-1/2 flex flex-col space-y-4 pointer-events-none">
                {[
                    { label: 'O2 SAT', val: '88%' },
                    { label: 'ARCANE', val: 'SIG-X' },
                    { label: 'E-WASTE', val: 'DETECT' }
                ].map((stat, i) => (
                    <div key={i} className="bg-black/40 border border-white/5 p-2 rounded-lg backdrop-blur-sm">
                        <div className="text-[8px] text-white/40 uppercase">{stat.label}</div>
                        <div className="text-[10px] text-green-400 font-mono">{stat.val}</div>
                    </div>
                ))}
            </div>

            {/* Material Classification Footer */}
            <div className="absolute bottom-6 left-10 right-10 flex justify-between items-end pointer-events-none">
                <div className="font-mono text-[9px] text-green-400/80 leading-relaxed max-w-[200px]">
                    <span className="text-white">// CLASSIFICATION ENGINE //</span><br/>
                    POLYMER-P2: <span className="text-white">NOT FOUND</span><br/>
                    CELLULOSE-F: <span className="text-white">SCANNING...</span><br/>
                    METALLIC-A: <span className="text-green-500 font-bold">FRAGMENT DETECTED</span>
                </div>
                <div className="flex flex-col items-end">
                    <div className="text-[8px] text-white/20 uppercase tracking-widest font-bold">Earth Sync</div>
                    <div className="text-2xl font-black text-green-400 italic">ACTIVE</div>
                </div>
            </div>
          </>
        )}
      </div>

      {(barcodeStatus || materialResult || imageStatus || imageResult) && (
        <div className="mt-6 rounded-2xl border border-white/10 bg-black/40 p-4 text-xs text-white/70 font-mono space-y-3">
          {barcodeStatus && (
            <div>
              <span className="text-green-400">BARCODE:</span> {barcodeStatus}
            </div>
          )}
          {materialResult && (
            <pre className="whitespace-pre-wrap text-green-200">{materialResult}</pre>
          )}
          {imageStatus && (
            <div>
              <span className="text-green-400">IMAGE:</span> {imageStatus}
            </div>
          )}
          {imageResult && (
            <pre className="whitespace-pre-wrap text-green-200">{imageResult}</pre>
          )}
        </div>
      )}

      <div className="mt-8 flex justify-center">
        <div className="flex flex-col sm:flex-row gap-4">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleScanForBarcode}
            disabled={isBarcodeScanning}
            className="px-8 py-4 rounded-full bg-gradient-to-r from-green-600 to-green-400 text-black font-black tracking-widest uppercase text-xs glow-green transition-shadow shadow-2xl flex items-center space-x-3 disabled:opacity-60"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
              <path d="M4 4h2v16H4V4Zm14 0h2v16h-2V4ZM8 4h1v16H8V4Zm3 0h2v16h-2V4Zm4 0h1v16h-1V4Z" />
            </svg>
            <span>{isBarcodeScanning ? 'Scanning...' : 'Scan for Barcode'}</span>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleIdentifyItem}
            className="px-8 py-4 rounded-full bg-gradient-to-r from-green-600 to-green-400 text-black font-black tracking-widest uppercase text-xs glow-green transition-shadow shadow-2xl flex items-center space-x-3"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
              <path fillRule="evenodd" d="M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6Zm-7 2a1 1 0 0 1 1-1h2.172a3 3 0 0 0 2.121-.879l.586-.586A2 2 0 0 1 12.414 8h-.828a2 2 0 0 1 1.414-.586l.586.586A3 3 0 0 0 16.707 10H19a1 1 0 0 1 1 1v6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-6Z" clipRule="evenodd" />
            </svg>
            <span>Identify Item</span>
          </motion.button>
        </div>
      </div>
    </div>
  );
};

export default ScannerView;
