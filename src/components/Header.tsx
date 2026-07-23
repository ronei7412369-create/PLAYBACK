import React, { useState, useRef, useEffect } from 'react';
import { usePlayerStore } from '../store/usePlayerStore';
import { Volume2, Settings, Hash, Key, ShieldCheck, Headphones, MonitorPlay, LogOut, Menu, SlidersHorizontal, X, Users, Download, RotateCcw, Contrast } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { AdminModal } from './AdminModal';
import { StemSplitter } from './StemSplitter';

import { MidiMapModal } from './MidiMapModal';
import { AnimatedLogo } from './AnimatedLogo';
import { handleMidiRightClick } from '../store/useMidiStore';
import { getCoverUrl } from '../lib/coverArt';

const AVAILABLE_KEYS = [
  'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'
];

export const Header: React.FC = () => {
  const { currentSong, globalBpm, masterVolume, setMasterVolume, masterEq, setMasterEQ, isPlaying, toggleMetronome, metronomeEnabled, isLRSplit, toggleLRSplit, isStageMode, toggleStageMode, themeMode, toggleThemeMode, logout, isSidebarOpen, setShowSidebar, tapTempo, updateBpm, cycleTimeSignature, pitchShift, setPitchShift, isAdmin, updateSongKey, user } = usePlayerStore();
  const [showEq, setShowEq] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const [showMidiMap, setShowMidiMap] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showKeySelector, setShowKeySelector] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    const checkStandalone = () => {
      const isStandaloneMode = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
      setIsStandalone(!!isStandaloneMode);
    };
    checkStandalone();
    window.addEventListener('resize', checkStandalone);
    return () => window.removeEventListener('resize', checkStandalone);
  }, []);
  const eqRef = useRef<HTMLDivElement>(null);
  const eqPopoverRef = useRef<HTMLDivElement>(null);
  const keyRef = useRef<HTMLDivElement>(null);
  const keyPopoverRef = useRef<HTMLDivElement>(null);

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
      const isInsideButton = eqRef.current && eqRef.current.contains(e.target as Node);
      const isInsidePopover = eqPopoverRef.current && eqPopoverRef.current.contains(e.target as Node);
      if (!isInsideButton && !isInsidePopover) {
        setShowEq(false);
      }
    };
    if (showEq) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showEq]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const isInsideButton = keyRef.current && keyRef.current.contains(e.target as Node);
      const isInsidePopover = keyPopoverRef.current && keyPopoverRef.current.contains(e.target as Node);
      if (!isInsideButton && !isInsidePopover) {
        setShowKeySelector(false);
      }
    };
    if (showKeySelector) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showKeySelector]);

  // Key Selector Helpers and Data
  const naturalKeys = [
    { index: 0, label: 'C', pt: 'Dó' },
    { index: 2, label: 'D', pt: 'Ré' },
    { index: 4, label: 'E', pt: 'Mi' },
    { index: 5, label: 'F', pt: 'Fá' },
    { index: 7, label: 'G', pt: 'Sol' },
    { index: 9, label: 'A', pt: 'Lá' },
    { index: 11, label: 'B', pt: 'Si' },
  ];

  const accidentalKeys = [
    { index: 1, label: 'C#', pt: 'Dó#' },
    { index: 3, label: 'D#', pt: 'Ré#' },
    { index: 6, label: 'F#', pt: 'Fá#' },
    { index: 8, label: 'G#', pt: 'Sol#' },
    { index: 10, label: 'A#', pt: 'Lá#' },
  ];

  const parseKey = (keyStr: string) => {
    if (!keyStr) return { rootIndex: 0, isMinor: false };
    const clean = keyStr.trim();
    const isMinor = clean.toLowerCase().endsWith('m') || clean.toLowerCase().includes('min');
    let root = clean;
    if (isMinor) {
      if (clean.toLowerCase().endsWith('min')) {
        root = clean.substring(0, clean.length - 3).trim();
      } else {
        root = clean.substring(0, clean.length - 1).trim();
      }
    }
    root = root.toUpperCase();
    
    let rootIndex = 0;
    if (root === 'C' || root === 'B#') rootIndex = 0;
    else if (root === 'C#' || root === 'DB') rootIndex = 1;
    else if (root === 'D') rootIndex = 2;
    else if (root === 'D#' || root === 'EB') rootIndex = 3;
    else if (root === 'E') rootIndex = 4;
    else if (root === 'F' || root === 'E#') rootIndex = 5;
    else if (root === 'F#' || root === 'GB') rootIndex = 6;
    else if (root === 'G') rootIndex = 7;
    else if (root === 'G#' || root === 'AB') rootIndex = 8;
    else if (root === 'A') rootIndex = 9;
    else if (root === 'A#' || root === 'BB') rootIndex = 10;
    else if (root === 'B' || root === 'CB') rootIndex = 11;
    
    return { rootIndex, isMinor };
  };

  const getTransposedKeyName = (originalKey: string | undefined, shift: number) => {
    if (!originalKey) return shift === 0 ? "Sem Tom" : (shift > 0 ? `+${shift}` : `${shift}`);
    
    const { rootIndex, isMinor } = parseKey(originalKey);
    let currentRootIndex = (rootIndex + shift) % 12;
    if (currentRootIndex < 0) currentRootIndex += 12;
    
    const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
      
    return `${notes[currentRootIndex]}${isMinor ? 'm' : ''}`;
  };

  const songKey = currentSong?.key;
  const songKeyParsed = parseKey(songKey || "");
  const currentKeyName = getTransposedKeyName(songKey, pitchShift);

  const currentRootIndex = songKey 
    ? (songKeyParsed.rootIndex + pitchShift) % 12 
    : -1;
  const normalizedCurrentRootIndex = currentRootIndex < 0 ? currentRootIndex + 12 : currentRootIndex;

  const handleKeySelect = (targetIndex: number) => {
    if (!songKey) return;
    const { rootIndex } = parseKey(songKey);
    let diff = (targetIndex - rootIndex) % 12;
    if (diff > 6) diff -= 12;
    if (diff < -6) diff += 12;
    setPitchShift(diff);
  };

  const getAccidentalLabel = (item: typeof accidentalKeys[0]) => {
    return { label: item.label, pt: item.pt };
  };

  return (
    <header className="mx-auto mt-4 mb-2 max-w-[96%] w-[96%] h-16 md:h-20 ios-glass rounded-2xl md:rounded-3xl flex items-center justify-between px-2 sm:px-3 md:px-6 z-50 sticky top-4 transition-all duration-300">
      <div className="flex items-center gap-1.5 md:gap-4 shrink pr-1 md:pr-4 min-w-0">
        
        {/* Mobile menu toggle */}
        <button 
          className="lg:hidden p-2 md:p-2.5 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white rounded-xl transition-all duration-200 shrink-0"
          onClick={() => setShowSidebar(!isSidebarOpen)}
        >
          <Menu size={18} className="md:w-5 md:h-5" />
        </button>

        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-1.5 md:gap-3 shrink-0"
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
        <div className="hidden xl:block ml-4 shrink-0">
           <StemSplitter />
        </div>
      </div>

      <div className="flex items-center gap-1.5 md:gap-4 lg:gap-6 shrink min-w-0 justify-end">


        <motion.div 
          animate={{ scale: isPlaying ? [1, 1.01, 1] : 1 }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="hidden xl:flex items-center gap-2 mr-2 bg-white/[0.02] border border-white/5 py-1.5 px-2.5 rounded-2xl shrink-0"
        >
          {currentSong && (
            <div className="w-8 h-8 rounded-xl overflow-hidden border border-white/10 shadow-md shadow-black/40 shrink-0">
              <img 
                src={currentSong.coverUrl || getCoverUrl(currentSong.title, currentSong.artist)} 
                alt={currentSong.title} 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
          )}
          <div className="flex flex-col min-w-0">
            <span className="text-[8px] text-[#00A3FF] uppercase tracking-[0.2em] font-extrabold mb-0.5 leading-none hidden 2xl:block">Now Performing</span>
            <span className="text-white font-extrabold text-xs tracking-tight truncate max-w-[100px] 2xl:max-w-[150px]">{currentSong?.title || "No Song Selected"}</span>
          </div>
        </motion.div>

        {/* Unified Controls Container */}
        <div className="flex items-center ios-glass-accent p-0.5 sm:p-1 rounded-xl md:rounded-2xl border border-white/15 shadow-2xl mr-1 md:mr-0 gap-0.5 sm:gap-1 max-w-full overflow-x-auto scrollbar-hide">
          
          <button 
            onClick={cycleTimeSignature}
            disabled={!currentSong}
            className="hidden sm:flex flex-col items-center justify-center px-1.5 py-1 sm:px-3 sm:py-1.5 rounded-lg sm:rounded-xl transition-colors text-white/40 hover:bg-white/5 hover:text-white disabled:opacity-50 min-w-[38px] sm:min-w-[50px]"
            title="Change Time Signature"
          >
            <Hash size={11} className="mb-0.5 sm:w-3 sm:h-3" />
            <span className="font-black text-[9px] sm:text-xs md:text-sm">{currentSong?.timeSignature || "4/4"}</span>
          </button>

          <div className="w-[1px] h-6 bg-white/10 mx-0.5 sm:mx-1" />

          {/* Advanced Pitch Transposer Button */}
          <div className="relative" ref={keyRef}>
            <button 
              onClick={() => setShowKeySelector(!showKeySelector)}
              title="Transposição de Tom"
              className={cn(
                "flex flex-col items-center justify-center px-1.5 py-1 sm:px-3 sm:py-1.5 rounded-lg sm:rounded-xl transition-all min-w-[38px] sm:min-w-[50px]",
                showKeySelector || pitchShift !== 0
                  ? "bg-[#F1C40F]/10 text-[#F1C40F]" 
                  : "text-white/40 hover:bg-white/5 hover:text-white"
              )}
            >
              <Key size={11} className={cn("mb-0.5 sm:w-3 sm:h-3", pitchShift !== 0 ? "text-[#F1C40F]" : "text-white/40")} />
              <span className={cn("font-black text-[9px] sm:text-xs md:text-sm", pitchShift !== 0 ? "text-[#F1C40F]" : "text-white")}>
                {currentKeyName}
              </span>
            </button>
          </div>

          <div className="w-[1px] h-6 bg-white/10 mx-1 2xl:mx-2" />

          {/* Icon Controls */}
          <div className="flex items-center gap-1 md:gap-1.5 pr-0.5 sm:pr-1 2xl:pr-2 relative" ref={eqRef}>
            <button 
              onClick={() => setShowEq(!showEq)}
              title="Master EQ"
              className={cn(
                "p-2 md:p-2.5 rounded-xl transition-all hidden lg:flex shrink-0",
                showEq ? "bg-[#00A3FF]/20 text-[#00A3FF]" : "text-white/40 hover:text-white hover:bg-white/5"
              )}
            >
              <SlidersHorizontal size={18} className="md:w-5 md:h-5" />
            </button>

            <button 
              onClick={toggleStageMode}
              title={isStageMode ? "Sair do Modo Palco" : "Modo Palco"}
              className={cn(
                "p-1.5 sm:p-2 md:p-2.5 rounded-xl transition-all shrink-0",
                isStageMode ? "bg-[#00A3FF]/20 text-[#00A3FF]" : "text-white/40 hover:text-white hover:bg-white/5"
              )}
            >
              <MonitorPlay size={16} className="sm:w-[18px] sm:h-[18px] md:w-5 md:h-5" />
            </button>

            <button 
              onClick={toggleThemeMode}
              title={`Tema Visual: ${themeMode === 'high-contrast' ? 'Alto Contraste' : 'Padrão'}`}
              className={cn(
                "p-1.5 sm:p-2 md:p-2.5 rounded-xl transition-all shrink-0 flex items-center gap-1.5",
                themeMode === 'high-contrast' 
                  ? "bg-amber-400/20 text-amber-300 border border-amber-400/40 shadow-[0_0_12px_rgba(251,191,36,0.25)]" 
                  : "text-white/40 hover:text-white hover:bg-white/5 border border-transparent"
              )}
            >
              <Contrast size={16} className="sm:w-[18px] sm:h-[18px] md:w-5 md:h-5" />
              <span className="hidden xl:inline text-[9px] font-black uppercase tracking-wider">
                {themeMode === 'high-contrast' ? 'Alto Contraste' : 'Padrão'}
              </span>
            </button>
            <button 
              onClick={() => setShowMidiMap(true)}
              title="MIDI Mapeamento"
              className="p-1.5 sm:p-2 md:p-2.5 rounded-xl transition-all text-white/40 hover:text-[#00A3FF] hover:bg-[#00A3FF]/10 hidden lg:flex shrink-0"
            >
              <Settings size={16} className="sm:w-[18px] sm:h-[18px] md:w-5 md:h-5" />
            </button>
            {isAdmin && (
              <button 
                onClick={() => setShowAdmin(true)}
                title="Admin Panel"
                className="p-1.5 sm:p-2 md:p-2.5 rounded-xl transition-all text-white/40 hover:text-[#2ECC71] hover:bg-[#2ECC71]/10 hidden sm:flex shrink-0"
              >
                <Users size={16} className="sm:w-[18px] sm:h-[18px] md:w-5 md:h-5" />
              </button>
            )}
            
            {user && (
              <div className="flex items-center gap-1.5 sm:gap-2 bg-white/5 border border-white/10 rounded-xl px-1.5 py-1 sm:px-2.5 sm:py-1.5 hover:bg-white/10 transition-all duration-200 shrink-0" title={user.email || 'Usuário conectado'}>
                {user.photoURL ? (
                  <img src={user.photoURL} alt={user.displayName || user.email} className="w-5 h-5 sm:w-6 sm:h-6 rounded-full object-cover border border-white/20" referrerPolicy="no-referrer" />
                ) : (
                  <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-[#00A3FF]/20 border border-[#00A3FF]/40 flex items-center justify-center text-[#00A3FF] text-[10px] font-extrabold uppercase">
                    {(user.displayName || user.email || 'U').substring(0, 1)}
                  </div>
                )}
                <div className="flex flex-col text-left hidden lg:flex max-w-[100px]">
                  <span className="text-[10px] sm:text-[11px] font-bold text-white/95 truncate leading-tight">
                    {user.displayName || user.email?.split('@')[0] || 'Usuário'}
                  </span>
                  <span className="text-[8px] text-[#00A3FF] font-extrabold tracking-wider leading-none uppercase">
                    {isAdmin ? 'ADMINISTRADOR' : 'GIGGER'}
                  </span>
                </div>
              </div>
            )}

            <button 
              onClick={logout}
              title="Log out"
              className="p-1.5 sm:p-2 md:p-2.5 rounded-xl transition-all text-white/40 hover:text-[#E74C3C] hover:bg-[#E74C3C]/10 shrink-0"
            >
              <LogOut size={16} className="sm:w-[18px] sm:h-[18px] md:w-5 md:h-5" />
            </button>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-2 bg-[#111112]/95 px-3 py-1.5 rounded-2xl border border-white/5 shadow-inner ml-1.5 shrink-0">
          <div className="flex items-center gap-1.5" title="Volume Master">
            <Volume2 size={14} className="text-white/40" />
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={masterVolume}
              onChange={(e) => setMasterVolume(parseFloat(e.target.value))}
              onContextMenu={(e) => handleMidiRightClick(e, 'master_volume', 'Master Volume')}
              className="w-14 lg:w-16 xl:w-20 h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer custom-slider accent-[#00A3FF] hover:accent-[#00A3FF]/80 transition-all"
            />
          </div>
          <div className="w-[1px] h-4 bg-white/10 mx-1" />
          <button 
            onClick={toggleLRSplit}
            className={cn(
              "flex items-center gap-1 px-2 py-1 rounded-xl transition-all text-[9px] font-black uppercase tracking-wider",
              isLRSplit 
                ? "bg-[#2ECC71]/20 text-[#2ECC71] border border-[#2ECC71]/30" 
                : "text-white/40 hover:bg-white/5 hover:text-white border border-transparent"
            )}
            title="Split L/R (Metrônomo L / Backing Tracks R)"
          >
            <Headphones size={11} className={isLRSplit ? "text-[#2ECC71]" : "text-white/40"} />
            <span>L/R</span>
          </button>
        </div>
      </div>
      <AdminModal isOpen={showAdmin} onClose={() => setShowAdmin(false)} />
      <MidiMapModal isOpen={showMidiMap} onClose={() => setShowMidiMap(false)} />

      {/* Popovers outside of scroll/clipping containers */}
      <AnimatePresence>
        {showKeySelector && (
          <motion.div 
            ref={keyPopoverRef}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="fixed top-24 right-4 sm:right-24 md:right-48 w-[340px] max-w-[95vw] bg-[#0A0A0B]/95 backdrop-blur-2xl border border-white/10 rounded-2xl p-4 shadow-[0_15px_40px_rgba(0,0,0,0.6),0_0_20px_rgba(241,196,15,0.05)] z-[110] flex flex-col gap-4 text-left"
          >
            <div className="flex flex-col gap-3 border-b border-white/5 pb-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-black text-[#F1C40F] tracking-widest leading-none">Selecionar Tom / Transposição</span>
                {pitchShift !== 0 && (
                  <span className="text-[10px] bg-[#F1C40F]/15 text-[#F1C40F] border border-[#F1C40F]/20 px-2.5 py-0.5 rounded-full font-extrabold font-mono leading-none">
                    {pitchShift > 0 ? `+${pitchShift}` : pitchShift} semitones
                  </span>
                )}
              </div>
              
              <div className="flex items-center justify-between bg-white/5 border border-white/5 rounded-xl px-3 py-2">
                <div className="flex flex-col">
                  <span className="text-[8px] uppercase font-black text-white/40 tracking-wider">Tom Original da Canção</span>
                  <span className="text-[10px] text-white/60 font-semibold mt-0.5">Mude para o tom real da gravação</span>
                </div>
                <select 
                  disabled={!currentSong}
                  value={songKey || "C"} 
                  onChange={(e) => {
                    if (currentSong) {
                      updateSongKey(currentSong.id, e.target.value);
                    }
                  }}
                  className="bg-black/60 hover:bg-black text-white text-[11px] font-black font-mono border border-white/10 rounded-lg px-2.5 py-1 cursor-pointer outline-none transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {AVAILABLE_KEYS.map(k => (
                    <option key={k} value={k} className="bg-[#0A0A0B] text-white font-mono">{k}</option>
                  ))}
                </select>
              </div>
            </div>

            {!songKey ? (
              <div className="text-center py-4 flex flex-col items-center justify-center gap-2">
                <Key size={24} className="text-white/20 animate-pulse" />
                <span className="text-xs text-white/40 font-bold">Carregue uma música para poder alterar o tom</span>
              </div>
            ) : (
              <>
                {/* Natural Notes (C, D, E, F, G, A, B) */}
                <div className="flex flex-col gap-1.5">
                  <span className="text-[9px] font-black uppercase text-white/30 tracking-wider">Tons Naturais (Prefira Notas Maiores)</span>
                  <div className="grid grid-cols-7 gap-1">
                    {naturalKeys.map((item) => {
                      const isSelected = item.index === normalizedCurrentRootIndex;
                      const keyLabel = `${item.label}${songKeyParsed.isMinor ? 'm' : ''}`;
                      const ptLabel = `${item.pt}${songKeyParsed.isMinor ? 'm' : ''}`;
                      
                      return (
                        <button
                          key={item.index}
                          onClick={() => handleKeySelect(item.index)}
                          className={cn(
                            "flex flex-col items-center justify-center py-2 px-1 rounded-xl transition-all border shrink-0",
                            isSelected 
                              ? "bg-[#F1C40F]/20 text-[#F1C40F] border-[#F1C40F]/40 shadow-[0_0_15px_rgba(241,196,15,0.15)] scale-[1.02]" 
                              : "bg-white/5 text-white/50 border-transparent hover:bg-white/10 hover:text-white"
                          )}
                        >
                          <span className="text-xs font-black leading-none">{keyLabel}</span>
                          <span className="text-[8px] font-bold mt-0.5 opacity-60 leading-none">{ptLabel}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Accidental Notes (Sharps & Flats) */}
                <div className="flex flex-col gap-1.5">
                  <span className="text-[9px] font-black uppercase text-white/30 tracking-wider">Acidentes (Sustenidos / Bemóis)</span>
                  <div className="flex justify-between gap-1">
                    {accidentalKeys.map((item) => {
                      const isSelected = item.index === normalizedCurrentRootIndex;
                      const { label, pt } = getAccidentalLabel(item);
                      const keyLabel = `${label}${songKeyParsed.isMinor ? 'm' : ''}`;
                      const ptLabel = `${pt}${songKeyParsed.isMinor ? 'm' : ''}`;
                      
                      return (
                        <button
                          key={item.index}
                          onClick={() => handleKeySelect(item.index)}
                          className={cn(
                            "flex-1 flex flex-col items-center justify-center py-2 px-1 rounded-xl transition-all border shrink-0 min-w-0",
                            isSelected 
                              ? "bg-[#F1C40F]/20 text-[#F1C40F] border-[#F1C40F]/40 shadow-[0_0_15px_rgba(241,196,15,0.15)] scale-[1.02]" 
                              : "bg-white/5 text-white/50 border-transparent hover:bg-white/10 hover:text-white"
                          )}
                        >
                          <span className="text-[10px] font-black leading-none truncate w-full text-center">{keyLabel}</span>
                          <span className="text-[7px] font-bold mt-0.5 opacity-60 leading-none truncate w-full text-center">{ptLabel}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Footer Controls */}
                <div className="flex gap-2 border-t border-white/5 pt-3 mt-1">
                  <button
                    onClick={() => setPitchShift(0)}
                    disabled={pitchShift === 0}
                    className="flex-1 py-2 bg-white/5 hover:bg-white/10 disabled:opacity-40 disabled:hover:bg-white/5 text-white rounded-xl text-xs font-bold transition-all border border-white/10 flex items-center justify-center gap-1.5"
                  >
                    <RotateCcw size={11} />
                    Tom Original
                  </button>
                  
                  <div className="flex items-center gap-1 bg-white/5 border border-white/5 rounded-xl px-1.5">
                    <button
                      onClick={() => setPitchShift(Math.max(-12, pitchShift - 1))}
                      disabled={pitchShift <= -12}
                      className="w-6 h-6 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 hover:text-white flex items-center justify-center font-black text-xs disabled:opacity-40"
                    >
                      -
                    </button>
                    <span className="text-[10px] font-mono text-white/60 min-w-[20px] text-center font-bold">
                      {pitchShift > 0 ? `+${pitchShift}` : pitchShift}
                    </span>
                    <button
                      onClick={() => setPitchShift(Math.min(12, pitchShift + 1))}
                      disabled={pitchShift >= 12}
                      className="w-6 h-6 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 hover:text-white flex items-center justify-center font-black text-xs disabled:opacity-40"
                    >
                      +
                    </button>
                  </div>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showEq && (
          <motion.div 
            ref={eqPopoverRef}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="fixed top-24 right-4 md:right-8 w-64 bg-[#111112]/95 backdrop-blur-2xl border border-[#00A3FF]/20 rounded-2xl p-4 shadow-[0_10px_40px_rgba(0,163,255,0.15)] z-[110] flex flex-col gap-4 text-left"
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

      <AdminModal isOpen={showAdmin} onClose={() => setShowAdmin(false)} />
      <MidiMapModal isOpen={showMidiMap} onClose={() => setShowMidiMap(false)} />
    </header>
  );
};
