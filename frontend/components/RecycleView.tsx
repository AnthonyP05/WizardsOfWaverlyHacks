import React, { useRef, useState, useEffect } from 'react';

interface RecycleViewProps {
  onBack: () => void;
}

const RecycleView: React.FC<RecycleViewProps> = ({ onBack }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(true);

  useEffect(() => {
    const startCamera = async () => {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' }
        });
        streamRef.current = mediaStream;
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      } catch (err) {
        setError('Failed to access camera. Please ensure permissions are granted.');
      }
    };

    startCamera();

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const handleScanSimulation = () => {
    setScanning(false);
    setTimeout(() => {
      alert(
        "Fragment Identified: Astral Aluminum Core\nStatus: High Recycle Potential\nTransmuting to 5 Earth Mana..."
      );
      setScanning(true);
    }, 1000);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-black/60 text-white p-8">
      <h2 className="text-3xl font-bold mb-6">Transmute Waste Scanner</h2>
      {error ? (
        <div className="text-red-400 mb-8">{error}</div>
      ) : (
        <div className="w-full max-w-md mb-8 rounded-2xl overflow-hidden bg-black border border-green-400/20">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className="w-full h-64 object-cover"
          />
          {scanning && (
            <div className="absolute inset-0 h-1 bg-gradient-to-b from-green-400/0 via-green-400 to-green-400/0 pointer-events-none" />
          )}
        </div>
      )}
      <button
        onClick={handleScanSimulation}
        disabled={!scanning}
        className="w-full max-w-md py-4 rounded-lg bg-gradient-to-r from-green-600 to-green-400 text-black font-bold uppercase tracking-wider hover:shadow-lg mb-6 disabled:opacity-50"
      >
        {scanning ? 'Scan Fragment' : 'Processing...'}
      </button>
      <button
        onClick={onBack}
        className="px-6 py-2 rounded-full bg-purple-500 text-white font-bold hover:bg-purple-600"
      >
        Back to Home
      </button>
    </div>
  );
};

export default RecycleView;