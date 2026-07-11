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
    <div className={cn(
      "mx-auto my-3 sm:my-4 md:my-5 max-w-[96%] w-[96%] h-auto md:h-24 lg:h-28 py-3 md:py-0",
      "bg-[#070913]/90 backdrop-blur-2xl border border-white/10 flex flex-col md:flex-row items-center justify-between",
      "gap-4 md:gap-3 lg:gap-8 px-4 sm:px-6 md:px-8 relative overflow-hidden z-50 rounded-[1.75rem] md:rounded-[2.25rem] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8)]",
      "transition-all duration-500 pb-[max(12px,env(safe-area-inset-bottom))] md:pb-0 shrink-0",
      isPlaying ? "shadow-[0_0_50px_rgba(0,163,255,0.15)] border-white/15" : "border-white/10"
    )}>
      
      {/* Background Interactive Glow */}
      <div className={cn(
        "absolute inset-0 bg-gradient-to-t from-[#00A3FF]/5 to-transparent pointer-events-none transition-opacity duration-1000",
        isPlaying ? "opacity-100" : "opacity-30"
      )} />

      {/* "ON AIR" / Top Gradient Laser Line */}
      <div className={cn(
        "absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#00A3FF] to-transparent pointer-events-none transition-transform duration-700",
        isPlaying ? "translate-y-0 opacity-100 scale-x-100" : "-translate-y-full opacity-0 scale-x-50"
      )} />

      {/* Immersive Soundwave Background Visualization */}
      <div className="absolute inset-0 flex items-end justify-center gap-[3px] px-16 pointer-events-none opacity-[0.06] select-none h-full pt-6">
        {Array.from({ length: 44 }).map((_, i) => {
          const defaultHeight = 15 + Math.sin(i * 0.25) * 15 + Math.cos(i * 0.1) * 10;
          const delay = `${(i % 8) * 0.1}s`;
          const speed = `${0.6 + (i % 5) * 0.15}s`;
          
          return (
            <div
              key={i}
              style={{
                height: `${defaultHeight}%`,
                animationDelay: delay,
                animationDuration: speed,
                animationPlayState: isPlaying ? 'running' : 'paused',
              }}
              className={cn(
                "w-[3px] bg-[#00A3FF] rounded-full transition-all duration-500 origin-bottom",
                isPlaying ? "animate-[synth-pulse_0.7s_ease-in-out_infinite_alternate]" : "h-[4px]"
              )}
            />
          );
        })}
      </div>

      {/* ==========================================
          POD 1: AUXILIARY CONTROLS (LOOP, INF, RATE, FADE)
          ========================================== */}
      <div className="w-full md:w-auto flex items-center justify-between md:justify-start gap-2 sm:gap-3 lg:gap-4 z-10 order-2 md:order-1 bg-white/[0.03] md:bg-transparent p-2 md:p-0 rounded-2xl md:rounded-none border border-white/5 md:border-transparent">
        
        {/* Loop Control */}
        <motion.button 
          whileHover={{ scale: 1.05, y: -1 }}
          whileTap={{ scale: 0.95 }}
          onClick={toggleLoop}
          onContextMenu={(e) => handleMidiRightClick(e, 'loop', 'Loop')}
          className={cn(
            "flex flex-col items-center justify-center gap-1.5 w-14 h-12 sm:w-16 sm:h-14 md:w-15 md:h-15 lg:w-18 lg:h-18 rounded-2xl transition-all border shrink-0 relative group",
            isLooping 
              ? "text-[#FFD60A] bg-[#FFD60A]/10 border-[#FFD60A]/30 shadow-[0_0_20px_rgba(255,214,10,0.15)]" 
              : "text-white/40 bg-white/[0.02] border-white/5 hover:text-white hover:border-white/10 hover:bg-white/[0.04]"
          )}
        >
          {/* Hardware LED Indicator */}
          <span className={cn(
            "absolute top-1.5 w-1.5 h-1.5 rounded-full transition-all",
            isLooping ? "bg-[#FFD60A] shadow-[0_0_8px_#FFD60A]" : "bg-neutral-800"
          )} />
          <Repeat size={16} className="md:w-[20px] md:h-[20px] mt-1" />
          <span className="text-[7px] md:text-[8px] font-black uppercase tracking-widest hidden sm:inline">Loop</span>
        </motion.button>

        {/* Infinite Control */}
        <motion.button 
          whileHover={{ scale: 1.05, y: -1 }}
          whileTap={{ scale: 0.95 }}
          onClick={toggleInfiniteLoop}
          onContextMenu={(e) => handleMidiRightClick(e, 'infinite_loop', 'Infinite Loop')}
          className={cn(
            "flex flex-col items-center justify-center gap-1.5 w-14 h-12 sm:w-16 sm:h-14 md:w-15 md:h-15 lg:w-18 lg:h-18 rounded-2xl transition-all border shrink-0 relative group",
            isInfiniteLoop 
              ? "text-[#00A3FF] bg-[#00A3FF]/10 border-[#00A3FF]/30 shadow-[0_0_20px_rgba(0,163,255,0.15)]" 
              : "text-white/40 bg-white/[0.02] border-white/5 hover:text-white hover:border-white/10 hover:bg-white/[0.04]"
          )}
        >
          {/* Hardware LED Indicator */}
          <span className={cn(
            "absolute top-1.5 w-1.5 h-1.5 rounded-full transition-all",
            isInfiniteLoop ? "bg-[#00A3FF] shadow-[0_0_8px_#00A3FF]" : "bg-neutral-800"
          )} />
          <InfinityIcon size={16} className="md:w-[20px] md:h-[20px] mt-1" />
          <span className="text-[7px] md:text-[8px] font-black uppercase tracking-widest hidden sm:inline">Infinite</span>
        </motion.button>

        <div className="w-[1px] h-8 bg-white/10 mx-0.5 shrink-0 md:hidden" />

        {/* Rate (Tempo Fader Style) */}
        <div className="flex flex-col items-center gap-1 group relative">
          <div className="flex items-center gap-1.5 bg-black/40 border border-white/5 md:border-white/10 rounded-2xl px-2.5 py-1.5 h-12 sm:h-14 md:h-15 lg:h-18 justify-center min-w-[90px] sm:min-w-[100px] md:min-w-[110px]">
            <motion.button 
              whileHover={{ scale: 1.15 }}
              whileTap={{ scale: 0.85 }}
              onClick={() => setPlaybackRate(Math.max(0.5, playbackRate - 0.1))}
              className="w-5 h-5 sm:w-6 sm:h-6 md:w-5 md:h-5 lg:w-6 lg:h-6 border border-white/10 rounded-lg text-white/40 hover:text-white hover:bg-white/5 font-black flex items-center justify-center transition-colors"
            >
              -
            </motion.button>
            
            <div className="flex flex-col items-center min-w-[36px] sm:min-w-[40px]">
              <span className="text-[6px] md:text-[7px] uppercase font-black text-[#00A3FF] tracking-wider leading-none">Rate</span>
              <span className="text-white font-black text-xs sm:text-sm mt-0.5 tabular-nums leading-none">{playbackRate.toFixed(1)}x</span>
            </div>

            <motion.button 
              whileHover={{ scale: 1.15 }}
              whileTap={{ scale: 0.85 }}
              onClick={() => setPlaybackRate(Math.min(2.0, playbackRate + 0.1))}
              className="w-5 h-5 sm:w-6 sm:h-6 md:w-5 md:h-5 lg:w-6 lg:h-6 border border-white/10 rounded-lg text-white/40 hover:text-white hover:bg-white/5 font-black flex items-center justify-center transition-colors"
            >
              +
            </motion.button>
          </div>
          
          {/* Sleek Fader Track Visualizer */}
          <div className="w-full px-1 hidden md:block">
            <div className="h-1 bg-white/10 rounded-full relative overflow-hidden">
              <motion.div 
                layoutId="rateFader"
                className="absolute top-0 left-0 h-full bg-[#00A3FF] shadow-[0_0_8px_rgba(0,163,255,0.7)]"
                style={{ width: `${((playbackRate - 0.5) / 1.5) * 100}%` }}
              />
            </div>
          </div>
        </div>

        <div className="w-[1px] h-8 bg-white/10 mx-0.5 shrink-0 md:hidden" />

        {/* Fade Out Control */}
        <motion.button 
          whileHover={{ scale: 1.05, y: -1 }}
          whileTap={{ scale: 0.95 }}
          onClick={toggleFadeOut}
          onContextMenu={(e) => handleMidiRightClick(e, 'fade_out', 'Fade Out')}
          className={cn(
            "flex flex-col items-center justify-center gap-1.5 w-14 h-12 sm:w-16 sm:h-14 md:w-15 md:h-15 lg:w-18 lg:h-18 rounded-2xl transition-all border shrink-0 relative group",
            isFadeOut 
              ? "text-[#FF453A] bg-[#FF453A]/10 border-[#FF453A]/30 shadow-[0_0_20px_rgba(255,69,58,0.15)]" 
              : "text-white/40 bg-white/[0.02] border-white/5 hover:text-white hover:border-white/10 hover:bg-white/[0.04]"
          )}
        >
          {/* Hardware LED Indicator */}
          <span className={cn(
            "absolute top-1.5 w-1.5 h-1.5 rounded-full transition-all",
            isFadeOut ? "bg-[#FF453A] shadow-[0_0_8px_#FF453A]" : "bg-neutral-800"
          )} />
          <TrendingDown size={16} className="md:w-[20px] md:h-[20px] mt-1" />
          <span className="text-[7px] md:text-[8px] font-black uppercase tracking-widest hidden sm:inline">Fade Out</span>
        </motion.button>
      </div>

      {/* ==========================================
          POD 2: CORE TRANSPORT CONTROLS (PLAY, STOP, SKIPS)
          ========================================== */}
      <div className="w-full md:w-auto flex items-center justify-between sm:justify-center gap-4 sm:gap-6 md:gap-6 lg:gap-8 z-10 order-1 md:order-2">
        
        {/* Skip Back */}
        <motion.button 
          whileHover={{ scale: 1.15 }}
          whileTap={{ scale: 0.85 }}
          className="p-2.5 text-white/40 hover:text-white transition-all bg-white/[0.02] hover:bg-white/5 border border-transparent hover:border-white/5 rounded-full"
        >
          <SkipBack size={20} className="sm:w-[24px] sm:h-[24px] md:w-[26px] md:h-[26px]" strokeWidth={1.5} />
        </motion.button>

        {/* Stop Button */}
        <motion.button 
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={stop}
          onContextMenu={(e) => handleMidiRightClick(e, 'stop', 'Stop')}
          className="w-12 h-12 sm:w-14 sm:h-14 md:w-15 md:h-15 lg:w-18 lg:h-18 bg-[#121626] border border-white/10 hover:border-white/20 rounded-2xl text-white/50 hover:text-white hover:bg-[#1a1f35] transition-all flex items-center justify-center shadow-lg relative group"
        >
          <div className="absolute inset-0 bg-white/[0.02] opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl" />
          <Square size={16} className="md:w-[20px] md:h-[20px]" strokeWidth={2} fill="currentColor" />
        </motion.button>

        {/* Play/Pause Main Trigger */}
        <div className="relative">
          {/* Glowing Halo */}
          <div className={cn(
            "absolute -inset-1.5 rounded-[1.75rem] blur-xl opacity-40 transition-all duration-1000",
            isPlaying 
              ? "bg-gradient-to-tr from-rose-500 to-red-500 animate-pulse scale-105" 
              : "bg-gradient-to-tr from-emerald-400 to-teal-400"
          )} />

          {/* Rotating Ring Around Play State */}
          {isPlaying && (
            <div className="absolute inset-0 border-2 border-dashed border-red-500/50 rounded-[1.5rem] md:rounded-[1.75rem] animate-[slow-rotate_8s_linear_infinite]" />
          )}

          <motion.button 
            layout
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            onClick={togglePlay}
            onContextMenu={(e) => handleMidiRightClick(e, 'play_pause', 'Play / Pause')}
            className={cn(
              "w-16 h-16 sm:w-18 sm:h-18 md:w-20 md:h-20 lg:w-22 lg:h-22 rounded-2xl md:rounded-[1.75rem] transition-all relative group focus:outline-none flex items-center justify-center border z-10",
              isPlaying 
                ? "bg-gradient-to-tr from-[#FF3B30] to-[#FF453A] border-[#FF3B30]/40 text-white shadow-[0_0_30px_rgba(255,59,48,0.5)]" 
                : "bg-gradient-to-tr from-[#34C759] to-[#30D158] border-[#34C759]/40 text-white shadow-[0_0_30px_rgba(52,199,89,0.5)]"
            )}
          >
            <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl md:rounded-[1.75rem]" />
            {isPlaying ? (
              <Pause size={24} className="md:w-[32px] md:h-[32px]" strokeWidth={3} fill="currentColor" />
            ) : (
              <Play size={24} className="md:w-[32px] md:h-[32px] ml-1 md:ml-1.5" strokeWidth={3} fill="currentColor" />
            )}
          </motion.button>
        </div>

        {/* Skip Forward */}
        <motion.button 
          whileHover={{ scale: 1.15 }}
          whileTap={{ scale: 0.85 }}
          className="p-2.5 text-white/40 hover:text-white transition-all bg-white/[0.02] hover:bg-white/5 border border-transparent hover:border-white/5 rounded-full"
        >
          <SkipForward size={20} className="sm:w-[24px] sm:h-[24px] md:w-[26px] md:h-[26px]" strokeWidth={1.5} />
        </motion.button>
      </div>

      {/* ==========================================
          POD 3: MASTER CLOCK & TAP TEMPO (BPM SYSTEM)
          ========================================== */}
      <div className="w-full md:w-auto flex items-center justify-between md:justify-start gap-3 lg:gap-4 z-10 order-3 bg-white/[0.03] md:bg-transparent p-2 md:p-0 rounded-2xl md:rounded-none border border-white/5 md:border-transparent">
        
        {/* Digital BPM Readout Display */}
        <div className="flex flex-col items-start gap-1 min-w-[85px] sm:min-w-[95px] md:min-w-[105px]">
          <span className="text-[7px] md:text-[8px] font-black uppercase text-[#00A3FF] tracking-widest leading-none">Master Clock</span>
          <div className="flex items-center gap-1.5 mt-0.5 w-full bg-black/40 border border-white/5 rounded-xl p-1 justify-between">
            <button 
              onClick={() => updateBpm(-1)}
              className="w-5 h-5 rounded-lg bg-white/5 border border-white/10 text-white/40 hover:text-white flex items-center justify-center font-bold text-xs hover:bg-white/10 transition-colors"
            >
              -
            </button>
            <div className="flex items-baseline gap-0.5 justify-center flex-1">
              <span className="text-white font-black text-sm md:text-base tabular-nums leading-none">
                {bpm}
              </span>
              <span className="text-[6px] text-white/40 font-bold uppercase">BPM</span>
            </div>
            <button 
              onClick={() => updateBpm(1)}
              className="w-5 h-5 rounded-lg bg-white/5 border border-white/10 text-white/40 hover:text-white flex items-center justify-center font-bold text-xs hover:bg-white/10 transition-colors"
            >
              +
            </button>
          </div>
        </div>

        {/* Concentric Radar Metronome Visualizer */}
        <div className="relative flex items-center justify-center w-10 h-10 rounded-full bg-black/40 border border-white/10 overflow-hidden shrink-0" title="Visual Beat Indicator">
          {/* Ripple Ring */}
          <motion.div
            key={`ripple-${bpm}-${isPlaying}`}
            animate={isPlaying ? {
              scale: [1, 1.8],
              opacity: [0.6, 0],
            } : {
              scale: 1,
              opacity: 0.2
            }}
            transition={{
              duration: beatDuration,
              repeat: Infinity,
              ease: "easeOut"
            }}
            className="absolute w-5 h-5 rounded-full border-2 border-[#00A3FF]/40 pointer-events-none"
          />
          {/* Inner Core */}
          <motion.div
            key={`core-${bpm}-${isPlaying}`}
            animate={isPlaying ? {
              scale: [0.95, 1.25, 0.95],
              backgroundColor: ["#00A3FF", "#38bdf8", "#00A3FF"],
            } : {
              scale: 1,
              backgroundColor: "#1e293b"
            }}
            transition={{
              duration: beatDuration,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="w-3.5 h-3.5 rounded-full bg-[#00A3FF] shadow-[0_0_12px_rgba(0,163,255,0.6)]"
          />
        </div>

        {/* Tap Tempo Trigger Pad (MPC Style) */}
        <motion.button 
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.92, rotate: -0.5 }}
          onClick={() => {
            tapTempo();
            setIsTapFlashed(true);
            setTimeout(() => setIsTapFlashed(false), 120);
          }}
          onContextMenu={(e) => handleMidiRightClick(e, 'tap_tempo', 'Tap Tempo')}
          className={cn(
            "flex flex-col items-center justify-center gap-0.5 w-14 h-11 sm:w-16 sm:h-12 md:w-16 md:h-15 lg:w-18 lg:h-18 rounded-2xl transition-all border shrink-0 relative group",
            isTapFlashed 
              ? "bg-[#00A3FF]/30 border-[#00A3FF] text-white shadow-[0_0_20px_rgba(0,163,255,0.4)]" 
              : "text-[#00A3FF] bg-[#00A3FF]/10 border-[#00A3FF]/20 hover:bg-[#00A3FF]/15 hover:border-[#00A3FF]/30"
          )}
        >
          {/* MPC style overlay flash */}
          <div className={cn(
            "absolute inset-0 rounded-2xl transition-opacity duration-300 pointer-events-none bg-white/5",
            isTapFlashed ? "opacity-100" : "opacity-0"
          )} />
          <span className="text-xs sm:text-sm font-black uppercase tracking-wider leading-none">TAP</span>
          <span className="text-[6px] md:text-[8px] font-bold uppercase tracking-wider text-white/40 leading-none">TEMPO</span>
        </motion.button>
      </div>

      {/* Styled custom animations */}
      <style>{`
        @keyframes synth-pulse {
          0% {
            transform: scaleY(0.4);
            opacity: 0.4;
          }
          100% {
            transform: scaleY(1.4);
            opacity: 1;
          }
        }
        @keyframes slow-rotate {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
};

