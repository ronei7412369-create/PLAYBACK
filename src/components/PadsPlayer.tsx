import React, { useRef, useState } from 'react';
import { usePlayerStore } from '../store/usePlayerStore';
import { Volume2, Power, Edit3, SlidersHorizontal, X, Music } from 'lucide-react';
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
  const { activePadKey, padVolume, customPads, padEq, toggleAmbientPad, setPadVolume, setPadEQ, setCustomPad } = usePlayerStore();
  const [editMode, setEditMode] = useState(false);
  const [showEq, setShowEq] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [editingNote, setEditingNote] = useState<string | null>(null);

  const handlePadClick = (note: string, freq: number) => {
    if (editMode) {
       setEditingNote(note);
       fileInputRef.current?.click();
    } else {
       toggleAmbientPad(note, freq);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && editingNote) {
       await setCustomPad(editingNote, file);
    }
    setEditingNote(null);
    if (fileInputRef.current) {
       fileInputRef.current.value = '';
    }
  };

  return (
    <div className="flex flex-col h-full relative p-1.5">
      <input 
         type="file"
         ref={fileInputRef}
         accept="audio/*"
         className="hidden"
         onChange={handleFileChange}
      />
      <div className="flex justify-between items-start mb-4">
        <div className="flex flex-col flex-1">
          <span className="text-[9px] text-white/30 uppercase tracking-[0.25em] font-black leading-none mb-1.5">Synthesis</span>
          <div className="flex items-center gap-2">
            <span className="text-white font-extrabold text-[11px] uppercase tracking-widest leading-none">
               AMBIENT PADS
             </span>
             <button 
                onClick={() => setEditMode(!editMode)}
                className={cn(
                  "p-1.5 rounded-lg transition-all border", 
                  editMode 
                    ? "bg-[#FF3B30]/15 border-[#FF3B30] text-[#FF3B30] shadow-[0_0_10px_rgba(255,59,48,0.25)]" 
                    : "bg-white/5 border-white/5 text-white/35 hover:bg-white/10 hover:text-white"
                )}
                title="Editar Pads"
             >
                <Edit3 size={11} />
             </button>
          </div>
        </div>
        
        <div className="flex items-center gap-2 relative">
          <button 
             onClick={() => setShowEq(!showEq)}
             className={cn(
               "p-2.5 rounded-xl transition-all border outline-none", 
               showEq 
                 ? "bg-[#00A3FF]/15 border-[#00A3FF] text-[#00A3FF] shadow-[0_0_15px_rgba(0,163,255,0.2)]" 
                 : "bg-white/5 border-white/5 text-white/35 hover:text-white hover:bg-white/10"
             )}
          >
             <SlidersHorizontal size={13} />
          </button>
          <div className="flex items-center gap-2.5 bg-black/40 px-3 py-2 rounded-xl border border-white/5 h-[34px]">
             <Volume2 size={13} className="text-white/35" />
             <input
               type="range"
               min="0"
               max="1"
               step="0.01"
               value={padVolume}
               onChange={(e) => setPadVolume(parseFloat(e.target.value))}
               className="w-14 h-1 bg-black/60 rounded-full appearance-none cursor-pointer accent-[#00A3FF] hover:accent-white transition-all custom-slider"
             />
          </div>
          
          <AnimatePresence>
            {showEq && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                className="absolute top-11 right-0 w-60 bg-black/90 border border-white/15 rounded-2xl p-4.5 shadow-[0_20px_50px_rgba(0,0,0,0.9)] z-[100] flex flex-col gap-4 origin-top-right backdrop-blur-2xl"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-black text-[#00A3FF] tracking-widest flex items-center gap-2">
                    <SlidersHorizontal size={11} />
                    Pads EQ
                  </span>
                  <button onClick={() => setShowEq(false)} className="text-white/40 hover:text-white bg-white/5 hover:bg-white/10 rounded-full p-1 transition-colors border border-white/5">
                    <X size={12} />
                  </button>
                </div>
                
                <div className="flex flex-col gap-3.5">
                  {[
                    { label: 'Low', band: 'low' as const, val: padEq.low, color: '#00A3FF' },
                    { label: 'Mid', band: 'mid' as const, val: padEq.mid, color: '#FFD60A' },
                    { label: 'High', band: 'high' as const, val: padEq.high, color: '#FF3B30' }
                  ].map(({ label, band, val, color }) => (
                    <div key={band} className="flex items-center gap-2.5">
                      <span className="text-[9px] text-white/40 font-extrabold w-8 uppercase tracking-wider">{label}</span>
                      <input
                        type="range"
                        min="-24"
                        max="24"
                        value={val}
                        onChange={(e) => setPadEQ(band, parseFloat(e.target.value))}
                        onDoubleClick={() => setPadEQ(band, 0)}
                        className="flex-1 h-1 bg-black/60 rounded-full appearance-none cursor-pointer custom-slider transition-all"
                        style={{ accentColor: color }}
                      />
                      <span className="text-[9px] tabular-nums font-mono w-7 text-right font-bold" style={{ color: val === 0 ? 'rgba(255,255,255,0.2)' : color }}>
                        {val > 0 ? `+${Math.round(val)}` : Math.round(val)}
                      </span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="grid grid-cols-4 grid-rows-3 gap-2 flex-1 relative mt-1">
        {editMode && (
           <div className="absolute inset-0 z-20 pointer-events-none rounded-2xl border-2 border-dashed border-red-500/40 bg-[#FF3B30]/5 flex items-center justify-center backdrop-blur-[1px]">
              <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#FF3B30] text-white text-[9px] font-black px-3.5 py-1.5 rounded-full z-30 shadow-[0_0_20px_rgba(255,59,48,0.4)] tracking-[0.2em] uppercase">
                Modo de Edição
              </span>
           </div>
        )}
        {PAD_KEYS.map(({ note, freq }) => {
          const isActive = activePadKey === note;
          const hasCustom = customPads[note];
          return (
            <motion.button
               key={note}
               onClick={() => handlePadClick(note, freq)}
               whileHover={{ scale: editMode ? 1 : 1.02, y: editMode ? 0 : -1 }}
               whileTap={{ scale: 0.95 }}
               className={cn(
                 "relative flex items-center justify-center rounded-2xl border transition-all duration-300 overflow-hidden group py-4",
                 editMode ? "hover:border-red-500 z-30 pointer-events-auto" : "hover:border-white/15",
                 isActive && !editMode
                   ? "ios-glass-accent border-[#00A3FF]/40 shadow-[0_8px_20px_rgba(0,163,255,0.2)] ring-1 ring-[#00A3FF]/20" 
                   : "bg-black/30 border-white/5 hover:bg-white/5"
               )}
            >
              <span className={cn(
                "text-xs font-black z-10 transition-all tracking-wider drop-shadow-sm font-sans",
                isActive && !editMode ? "text-[#00A3FF] scale-110 font-black" : "text-white/35 group-hover:text-white/80"
              )}>
                {note}
              </span>

              {hasCustom && (
                <div className={cn(
                  "absolute top-2 right-2 w-1.5 h-1.5 rounded-full shadow-[0_0_8px_currentColor] transition-colors",
                  isActive && !editMode ? "bg-[#00A3FF] text-[#00A3FF]" : "bg-white/30 text-white/30"
                )} />
              )}
              
              <AnimatePresence>
                {(isActive && !editMode) && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 flex items-end justify-center pb-2.5"
                  >
                    <motion.div 
                      animate={{ scale: [1, 1.4, 1], opacity: [0.5, 1, 0.5] }}
                      transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
                      className="w-1.5 h-1.5 bg-[#00A3FF] rounded-full shadow-[0_0_10px_#00A3FF]"
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};
