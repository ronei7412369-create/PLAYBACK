import React, { useRef, useState } from 'react';
import { usePlayerStore } from '../store/usePlayerStore';
import { Volume2, Power, Edit3, SlidersHorizontal, X } from 'lucide-react';
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
    <div className="flex flex-col h-full relative">
      <input 
         type="file"
         ref={fileInputRef}
         accept="audio/*"
         className="hidden"
         onChange={handleFileChange}
      />
      <div className="flex justify-between items-center mb-3">
        <div className="flex flex-col">
          <span className="text-[9px] text-[#A0A0A0] uppercase tracking-[0.15em] font-black leading-none mb-1">Continuous</span>
          <span className="text-white font-black text-sm tracking-tighter leading-none shadow-[0_0_15px_rgba(255,255,255,0.1)] flex items-center gap-2">
             AMBIENT PADS
             <button 
                onClick={() => setEditMode(!editMode)}
                className={cn("p-1 rounded-md transition-colors", editMode ? "bg-[#00A3FF] text-white" : "bg-white/5 text-white/50 hover:bg-white/10 hover:text-white")}
             >
                <Edit3 size={12} />
             </button>
          </span>
        </div>
        
        <div className="flex items-center gap-2 relative">
          <button 
             onClick={() => setShowEq(!showEq)}
             className={cn("p-1.5 rounded-lg transition-colors border", showEq ? "bg-[#00A3FF] border-[#00A3FF] text-white" : "bg-white/5 border-white/5 text-white/40 hover:text-white hover:bg-white/10")}
          >
             <SlidersHorizontal size={14} />
          </button>
          <div className="flex items-center gap-2 bg-white/[0.03] px-3 py-1.5 rounded-lg border border-white/5">
             <Volume2 size={13} className="text-white/40" />
             <input
               type="range"
               min="0"
               max="1"
               step="0.01"
               value={padVolume}
               onChange={(e) => setPadVolume(parseFloat(e.target.value))}
               className="w-16 h-1 bg-white/10 rounded-full appearance-none cursor-pointer accent-[#00A3FF] hover:accent-white transition-all custom-slider"
             />
          </div>
          
          <AnimatePresence>
            {showEq && (
              <motion.div 
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 5 }}
                className="absolute top-10 right-0 w-64 bg-[#111112] border border-white/10 rounded-2xl p-4 shadow-[0_10px_40px_rgba(0,0,0,0.5)] z-[100] flex flex-col gap-4"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-black text-[#00A3FF] tracking-widest">Pads EQ</span>
                  <button onClick={() => setShowEq(false)} className="text-white/40 hover:text-white bg-white/5 rounded-full p-1">
                    <X size={14} />
                  </button>
                </div>
                
                <div className="flex flex-col gap-3">
                  {[
                    { label: 'Low', band: 'low' as const, val: padEq.low },
                    { label: 'Mid', band: 'mid' as const, val: padEq.mid },
                    { label: 'High', band: 'high' as const, val: padEq.high }
                  ].map(({ label, band, val }) => (
                    <div key={band} className="flex items-center gap-3">
                      <span className="text-[11px] text-white/50 font-bold w-7 uppercase">{label}</span>
                      <input
                        type="range"
                        min="-24"
                        max="24"
                        value={val}
                        onChange={(e) => setPadEQ(band, parseFloat(e.target.value))}
                        onDoubleClick={() => setPadEQ(band, 0)}
                        className="flex-1 h-1.5 bg-[#0A0A0B] border border-white/5 rounded-full appearance-none cursor-pointer custom-slider accent-[#00A3FF] hover:accent-white transition-all"
                      />
                      <span className="text-[10px] tabular-nums font-mono w-6 text-right text-white/70">{val > 0 ? `+${Math.round(val)}` : Math.round(val)}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="grid grid-cols-4 grid-rows-3 gap-1.5 flex-1 relative">
        {editMode && (
           <div className="absolute inset-0 z-20 pointer-events-none rounded-xl border-2 border-dashed border-[#00A3FF]/50 bg-[#00A3FF]/5 flex items-center justify-center">
              <span className="absolute top-2 bg-[#00A3FF] text-white text-[10px] font-black px-2 py-0.5 rounded-full z-30">EDIT MODE</span>
           </div>
        )}
        {PAD_KEYS.map(({ note, freq }) => {
          const isActive = activePadKey === note;
          const hasCustom = customPads[note];
          return (
            <button
               key={note}
               onClick={() => handlePadClick(note, freq)}
               className={cn(
                 "relative flex items-center justify-center rounded-lg border transition-all duration-300 overflow-hidden group",
                 editMode ? "hover:border-[#00A3FF] z-30 pointer-events-auto" : "",
                 isActive && !editMode
                   ? "bg-[#002D4A] border-[#00A3FF]/40 shadow-[inset_0_0_10px_rgba(0,163,255,0.2)]" 
                   : "bg-[#111112] border-white/5 hover:bg-[#1A1A1C]"
               )}
            >
              <span className={cn(
                "text-xs font-black z-10 transition-colors tracking-widest",
                isActive && !editMode ? "text-[#00A3FF]" : "text-white/30 group-hover:text-white/60"
              )}>
                {note}
              </span>

              {hasCustom && (
                <div className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-[#00A3FF] rounded-full shadow-[0_0_5px_#00A3FF]" />
              )}
              
              <AnimatePresence>
                {(isActive && !editMode) && (
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
