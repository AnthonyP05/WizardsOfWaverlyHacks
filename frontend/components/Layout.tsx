import React, { useState, useMemo } from 'react';
import FloatingChat from './FloatingChat';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isChatOpen, setIsChatOpen] = useState(false);

  // Memoize background decorations to prevent re-rendering
  const backgroundDecorations = useMemo(() => {
    return [...Array(12)].map((_, i) => ({
      id: i,
      emoji: i % 2 === 0 ? '🌿' : '♻️',
      top: Math.random() * 100,
      left: Math.random() * 100,
      duration: 3 + Math.random() * 4,
      delay: Math.random() * 2
    }));
  }, []);

  return (
    <div style={{
      position: 'relative',
      minHeight: '100vh',
      width: '100%',
      overflow: 'hidden',
      background: 'linear-gradient(135deg, #1d0937 0%, #05020a 100%)',
      color: 'white'
    }}>
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        {backgroundDecorations.map((decoration) => (
          <div 
            key={decoration.id}
            style={{
              position: 'absolute',
              fontSize: '1.25rem',
              color: 'rgba(34, 197, 94, 0.2)',
              top: `${decoration.top}%`,
              left: `${decoration.left}%`,
              animation: `bounce ${decoration.duration}s infinite`,
              animationDelay: `${decoration.delay}s`
            }}
          >
            {decoration.emoji}
          </div>
        ))}
      </div>
      <main style={{ position: 'relative', zIndex: 10 }}>
        {children}
      </main>
      <FloatingChat isOpen={isChatOpen} setIsOpen={setIsChatOpen} />
      <style>{`
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-20px); }
        }
      `}</style>
    </div>
  );
};

export default Layout;