import React, { useState, useRef, useEffect } from 'react';
import { usePlayerStore } from '../store/usePlayerStore';
import { Volume2, Settings, Clock, Hash, Key, ShieldCheck, Headphones, MonitorPlay, LogOut, Menu, SlidersHorizontal, X, Users, Download, RotateCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { AdminModal } from './AdminModal';
import { StemSplitter } from './StemSplitter';

import { MidiMapModal } from './MidiMapModal';
import { AnimatedLogo } from './AnimatedLogo';
import { handleMidiRightClick } from '../store/useMidiStore';
import { getCoverUrl } from '../lib/coverArt';

const AVAILABLE_KEYS = [
  'C', 'Cm', 'C#', 'C#m', 'Db', 'Dbm', 'D', 'Dm', 'D#', 'D#m', 'Eb', 'Ebm',
  'E', 'Em', 'F', 'Fm', 'F#', 'F#m', 'Gb', 'Gbm', 'G', 'Gm', 'G#', 'G#m',
  'Ab', 'Abm', 'A', 'Am', 'A#', 'A#m', 'Bb', 'Bbm', 'B', 'Bm'
];

export const Header: React.FC = () => {
  const { currentSong, globalBpm, masterVolume, setMasterVolume, masterEq, setMasterEQ, isPlaying, toggleMetronome, metronomeEnabled, isLRSplit, toggleLRSplit, isStageMode, toggleStageMode, logout, isSidebarOpen, setShowSidebar, tapTempo, updateBpm, cycleTimeSignature, pitchShift, setPitchShift, isAdmin, updateSongKey } = usePlayerStore();
  const [showEq, setShowEq] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const [showMidiMap, setShowMidiMap] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showKeySelector, setShowKeySelector] = useState(false);
  const eqRef = useRef<HTMLDivElement>(null);
  const keyRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (keyRef.current && !keyRef.current.contains(e.target as Node)) {
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
    { index: 1, label: 'C# / Db', pt: 'Dó# / Ré♭' },
    { index: 3, label: 'D# / Eb', pt: 'Ré# / Mi♭' },
    { index: 6, label: 'F# / Gb', pt: 'Fá# / Sol♭' },
    { index: 8, label: 'G# / Ab', pt: 'Sol# / Lá♭' },
    { index: 10, label: 'A# / Bb', pt: 'Lá# / Si♭' },
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
    
    const useFlats = originalKey.includes('b') || originalKey.includes('B') && originalKey.toLowerCase().includes('b');
    
    const notes = useFlats 
      ? ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B']
      : ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
      
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
    const useFlats = songKey?.includes('b') || songKey?.includes('B') && songKey?.toLowerCase().includes('b');
    const label = useFlats ? item.label.split(' / ')[1] : item.label.split(' / ')[0];
    const pt = useFlats ? item.pt.split(' / ')[1] : item.pt.split(' / ')[0];
    return { label, pt };
  };

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
          animate={{ scale: isPlaying ? [1, 1.01, 1] : 1 }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="hidden xl:flex items-center gap-3 mr-4 bg-white/[0.02] border border-white/5 py-1.5 px-3 rounded-2xl"
        >
          {currentSong && (
            <div className="w-9 h-9 rounded-xl overflow-hidden border border-white/10 shadow-md shadow-black/40 shrink-0">
              <img 
                src={currentSong.coverUrl || getCoverUrl(currentSong.title, currentSong.artist)} 
                alt={currentSong.title} 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
          )}
          <div className="flex flex-col min-w-0">
            <span className="text-[8px] text-[#00A3FF] uppercase tracking-[0.2em] font-extrabold mb-0.5 leading-none">Now Performing</span>
            <span className="text-white font-extrabold text-xs md:text-sm tracking-tight truncate max-w-[150px]">{currentSong?.title || "No Song Selected"}</span>
          </div>
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

          <div className="w-[1px] h-6 bg-white/10 mx-1" />

          {/* Advanced Pitch Transposer Button */}
          <div className="relative" ref={keyRef}>
            <button 
              onClick={() => setShowKeySelector(!showKeySelector)}
              title="Transposição de Tom"
              className={cn(
                "flex flex-col items-center justify-center px-3 py-1.5 rounded-xl transition-all min-w-[50px]",
                showKeySelector || pitchShift !== 0
                  ? "bg-[#F1C40F]/10 text-[#F1C40F]" 
                  : "text-white/40 hover:bg-white/5 hover:text-white"
              )}
            >
              <Key size={12} className={cn("mb-0.5", pitchShift !== 0 ? "text-[#F1C40F]" : "text-white/40")} />
              <span className={cn("font-black text-xs md:text-sm", pitchShift !== 0 ? "text-[#F1C40F]" : "text-white")}>
                {currentKeyName}
              </span>
            </button>
            
            {/* Popover */}
            <AnimatePresence>
              {showKeySelector && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="fixed sm:absolute top-24 sm:top-auto sm:bottom-auto sm:mt-2 left-1/2 -translate-x-1/2 sm:translate-x-0 sm:left-auto sm:right-0 w-[340px] max-w-[95vw] bg-[#0A0A0B]/95 backdrop-blur-2xl border border-white/10 rounded-2xl p-4 shadow-[0_15px_40px_rgba(0,0,0,0.6),0_0_20px_rgba(241,196,15,0.05)] z-[100] flex flex-col gap-4 text-left"
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
