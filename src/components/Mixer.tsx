import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { usePlayerStore } from '../store/usePlayerStore';
import { Stem } from '../types';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { Settings, X, Volume2, VolumeX, Headphones, SlidersHorizontal, Activity } from 'lucide-react';
import { audioEngine } from '../services/audioEngine';

interface ChannelStripProps {
  stem: Stem;
  index: number;
  onOpenDetails: () => void;
}

const TRACK_COLORS = [
  '#FF453A', // Apple Neon Ruby
  '#BF5AF2', // Apple Neon Violet
  '#0A84FF', // Apple Neon Blue
  '#30D158', // Apple Neon Green
  '#FFD60A', // Apple Neon Yellow
  '#FF9F0A', // Apple Neon Orange
  '#64D2FF', // Apple Neon Light Blue
  '#FF375F', // Apple Neon Pink
  '#E056FD', // Purple Spark
  '#30336B', // Deep Space
  '#10AC84', // Mint Green
  '#FF9F43', // Warm Gold
  '#54A0FF', // Sky Blue
  '#5F27CD', // Pure Violet
  '#EE5253', // Rose Red
  '#01A3A4'  // Petrol Teal
];

const ChannelStrip: React.FC<ChannelStripProps> = ({ stem, index, onOpenDetails }) => {
  const { updateStemVolume, isPlaying, toggleStemMute, toggleStemSolo, currentSong } = usePlayerStore();
  const trackColor = TRACK_COLORS[index % TRACK_COLORS.length];
  
  const meterRef = useRef<HTMLDivElement>(null);
  const ledRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let animationFrameId: number;

    const renderLoop = () => {
      // 1. Update standard vertical meters
      if (meterRef.current) {
        if (!isPlaying || stem.isMuted) {
          meterRef.current.style.height = '0%';
        } else {
          const level = audioEngine.getStemLevel(stem.id);
          const percentage = Math.min(100, Math.max(0, level * 100));
          meterRef.current.style.height = `${percentage}%`;
        }
      }

      // 2. Real-time Frequency Modulation LED Lights
      if (ledRef.current) {
        if (!isPlaying || stem.isMuted) {
          ledRef.current.style.opacity = '0.15';
          ledRef.current.style.transform = 'scale(0.85)';
          ledRef.current.style.boxShadow = `0 0 4px ${trackColor}40`;
        } else {
          const level = audioEngine.getStemLevel(stem.id);
          // Scale raw audio amplitude (intensity peak range 0 to ~1)
          const multiplier = Math.min(1.0, level * 2.5);
          ledRef.current.style.opacity = `${0.35 + multiplier * 0.65}`;
          ledRef.current.style.transform = `scale(${1.0 + multiplier * 0.75})`;
          ledRef.current.style.boxShadow = `0 0 ${4 + multiplier * 18}px ${trackColor}, 0 0 ${1 + multiplier * 6}px #ffffff`;
        }
      }
      
      animationFrameId = requestAnimationFrame(renderLoop);
    };

    renderLoop();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [isPlaying, stem.isMuted, stem.id, trackColor]);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center w-16 sm:w-20 md:w-24 shrink-0 h-full ios-glass border-r border-white/5 py-3 group relative overflow-hidden transition-all hover:bg-white/5"
    >
      {/* Background Glow */}
      <div 
        className={cn(
          "absolute inset-0 transition-opacity duration-1000 pointer-events-none opacity-10",
          stem.isSoloed ? "bg-[#FFD60A]/20" : stem.isMuted ? "bg-[#FF3B30]/20" : ""
        )} 
        style={{ backgroundColor: (!stem.isSoloed && !stem.isMuted) ? `${trackColor}15` : undefined }} 
      />

      {/* Dynamic LED Indicator Lamp */}
      <div className="absolute top-2 right-2 w-2 h-2 flex items-center justify-center pointer-events-none">
        <div 
          ref={ledRef}
          className="w-1.5 h-1.5 rounded-full transition-all duration-75 border border-white/10"
          style={{ 
            backgroundColor: trackColor,
            boxShadow: `0 0 6px ${trackColor}`,
          }}
          title={`${stem.name} Frequency Light`}
        />
      </div>

      {/* Label */}
      <div className="w-full px-1.5 md:px-2 z-10 relative mb-2 flex items-center justify-center">
        <button 
          onClick={onOpenDetails}
          className={cn(
            "w-full py-2 rounded-xl flex items-center justify-center transition-all duration-300 border overflow-hidden bg-black/40 hover:bg-black/20",
            stem.isMuted ? "border-white/5 opacity-55" : "shadow-lg"
          )}
          style={{ borderColor: stem.isMuted ? undefined : `${trackColor}50`, color: trackColor }}
        >
          <span 
            className={cn(
               "text-[8px] md:text-[9.5px] font-extrabold uppercase text-center leading-tight tracking-wider px-1",
               stem.isMuted ? "text-white/35" : "text-white/90"
            )}
            style={{ 
              display: '-webkit-box', 
              WebkitLineClamp: 2, 
              WebkitBoxOrient: 'vertical',
              wordBreak: 'break-word',
              minHeight: '2.4em'
            }}
          >
            {stem.name}
          </span>
        </button>
      </div>

      {/* Fader Area */}
      <div className="flex-1 relative flex flex-col items-center w-full z-10 pb-4 md:pb-6 pt-2">
        {/* VU Meter Container */}
        <div className="absolute left-1 sm:left-2 md:left-3 top-4 bottom-4 w-1 sm:w-1.5 bg-black/60 rounded-full overflow-hidden border border-white/5 shadow-inner">
          <div 
            ref={meterRef}
            className="w-full transition-[height] duration-75 rounded-b-full"
            style={{ 
              position: 'absolute', bottom: 0, left: 0,
              background: `linear-gradient(to top, ${trackColor}, #FFD60A, #FF453A)`,
              height: '0%',
              opacity: stem.isMuted ? 0.15 : 1
            }}
          />
        </div>

        {/* Fader Track */}
        <div className="relative h-full w-full flex justify-center group/fader cursor-pointer" onClick={onOpenDetails}>
          <div className="absolute top-0 bottom-0 w-1 sm:w-1.5 bg-black/60 rounded-full border border-white/5 shadow-inner" />
          
          {/* Fader Tick Marks */}
          <div className="absolute top-0 bottom-0 left-4 sm:left-6 md:left-8 flex flex-col justify-between py-1 pointer-events-none opacity-15">
            {[0, 1, 2, 3, 4].map(i => (
              <div key={i} className="flex items-center gap-1">
                <div className="w-1.5 md:w-2 h-[1px] bg-white" />
                {i === 0 && <span className="text-[6px] md:text-[7px] font-extrabold text-white absolute -right-2 md:-right-3 top-[-3px] hidden sm:block">0dB</span>}
              </div>
            ))}
          </div>

          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={stem.volume}
            onChange={(e) => updateStemVolume(stem.id, parseFloat(e.target.value))}
            onClick={(e) => e.stopPropagation()}
            className="absolute top-0 bottom-0 left-0 w-full opacity-0 cursor-pointer z-20 [writing-mode:bt-lr] [appearance:slider-vertical]"
          />

          {/* Custom Fader Thumb */}
          <motion.div 
            className={cn(
              "absolute w-6 sm:w-8 md:w-9 h-7 sm:h-9 md:h-10 rounded-[10px] md:rounded-xl shadow-xl z-10 pointer-events-none flex flex-col items-center justify-center gap-0.5 border transition-colors duration-300",
              stem.isMuted ? "bg-white/10 border-white/5" : "bg-gradient-to-br from-[#1E1E20] to-[#0D0D0E]"
            )}
            style={{ 
              bottom: `${stem.volume * 100}%`, transform: 'translateY(50%)',
              borderColor: stem.isMuted ? undefined : `${trackColor}50`,
              boxShadow: stem.isMuted ? undefined : `0 4px 15px ${trackColor}25`
            }}
            animate={{ scale: stem.isMuted ? 0.85 : 1 }}
          >
            <div className={cn("w-3.5 sm:w-4 md:w-5 h-[1.5px] rounded-full", stem.isMuted ? "bg-white/10" : "")} style={{ backgroundColor: stem.isMuted ? undefined : trackColor }} />
            <div className={cn("w-3.5 sm:w-4 md:w-5 h-[1.5px] rounded-full", stem.isMuted ? "bg-white/10" : "")} style={{ backgroundColor: stem.isMuted ? undefined : trackColor }} />
          </motion.div>
        </div>
      </div>

      {/* Quick Controls */}
      <div className="mt-1 flex flex-col gap-1 z-10 px-1.5 w-full">
         <div className="flex gap-1 w-full h-8">
            <button
               onClick={() => toggleStemMute(stem.id)}
               className={cn(
                 "flex-1 rounded-lg flex items-center justify-center transition-all border border-transparent text-[10px]",
                 stem.isMuted ? "bg-[#FF3B30] text-white border-[#FF3B30]/30 shadow-[0_0_12px_rgba(255,59,48,0.35)]" : "bg-white/5 text-white/40 hover:bg-white/10 hover:text-white"
               )}
            >
               <span className="font-extrabold font-sans">M</span>
            </button>
            <button
               onClick={() => toggleStemSolo(stem.id)}
               className={cn(
                 "flex-1 rounded-lg flex items-center justify-center transition-all border border-transparent text-[10px]",
                 stem.isSoloed ? "bg-[#FFD60A] text-black border-[#FFD60A]/30 shadow-[0_0_12px_rgba(255,214,10,0.35)]" : "bg-white/5 text-white/40 hover:bg-white/10 hover:text-white"
               )}
            >
               <span className="font-extrabold font-sans">S</span>
            </button>
         </div>
      </div>
    </motion.div>
  );
};

const TrackDetailsModal: React.FC<{ stem: Stem, index: number, onClose: () => void }> = ({ stem, index, onClose }) => {
  const { updateStemVolume, toggleStemMute, toggleStemSolo, setStemOutput, setStemEQ } = usePlayerStore();
  const trackColor = TRACK_COLORS[index % TRACK_COLORS.length];

  return createPortal(
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-end justify-center bg-black/70 backdrop-blur-md sm:items-center sm:p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: "100%", scale: 0.95 }}
        animate={{ y: 0, scale: 1 }}
        exit={{ y: "100%", scale: 0.95 }}
        transition={{ type: "spring", damping: 26, stiffness: 320 }}
        className="w-full sm:w-[500px] max-w-full ios-glass border-t sm:border border-white/15 rounded-t-[2rem] sm:rounded-[2.25rem] shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-white/10 bg-gradient-to-b from-white/5 to-transparent">
            <div className="flex items-center gap-3">
              <div 
                className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg border border-white/10"
                style={{ backgroundColor: `${trackColor}25`, boxShadow: `0 0 15px ${trackColor}20` }}
              >
                <SlidersHorizontal size={18} style={{ color: trackColor }} />
              </div>
              <div>
                <h3 className="text-white font-extrabold text-base tracking-normal uppercase" style={{ color: trackColor }}>{stem.name}</h3>
                <p className="text-white/35 text-[9px] uppercase tracking-widest font-black mt-0.5">Track Settings</p>
              </div>
            </div>
            <button onClick={onClose} className="p-1.5 bg-white/5 rounded-full text-white/40 hover:text-white hover:bg-white/10 transition-colors border border-white/5">
              <X size={16} />
            </button>
          </div>

          <div className="p-5 flex flex-col sm:flex-row gap-5 overflow-y-auto max-h-[80vh]">
            
            {/* Primary Controls */}
            <div className="flex flex-col gap-4 w-full sm:w-1/2">
               {/* Fader */}
               <div className="bg-black/40 rounded-2xl p-4 border border-white/5 flex flex-col items-center flex-1">
                  <div className="flex justify-between w-full mb-3">
                     <VolumeX size={15} className="text-white/30" />
                     <Volume2 size={15} className={stem.volume > 0.8 ? "" : "text-white/30"} style={stem.volume > 0.8 ? { color: trackColor } : {}} />
                  </div>
                  
                  <div className="relative w-full h-44 flex justify-center py-2 shrink-0">
                     <div className="absolute inset-y-0 w-1.5 bg-black/60 rounded-full border border-white/5 shadow-inner" />
                     <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.01"
                        value={stem.volume}
                        onChange={(e) => updateStemVolume(stem.id, parseFloat(e.target.value))}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20 [writing-mode:bt-lr] [appearance:slider-vertical]"
                     />
                     <motion.div 
                        className="absolute w-10 h-8 rounded-lg shadow-2xl z-10 pointer-events-none flex items-center justify-center border border-white/15 bg-gradient-to-br from-[#1E1E20] to-[#0A0A0B]"
                        style={{ bottom: `${stem.volume * 100}%`, transform: 'translateY(50%)', borderColor: `${trackColor}50` }}
                     >
                        <div className="flex flex-col gap-1">
                           <div className="w-5 h-[1.5px] rounded-full" style={{ backgroundColor: trackColor }} />
                           <div className="w-5 h-[1.5px] rounded-full" style={{ backgroundColor: trackColor }} />
                        </div>
                     </motion.div>
                  </div>

                  <div className="mt-4 text-center flex items-baseline justify-center">
                     <span className="font-mono font-black text-2xl tabular-nums leading-none" style={{ color: trackColor }}>{(stem.volume * 100).toFixed(0)}</span>
                     <span className="text-white/30 text-xs font-bold ml-1">%</span>
                  </div>
               </div>
            </div>

            {/* Right Column: Buttons & EQ */}
            <div className="flex flex-col gap-4 w-full sm:w-1/2">
               <div className="flex gap-3">
                  <button
                     onClick={() => toggleStemMute(stem.id)}
                     className={cn(
                        "flex-1 rounded-2xl py-3 flex flex-col items-center justify-center gap-1.5 transition-all border-2 text-[10px]",
                        stem.isMuted 
                           ? "bg-[#FF3B30]/15 border-[#FF3B30] text-[#FF3B30] shadow-[0_0_20px_rgba(255,59,48,0.2)] font-extrabold" 
                           : "bg-black/30 border-white/5 text-white/40 hover:border-white/10"
                     )}
                  >
                     <VolumeX size={20} />
                     <span className="font-extrabold tracking-widest uppercase">Mute</span>
                  </button>

                  <button
                     onClick={() => toggleStemSolo(stem.id)}
                     className={cn(
                        "flex-1 rounded-2xl py-3 flex flex-col items-center justify-center gap-1.5 transition-all border-2 text-[10px]",
                        stem.isSoloed 
                           ? "bg-[#FFD60A]/15 border-[#FFD60A] text-[#FFD60A] shadow-[0_0_20px_rgba(255,214,10,0.2)] font-extrabold" 
                           : "bg-black/30 border-white/5 text-white/40 hover:border-white/10"
                     )}
                  >
                     <Headphones size={20} />
                     <span className="font-extrabold tracking-widest uppercase">Solo</span>
                  </button>
               </div>

               <div className="bg-black/40 rounded-2xl border border-white/5 p-3">
                  <label className="text-[8px] uppercase font-black text-white/35 block mb-1.5 tracking-widest">Output Routing</label>
                  <select 
                     value={stem.output}
                     onChange={(e) => setStemOutput(stem.id, parseInt(e.target.value))}
                     className="w-full bg-[#111112] border border-white/10 rounded-xl p-2.5 text-xs font-extrabold text-white outline-none cursor-pointer hover:bg-white/5 transition-colors"
                  >
                     <option value={1} className="bg-[#111112] text-xs">L (Click)</option>
                     <option value={2} className="bg-[#111112] text-xs">R (Tracks)</option>
                     <option value={3} className="bg-[#111112] text-xs">Stereo Output</option>
                  </select>
               </div>

               {/* EQ Section */}
               <div className="bg-black/40 rounded-2xl p-3 border border-white/5 flex-1 flex flex-col">
                  <div className="text-[9px] uppercase font-black tracking-widest mb-3" style={{ color: trackColor }}>Equalizer</div>
                  <div className="flex gap-2 flex-1 min-h-[110px]">
                     {['high', 'mid', 'low'].map((band) => {
                         const value = stem.eq?.[band as keyof typeof stem.eq] || 0;
                         const percentage = ((value + 24) / 48) * 100;
                         
                         return (
                            <div key={band} className="flex-1 flex flex-col items-center gap-1.5">
                               <div className="text-[8px] font-extrabold text-white/35 uppercase tracking-wider">{band}</div>
                               <div className="flex-1 relative w-full flex justify-center">
                                  <div className="absolute inset-y-0 w-1.5 bg-black/60 rounded-full border border-white/5 shadow-inner" />
                                  <div 
                                     className={cn(
                                        "absolute bottom-0 w-1.5 rounded-b-full transition-all",
                                        value > 0 ? "shadow-[0_0_10px_currentColor]" : ""
                                     )}
                                     style={{ height: `${percentage}%`, backgroundColor: value > 0 ? trackColor : '#FF3B30', color: trackColor }}
                                  />
                                  <input
                                     type="range"
                                     min="-24"
                                     max="24"
                                     step="1"
                                     value={value}
                                     onChange={(e) => setStemEQ(stem.id, band as 'high'|'mid'|'low', parseFloat(e.target.value))}
                                     className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20 [writing-mode:bt-lr] [appearance:slider-vertical]"
                                  />
                               </div>
                               <div className="text-[9px] font-mono tabular-nums text-white/60">
                                  {value > 0 ? '+' : ''}{value}
                               </div>
                            </div>
                         );
                     })}
                  </div>
               </div>

            </div>

          </div>
        </motion.div>
      </motion.div>,
    document.body
  );
};

export const Mixer: React.FC = () => {
  const { currentSong } = usePlayerStore();
  const [selectedTrackId, setSelectedTrackId] = useState<string | null>(null);

  if (!currentSong) return null;

  const selectedStem = currentSong.stems.find(s => s.id === selectedTrackId);

  return (
    <div className="flex-1 flex overflow-x-auto bg-white/[0.02] backdrop-blur-md border border-white/5 custom-scrollbar relative h-full rounded-[20px] mx-1 sm:mx-0">
      {/* Background Texture Grid */}
      <div className="absolute inset-0 opacity-[0.02] pointer-events-none" 
        style={{ 
          backgroundImage: 'radial-gradient(circle at 1.5px 1.5px, white 1px, transparent 0)',
          backgroundSize: '18px 18px'
        }} 
      />
      
      {currentSong.stems.map((stem, index) => (
        <ChannelStrip key={stem.id} stem={stem} index={index} onOpenDetails={() => setSelectedTrackId(stem.id)} />
      ))}
      <div className="min-w-[40px]" />

      <AnimatePresence>
        {selectedStem && (
           <TrackDetailsModal 
             key="track-details-modal"
             stem={selectedStem} 
             index={currentSong.stems.findIndex(s => s.id === selectedStem.id)}
             onClose={() => setSelectedTrackId(null)} 
           />
         )}
      </AnimatePresence>
    </div>
  );
};
