import React, { useState } from 'react';
import FloatingChat from './FloatingChat';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isChatOpen, setIsChatOpen] = useState(false);

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
        {[...Array(12)].map((_, i) => (
          <div 
            key={i}
            style={{
              position: 'absolute',
              fontSize: '1.25rem',
              color: 'rgba(34, 197, 94, 0.2)',
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              animation: `bounce ${3 + Math.random() * 4}s infinite`,
              animationDelay: `${Math.random() * 2}s`
            }}
          >
            {i % 2 === 0 ? '🌿' : '♻️'}
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