import React from 'react';
import { motion } from 'framer-motion';

interface AboutViewProps {
  onBack: () => void;
}

const AboutView: React.FC<AboutViewProps> = ({ onBack }) => {
  return (
    <div className="relative min-h-screen flex flex-col p-6 items-center">
      <div className="w-full max-w-4xl flex justify-between items-center mb-12">
        <button 
          onClick={onBack}
          className="flex items-center space-x-2 text-white/60 hover:text-white transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
          </svg>
          <span className="uppercase text-sm tracking-widest font-bold">Leave Archive</span>
        </button>
        <div className="text-[10px] text-pink-400 font-mono border border-pink-400/20 px-3 py-1 rounded-full">
          DOC_VERSION: ARCANE-ECO.v1
        </div>
      </div>

      <div className="max-w-2xl text-center space-y-12">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-pink-400 mb-6">Wizardry for a Green Earth</h2>
          <div className="aspect-video rounded-[32px] overflow-hidden glow-green mb-8 border border-white/10 relative">
            <img 
              src="https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?q=80&w=2026&auto=format&fit=crop" 
              alt="Magic Forest" 
              className="w-full h-full object-cover opacity-60 mix-blend-screen"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#05020a] via-transparent to-transparent" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-32 h-32 bg-green-500/10 rounded-full flex items-center justify-center animate-pulse border border-green-500/20">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-12 h-12 text-green-400">
                  <path d="M7 2v5h5L10.12 4.88c1.91-1.16 4.35-1.11 6.21.14 2.3 1.54 3.03 4.54 1.76 6.98l-1.47-1.47-1.41 1.41 3.54 3.54 3.54-3.54-1.41-1.41-1.41 1.41c1.8-3.52.88-7.85-2.52-10.12-2.73-1.83-6.27-1.91-9.08-.24L7 2zm-4 7l3.54 3.54 1.41-1.41-1.41-1.41c1.8 3.52.88 7.85 2.52 10.12 2.73 1.83 6.27 1.91 9.08.24L20 22v-5h-5l1.88 2.12c-1.91 1.16-4.35 1.11-6.21-.14-2.3-1.54-3.03-4.54-1.76-6.98l1.47 1.47 1.41-1.41L8.25 8.54 4.71 12.08l1.41 1.41L7.53 12c-1.8 3.52-.88 7.85 2.52 10.12l-2.17 2.12c2.73 1.83 6.27 1.91 9.08.24L17 22H7l-3.54-3.54 1.41-1.41-1.41-1.41z" />
                </svg>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="space-y-6 text-purple-100/80 text-lg leading-relaxed font-light text-left"
        >
          <p className="border-l-2 border-green-500/50 pl-6">
            At <span className="text-green-400 font-bold uppercase">WizardsOfWaverlyHacks</span>, we practice the ancient art of <span className="italic">Ecological Transmutation</span>. We believe every piece of plastic, glass, and aluminum is a trapped fragment of planetary mana waiting to be released.
          </p>
          <p className="border-l-2 border-pink-500/50 pl-6">
            Our technology utilizes high-frequency biometric resonance to identify the lineage of materials. By scanning and properly disposing of these fragments, you aren't just "recycling"-you are contributing to the <span className="text-pink-400 font-bold uppercase">Global Earth Shield</span>.
          </p>
          <p className="border-l-2 border-purple-500/50 pl-6">
            Every scan fuels the forest, powers the coven, and protects our future. Join us in the synthesis of magic and science.
          </p>
        </motion.div>

        <motion.div 
          className="grid grid-cols-3 gap-4"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          {[
            { label: 'Transmuted', val: '14.2m' },
            { label: 'Green Mana', val: 'HIGH' },
            { label: 'Forest Radius', val: '+12km' }
          ].map((stat, i) => (
            <div key={i} className="p-4 rounded-2xl bg-white/5 border border-white/10 glow-green backdrop-blur-sm">
              <div className={`font-bold text-xl ${i === 1 ? 'text-green-400' : 'text-pink-400'}`}>{stat.val}</div>
              <div className="text-[10px] uppercase tracking-widest text-white/40">{stat.label}</div>
            </div>
          ))}
        </motion.div>
      </div>

      <div className="absolute top-1/2 left-0 -translate-x-1/2 w-64 h-64 bg-green-600/10 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 translate-x-1/2 w-96 h-96 bg-pink-600/10 blur-[120px] pointer-events-none" />
    </div>
  );
};

export default AboutView;
