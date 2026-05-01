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
    <div className="flex flex-col h-full relative p-1">
      <input 
         type="file"
         ref={fileInputRef}
         accept="audio/*"
         className="hidden"
         onChange={handleFileChange}
      />
      <div className="flex justify-between items-start mb-4">
        <div className="flex flex-col flex-1">
          <span className="text-[10px] text-white/40 uppercase tracking-[0.2em] font-black leading-none mb-1.5">Continuous</span>
          <div className="flex items-center gap-2">
            <span className="text-white font-black text-lg tracking-tight leading-none drop-shadow-md">
               AMBIENT PADS
            </span>
            <button 
                onClick={() => setEditMode(!editMode)}
                className={cn(
                  "p-1.5 rounded-lg transition-all", 
                  editMode ? "bg-red-500 text-white shadow-[0_0_10px_rgba(239,68,68,0.5)]" : "bg-white/5 text-white/40 hover:bg-white/10 hover:text-white"
                )}
                title="Editar Pads"
             >
                <Edit3 size={12} />
             </button>
          </div>
        </div>
        
        <div className="flex items-center gap-2 relative">
          <button 
             onClick={() => setShowEq(!showEq)}
             className={cn(
               "p-2.5 rounded-xl transition-all border outline-none", 
               showEq ? "bg-[#00A3FF] border-[#00A3FF] text-white shadow-[0_0_15px_rgba(0,163,255,0.4)]" : "bg-[#1A1A1C] border-white/5 text-white/40 hover:text-white hover:bg-[#222224] hover:border-white/10"
             )}
          >
             <SlidersHorizontal size={14} />
          </button>
          <div className="flex items-center gap-3 bg-[#1A1A1C] px-4 py-2.5 rounded-xl border border-white/5 h-full">
             <Volume2 size={14} className="text-white/40" />
             <input
               type="range"
               min="0"
               max="1"
               step="0.01"
               value={padVolume}
               onChange={(e) => setPadVolume(parseFloat(e.target.value))}
               className="w-16 h-1.5 bg-black/50 border border-white/5 rounded-full appearance-none cursor-pointer accent-[#00A3FF] hover:accent-white transition-all custom-slider"
             />
          </div>
          
          <AnimatePresence>
            {showEq && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                className="absolute top-14 right-0 w-64 bg-[#0A0A0B] border border-white/10 rounded-2xl p-5 shadow-[0_20px_60px_rgba(0,0,0,0.8)] z-[100] flex flex-col gap-5 origin-top-right backdrop-blur-xl"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs uppercase font-black text-[#00A3FF] tracking-widest flex items-center gap-2">
                    <SlidersHorizontal size={12} />
                    Pads EQ
                  </span>
                  <button onClick={() => setShowEq(false)} className="text-white/40 hover:text-white bg-white/5 hover:bg-white/10 rounded-full p-1.5 transition-colors">
                    <X size={14} />
                  </button>
                </div>
                
                <div className="flex flex-col gap-4">
                  {[
                    { label: 'Low', band: 'low' as const, val: padEq.low, color: '#00A3FF' },
                    { label: 'Mid', band: 'mid' as const, val: padEq.mid, color: '#FFB800' },
                    { label: 'High', band: 'high' as const, val: padEq.high, color: '#FF3B30' }
                  ].map(({ label, band, val, color }) => (
                    <div key={band} className="flex items-center gap-3">
                      <span className="text-[10px] text-white/50 font-black w-8 uppercase tracking-widest">{label}</span>
                      <input
                        type="range"
                        min="-24"
                        max="24"
                        value={val}
                        onChange={(e) => setPadEQ(band, parseFloat(e.target.value))}
                        onDoubleClick={() => setPadEQ(band, 0)}
                        className="flex-1 h-1.5 bg-black/50 border border-white/5 rounded-full appearance-none cursor-pointer custom-slider transition-all"
                        style={{ accentColor: color }}
                      />
                      <span className="text-[10px] tabular-nums font-mono w-7 text-right font-bold" style={{ color: val === 0 ? 'rgba(255,255,255,0.3)' : color }}>
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
           <div className="absolute inset-0 z-20 pointer-events-none rounded-2xl border-2 border-dashed border-red-500/50 bg-red-500/5 flex items-center justify-center backdrop-blur-[2px]">
              <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-red-500 text-white text-[10px] font-black px-3 py-1.5 rounded-full z-30 shadow-[0_0_20px_rgba(239,68,68,0.5)] tracking-widest uppercase">
                Modo de Edição
              </span>
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
                 "relative flex items-center justify-center rounded-xl border transition-all duration-300 overflow-hidden group",
                 editMode ? "hover:border-red-500 z-30 pointer-events-auto" : "hover:border-white/20",
                 isActive && !editMode
                   ? "bg-gradient-to-b from-[#00A3FF]/20 to-[#00A3FF]/5 border-[#00A3FF]/50 shadow-[0_0_20px_rgba(0,163,255,0.15)]" 
                   : "bg-[#141415] border-white/5 shadow-inner"
               )}
            >
              <span className={cn(
                "text-sm font-black z-10 transition-all tracking-wider drop-shadow-sm",
                isActive && !editMode ? "text-[#00A3FF] scale-110" : "text-white/40 group-hover:text-white/80 group-hover:scale-105"
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
                    className="absolute inset-0 flex items-end justify-center pb-3"
                  >
                    <motion.div 
                      animate={{ scale: [1, 1.5, 1], opacity: [0.6, 1, 0.6] }}
                      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                      className="w-1.5 h-1.5 bg-[#00A3FF] rounded-full shadow-[0_0_12px_#00A3FF]"
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
