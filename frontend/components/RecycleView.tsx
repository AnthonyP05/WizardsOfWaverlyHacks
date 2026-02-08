
import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { isLoggedIn, getToken, getStoredUser } from '../services/authService';

interface ScannerViewProps {
  onBack: () => void;
}

type ScanMode = 'select' | 'barcode' | 'image';

const ScannerView: React.FC<ScannerViewProps> = ({ onBack }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [scanMode, setScanMode] = useState<ScanMode>('select');
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  useEffect(() => {
    if (scanMode === 'select') return;

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
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [scanMode]);

  const captureImage = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.drawImage(video, 0, 0);
    return canvas.toDataURL('image/jpeg').split(',')[1]; // Get base64 without prefix
  };

  const handleImageCapture = async () => {
    setAnalyzing(true);
    setResult(null);

    try {
      const imageBase64 = captureImage();
      if (!imageBase64) {
        throw new Error('Failed to capture image');
      }

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      let zip: string | undefined;

      if (isLoggedIn()) {
        headers['Authorization'] = `Bearer ${getToken()}`;
        const user = getStoredUser();
        zip = user?.zip_code || undefined;
      }

      const response = await fetch('http://localhost:3000/api/ai/analyze-image', {
        method: 'POST',
        headers,
        body: JSON.stringify({ image: imageBase64, zip })
      });

      if (!response.ok) {
        throw new Error('Failed to analyze image');
      }

      const data = await response.json();
      setResult(data.analysis || 'No materials detected');
    } catch (err) {
      console.error('Analysis error:', err);
      setResult('Failed to analyze image. Please try again.');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleBarcodeDetection = async (barcode: string) => {
    setAnalyzing(true);
    setResult(null);

    try {
      const response = await fetch('http://localhost:3000/api/ai/barcode', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ barcode })
      });

      if (!response.ok) {
        throw new Error('Failed to lookup barcode');
      }

      const data = await response.json();
      setResult(data.analysis || 'Product analysis complete');
    } catch (err) {
      console.error('Barcode lookup error:', err);
      setResult('Failed to lookup barcode. Please try again.');
    } finally {
      setAnalyzing(false);
    }
  };

  // Simple barcode detection using pattern matching on captured frames
  const scanForBarcode = () => {
    setAnalyzing(true);
    // For demo purposes - in production, use a proper barcode scanning library
    setTimeout(() => {
      const mockBarcode = '012345678905'; // Example UPC
      handleBarcodeDetection(mockBarcode);
    }, 2000);
  };

  if (scanMode === 'select') {
    return (
      <div className="relative min-h-screen flex flex-col items-center justify-center p-6">
        <button 
          onClick={onBack}
          className="absolute top-6 left-6 flex items-center space-x-2 text-white/60 hover:text-white transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
          </svg>
          <span className="uppercase text-sm tracking-widest font-bold font-mono">Back</span>
        </button>

        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-purple-300 mb-2">Identify Item</h2>
          <p className="text-white/60 text-sm uppercase tracking-widest">Choose scanning method</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl w-full">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setScanMode('barcode')}
            className="p-8 rounded-3xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-400/40 hover:border-purple-400 transition-all"
          >
            <div className="text-6xl mb-4">📊</div>
            <h3 className="text-xl font-bold text-purple-300 mb-2">Scan Barcode</h3>
            <p className="text-white/60 text-sm">Item has a barcode</p>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setScanMode('image')}
            className="p-8 rounded-3xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-400/40 hover:border-green-400 transition-all"
          >
            <div className="text-6xl mb-4">📸</div>
            <h3 className="text-xl font-bold text-green-300 mb-2">No Barcode</h3>
            <p className="text-white/60 text-sm">Take a photo to identify</p>
          </motion.button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen flex flex-col p-6">
      <div className="flex justify-between items-center mb-6">
        <button 
          onClick={() => {
            setScanMode('select');
            setResult(null);
          }}
          className="flex items-center space-x-2 text-white/60 hover:text-white transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
          </svg>
          <span className="uppercase text-sm tracking-widest font-bold font-mono">Change Mode</span>
        </button>
        <div className="flex flex-col items-end">
            <div className="text-green-400 font-mono text-xs animate-pulse">
                {scanMode === 'barcode' ? 'SCANNING_BARCODE...' : 'ANALYZING_IMAGE...'}
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
            <canvas ref={canvasRef} style={{ display: 'none' }} />
            
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
                {analyzing && (
                  <motion.div 
                    animate={{ top: ['0%', '100%'] }}
                    transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}
                    className="absolute left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-green-400 to-transparent shadow-[0_0_15px_rgba(74,222,128,0.8)] z-20"
                  />
                )}
              </div>
            </div>

            {/* Result Display */}
            {result && (
              <div className="absolute bottom-24 left-6 right-6 bg-black/80 border border-green-400/50 rounded-2xl p-4 backdrop-blur-sm max-h-48 overflow-y-auto">
                <div className="text-green-400 font-mono text-xs whitespace-pre-wrap">
                  {result}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <div className="mt-8 flex justify-center">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={scanMode === 'barcode' ? scanForBarcode : handleImageCapture}
          disabled={analyzing}
          className="px-12 py-5 rounded-full bg-gradient-to-r from-green-600 to-green-400 text-black font-black tracking-widest uppercase text-sm glow-green transition-shadow shadow-2xl flex items-center space-x-3 disabled:opacity-50"
        >
          {analyzing ? (
            <>
              <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>Analyzing...</span>
            </>
          ) : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                <path fillRule="evenodd" d="M4.755 10.059a7.5 7.5 0 0 1 12.548-3.364l1.903 1.903h-3.183a.75.75 0 1 0 0 1.5h4.992a.75.75 0 0 0 .75-.75V4.356a.75.75 0 0 0-1.5 0v3.18l-1.9-1.9A9 9 0 0 0 3.306 9.67a.75.75 0 1 0 1.45.388Zm15.408 3.352a.75.75 0 0 0-.919.53 7.5 7.5 0 0 1-12.548 3.364l-1.902-1.903h3.183a.75.75 0 0 0 0-1.5H2.984a.75.75 0 0 0-.75.75v4.992a.75.75 0 0 0 1.5 0v-3.18l1.9 1.9a9 9 0 0 0 15.059-4.035.75.75 0 0 0-.53-.918Z" clipRule="evenodd" />
              </svg>
              <span>{scanMode === 'barcode' ? 'Scan Barcode' : 'Capture & Analyze'}</span>
            </>
          )}
        </motion.button>
      </div>
    </div>
  );

};

export default ScannerView;
