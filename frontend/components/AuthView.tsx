import React from 'react';
import { motion } from 'framer-motion';

interface AuthViewProps {
  mode: 'login' | 'signup';
  onBack: () => void;
}

const AuthView: React.FC<AuthViewProps> = ({ mode, onBack }) => {
  const isLogin = mode === 'login';

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md p-8 rounded-[2.5rem] bg-black/40 border-2 border-white/10 glow-purple backdrop-blur-xl relative overflow-hidden"
      >
        {/* Background Sparkles */}
        <div className="absolute inset-0 pointer-events-none opacity-20">
          {[...Array(20)].map((_, i) => (
            <div 
              key={i}
              className="absolute bg-white rounded-full"
              style={{
                width: Math.random() * 3 + 'px',
                height: Math.random() * 3 + 'px',
                top: Math.random() * 100 + '%',
                left: Math.random() * 100 + '%',
                animation: `pulse ${2 + Math.random() * 3}s infinite`
              }}
            />
          ))}
        </div>

        <button 
          onClick={onBack}
          className="absolute top-6 left-6 text-white/40 hover:text-white transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
          </svg>
        </button>

        <div className="text-center mb-10">
          <h2 className={`text-3xl font-black tracking-tight mb-2 ${isLogin ? 'text-purple-400' : 'text-pink-400'}`}>
            {isLogin ? 'Welcome Back' : 'Join the Coven'}
          </h2>
          <p className="text-white/40 text-xs uppercase tracking-[0.2em] font-bold">
            {isLogin ? 'Enter your magical credentials' : 'Initiate your arcane journey'}
          </p>
        </div>

        <form className="space-y-6 relative z-10" onSubmit={(e) => e.preventDefault()}>
          {!isLogin && (
            <div className="space-y-1">
              <label className="text-[10px] text-white/40 uppercase tracking-widest font-bold ml-4">Full Name</label>
              <input 
                type="text" 
                placeholder="Archmage Doe" 
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white focus:outline-none focus:border-pink-400/50 transition-all placeholder:text-white/10"
              />
            </div>
          )}
          <div className="space-y-1">
            <label className="text-[10px] text-white/40 uppercase tracking-widest font-bold ml-4">Email Address</label>
            <input 
              type="email" 
              placeholder="mage@waverly.hacks" 
              className={`w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white focus:outline-none transition-all placeholder:text-white/10 ${isLogin ? 'focus:border-purple-400/50' : 'focus:border-pink-400/50'}`}
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] text-white/40 uppercase tracking-widest font-bold ml-4">Arcane Phrase</label>
            <input 
              type="password" 
              placeholder="••••••••" 
              className={`w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white focus:outline-none transition-all placeholder:text-white/10 ${isLogin ? 'focus:border-purple-400/50' : 'focus:border-pink-400/50'}`}
            />
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`w-full py-4 rounded-2xl font-black text-black tracking-[0.2em] uppercase text-sm mt-4 shadow-xl ${isLogin ? 'bg-purple-400 glow-purple' : 'bg-pink-400 glow-pink'}`}
          >
            {isLogin ? 'Unlock Portal' : 'Bind Soul'}
          </motion.button>
        </form>

        <div className="mt-8 text-center">
          <button className="text-[10px] text-white/20 hover:text-white/60 transition-colors uppercase tracking-widest font-bold">
            Lost your spellbook?
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default AuthView;
