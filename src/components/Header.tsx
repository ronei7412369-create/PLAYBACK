import React, { useState, useRef, useEffect } from 'react';
import { usePlayerStore } from '../store/usePlayerStore';
import { Volume2, Settings, Clock, Hash, Key, ShieldCheck, Headphones, MonitorPlay, LogOut, Menu, SlidersHorizontal, X, Users, Download } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { AdminModal } from './AdminModal';
import { StemSplitter } from './StemSplitter';

import { MidiMapModal } from './MidiMapModal';
import { AnimatedLogo } from './AnimatedLogo';
import { handleMidiRightClick } from '../store/useMidiStore';

export const Header: React.FC = () => {
  const { currentSong, globalBpm, masterVolume, setMasterVolume, masterEq, setMasterEQ, isPlaying, toggleMetronome, metronomeEnabled, isLRSplit, toggleLRSplit, isStageMode, toggleStageMode, logout, isSidebarOpen, setShowSidebar, tapTempo, updateBpm, cycleTimeSignature, pitchShift, setPitchShift, isAdmin } = usePlayerStore();
  const [showEq, setShowEq] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const [showMidiMap, setShowMidiMap] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const eqRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (eqRef.current && !eqRef.current.contains(e.target as Node)) {
        setShowEq(false);
      }
    };
    if (showEq) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showEq]);

  return (
    <header className="mx-auto mt-4 mb-2 max-w-[96%] w-[96%] h-16 md:h-20 ios-glass rounded-2xl md:rounded-3xl flex items-center justify-between px-3 md:px-6 z-50 sticky top-4 transition-all duration-300">
      <div className="flex items-center gap-2 md:gap-4 shrink-0 pr-4">
        
        {/* Mobile menu toggle */}
        <button 
          className="lg:hidden p-2.5 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white rounded-xl transition-all duration-200 shrink-0"
          onClick={() => setShowSidebar(!isSidebarOpen)}
        >
          <Menu size={20} className="md:w-5 md:h-5" />
        </button>

        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-2 md:gap-3 shrink-0"
        >
          <div className="relative group">
            <AnimatedLogo size="sm" />
          </div>
          <div className="flex flex-col hidden sm:flex">
            <span className="text-white font-extrabold text-sm md:text-lg tracking-wider font-sans uppercase">GIG <span className="text-[#00A3FF] drop-shadow-[0_0_10px_rgba(0,163,255,0.4)]">PLAY</span></span>
            <span className="text-[8px] text-white/30 uppercase tracking-[0.25em] font-medium font-sans">OS 26 Studio</span>
          </div>
        </motion.div>
        
        {/* Yellow Box equivalent: Stem Splitter */}
        <div className="hidden lg:block ml-4">
           <StemSplitter />
        </div>
      </div>

      <div className="flex items-center gap-2 md:gap-4 lg:gap-6 shrink-0">
        {deferredPrompt && (
          <button
            onClick={handleInstallClick}
            className="flex items-center gap-1.5 md:gap-2 bg-white/10 hover:bg-white/15 text-white px-2.5 py-1.5 md:px-4 md:py-2 rounded-full text-[10px] md:text-xs font-bold transition-all border border-white/10 shadow-lg"
          >
            <Download size={13} className="w-3 h-3 md:w-3.5 md:h-3.5 text-[#00A3FF]" />
            <span className="hidden sm:inline">Instalar App</span>
            <span className="inline sm:hidden">Instalar</span>
          </button>
        )}

        <motion.div 
          animate={{ scale: isPlaying ? [1, 1.02, 1] : 1 }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="flex flex-col hidden xl:flex mr-2"
        >
          <span className="text-[8px] text-[#00A3FF] uppercase tracking-[0.2em] font-extrabold mb-0.5">Now Performing</span>
          <span className="text-white font-extrabold text-base tracking-tight truncate max-w-[180px]">{currentSong?.title || "No Song Selected"}</span>
        </motion.div>

        {/* Unified Controls Container */}
        <div className="flex items-center ios-glass-accent p-1 rounded-2xl border border-white/15 shadow-2xl mr-2 md:mr-0 gap-1">
          
          <div className="flex items-center gap-1">
             <button 
               onClick={tapTempo}
               className="hidden sm:block text-[9px] font-extrabold uppercase tracking-[0.2em] text-white/60 hover:text-white bg-white/5 hover:bg-white/10 px-2.5 py-2.5 rounded-xl transition-all border border-white/5 h-full"
               title="Tap Tempo"
             >
               TAP
             </button>
             <div className={cn(
               "flex flex-col items-center justify-center px-2 py-1 rounded-xl transition-all min-w-[70px] relative overflow-hidden",
               metronomeEnabled 
                 ? "bg-[#00A3FF]/15 border border-[#00A3FF]/30 shadow-[0_0_15px_rgba(0,163,255,0.15)]" 
                 : "hover:bg-white/5 border border-transparent"
             )}>
                {metronomeEnabled && <div className="absolute inset-0 bg-[#00A3FF]/10 animate-pulse" />}
                <button onClick={toggleMetronome} className={cn("flex items-center justify-center mb-0.5", metronomeEnabled ? "text-[#00A3FF] scale-110" : "text-white/40 hover:text-white transition-all")}>
                  <Clock size={12} />
                </button>
                <div className="flex items-center justify-between w-full h-[18px] gap-1 z-10">
                   <button onClick={() => updateBpm(-1)} className="text-white/40 hover:text-white font-black text-xs px-1 leading-none">-</button>
                   <span className={cn("font-black text-xs md:text-sm tabular-nums tracking-tighter w-8 text-center", metronomeEnabled ? "text-[#00A3FF]" : "text-white")}>{currentSong?.bpm || globalBpm}</span>
                   <button onClick={() => updateBpm(1)} className="text-white/40 hover:text-white font-black text-xs px-1 leading-none">+</button>
                </div>
             </div>
          </div>
          
          <div className="w-[1px] h-6 bg-white/10 mx-1" />

          <button 
            onClick={toggleLRSplit}
            className={cn(
              "flex flex-col items-center justify-center px-3 py-1.5 rounded-xl transition-all min-w-[50px]",
              isLRSplit 
                ? "bg-[#2ECC71]/10 text-[#2ECC71]" 
                : "text-white/40 hover:bg-white/5 hover:text-white"
            )}
          >
            <Headphones size={12} className={cn("mb-0.5", isLRSplit ? "text-[#2ECC71]" : "")} />
            <span className="font-black text-xs md:text-sm">L/R</span>
          </button>

          <div className="hidden sm:block w-[1px] h-6 bg-white/10 mx-1" />

          <button 
            onClick={cycleTimeSignature}
            disabled={!currentSong}
            className="hidden sm:flex flex-col items-center justify-center px-3 py-1.5 rounded-xl transition-colors text-white/40 hover:bg-white/5 hover:text-white disabled:opacity-50 min-w-[50px]"
            title="Change Time Signature"
          >
            <Hash size={12} className="mb-0.5" />
            <span className="font-black text-xs md:text-sm">{currentSong?.timeSignature || "4/4"}</span>
          </button>

          <div className="hidden sm:block w-[1px] h-6 bg-white/10 mx-1" />

          <div className="hidden md:flex flex-col items-center justify-center px-2 py-1.5 transition-colors">
             <Key size={12} className="text-white/40 mb-0.5" />
             <div className="flex items-center gap-1">
                <button onClick={() => setPitchShift(Math.max(-12, pitchShift - 1))} className="text-white/60 hover:text-white px-1 font-black" disabled={pitchShift <= -12}>-</button>
                <span className="text-[#F1C40F] font-black text-sm tabular-nums w-6 text-center">{pitchShift > 0 ? `+${pitchShift}` : pitchShift}</span>
                <button onClick={() => setPitchShift(Math.min(12, pitchShift + 1))} className="text-white/60 hover:text-white px-1 font-black" disabled={pitchShift >= 12}>+</button>
             </div>
          </div>

          <div className="w-[1px] h-6 bg-white/10 mx-2" />

          {/* Icon Controls */}
          <div className="flex items-center gap-1 md:gap-2 pr-1 relative" ref={eqRef}>
            <button 
              onClick={() => setShowEq(!showEq)}
              title="Master EQ"
              className={cn(
                "p-2 md:p-2.5 rounded-xl transition-all hidden sm:flex",
                showEq ? "bg-[#00A3FF]/20 text-[#00A3FF]" : "text-white/40 hover:text-white hover:bg-white/5"
              )}
            >
              <SlidersHorizontal size={18} className="md:w-5 md:h-5" />
            </button>

            <AnimatePresence>
              {showEq && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="fixed top-20 right-4 md:right-8 w-64 bg-[#111112] border border-[#00A3FF]/20 rounded-2xl p-4 shadow-[0_10px_40px_rgba(0,163,255,0.1)] z-[100] flex flex-col gap-4"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-black text-[#00A3FF] tracking-widest">Master EQ</span>
                    <button onClick={() => setShowEq(false)} className="text-white/40 hover:text-white bg-white/5 rounded-full p-1">
                      <X size={14} />
                    </button>
                  </div>
                  
                  <div className="flex flex-col gap-3">
                    {[
                      { label: 'Low', band: 'low' as const, val: masterEq.low },
                      { label: 'Mid', band: 'mid' as const, val: masterEq.mid },
                      { label: 'High', band: 'high' as const, val: masterEq.high }
                    ].map(({ label, band, val }) => (
                      <div key={band} className="flex items-center gap-3">
                        <span className="text-[11px] text-white/50 font-bold w-7 uppercase">{label}</span>
                        <input
                          type="range"
                          min="-24"
                          max="24"
                          value={val}
                          onChange={(e) => setMasterEQ(band, parseFloat(e.target.value))}
                          onDoubleClick={() => setMasterEQ(band, 0)}
                          className="flex-1 h-1.5 bg-[#0A0A0B] border border-white/5 rounded-full appearance-none cursor-pointer custom-slider accent-[#00A3FF] hover:accent-white transition-all"
                        />
                        <span className="text-[10px] tabular-nums font-mono w-6 text-right text-white/70">{val > 0 ? `+${Math.round(val)}` : Math.round(val)}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <button 
              onClick={toggleStageMode}
              title={isStageMode ? "Exit Stage Mode" : "Enter Stage Mode"}
              className={cn(
                "p-2 md:p-2.5 rounded-xl transition-all",
                isStageMode ? "bg-[#00A3FF]/20 text-[#00A3FF]" : "text-white/40 hover:text-white hover:bg-white/5"
              )}
            >
              <MonitorPlay size={18} className="md:w-5 md:h-5" />
            </button>
            <button 
              onClick={() => setShowMidiMap(true)}
              title="MIDI Mapeamento"
              className="p-2 md:p-2.5 rounded-xl transition-all text-white/40 hover:text-[#00A3FF] hover:bg-[#00A3FF]/10"
            >
              <Settings size={18} className="md:w-5 md:h-5" />
            </button>
            {isAdmin && (
              <button 
                onClick={() => setShowAdmin(true)}
                title="Admin Panel"
                className="p-2 md:p-2.5 rounded-xl transition-all text-white/40 hover:text-[#2ECC71] hover:bg-[#2ECC71]/10"
              >
                <Users size={18} className="md:w-5 md:h-5" />
              </button>
            )}
            <button 
              onClick={logout}
              title="Log out"
              className="p-2 md:p-2.5 rounded-xl transition-all text-white/40 hover:text-[#E74C3C] hover:bg-[#E74C3C]/10"
            >
              <LogOut size={18} className="md:w-5 md:h-5" />
            </button>
          </div>
        </div>

        <div className="hidden xl:flex items-center gap-4 bg-[#111112] px-5 py-2.5 rounded-2xl border border-white/5 shadow-inner ml-2">
          <Volume2 size={16} className="text-white/40" />
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={masterVolume}
            onChange={(e) => setMasterVolume(parseFloat(e.target.value))}
            onContextMenu={(e) => handleMidiRightClick(e, 'master_volume', 'Master Volume')}
            className="w-24 h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer custom-slider accent-[#00A3FF] hover:accent-[#00A3FF]/80 transition-all"
          />
        </div>
      </div>
      <AdminModal isOpen={showAdmin} onClose={() => setShowAdmin(false)} />
      <MidiMapModal isOpen={showMidiMap} onClose={() => setShowMidiMap(false)} />
    </header>
  );
};
