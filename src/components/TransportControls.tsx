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
    <div className="h-auto md:h-28 py-3 md:py-0 bg-[#0A0A0B]/95 backdrop-blur-2xl border-t border-white/5 flex flex-col md:flex-row items-center justify-center md:justify-between gap-3 md:gap-4 lg:gap-16 px-2 md:px-12 relative overflow-hidden z-50 rounded-t-3xl md:rounded-none pb-[max(12px,env(safe-area-inset-bottom))] md:pb-0">
      {/* Background Glow */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#00A3FF]/5 to-transparent pointer-events-none" />

      {/* Auxiliary Controls (Loop, Rate, FadeOut) - Shown at bottom on mobile */}
      <div className="flex items-center justify-center gap-1.5 sm:gap-2 md:gap-6 z-10 order-2 w-full md:w-auto bg-[#111112] md:bg-transparent p-1.5 md:p-0 rounded-2xl md:rounded-none border border-white/5 md:border-transparent shadow-inner md:shadow-none overflow-x-auto scrollbar-hide">
        <motion.button 
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={toggleLoop}
          className={cn(
            "flex flex-col items-center justify-center gap-1 w-12 h-10 sm:w-14 sm:h-12 md:w-auto md:h-auto md:p-3 rounded-xl transition-all border shrink-0",
            isLooping 
              ? "text-[#F1C40F] bg-[#F1C40F]/10 border-[#F1C40F]/30" 
              : "text-white/40 md:bg-white/5 border-transparent md:border-white/5 hover:text-white"
          )}
        >
          <Repeat size={16} className="md:w-[22px] md:h-[22px]" />
          <span className="text-[7px] md:text-[9px] font-black uppercase tracking-widest hidden sm:inline">Loop</span>
        </motion.button>

        <motion.button 
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={toggleInfiniteLoop}
          className={cn(
            "flex flex-col items-center justify-center gap-1 w-12 h-10 sm:w-14 sm:h-12 md:w-auto md:h-auto md:p-3 rounded-xl transition-all border shrink-0",
            isInfiniteLoop 
              ? "text-[#00A3FF] bg-[#00A3FF]/10 border-[#00A3FF]/30" 
              : "text-white/40 md:bg-white/5 border-transparent md:border-white/5 hover:text-white"
          )}
        >
          <InfinityIcon size={16} className="md:w-[22px] md:h-[22px]" />
          <span className="text-[7px] md:text-[9px] font-black uppercase tracking-widest hidden sm:inline">Infinite</span>
        </motion.button>

        <div className="w-[1px] h-6 bg-white/10 mx-0.5 shrink-0 md:hidden" />

        <div className="flex items-center gap-0.5 sm:gap-1 md:gap-3 bg-[#0A0A0B] md:bg-transparent rounded-xl p-0.5 md:p-0 shrink-0">
          <motion.button 
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setPlaybackRate(Math.max(0.5, playbackRate - 0.1))}
            className="w-6 h-8 sm:w-8 sm:h-10 md:w-auto md:h-auto p-1 md:p-2 border border-transparent md:border-white/10 rounded-lg text-white/40 hover:text-white md:hover:bg-white/5 font-black flex items-center justify-center"
          >
            -
          </motion.button>
          
          <div className="flex flex-col items-center min-w-[32px] sm:min-w-[36px]">
            <span className="text-[7px] md:text-[9px] uppercase font-black text-[#00A3FF] tracking-widest leading-none">Rate</span>
            <span className="text-white font-black text-xs md:text-base leading-none mt-1">{playbackRate.toFixed(1)}x</span>
          </div>

          <motion.button 
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setPlaybackRate(Math.min(2.0, playbackRate + 0.1))}
            className="w-6 h-8 sm:w-8 sm:h-10 md:w-auto md:h-auto p-1 md:p-2 border border-transparent md:border-white/10 rounded-lg text-white/40 hover:text-white md:hover:bg-white/5 font-black flex items-center justify-center"
          >
            +
          </motion.button>
        </div>

        <div className="w-[1px] h-6 bg-white/10 mx-0.5 shrink-0 md:hidden" />

        <motion.button 
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={toggleFadeOut}
          className={cn(
            "flex flex-col items-center justify-center gap-1 w-12 h-10 sm:w-14 sm:h-12 md:w-auto md:h-auto md:p-3 rounded-xl transition-all border shrink-0",
            isFadeOut 
              ? "text-[#E74C3C] bg-[#E74C3C]/10 border-[#E74C3C]/30" 
              : "text-white/40 md:bg-white/5 border-transparent md:border-white/5 hover:text-white"
          )}
        >
          <TrendingDown size={16} className="md:w-[22px] md:h-[22px]" />
          <span className="text-[7px] md:text-[9px] font-black uppercase tracking-widest hidden sm:inline">Fade Out</span>
        </motion.button>
      </div>

      {/* Main Playback Controls - Put this on top for mobile */}
      <div className="flex items-center justify-center gap-4 sm:gap-6 md:gap-10 z-10 order-1 w-full md:w-auto">
        <motion.button 
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className="p-2 sm:p-2 md:p-4 text-white/30 hover:text-white transition-colors"
        >
          <SkipBack size={24} className="sm:w-[28px] sm:h-[28px] md:w-[36px] md:h-[36px]" strokeWidth={1.5} />
        </motion.button>

        <motion.button 
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={stop}
          className="w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 bg-[#1A1A1C]/80 border border-white/5 rounded-[1rem] md:rounded-[1.75rem] text-white/40 hover:text-white hover:bg-[#252528] transition-all flex items-center justify-center"
        >
          <Square size={20} className="md:w-[28px] md:h-[28px]" strokeWidth={2.5} fill="currentColor" />
        </motion.button>

        <motion.button 
          layout
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={togglePlay}
          className={cn(
            "w-16 h-16 sm:w-20 sm:h-20 md:w-28 md:h-28 rounded-[1.25rem] md:rounded-[2.25rem] transition-all relative group focus:outline-none flex items-center justify-center",
            isPlaying 
              ? "bg-[#FF3B30] text-white shadow-[0_0_20px_rgba(255,59,48,0.3)]" 
              : "bg-[#34C759] text-white shadow-[0_0_20px_rgba(52,199,89,0.3)]"
          )}
        >
          <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity rounded-[1.25rem] md:rounded-[2.25rem]" />
          {isPlaying ? (
            <Pause size={28} className="md:w-[40px] md:h-[40px]" strokeWidth={3} fill="currentColor" />
          ) : (
            <Play size={28} className="md:w-[40px] md:h-[40px] ml-1 md:ml-2.5" strokeWidth={3} fill="currentColor" />
          )}
        </motion.button>

        <motion.button 
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className="p-2 sm:p-2 md:p-4 text-white/30 hover:text-white transition-colors"
        >
          <SkipForward size={24} className="sm:w-[28px] sm:h-[28px] md:w-[36px] md:h-[36px]" strokeWidth={1.5} />
        </motion.button>
      </div>

      <div className="hidden md:flex flex-1 order-3 opacity-0 pointer-events-none">
        {/* Invisible spacer for flex balance on desktop */}
      </div>
    </div>
  );
};
