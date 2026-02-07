import React from 'react';
import { AppView } from '../App';

interface HomeViewProps {
  onNavigate: (view: AppView | 'chat', e?: React.MouseEvent) => void;
}

const HomeView: React.FC<HomeViewProps> = ({ onNavigate }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-6 py-20 text-center relative">
      {/* Top-right Login/Signup buttons */}
      <div className="absolute top-8 right-8 flex space-x-4 z-20">
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
    </div>
  );
};

export default HomeView;