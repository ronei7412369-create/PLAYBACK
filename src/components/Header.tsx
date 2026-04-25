import React, { useState, useRef, useEffect } from 'react';
import { usePlayerStore } from '../store/usePlayerStore';
import { Volume2, Settings, Clock, Hash, Key, ShieldCheck, Headphones, MonitorPlay, LogOut, Menu, SlidersHorizontal, X, Users, Download } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { AdminModal } from './AdminModal';

export const Header: React.FC = () => {
  const { currentSong, masterVolume, setMasterVolume, masterEq, setMasterEQ, isPlaying, toggleMetronome, metronomeEnabled, isLRSplit, toggleLRSplit, isStageMode, toggleStageMode, logout, isSidebarOpen, setShowSidebar, tapTempo, cycleTimeSignature, pitchShift, setPitchShift, isAdmin } = usePlayerStore();
  const [showEq, setShowEq] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
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
    <header className="h-16 md:h-20 bg-[#0A0A0B]/60 backdrop-blur-md border-b border-white/5 flex items-center justify-between px-3 md:px-8 z-50 sticky top-0">
      <div className="flex items-center gap-2 md:gap-4 shrink-0 pr-4">
        
        {/* Mobile menu toggle */}
        <button 
          className="lg:hidden p-2 bg-transparent text-white/60 hover:bg-white/5 hover:text-white rounded-xl transition-colors shrink-0"
          onClick={() => setShowSidebar(!isSidebarOpen)}
        >
          <Menu size={22} className="md:w-5 md:h-5" />
        </button>

        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-2 md:gap-3 shrink-0"
        >
          <div className="w-9 h-9 md:w-10 md:h-10 bg-gradient-to-br from-[#00A3FF] to-[#0066FF] rounded-xl flex items-center justify-center shadow-lg shadow-[#00A3FF]/20">
            <ShieldCheck size={18} className="text-white md:w-6 md:h-6" />
          </div>
          <div className="flex flex-col hidden sm:flex">
            <span className="text-[9px] md:text-[10px] text-[#00A3FF] uppercase tracking-[0.2em] font-black">Prime</span>
            <span className="text-white font-black text-sm md:text-xl tracking-tighter">GIG PLAY</span>
          </div>
        </motion.div>
      </div>

      <div className="flex items-center gap-2 md:gap-8 shrink-0">
        {deferredPrompt && (
          <button
            onClick={handleInstallClick}
            className="flex items-center gap-1.5 md:gap-2 bg-[#00A3FF]/10 text-[#00A3FF] hover:bg-[#00A3FF]/20 px-2.5 py-1.5 md:px-4 md:py-1.5 rounded-full text-[10px] md:text-xs font-bold transition-colors border border-[#00A3FF]/30"
          >
            <Download size={14} className="w-3 h-3 md:w-3.5 md:h-3.5" />
            <span className="hidden sm:inline">Instalar App</span>
            <span className="inline sm:hidden">Instalar</span>
          </button>
        )}

        <motion.div 
          animate={{ scale: isPlaying ? [1, 1.05, 1] : 1 }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="flex flex-col hidden xl:flex mr-6"
        >
          <span className="text-[9px] text-white/40 uppercase tracking-widest font-bold mb-0.5">Now Performing</span>
          <span className="text-white font-bold text-lg tracking-tight truncate max-w-[200px]">{currentSong?.title || "No Song Selected"}</span>
        </motion.div>

        {/* Unified Controls Container */}
        <div className="flex items-center bg-[#111112] p-1.5 rounded-2xl border border-white/5 shadow-inner mr-2 md:mr-0">
          
          <button 
            onClick={toggleMetronome}
            disabled={!currentSong}
            className={cn(
              "flex flex-col items-center justify-center px-3 py-1.5 rounded-xl transition-all disabled:opacity-50 min-w-[50px] relative overflow-hidden",
              metronomeEnabled 
                ? "bg-[#00A3FF]/10 text-[#00A3FF]" 
                : "text-white/40 hover:bg-white/5 hover:text-white"
            )}
          >
            {metronomeEnabled && <div className="absolute inset-0 bg-[#00A3FF]/20 animate-pulse" />}
            <Clock size={12} className={cn("mb-0.5", metronomeEnabled ? "text-[#00A3FF]" : "")} />
            <span className="font-black text-xs md:text-sm">{currentSong?.bpm || "120"}</span>
          </button>
          
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
            className="w-24 h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer custom-slider accent-[#00A3FF] hover:accent-[#00A3FF]/80 transition-all"
          />
        </div>
      </div>
      <AdminModal isOpen={showAdmin} onClose={() => setShowAdmin(false)} />
    </header>
  );
};
