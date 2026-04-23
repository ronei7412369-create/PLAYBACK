import React from 'react';
import { usePlayerStore } from '../store/usePlayerStore';
import { Volume2, Power } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

// Frequencies for octave 4
const PAD_KEYS = [
  { note: 'C', freq: 261.63 },
  { note: 'C#', freq: 277.18 },
  { note: 'D', freq: 293.66 },
  { note: 'Eb', freq: 311.13 },
  { note: 'E', freq: 329.63 },
  { note: 'F', freq: 349.23 },
  { note: 'F#', freq: 369.99 },
  { note: 'G', freq: 392.00 },
  { note: 'Ab', freq: 415.30 },
  { note: 'A', freq: 440.00 },
  { note: 'Bb', freq: 466.16 },
  { note: 'B', freq: 493.88 },
];

export const PadsPlayer: React.FC = () => {
  const { activePadKey, padVolume, toggleAmbientPad, setPadVolume } = usePlayerStore();

  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-center mb-4 px-2">
        <div className="flex flex-col">
          <span className="text-[10px] text-white/40 uppercase tracking-widest font-black">Continuous</span>
          <span className="text-white font-black text-xl tracking-tighter">AMBIENT PADS</span>
        </div>
        
        <div className="flex items-center gap-3 bg-white/5 px-4 py-2 rounded-xl border border-white/5">
           <Volume2 size={16} className="text-white/40" />
           <input
             type="range"
             min="0"
             max="1"
             step="0.01"
             value={padVolume}
             onChange={(e) => setPadVolume(parseFloat(e.target.value))}
             className="w-24 h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer accent-[#00A3FF] hover:accent-white transition-all"
           />
        </div>
      </div>

      <div className="grid grid-cols-4 grid-rows-3 gap-2 flex-1">
        {PAD_KEYS.map(({ note, freq }) => {
          const isActive = activePadKey === note;
          return (
            <button
              key={note}
              onClick={() => toggleAmbientPad(note, freq)}
              className={cn(
                "relative flex items-center justify-center rounded-xl border transition-all duration-300 overflow-hidden group",
                isActive 
                  ? "bg-[#00A3FF]/20 border-[#00A3FF]/50 shadow-[0_0_20px_rgba(0,163,255,0.2)]" 
                  : "bg-white/5 border-white/5 hover:bg-white/10"
              )}
            >
              <span className={cn(
                "text-2xl font-black z-10 transition-colors",
                isActive ? "text-white" : "text-white/40 group-hover:text-white"
              )}>
                {note}
              </span>
              
              <AnimatePresence>
                {isActive && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-gradient-to-t from-[#00A3FF]/20 to-transparent flex items-end justify-center pb-2"
                  >
                    <motion.div 
                      animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="w-1.5 h-1.5 bg-[#00A3FF] rounded-full shadow-[0_0_10px_#00A3FF]"
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </button>
          );
        })}
      </div>
    </div>
  );
};
