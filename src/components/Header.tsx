import React from 'react';
import { usePlayerStore } from '../store/usePlayerStore';
import { Volume2, Settings, Clock, Hash, Key, ShieldCheck, Headphones, MonitorPlay, LogOut, Menu } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';

export const Header: React.FC = () => {
  const { currentSong, masterVolume, setMasterVolume, isPlaying, toggleMetronome, metronomeEnabled, isLRSplit, toggleLRSplit, isStageMode, toggleStageMode, logout, isSidebarOpen, setShowSidebar, tapTempo, cycleTimeSignature, pitchShift, setPitchShift } = usePlayerStore();

  if (!currentSong) return null;

  return (
    <header className="h-20 bg-[#0A0A0B]/80 backdrop-blur-xl border-b border-white/5 flex items-center justify-between px-8 z-50 sticky top-0">
      <div className="flex items-center gap-4 xl:gap-10">
        
        {/* Mobile menu toggle */}
        <button 
          className="lg:hidden p-2 bg-white/5 border border-white/5 rounded-xl hover:bg-white/10 hover:text-white"
          onClick={() => setShowSidebar(!isSidebarOpen)}
        >
          <Menu size={20} />
        </button>

        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-3"
        >
          <div className="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-br from-[#00A3FF] to-[#0066FF] rounded-xl flex items-center justify-center shadow-lg shadow-[#00A3FF]/20">
            <ShieldCheck size={18} className="text-white md:w-6 md:h-6" />
          </div>
          <div className="flex flex-col hidden sm:flex">
            <span className="text-[9px] md:text-[10px] text-[#00A3FF] uppercase tracking-[0.2em] font-black">Prime</span>
            <span className="text-white font-black text-sm md:text-xl tracking-tighter">MULTITRACK</span>
          </div>
        </motion.div>

        <div className="hidden lg:block h-10 w-[1px] bg-white/10" />

        <div className="flex items-center gap-2 xl:gap-8">
          <motion.div 
            animate={{ scale: isPlaying ? [1, 1.05, 1] : 1 }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="flex flex-col hidden xl:flex"
          >
            <span className="text-[9px] text-white/40 uppercase tracking-widest font-bold mb-0.5">Now Performing</span>
            <span className="text-white font-bold text-lg tracking-tight truncate max-w-[200px]">{currentSong.title}</span>
          </motion.div>

          {/* Core Controls */}
          <div className="flex items-center gap-2 md:gap-4 xl:gap-8 bg-white/5 px-2 md:px-6 py-1.5 md:py-2.5 rounded-2xl border border-white/5">
            <div className="flex group">
               <button 
                 onClick={toggleMetronome}
                 className={cn(
                   "flex flex-col items-center p-1.5 md:p-2 rounded-l-xl border-y border-l transition-colors",
                   metronomeEnabled 
                     ? "bg-[#00A3FF]/20 border-[#00A3FF]/50 shadow-[0_0_15px_rgba(0,163,255,0.3)]" 
                     : "border-transparent bg-transparent hover:bg-white/10 hover:border-white/10"
                 )}
               >
                 <div className="flex items-center gap-1.5 text-white/40 md:mb-0.5">
                   <Clock size={11} className={metronomeEnabled ? "text-[#00A3FF]" : ""} />
                   <span className="text-[9px] uppercase font-black tracking-tighter hidden lg:inline">Click</span>
                 </div>
                 <span className={cn("font-black text-sm md:text-lg tabular-nums transition-colors", metronomeEnabled ? "text-[#00A3FF]" : "text-white")}>{currentSong.bpm}</span>
               </button>
               <button 
                 onClick={tapTempo}
                 className="flex flex-col items-center justify-center px-1.5 md:px-2 border-y border-r border-transparent bg-transparent hover:bg-white/10 hover:border-white/10 rounded-r-xl transition-colors text-white/40 hover:text-white"
                 title="Tap Tempo"
                 style={{ writingMode: 'vertical-rl' }}
               >
                 <span className="text-[9px] uppercase font-black tracking-widest rotate-180 flex items-center">TAP</span>
               </button>
            </div>

            <button 
              onClick={toggleLRSplit}
              className={cn(
                "flex flex-col items-center p-1.5 md:p-2 rounded-xl border transition-colors",
                isLRSplit 
                  ? "bg-[#2ECC71]/20 border-[#2ECC71]/50 shadow-[0_0_15px_rgba(46,204,113,0.3)]" 
                  : "border-transparent hover:bg-white/10"
              )}
            >
              <div className="flex items-center gap-1.5 text-white/40 md:mb-0.5">
                <Headphones size={11} className={isLRSplit ? "text-[#2ECC71]" : ""} />
                <span className="text-[9px] uppercase font-black tracking-tighter hidden lg:inline">Split</span>
              </div>
              <span className={cn("font-black text-sm md:text-lg tabular-nums transition-colors", isLRSplit ? "text-[#2ECC71]" : "text-white")}>L/R</span>
            </button>

            <div className="hidden sm:block w-[1px] h-6 bg-white/10" />

            <button 
              onClick={cycleTimeSignature}
              className="hidden sm:flex flex-col items-center hover:bg-white/10 p-1.5 md:p-2 rounded-xl border border-transparent hover:border-white/5 transition-colors cursor-pointer"
              title="Change Time Signature"
            >
              <div className="flex items-center gap-1.5 text-white/40 mb-0.5">
                <Hash size={11} />
                <span className="text-[9px] uppercase font-black tracking-tighter">Sig</span>
              </div>
              <span className="text-white font-black text-sm md:text-xl tabular-nums">{currentSong.timeSignature || "4/4"}</span>
            </button>

            <div className="hidden sm:block w-[1px] h-6 bg-white/10" />

            <div className="flex flex-col items-center p-1.5 md:p-0 border border-transparent">
              <div className="flex items-center gap-1.5 text-white/40 md:mb-0.5">
                <Key size={11} />
                <span className="text-[9px] uppercase font-black tracking-tighter hidden lg:inline">Tone</span>
              </div>
              <div className="flex items-center gap-1.5">
                <button 
                  onClick={() => setPitchShift(Math.max(-12, pitchShift - 1))}
                  className="text-white/40 hover:text-white px-1 font-black transition-colors disabled:opacity-30"
                  disabled={pitchShift <= -12}
                >-</button>
                <span className="text-[#F1C40F] font-black text-sm md:text-xl tabular-nums min-w-[30px] text-center">
                  {pitchShift > 0 ? `+${pitchShift}` : pitchShift}
                </span>
                <button 
                  onClick={() => setPitchShift(Math.min(12, pitchShift + 1))}
                  className="text-white/40 hover:text-white px-1 font-black transition-colors disabled:opacity-30"
                  disabled={pitchShift >= 12}
                >+</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 md:gap-6">
        <div className="hidden xl:flex items-center gap-4 bg-[#0F0F0F] px-5 py-2.5 rounded-2xl border border-white/5 shadow-inner">
          <Volume2 size={16} className="text-white/40" />
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={masterVolume}
            onChange={(e) => setMasterVolume(parseFloat(e.target.value))}
            className="w-36 h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer custom-slider accent-[#00A3FF] hover:accent-white transition-all"
          />
          <span className="text-white font-mono font-black text-sm w-10 text-right">{(masterVolume * 100).toFixed(0)}%</span>
        </div>
        
        <div className="flex items-center gap-2">
          <button 
            onClick={toggleStageMode}
            title={isStageMode ? "Exit Stage Mode" : "Enter Stage Mode"}
            className={cn(
              "p-2 md:p-3 rounded-2xl transition-all border",
              isStageMode ? "bg-[#00A3FF] text-white shadow-[0_0_15px_rgba(0,163,255,0.4)] border-[#00A3FF]" : "bg-white/5 border-white/5 text-white/40 hover:text-white hover:bg-white/10"
            )}
          >
            <MonitorPlay size={18} className="md:w-[22px] md:h-[22px]" />
          </button>
          <button 
            onClick={logout}
            title="Log out"
            className="p-2 md:p-3 bg-white/5 rounded-2xl text-white/40 hover:text-[#E74C3C] hover:bg-[#E74C3C]/10 hover:border-[#E74C3C]/30 transition-all border border-white/5 hidden sm:flex"
          >
            <LogOut size={18} className="md:w-[22px] md:h-[22px]" />
          </button>
        </div>
      </div>
    </header>
  );
};
