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
    <div className="h-auto md:h-28 py-4 md:py-0 bg-[#0A0A0B]/95 backdrop-blur-2xl border-t border-white/5 flex flex-col md:flex-row items-center justify-center md:justify-between gap-4 lg:gap-16 px-4 md:px-12 relative overflow-hidden z-50 rounded-t-3xl md:rounded-none pb-safe">
      {/* Background Glow */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#00A3FF]/5 to-transparent pointer-events-none" />

      {/* Auxiliary Controls (Loop, Rate, FadeOut) - Shown at bottom on mobile */}
      <div className="flex items-center justify-center gap-2 md:gap-6 z-10 order-2 w-full md:w-auto bg-[#111112] md:bg-transparent p-2 md:p-0 rounded-2xl md:rounded-none border border-white/5 md:border-transparent shadow-inner md:shadow-none">
        <motion.button 
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={toggleLoop}
          className={cn(
            "flex flex-col items-center justify-center gap-1.5 w-14 h-12 md:w-auto md:h-auto md:p-3 rounded-xl transition-all border",
            isLooping 
              ? "text-[#F1C40F] bg-[#F1C40F]/10 border-[#F1C40F]/30" 
              : "text-white/40 md:bg-white/5 border-transparent md:border-white/5 hover:text-white"
          )}
        >
          <Repeat size={18} className="md:w-[22px] md:h-[22px]" />
          <span className="text-[8px] md:text-[9px] font-black uppercase tracking-widest hidden sm:inline">Loop</span>
        </motion.button>

        <motion.button 
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={toggleInfiniteLoop}
          className={cn(
            "flex flex-col items-center justify-center gap-1.5 w-14 h-12 md:w-auto md:h-auto md:p-3 rounded-xl transition-all border",
            isInfiniteLoop 
              ? "text-[#00A3FF] bg-[#00A3FF]/10 border-[#00A3FF]/30" 
              : "text-white/40 md:bg-white/5 border-transparent md:border-white/5 hover:text-white"
          )}
        >
          <InfinityIcon size={18} className="md:w-[22px] md:h-[22px]" />
          <span className="text-[8px] md:text-[9px] font-black uppercase tracking-widest hidden sm:inline">Infinite</span>
        </motion.button>

        <div className="w-[1px] h-8 bg-white/10 mx-1 md:hidden" />

        <div className="flex items-center gap-1 md:gap-3 bg-[#0A0A0B] md:bg-transparent rounded-xl p-1 md:p-0">
          <motion.button 
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setPlaybackRate(Math.max(0.5, playbackRate - 0.1))}
            className="w-8 h-10 md:w-auto md:h-auto p-1 md:p-2 border border-transparent md:border-white/10 rounded-lg text-white/40 hover:text-white md:hover:bg-white/5 font-black flex items-center justify-center"
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
            className="w-8 h-10 md:w-auto md:h-auto p-1 md:p-2 border border-transparent md:border-white/10 rounded-lg text-white/40 hover:text-white md:hover:bg-white/5 font-black flex items-center justify-center"
          >
            +
          </motion.button>
        </div>

        <div className="w-[1px] h-8 bg-white/10 mx-1 md:hidden" />

        <motion.button 
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={toggleFadeOut}
          className={cn(
            "flex flex-col items-center justify-center gap-1.5 w-14 h-12 md:w-auto md:h-auto md:p-3 rounded-xl transition-all border",
            isFadeOut 
              ? "text-[#E74C3C] bg-[#E74C3C]/10 border-[#E74C3C]/30" 
              : "text-white/40 md:bg-white/5 border-transparent md:border-white/5 hover:text-white"
          )}
        >
          <TrendingDown size={18} className="md:w-[22px] md:h-[22px]" />
          <span className="text-[8px] md:text-[9px] font-black uppercase tracking-widest hidden sm:inline">Fade Out</span>
        </motion.button>
      </div>

      {/* Main Playback Controls - Put this on top for mobile */}
      <div className="flex items-center justify-center gap-6 md:gap-8 z-10 order-1 w-full md:w-auto">
        <motion.button 
          whileHover={{ scale: 1.2, x: -5 }}
          whileTap={{ scale: 0.9 }}
          className="p-2 md:p-4 text-white/40 hover:text-white transition-colors"
        >
          <SkipBack size={26} className="md:w-[28px] md:h-[28px]" fill="currentColor" />
        </motion.button>

        <motion.button 
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={stop}
          className="p-4 md:p-5 bg-white/5 border border-white/5 md:border-white/10 rounded-2xl md:rounded-3xl text-white/60 hover:text-white hover:bg-white/10 transition-all shadow-lg"
        >
          <Square size={22} className="md:w-[24px] md:h-[24px]" fill="currentColor" />
        </motion.button>

        <motion.button 
          layout
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={togglePlay}
          className={cn(
            "p-5 md:p-6 rounded-[1.75rem] md:rounded-[2rem] transition-all shadow-2xl relative group focus:outline-none focus:ring-4 focus:ring-white/10",
            isPlaying 
              ? "bg-gradient-to-br from-[#E74C3C] to-[#C0392B] text-white shadow-[#E74C3C]/30" 
              : "bg-gradient-to-br from-[#2ECC71] to-[#27AE60] text-white shadow-[#2ECC71]/30"
          )}
          style={{ width: '80px', height: '80px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity rounded-[1.75rem] md:rounded-[2rem]" />
          {isPlaying ? (
            <Pause size={28} className="md:w-[32px] md:h-[32px]" fill="currentColor" />
          ) : (
            <Play size={28} className="md:w-[32px] md:h-[32px] ml-1.5 md:ml-2" fill="currentColor" />
          )}
        </motion.button>

        <motion.button 
          whileHover={{ scale: 1.2, x: 5 }}
          whileTap={{ scale: 0.9 }}
          className="p-2 md:p-4 text-white/40 hover:text-white transition-colors"
        >
          <SkipForward size={26} className="md:w-[28px] md:h-[28px]" fill="currentColor" />
        </motion.button>
      </div>

      <div className="hidden md:flex flex-1 order-3 opacity-0 pointer-events-none">
        {/* Invisible spacer for flex balance on desktop */}
      </div>
    </div>
  );
};
