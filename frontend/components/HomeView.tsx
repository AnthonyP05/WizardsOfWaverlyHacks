import React from 'react';
import { AppView } from '../App';
import { logout, User } from '../services/authService';

interface HomeViewProps {
  onNavigate: (view: AppView | 'chat', e?: React.MouseEvent) => void;
  user: User | null;
  onLogout: () => void;
}

const HomeView: React.FC<HomeViewProps> = ({ onNavigate, user, onLogout }) => {
  const handleLogout = () => {
    logout();
    onLogout();
  };
  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-6 py-20 text-center relative">
      {/* Top-right Login/Signup or User info */}
      <div className="absolute top-8 right-8 flex items-center space-x-4 z-20">
        {user ? (
          <>
            <div className="px-4 py-2 rounded-full bg-green-500/10 border border-green-400/40 backdrop-blur-sm">
              <span className="text-green-300 font-bold text-sm tracking-wider">✨ {user.username}</span>
            </div>
            <button
              className="px-6 py-2 rounded-full bg-red-500/10 border border-red-400/40 text-red-300 font-bold text-sm tracking-widest uppercase hover:bg-red-500/20 hover:border-red-400 transition-all"
              onClick={handleLogout}
            >
              Logout
            </button>
          </>
        ) : (
          <>
            <button
              className="px-6 py-2 rounded-full bg-purple-500/10 border border-purple-400/40 text-purple-300 font-bold text-sm tracking-widest uppercase hover:bg-purple-500/20 hover:border-purple-400 transition-all"
              onClick={(e) => onNavigate('login', e)}
            >
              Login
            </button>
            <button
              className="px-6 py-2 rounded-full bg-pink-500/10 border border-pink-400/40 text-pink-300 font-bold text-sm tracking-widest uppercase hover:bg-pink-500/20 hover:border-pink-400 transition-all"
              onClick={(e) => onNavigate('signup', e)}
            >
              Signup
            </button>
          </>
        )}
      </div>

       {/* Top-left Earth Mana meter */}
      <div className="absolute top-8 left-8 flex flex-col items-start space-y-2 z-20">
        <span className="text-[10px] text-green-400 font-bold uppercase tracking-[0.2em]">Earth Mana (Recycled)</span>
        <div className="w-48 h-2 bg-white/5 rounded-full overflow-hidden border border-white/10">
          <div className="h-full bg-gradient-to-r from-green-600 to-green-400" style={{ width: '68%' }} />
        </div>
        <span className="text-[10px] text-white/40 font-mono text-left uppercase">Archmage Level 14</span>
      </div>

      {/* Title and subtitle */}
      <div className="mb-12">
        <h1 className="text-5xl md:text-7xl lg:text-8xl font-extrabold tracking-tighter mb-4 bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-pink-400 to-green-400 leading-tight">
          WizardsOfWaverlyHacks
        </h1>
        <p className="text-purple-200/60 text-lg md:text-xl font-light tracking-[0.3em] uppercase">
          Arcane Recycling
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl">
  {/* Transmute Waste button */}
  <button
    onClick={(e) => onNavigate('scanner', e)}
    className="group relative h-64 md:h-72 rounded-[2.5rem] overflow-hidden bg-black/40 border border-white/10 flex flex-col items-center justify-center transition-all hover:border-green-400/50"
  >
    <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
    <div className="relative z-10 text-green-400 mb-6 transition-all group-hover:scale-110">
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-16 h-16 md:w-20 md:h-20">
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
      </svg>
    </div>
    <span className="text-xl md:text-2xl font-black tracking-tight text-white/90 uppercase leading-none">Transmute Waste</span>
    <span className="text-[10px] text-green-400/50 mt-2 uppercase tracking-widest font-bold">Initiate Recycle Swirl</span>
  </button>

  {/* The Archive button */}
  <button
    onClick={(e) => onNavigate('about', e)}
    className="group relative h-64 md:h-72 rounded-[2.5rem] overflow-hidden bg-gradient-to-b from-pink-500/20 to-purple-500/20 border-2 border-pink-400/30 flex flex-col items-center justify-center transition-all hover:border-pink-300"
  >
    <div className="absolute inset-0 bg-pink-500 rounded-full blur-[60px] opacity-20 group-hover:opacity-40 transition-opacity" />
    <div className="relative z-10 text-pink-300 mb-6 transition-all group-hover:scale-110 group-hover:text-white">
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-16 h-16 md:w-20 md:h-20">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
      </svg>
    </div>
    <span className="text-xl md:text-2xl font-black tracking-widest text-white uppercase leading-none">The Archive</span>
    <span className="text-[10px] text-pink-200 mt-2 uppercase tracking-widest font-bold">Wand Selection Portal</span>
  </button>
</div>
    </div>
  );
};

export default HomeView;