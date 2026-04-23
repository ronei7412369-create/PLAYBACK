import React from 'react';
import { usePlayerStore } from '../store/usePlayerStore';
import { Play, Pause, Square, Repeat, Infinity as InfinityIcon, TrendingDown, SkipBack, SkipForward } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';

export const TransportControls: React.FC = () => {
  const { 
    isPlaying, togglePlay, stop, 
    isLooping, toggleLoop,
    isInfiniteLoop, toggleInfiniteLoop,
    isFadeOut, triggerFadeOut: toggleFadeOut,
    playbackRate, setPlaybackRate
  } = usePlayerStore();

  return (
    <div className="h-auto md:h-28 py-4 md:py-0 bg-[#0A0A0B] border-t border-white/5 flex flex-wrap md:flex-nowrap items-center justify-center gap-4 lg:gap-16 px-4 md:px-12 relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#00A3FF]/5 to-transparent pointer-events-none" />

      {/* Loop Controls */}
      <div className="flex items-center gap-2 md:gap-6 z-10 order-2 md:order-1">
        <motion.button 
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={toggleLoop}
          className={cn(
            "flex flex-col items-center gap-1.5 p-2 md:p-3 rounded-2xl transition-all border",
            isLooping 
              ? "text-[#F1C40F] bg-[#F1C40F]/10 border-[#F1C40F]/30 shadow-lg shadow-[#F1C40F]/10" 
              : "text-white/20 bg-white/5 border-white/5 hover:text-white/60"
          )}
        >
          <Repeat size={18} className="md:w-[22px] md:h-[22px]" />
          <span className="text-[8px] md:text-[9px] font-black uppercase tracking-widest hidden sm:inline">Loop</span>
        </motion.button>

        <motion.button 
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={toggleInfiniteLoop}
          className={cn(
            "flex flex-col items-center gap-1.5 p-2 md:p-3 rounded-2xl transition-all border",
            isInfiniteLoop 
              ? "text-[#00A3FF] bg-[#00A3FF]/10 border-[#00A3FF]/30 shadow-lg shadow-[#00A3FF]/10" 
              : "text-white/20 bg-white/5 border-white/5 hover:text-white/60"
          )}
        >
          <InfinityIcon size={18} className="md:w-[22px] md:h-[22px]" />
          <span className="text-[8px] md:text-[9px] font-black uppercase tracking-widest hidden sm:inline">Infinite</span>
        </motion.button>
      </div>

      {/* Main Playback Controls - Put this on top for mobile */}
      <div className="flex items-center justify-center gap-4 md:gap-8 z-10 order-1 md:order-2 w-full md:w-auto">
        <motion.button 
          whileHover={{ scale: 1.2, x: -5 }}
          whileTap={{ scale: 0.9 }}
          className="p-2 md:p-4 text-white/20 hover:text-white transition-colors"
        >
          <SkipBack size={24} className="md:w-[28px] md:h-[28px]" fill="currentColor" />
        </motion.button>

        <motion.button 
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={stop}
          className="p-3 md:p-5 bg-white/5 border border-white/10 rounded-2xl md:rounded-3xl text-white/40 hover:text-white hover:bg-white/10 transition-all shadow-xl"
        >
          <Square size={20} className="md:w-[28px] md:h-[28px]" fill="currentColor" />
        </motion.button>

        <motion.button 
          layout
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={togglePlay}
          className={cn(
            "p-4 md:p-6 rounded-[1.5rem] md:rounded-[2rem] transition-all shadow-2xl relative group",
            isPlaying 
              ? "bg-gradient-to-br from-[#E74C3C] to-[#C0392B] text-white shadow-[#E74C3C]/30" 
              : "bg-gradient-to-br from-[#2ECC71] to-[#27AE60] text-white shadow-[#2ECC71]/30"
          )}
        >
          <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity rounded-[1.5rem] md:rounded-[2rem]" />
          {isPlaying ? (
            <Pause size={28} className="md:w-[32px] md:h-[32px]" fill="currentColor" />
          ) : (
            <Play size={28} className="md:w-[32px] md:h-[32px] ml-1 md:ml-1.5" fill="currentColor" />
          )}
        </motion.button>

        <motion.button 
          whileHover={{ scale: 1.2, x: 5 }}
          whileTap={{ scale: 0.9 }}
          className="p-2 md:p-4 text-white/20 hover:text-white transition-colors"
        >
          <SkipForward size={24} className="md:w-[28px] md:h-[28px]" fill="currentColor" />
        </motion.button>
      </div>

      {/* Extra Controls */}
      <div className="flex items-center gap-4 md:gap-6 z-10 order-3 md:order-3">
        <div className="hidden md:block w-[1px] h-8 bg-white/10" />

        <div className="flex items-center gap-2 md:gap-3">
          <motion.button 
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setPlaybackRate(Math.max(0.5, playbackRate - 0.1))}
            className="p-1 md:p-2 border border-white/10 rounded-lg text-white/40 hover:text-white hover:bg-white/5 font-black"
          >
            -
          </motion.button>
          
          <div className="flex flex-col items-center min-w-[36px]">
            <span className="text-[8px] md:text-[9px] uppercase font-black text-[#00A3FF] tracking-widest leading-none">Rate</span>
            <span className="text-white font-black text-sm md:text-base leading-none mt-1">{playbackRate.toFixed(1)}x</span>
          </div>

          <motion.button 
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setPlaybackRate(Math.min(2.0, playbackRate + 0.1))}
            className="p-1 md:p-2 border border-white/10 rounded-lg text-white/40 hover:text-white hover:bg-white/5 font-black"
          >
            +
          </motion.button>
        </div>

        <div className="hidden md:block w-[1px] h-8 bg-white/10" />

        <motion.button 
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={toggleFadeOut}
          className={cn(
            "flex flex-col items-center gap-1.5 p-2 md:p-3 rounded-2xl transition-all border",
            isFadeOut 
              ? "text-[#E74C3C] bg-[#E74C3C]/10 border-[#E74C3C]/30 shadow-lg shadow-[#E74C3C]/10" 
              : "text-white/20 bg-white/5 border-white/5 hover:text-white/60"
          )}
        >
          <TrendingDown size={18} className="md:w-[22px] md:h-[22px]" />
          <span className="text-[8px] md:text-[9px] font-black uppercase tracking-widest hidden sm:inline">Fade Out</span>
        </motion.button>
      </div>
    </div>
  );
};
