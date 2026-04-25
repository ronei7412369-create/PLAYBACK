import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { usePlayerStore } from './store/usePlayerStore';
import { audioEngine } from './services/audioEngine';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { WaveformDisplay } from './components/WaveformDisplay';
import { Mixer } from './components/Mixer';
import { TransportControls } from './components/TransportControls';
import { LoginScreen } from './components/LoginScreen';
import { useMIDI } from './hooks/useMIDI';
import { cn } from './lib/utils';
import { Sliders, Type, Grid } from 'lucide-react';
import { auth } from './services/firebase';

import { Teleprompter } from './components/Teleprompter';
import { PadsPlayer } from './components/PadsPlayer';
import { BackgroundAnimation } from './components/BackgroundAnimation';

type MobileView = 'mixer' | 'teleprompter' | 'pads';

export default function App() {
  const { 
    isPlaying, currentTime, seek, currentSong, togglePlay, stop, toggleLoop, 
    setPlaybackRate, playbackRate, initPersistence,
    isAuthenticated, hasAccess, isStageMode, isSidebarOpen
  } = usePlayerStore() as any;

  const [mobileView, setMobileView] = useState<MobileView>('mixer');

  useMIDI(); // Initialize MIDI foot pedals

  
  useEffect(() => {
    initPersistence();
  }, [initPersistence]);

  // Keep screen active while playing
  useEffect(() => {
    let wakeLock: any = null;

    const requestWakeLock = async () => {
      try {
        if ('wakeLock' in navigator) {
          // @ts-ignore
          wakeLock = await navigator.wakeLock.request('screen');
        }
      } catch (err) {
        console.error('Wake Lock error:', err);
      }
    };

    const releaseWakeLock = () => {
      if (wakeLock) {
        wakeLock.release().catch(console.error);
        wakeLock = null;
      }
    };

    if (isPlaying) {
      requestWakeLock();
    } else {
      releaseWakeLock();
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && isPlaying) {
        requestWakeLock();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      releaseWakeLock();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isPlaying]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      switch (e.code) {
        case 'Space': e.preventDefault(); togglePlay(); break;
        case 'KeyS': stop(); break;
        case 'KeyL': toggleLoop(); break;
        case 'Digit1': case 'Digit2': case 'Digit3': case 'Digit4': case 'Digit5':
        case 'Digit6': case 'Digit7': case 'Digit8': case 'Digit9':
          if (currentSong) {
            const markerIndex = parseInt(e.key) - 1;
            if (currentSong.markers[markerIndex]) seek(currentSong.markers[markerIndex].startTime);
          }
          break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [togglePlay, stop, toggleLoop, seek, currentSong]);

  useEffect(() => {

    let animationFrameId: number;
    let lastTime = 0;

    const tick = (timestamp: number) => {
      // Limit updates to UI to avoid React thrashing, 
      // but ensure smooth animation for playhead if needed via CSS or refs ideally.
      // Doing it in store works but might re-render too much. Let's throttle slightly if needed, 
      // but requestAnimationFrame is better than setInterval.
      if (timestamp - lastTime >= 50) { // ~20fps upate is enough for numbers, waveform is CSS
        const engTime = audioEngine.getCurrentTime();
        if (currentSong && engTime >= currentSong.duration) {
          seek(0);
          stop(); // Or loop based on settings
        } else {
          // We bypass Zustand store to avoid massive re-renders of the WHOLE app
          // But since other components rely on currentTime from store, we'll update it.
          usePlayerStore.setState({ currentTime: engTime });
          
          if (currentSong) {
             const { setlist, preloadingSongId, preloadedSongIds } = usePlayerStore.getState();
             const currentIndex = setlist.findIndex(s => s.id === currentSong.id);
             if (currentIndex !== -1 && currentIndex < setlist.length - 1) {
                // Preload all remaining songs sequentially, but let's just trigger the next one for now.
                // Since `preloadSong` will only work if not already `preloadedSongIds`, once it's done,
                // the next tick won't trigger it again. We could even look ahead to all un-preloaded songs.
                for (let i = currentIndex + 1; i < setlist.length; i++) {
                   const nextSongId = setlist[i].id;
                   if (!preloadedSongIds.includes(nextSongId)) {
                      if (!preloadingSongId) {
                         usePlayerStore.getState().preloadSong(nextSongId);
                      }
                      break; // Only preload one at a time, wait for it to finish
                   }
                }
             }
          }
        }
        lastTime = timestamp;
      }
      
      if (isPlaying) {
        animationFrameId = requestAnimationFrame(tick);
      }
    };

    if (isPlaying && currentSong) {
      animationFrameId = requestAnimationFrame(tick);
    }
    return () => cancelAnimationFrame(animationFrameId);
  }, [isPlaying, currentSong, seek, stop]);

  if (!isAuthenticated) return <LoginScreen />;

  if (!hasAccess) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-transparent text-white p-6 text-center">
        <BackgroundAnimation />
        <h1 className="text-3xl font-black mb-4">Período de Teste Expirado</h1>
        <p className="text-white/60 mb-8 max-w-md">Seu período de teste de 3 dias chegou ao fim. Para continuar usando o aplicativo e acessar todas as ferramentas, por favor, realize o pagamento da assinatura mensal.</p>
        <button onClick={() => window.location.href = 'mailto:ronei7412369@gmail.com'} className="bg-[#00A3FF] hover:bg-[#00A3FF]/80 text-white font-bold py-3 px-8 rounded-full transition-colors mb-4">
          Renovar Assinatura
        </button>
        <button onClick={() => { auth.signOut(); window.location.reload(); }} className="text-white/40 hover:text-white transition-colors">
          Sair
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-transparent text-white overflow-hidden font-sans select-none relative">
      <BackgroundAnimation />
      
      <Header />
      
      <div className="flex flex-1 overflow-hidden relative z-10 w-full">
        {/* Sidebar for Desktop - Always visible unless Stage Mode */}
        {!isStageMode && (
          <div className="hidden lg:block h-full z-40 relative">
            <Sidebar />
          </div>
        )}

        {/* Sidebar Overlay for Mobile */}
        <AnimatePresence>
          {(!isStageMode && isSidebarOpen) && (
            <motion.div
              initial={{ x: -320 }}
              animate={{ x: 0 }}
              exit={{ x: -320 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="absolute lg:hidden z-50 h-full shadow-2xl"
            >
              <Sidebar />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Close overlay on mobile */}
        {(!isStageMode && isSidebarOpen) && (
           <div 
             className="absolute inset-0 z-40 bg-black/50 lg:hidden backdrop-blur-sm"
             onClick={() => usePlayerStore.getState().setShowSidebar(false)}
           />
        )}
        
        <main className="flex-1 flex flex-col overflow-hidden bg-black/20 backdrop-blur-sm relative z-10">
          <WaveformDisplay />
          
          <div className="flex-1 overflow-hidden flex flex-col">
             {isStageMode ? (
               <div className="h-full flex flex-col items-center justify-center p-8 text-center bg-gradient-to-b from-transparent to-[#00A3FF]/5">
                 <div className="text-[120px] md:text-[200px] font-black tabular-nums tracking-tighter leading-none text-[#00A3FF] drop-shadow-[0_0_80px_rgba(0,163,255,0.4)]">
                   {Math.floor(currentTime / 60)}:{(Math.floor(currentTime) % 60).toString().padStart(2, '0')}
                 </div>
                 {currentSong && currentSong.markers.length > 0 && (
                    <div className="mt-8 px-12 py-6 bg-white/5 backdrop-blur-xl border border-white/10 rounded-full flex flex-col gap-2">
                       <span className="text-white/40 uppercase tracking-[0.3em] font-black text-sm">Próxima Seção</span>
                       <span className="text-4xl md:text-5xl font-black text-white">
                         {currentSong.markers.find(m => m.startTime > currentTime)?.label || 'FIM DA MÚSICA'}
                       </span>
                    </div>
                 )}
               </div>
             ) : (
               <>
                 <div className="sm:hidden flex p-2 gap-2 bg-[#0A0A0B]/80 sticky top-0 z-20 border-b border-white/5 overflow-x-auto scrollbar-hide shrink-0">
                   <button 
                     onClick={() => setMobileView('mixer')}
                     className={cn(
                       "flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-bold transition-all whitespace-nowrap",
                       mobileView === 'mixer' ? "bg-[#0088CC] text-white" : "bg-white/5 text-white/50"
                     )}
                   >
                     <Sliders size={16} /> Mixer
                   </button>
                   <button 
                     onClick={() => setMobileView('teleprompter')}
                     className={cn(
                       "flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-bold transition-all whitespace-nowrap",
                       mobileView === 'teleprompter' ? "bg-purple-500 text-white" : "bg-white/5 text-white/50"
                     )}
                   >
                     <Type size={16} /> Cifras
                   </button>
                   <button 
                     onClick={() => setMobileView('pads')}
                     className={cn(
                       "flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-bold transition-all whitespace-nowrap",
                       mobileView === 'pads' ? "bg-teal-500 text-white" : "bg-white/5 text-white/50"
                     )}
                   >
                     <Grid size={16} /> Pads
                   </button>
                 </div>

                 <div className={cn(
                   "overflow-hidden shrink-0",
                   "flex-1 sm:flex-none sm:h-[180px] lg:h-[200px] xl:h-[220px]",
                   "sm:block transition-all",
                   mobileView !== 'mixer' && "hidden sm:block" 
                 )}>
                   <Mixer />
                 </div>

                 <div className={cn(
                   "flex-1 flex flex-col sm:flex-row gap-4 px-4 pb-4 sm:bg-[#050506]/50 min-h-0",
                   "sm:overflow-hidden overflow-y-auto",
                   (mobileView !== 'teleprompter' && mobileView !== 'pads') && "hidden sm:flex" 
                 )}>
                    {/* Teleprompter */}
                    <div className={cn(
                      "flex-[2] rounded-xl bg-[#0A0A0B] border border-white/5 overflow-hidden group transition-all relative",
                      "min-h-[400px] sm:min-h-0 sm:h-full",
                      "sm:block",
                      mobileView !== 'teleprompter' && "hidden sm:flex"
                    )}>
                       <Teleprompter />
                    </div>
                    
                    {/* Pads */}
                    <div className={cn(
                      "flex-none w-full sm:w-[360px] rounded-xl bg-[#0A0A0B] border border-white/5 overflow-hidden p-3",
                      "min-h-[350px] sm:min-h-0 sm:h-full",
                      "sm:block",
                      mobileView !== 'pads' && "hidden sm:block"
                    )}>
                       <PadsPlayer />
                    </div>
                 </div>
               </>
             )}
          </div>

          <TransportControls />
        </main>
      </div>

      {/* Global CSS for scrollbars and custom elements */}
      <style>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.02);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.2);
        }
        input[type="range"]::-webkit-slider-thumb {
          appearance: none;
          width: 16px;
          height: 16px;
          background: #fff;
          border-radius: 50%;
          cursor: pointer;
          border: 4px solid #00A3FF;
          box-shadow: 0 0 15px rgba(0, 163, 255, 0.5);
          transition: all 0.2s ease;
        }
        input[type="range"]::-webkit-slider-thumb:hover {
          transform: scale(1.2);
          box-shadow: 0 0 20px rgba(0, 163, 255, 0.8);
        }
        @keyframes pulse-glow {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 1; }
        }
        .animate-pulse-glow {
          animation: pulse-glow 2s infinite;
        }
      `}</style>
    </div>
  );
}
