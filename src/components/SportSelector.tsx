import { motion } from 'motion/react';
import type { Sport } from '../types';

interface SportSelectorProps {
  selected: Sport | null;
  onSelect: (sport: Sport) => void;
}

export default function SportSelector({ selected, onSelect }: SportSelectorProps) {
  return (
    <div className="flex flex-col md:flex-row gap-8 justify-center items-center py-20 px-4">
      {/* Football Card */}
      <motion.div
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => onSelect('football')}
        className={`relative group cursor-pointer w-full max-w-xs h-96 rounded-[2rem] overflow-hidden transition-all duration-500 ${
          selected === 'football' ? 'neon-border scale-105' : 'glass-morphism grayscale hover:grayscale-0'
        }`}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-primary/20" />
        
        {/* Stylish Icon Representation */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 flex items-center justify-center">
          <motion.div
            animate={selected === 'football' ? { rotate: 360 } : {}}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="w-32 h-32 relative"
          >
             <svg viewBox="0 0 100 100" className="w-full h-full fill-primary drop-shadow-[0_0_15px_rgba(0,255,136,0.6)]">
               <path d="M50 0C22.4 0 0 22.4 0 50s22.4 50 50 50 50-22.4 50-50S77.6 0 50 0zm0 92c-23.2 0-42-18.8-42-42S26.8 8 50 8s42 18.8 42 42-18.8 42-42 42z"/>
               <path d="M50 25l-15 10v20l15 10 15-10V35l-15-10zm10 27.3l-10 6.7-10-6.7V42.7l10-6.7 10 6.7v9.9z"/>
               <path d="M30 35l-10-5M70 35l10-5M30 65l-10 5M70 65l10 5M50 15V5M50 85v10" stroke="currentColor" strokeWidth="2"/>
             </svg>
             {/* Glow Effect */}
             <div className="absolute inset-0 bg-primary/20 rounded-full blur-2xl -z-10" />
          </motion.div>
        </div>

        <div className="absolute bottom-0 left-0 w-full p-8 text-center z-10">
          <h3 className="text-3xl font-display font-black mb-2 drop-shadow-lg">FOOTBALL</h3>
          <p className="text-sm text-white/80 uppercase tracking-widest font-bold drop-shadow-md">5-A-SIDE / 7-A-SIDE</p>
        </div>
        
        {selected === 'football' && (
          <motion.div
            layoutId="active-glow"
            className="absolute inset-0 bg-primary/5 animate-pulse pointer-events-none"
          />
        )}
      </motion.div>

      {/* Cricket Card */}
      <motion.div
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => onSelect('cricket')}
        className={`relative group cursor-pointer w-full max-w-xs h-96 rounded-[2rem] overflow-hidden transition-all duration-500 ${
          selected === 'cricket' ? 'neon-border scale-105' : 'glass-morphism grayscale hover:grayscale-0'
        }`}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-accent/20" />
        
        {/* Stylish Icon Representation */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 flex items-center justify-center">
          <motion.div
            animate={selected === 'cricket' ? { 
              rotate: [0, -10, 10, -10, 0],
              y: [0, -5, 0]
            } : {}}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="w-32 h-32 relative"
          >
             <svg viewBox="0 0 100 100" className="w-full h-full fill-accent drop-shadow-[0_0_15px_rgba(0,234,255,0.6)]">
               <path d="M40 5h10v30H40zM35 35h20v50c0 5.5-4.5 10-10 10s-10-4.5-10-10V35z"/>
               <circle cx="75" cy="70" r="12"/>
               <path d="M75 70l15-15" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
               <path d="M45 40v45" stroke="rgba(255,255,255,0.2)" strokeWidth="1"/>
             </svg>
             {/* Glow Effect */}
             <div className="absolute inset-0 bg-accent/20 rounded-full blur-2xl -z-10" />
          </motion.div>
        </div>

        <div className="absolute bottom-0 left-0 w-full p-8 text-center z-10">
          <h3 className="text-3xl font-display font-black mb-2 text-accent drop-shadow-lg">CRICKET</h3>
          <p className="text-sm text-white/80 uppercase tracking-widest font-bold drop-shadow-md">BOX CRICKET</p>
        </div>

        {selected === 'cricket' && (
          <motion.div
            layoutId="active-glow"
            className="absolute inset-0 bg-accent/5 animate-pulse pointer-events-none"
          />
        )}
      </motion.div>
    </div>
  );
}
