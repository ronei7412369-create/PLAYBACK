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
    <div className="mx-auto my-6 max-w-[95%] w-[95%] h-auto md:h-28 py-4 md:py-0 ios-glass border border-white/10 flex flex-col md:flex-row items-center justify-center md:justify-between gap-3 md:gap-4 lg:gap-16 px-4 md:px-12 relative overflow-hidden z-50 rounded-[2.25rem] shadow-2xl pb-[max(16px,env(safe-area-inset-bottom))] md:pb-0 shrink-0">
      {/* Background Glow */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#00A3FF]/5 to-transparent pointer-events-none" />

      {/* Auxiliary Controls (Loop, Rate, FadeOut) - Shown at bottom on mobile */}
      <div className="flex items-center justify-center gap-1.5 sm:gap-2 md:gap-6 z-10 order-2 w-full md:w-auto bg-white/5 md:bg-transparent p-1.5 md:p-0 rounded-2xl md:rounded-none border border-white/5 md:border-transparent shadow-inner md:shadow-none overflow-x-auto scrollbar-hide">
        <motion.button 
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={toggleLoop}
          className={cn(
            "flex flex-col items-center justify-center gap-1 w-12 h-10 sm:w-14 sm:h-12 md:w-16 md:h-16 rounded-2xl transition-all border shrink-0",
            isLooping 
              ? "text-[#FFD60A] bg-[#FFD60A]/10 border-[#FFD60A]/30 shadow-[0_0_15px_rgba(255,214,10,0.15)]" 
              : "text-white/40 bg-white/5 border-transparent hover:text-white"
          )}
        >
          <Repeat size={16} className="md:w-[20px] md:h-[20px]" />
          <span className="text-[7px] md:text-[9px] font-extrabold uppercase tracking-widest hidden sm:inline">Loop</span>
        </motion.button>

        <motion.button 
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={toggleInfiniteLoop}
          className={cn(
            "flex flex-col items-center justify-center gap-1 w-12 h-10 sm:w-14 sm:h-12 md:w-16 md:h-16 rounded-2xl transition-all border shrink-0",
            isInfiniteLoop 
              ? "text-[#00A3FF] bg-[#00A3FF]/10 border-[#00A3FF]/30 shadow-[0_0_15px_rgba(0,163,255,0.15)]" 
              : "text-white/40 bg-white/5 border-transparent hover:text-white"
          )}
        >
          <InfinityIcon size={16} className="md:w-[20px] md:h-[20px]" />
          <span className="text-[7px] md:text-[9px] font-extrabold uppercase tracking-widest hidden sm:inline">Infinite</span>
        </motion.button>

        <div className="w-[1px] h-6 bg-white/10 mx-0.5 shrink-0 md:hidden" />

        <div className="flex items-center gap-0.5 sm:gap-1 md:gap-3 bg-black/40 md:bg-white/5 border border-white/5 md:border-transparent rounded-2xl p-0.5 md:p-3 shrink-0 h-10 sm:h-12 md:h-16 md:w-28 items-center justify-center">
          <motion.button 
            whileHover={{ scale: 1.15 }}
            whileTap={{ scale: 0.85 }}
            onClick={() => setPlaybackRate(Math.max(0.5, playbackRate - 0.1))}
            className="w-5 h-7 sm:w-7 sm:h-9 md:w-6 md:h-6 border border-transparent md:border-white/10 rounded-lg text-white/40 hover:text-white md:hover:bg-white/5 font-extrabold flex items-center justify-center"
          >
            -
          </motion.button>
          
          <div className="flex flex-col items-center min-w-[32px] sm:min-w-[36px]">
            <span className="text-[6px] md:text-[8px] uppercase font-black text-[#00A3FF] tracking-widest leading-none">Rate</span>
            <span className="text-white font-extrabold text-xs md:text-sm mt-0.5 tabular-nums">{playbackRate.toFixed(1)}x</span>
          </div>

          <motion.button 
            whileHover={{ scale: 1.15 }}
            whileTap={{ scale: 0.85 }}
            onClick={() => setPlaybackRate(Math.min(2.0, playbackRate + 0.1))}
            className="w-5 h-7 sm:w-7 sm:h-9 md:w-6 md:h-6 border border-transparent md:border-white/10 rounded-lg text-white/40 hover:text-white md:hover:bg-white/5 font-extrabold flex items-center justify-center"
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
            "flex flex-col items-center justify-center gap-1 w-12 h-10 sm:w-14 sm:h-12 md:w-16 md:h-16 rounded-2xl transition-all border shrink-0",
            isFadeOut 
              ? "text-[#FF453A] bg-[#FF453A]/10 border-[#FF453A]/30 shadow-[0_0_15px_rgba(255,69,58,0.15)]" 
              : "text-white/40 bg-white/5 border-transparent hover:text-white"
          )}
        >
          <TrendingDown size={16} className="md:w-[20px] md:h-[20px]" />
          <span className="text-[7px] md:text-[9px] font-extrabold uppercase tracking-widest hidden sm:inline">Fade Out</span>
        </motion.button>
      </div>

      {/* Main Playback Controls - Put this on top for mobile */}
      <div className="flex items-center justify-center gap-4 sm:gap-6 md:gap-10 z-10 order-1 w-full md:w-auto">
        <motion.button 
          whileHover={{ scale: 1.15 }}
          whileTap={{ scale: 0.85 }}
          className="p-2 text-white/30 hover:text-white transition-colors"
        >
          <SkipBack size={22} className="sm:w-[26px] sm:h-[26px] md:w-[32px] md:h-[32px]" strokeWidth={1.5} />
        </motion.button>

        <motion.button 
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={stop}
          className="w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 bg-white/5 border border-white/10 rounded-[1.25rem] md:rounded-[1.75rem] text-white/60 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all flex items-center justify-center shadow-lg"
        >
          <Square size={16} className="md:w-[22px] md:h-[22px]" strokeWidth={2.5} fill="currentColor" />
        </motion.button>

        <motion.button 
          layout
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={togglePlay}
          className={cn(
            "w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-[1.5rem] md:rounded-[2rem] transition-all relative group focus:outline-none flex items-center justify-center border",
            isPlaying 
              ? "bg-gradient-to-tr from-[#FF3B30] to-[#FF453A] border-[#FF3B30]/50 text-white shadow-[0_0_30px_rgba(255,59,48,0.45)]" 
              : "bg-gradient-to-tr from-[#34C759] to-[#30D158] border-[#34C759]/50 text-white shadow-[0_0_30px_rgba(52,199,89,0.45)]"
          )}
        >
          <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity rounded-[1.5rem] md:rounded-[2rem]" />
          {isPlaying ? (
            <Pause size={24} className="md:w-[32px] md:h-[32px]" strokeWidth={3} fill="currentColor" />
          ) : (
            <Play size={24} className="md:w-[32px] md:h-[32px] ml-1 md:ml-1.5" strokeWidth={3} fill="currentColor" />
          )}
        </motion.button>

        <motion.button 
          whileHover={{ scale: 1.15 }}
          whileTap={{ scale: 0.85 }}
          className="p-2 text-white/30 hover:text-white transition-colors"
        >
          <SkipForward size={22} className="sm:w-[26px] sm:h-[26px] md:w-[32px] md:h-[32px]" strokeWidth={1.5} />
        </motion.button>
      </div>

      <div className="hidden md:flex flex-1 order-3 opacity-0 pointer-events-none">
        {/* Invisible spacer for flex balance on desktop */}
      </div>
    </div>
  );
};
