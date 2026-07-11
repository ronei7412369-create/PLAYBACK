import React from 'react';
import { usePlayerStore } from '../store/usePlayerStore';
import { handleMidiRightClick } from '../store/useMidiStore';
import { Play, Pause, Square, Repeat, Infinity as InfinityIcon, TrendingDown, SkipBack, SkipForward } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';

export const TransportControls: React.FC = () => {
  const { 
    isPlaying, togglePlay, stop, 
    isLooping, toggleLoop,
    isInfiniteLoop, toggleInfiniteLoop,
    isFadeOut, triggerFadeOut: toggleFadeOut,
    playbackRate, setPlaybackRate,
    currentSong, globalBpm, tapTempo, updateBpm
  } = usePlayerStore();

  const [isTapFlashed, setIsTapFlashed] = React.useState(false);
  const bpm = currentSong?.bpm || globalBpm || 120;
  const beatDuration = 60 / bpm;

  return (
    <div className="mx-auto my-2.5 sm:my-3 md:my-4 max-w-[95%] w-[95%] h-auto md:h-20 lg:h-24 py-2.5 md:py-0 ios-glass border border-white/10 flex flex-col md:flex-row items-center justify-center md:justify-between gap-2.5 md:gap-3 lg:gap-8 px-4 md:px-8 relative overflow-hidden z-50 rounded-2xl md:rounded-[1.75rem] shadow-2xl pb-[max(10px,env(safe-area-inset-bottom))] md:pb-0 shrink-0">
      {/* Background Glow */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#00A3FF]/5 to-transparent pointer-events-none" />

      {/* Auxiliary Controls (Loop, Rate, FadeOut) - Shown at bottom on mobile */}
      <div className="flex items-center justify-center gap-1.5 sm:gap-2 md:gap-6 z-10 order-2 w-full md:w-auto bg-white/5 md:bg-transparent p-1.5 md:p-0 rounded-2xl md:rounded-none border border-white/5 md:border-transparent shadow-inner md:shadow-none overflow-x-auto scrollbar-hide">
        <motion.button 
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={toggleLoop}
          onContextMenu={(e) => handleMidiRightClick(e, 'loop', 'Loop')}
          className={cn(
            "flex flex-col items-center justify-center gap-1 w-11 h-9 sm:w-13 sm:h-11 md:w-14 md:h-14 rounded-2xl transition-all border shrink-0",
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
          onContextMenu={(e) => handleMidiRightClick(e, 'infinite_loop', 'Infinite Loop')}
          className={cn(
            "flex flex-col items-center justify-center gap-1 w-11 h-9 sm:w-13 sm:h-11 md:w-14 md:h-14 rounded-2xl transition-all border shrink-0",
            isInfiniteLoop 
              ? "text-[#00A3FF] bg-[#00A3FF]/10 border-[#00A3FF]/30 shadow-[0_0_15px_rgba(0,163,255,0.15)]" 
              : "text-white/40 bg-white/5 border-transparent hover:text-white"
          )}
        >
          <InfinityIcon size={16} className="md:w-[20px] md:h-[20px]" />
          <span className="text-[7px] md:text-[9px] font-extrabold uppercase tracking-widest hidden sm:inline">Infinite</span>
        </motion.button>

        <div className="w-[1px] h-6 bg-white/10 mx-0.5 shrink-0 md:hidden" />

        <div className="flex items-center gap-0.5 sm:gap-1 md:gap-3 bg-black/40 md:bg-white/5 border border-white/5 md:border-transparent rounded-2xl p-0.5 md:p-2 shrink-0 h-9 sm:h-11 md:h-14 md:w-24 items-center justify-center">
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
          onContextMenu={(e) => handleMidiRightClick(e, 'fade_out', 'Fade Out')}
          className={cn(
            "flex flex-col items-center justify-center gap-1 w-11 h-9 sm:w-13 sm:h-11 md:w-14 md:h-14 rounded-2xl transition-all border shrink-0",
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
          onContextMenu={(e) => handleMidiRightClick(e, 'stop', 'Stop')}
          className="w-11 h-11 sm:w-12 sm:h-12 md:w-14 md:h-14 bg-white/5 border border-white/10 rounded-xl md:rounded-[1.25rem] text-white/60 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all flex items-center justify-center shadow-lg"
        >
          <Square size={16} className="md:w-[22px] md:h-[22px]" strokeWidth={2.5} fill="currentColor" />
        </motion.button>

        <motion.button 
          layout
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={togglePlay}
          onContextMenu={(e) => handleMidiRightClick(e, 'play_pause', 'Play / Pause')}
          className={cn(
            "w-14 h-14 sm:w-16 sm:h-16 md:w-18 md:h-18 rounded-2xl md:rounded-[1.5rem] transition-all relative group focus:outline-none flex items-center justify-center border",
            isPlaying 
              ? "bg-gradient-to-tr from-[#FF3B30] to-[#FF453A] border-[#FF3B30]/50 text-white shadow-[0_0_30px_rgba(255,59,48,0.45)]" 
              : "bg-gradient-to-tr from-[#34C759] to-[#30D158] border-[#34C759]/50 text-white shadow-[0_0_30px_rgba(52,199,89,0.45)]"
          )}
        >
          <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl md:rounded-[1.5rem]" />
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

      {/* Tap Tempo & Master Clock Section */}
      <div className="flex items-center justify-center gap-3 z-10 order-3 w-full md:w-auto bg-white/5 md:bg-transparent p-1.5 md:p-0 rounded-2xl md:rounded-none border border-white/5 md:border-transparent shadow-inner md:shadow-none shrink-0">
        {/* Info & Micro controls */}
        <div className="flex flex-col items-start gap-0.5 min-w-[70px] pl-1">
          <span className="text-[7px] md:text-[8px] font-black uppercase text-[#00A3FF] tracking-wider leading-none">Master Clock</span>
          <div className="flex items-center gap-1.5 mt-0.5">
            <button 
              onClick={() => updateBpm(-1)}
              className="w-5 h-5 rounded bg-white/5 border border-white/10 text-white/50 hover:text-white flex items-center justify-center font-extrabold text-xs"
            >
              -
            </button>
            <span className="text-white font-extrabold text-xs md:text-sm tabular-nums leading-none min-w-[28px] text-center">
              {bpm}
            </span>
            <button 
              onClick={() => updateBpm(1)}
              className="w-5 h-5 rounded bg-white/5 border border-white/10 text-white/50 hover:text-white flex items-center justify-center font-extrabold text-xs"
            >
              +
            </button>
            <span className="text-[7px] text-white/40 font-bold uppercase leading-none">BPM</span>
          </div>
        </div>

        {/* Pulsing Visual Beat Metronome */}
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-white/5 border border-white/10" title="Visual Beat Indicator">
          <motion.div
            key={bpm}
            animate={{
              scale: [1, 1.4, 1],
              opacity: [0.4, 1, 0.4],
            }}
            transition={{
              duration: beatDuration,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="w-2.5 h-2.5 rounded-full bg-[#00A3FF] shadow-[0_0_12px_#00A3FF]"
          />
        </div>

        {/* Tap Tempo Button */}
        <motion.button 
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            tapTempo();
            setIsTapFlashed(true);
            setTimeout(() => setIsTapFlashed(false), 120);
          }}
          onContextMenu={(e) => handleMidiRightClick(e, 'tap_tempo', 'Tap Tempo')}
          className={cn(
            "flex flex-col items-center justify-center gap-0.5 w-12 h-9 sm:w-14 sm:h-11 md:w-16 md:h-14 rounded-2xl transition-all border shrink-0",
            isTapFlashed 
              ? "bg-[#00A3FF]/30 border-[#00A3FF] text-white shadow-[0_0_20px_rgba(0,163,255,0.4)]" 
              : "text-[#00A3FF] bg-[#00A3FF]/10 border-[#00A3FF]/20 hover:bg-[#00A3FF]/15 hover:border-[#00A3FF]/30"
          )}
        >
          <span className="text-xs font-black uppercase tracking-widest leading-none">TAP</span>
          <span className="text-[6px] md:text-[8px] font-bold uppercase tracking-wider text-white/40 leading-none">TEMPO</span>
        </motion.button>
      </div>
    </div>
  );
};
