import React from 'react';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="relative min-h-screen w-full overflow-hidden magic-gradient text-white">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-pink-600/10 blur-[120px] rounded-full animate-pulse delay-700" />
        <div className="absolute top-3/4 left-1/3 w-64 h-64 bg-green-500/10 blur-[80px] rounded-full animate-pulse delay-1000" />
        {[...Array(12)].map((_, i) => (
          <div 
            key={i}
            className="absolute text-green-400/20 text-xl animate-bounce"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              animationDuration: `${3 + Math.random() * 4}s`,
              animationDelay: `${Math.random() * 2}s`
            }}
          >
            {i % 2 === 0 ? '🌿' : '♻️'}
          </div>
        ))}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600/10 blur-[120px] rounded-full animate-pulse" />
      </div>
      <main className="relative z-10">
        {children}
      </main>
    </div>
  );
};

export default Layout;