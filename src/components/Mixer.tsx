import React, { useState } from 'react';
import { usePlayerStore } from '../store/usePlayerStore';
import { Stem } from '../types';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { Settings, X, Volume2, VolumeX, Headphones, SlidersHorizontal } from 'lucide-react';

interface ChannelStripProps {
  stem: Stem;
  index: number;
  onOpenDetails: () => void;
}

const TRACK_COLORS = [
  '#E74C3C', '#9B59B6', '#3498DB', '#2ECC71', '#F1C40F', '#E67E22', '#1ABC9C', '#34495E',
  '#FF7F50', '#8A2BE2', '#00CED1', '#FF1493', '#32CD32', '#FFD700', '#FF4500', '#4169E1'
];

const ChannelStrip: React.FC<ChannelStripProps> = ({ stem, index, onOpenDetails }) => {
  const { updateStemVolume, isPlaying, toggleStemMute, toggleStemSolo } = usePlayerStore();
  const trackColor = TRACK_COLORS[index % TRACK_COLORS.length];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center w-20 md:w-24 shrink-0 h-full bg-[#0A0A0B]/80 backdrop-blur-sm border-r border-white/5 py-3 group relative overflow-hidden"
    >
      {/* Background Glow */}
      <div className={cn(
        "absolute inset-0 transition-opacity duration-1000 pointer-events-none",
        stem.isSoloed ? "bg-[#F1C40F]/10" : stem.isMuted ? "bg-[#E74C3C]/10" : ""
      )} style={{ backgroundColor: (!stem.isSoloed && !stem.isMuted) ? `${trackColor}10` : undefined }} />

      {/* Label */}
      <div className="w-full px-1 md:px-2 z-10 relative mb-2 flex items-center justify-center">
        <button 
          onClick={onOpenDetails}
          className={cn(
            "w-full py-1.5 md:py-2 rounded-xl flex items-center justify-center transition-all duration-300 border-2 overflow-hidden",
            stem.isMuted ? "bg-white/5 border-white/5" : "bg-white/10 shadow-[0_0_15px_rgba(0,0,0,0.2)]"
          )}
          style={{ borderColor: stem.isMuted ? undefined : `${trackColor}50`, color: trackColor }}
        >
          <span 
            className={cn(
               "text-[9px] md:text-[10px] font-black uppercase text-center leading-tight tracking-[0.02em]",
               stem.isMuted ? "text-white/30" : "text-white"
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
      <div className="flex-1 relative flex flex-col items-center w-full z-10 pb-6 pt-6">
        {/* VU Meter Container */}
        <div className="absolute left-2 md:left-4 top-6 bottom-6 w-1.5 md:w-2 bg-black rounded-full overflow-hidden border border-white/10 shadow-inner">
          <motion.div 
            className="w-full shadow-[0_0_10px_rgba(46,204,113,0.5)]"
            animate={{ 
              height: !isPlaying || stem.isMuted ? '0%' : [`${Math.random() * 40}%`, `${Math.random() * 80}%`, `${Math.random() * 60}%`],
              opacity: stem.isMuted ? 0.2 : 1
            }}
            transition={{ 
              duration: 0.15, 
              repeat: isPlaying ? Infinity : 0,
              repeatType: "reverse"
            }}
            style={{ 
              position: 'absolute', bottom: 0, left: 0,
              background: `linear-gradient(to top, ${trackColor}, #F1C40F, #E74C3C)`
            }}
          />
        </div>

        {/* Fader Track */}
        <div className="relative h-full w-full flex justify-center group/fader cursor-pointer" onClick={onOpenDetails}>
          <div className="absolute top-0 bottom-0 w-1.5 bg-black rounded-full border border-white/10 shadow-inner" />
          
          {/* Fader Tick Marks */}
          <div className="absolute top-0 bottom-0 left-6 md:left-8 flex flex-col justify-between py-1 pointer-events-none opacity-20">
            {[0, 1, 2, 3, 4].map(i => (
              <div key={i} className="flex items-center gap-1">
                <div className="w-1.5 md:w-2 h-[1px] bg-white" />
                {i === 0 && <span className="text-[7px] font-black text-white absolute -right-3 top-[-3px]">0dB</span>}
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
              "absolute w-8 md:w-10 h-10 md:h-12 rounded-xl shadow-2xl z-10 pointer-events-none flex flex-col items-center justify-center gap-1 border transition-colors duration-300",
              stem.isMuted ? "bg-white/10 border-white/5" : "bg-gradient-to-br from-[#1A1A1C] to-[#0A0A0B]"
            )}
            style={{ 
              bottom: `${stem.volume * 100}%`, transform: 'translateY(50%)',
              borderColor: stem.isMuted ? undefined : `${trackColor}60`,
              boxShadow: stem.isMuted ? undefined : `0 0 15px ${trackColor}40`
            }}
            animate={{ scale: stem.isMuted ? 0.9 : 1 }}
          >
            <div className={cn("w-4 md:w-6 h-[2px] rounded-full", stem.isMuted ? "bg-white/20" : "")} style={{ backgroundColor: stem.isMuted ? undefined : trackColor }} />
            <div className={cn("w-4 md:w-6 h-[2px] rounded-full", stem.isMuted ? "bg-white/20" : "")} style={{ backgroundColor: stem.isMuted ? undefined : trackColor }} />
          </motion.div>
        </div>
      </div>

      {/* Quick Controls */}
      <div className="mt-2 flex flex-col gap-1.5 z-10 px-2 w-full">
         <div className="flex gap-1 w-full h-8">
            <button
               onClick={() => toggleStemMute(stem.id)}
               className={cn(
                 "flex-1 rounded-lg flex items-center justify-center transition-all",
                 stem.isMuted ? "bg-[#E74C3C] text-white shadow-[0_0_15px_rgba(231,76,60,0.4)]" : "bg-white/5 text-white/40 hover:bg-white/10 hover:text-white"
               )}
            >
               <span className="text-[10px] font-black">M</span>
            </button>
            <button
               onClick={() => toggleStemSolo(stem.id)}
               className={cn(
                 "flex-1 rounded-lg flex items-center justify-center transition-all",
                 stem.isSoloed ? "bg-[#F1C40F] text-black shadow-[0_0_15px_rgba(241,196,15,0.4)]" : "bg-white/5 text-white/40 hover:bg-white/10 hover:text-white"
               )}
            >
               <span className="text-[10px] font-black">S</span>
            </button>
         </div>
      </div>
    </motion.div>
  );
};

const TrackDetailsModal: React.FC<{ stem: Stem, index: number, onClose: () => void }> = ({ stem, index, onClose }) => {
  const { updateStemVolume, toggleStemMute, toggleStemSolo, setStemOutput, setStemEQ } = usePlayerStore();
  const trackColor = TRACK_COLORS[index % TRACK_COLORS.length];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center sm:p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="w-full sm:w-[400px] bg-[#111112] border-t sm:border border-white/10 rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-white/5 bg-gradient-to-b from-white/5 to-transparent">
            <div className="flex items-center gap-3">
              <div 
                className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg"
                style={{ backgroundColor: `${trackColor}20`, boxShadow: `0 0 15px ${trackColor}20` }}
              >
                <SlidersHorizontal size={20} style={{ color: trackColor }} />
              </div>
              <div>
                <h3 className="text-white font-black text-lg tracking-tight uppercase" style={{ color: trackColor }}>{stem.name}</h3>
                <p className="text-white/40 text-[10px] uppercase tracking-widest font-bold">Track Settings</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 bg-white/5 rounded-full text-white/40 hover:text-white hover:bg-white/10 transition-colors">
              <X size={20} />
            </button>
          </div>

          <div className="p-5 flex flex-col gap-6">
            
            {/* Primary Controls */}
            <div className="flex gap-4">
               {/* Fader */}
               <div className="flex-1 bg-[#0A0A0B] rounded-2xl p-4 border border-white/5 flex flex-col items-center">
                  <div className="flex justify-between w-full mb-4">
                     <VolumeX size={16} className="text-white/30" />
                     <Volume2 size={16} className={stem.volume > 0.8 ? "" : "text-white/30"} style={stem.volume > 0.8 ? { color: trackColor } : {}} />
                  </div>
                  
                  <div className="relative w-full h-48 flex justify-center py-2">
                     <div className="absolute inset-y-0 w-2 bg-black rounded-full border border-white/10 shadow-inner" />
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
                        className="absolute w-12 h-10 rounded-xl shadow-2xl z-10 pointer-events-none flex items-center justify-center border border-white/20 bg-gradient-to-br from-[#1A1A1C] to-[#0A0A0B]"
                        style={{ bottom: `${stem.volume * 100}%`, transform: 'translateY(50%)', borderColor: `${trackColor}60` }}
                     >
                        <div className="flex flex-col gap-1">
                           <div className="w-6 h-[2px] rounded-full" style={{ backgroundColor: trackColor }} />
                           <div className="w-6 h-[2px] rounded-full" style={{ backgroundColor: trackColor }} />
                        </div>
                     </motion.div>
                  </div>

                  <div className="mt-4 text-center">
                     <span className="font-mono font-black text-2xl tabular-nums" style={{ color: trackColor }}>{(stem.volume * 100).toFixed(0)}</span>
                     <span className="text-white/30 text-xs font-bold ml-1">%</span>
                  </div>
               </div>

               {/* Buttons & Output */}
               <div className="flex-1 flex flex-col gap-4">
                  <button
                     onClick={() => toggleStemMute(stem.id)}
                     className={cn(
                        "flex-1 rounded-2xl flex flex-col items-center justify-center gap-2 transition-all border-2",
                        stem.isMuted 
                           ? "bg-[#E74C3C]/20 border-[#E74C3C] text-[#E74C3C] shadow-[0_0_20px_rgba(231,76,60,0.2)]" 
                           : "bg-[#0A0A0B] border-white/5 text-white/40 hover:border-white/20"
                     )}
                  >
                     <VolumeX size={24} />
                     <span className="font-black tracking-widest uppercase">Mute</span>
                  </button>

                  <button
                     onClick={() => toggleStemSolo(stem.id)}
                     className={cn(
                        "flex-1 rounded-2xl flex flex-col items-center justify-center gap-2 transition-all border-2",
                        stem.isSoloed 
                           ? "bg-[#F1C40F]/20 border-[#F1C40F] text-[#F1C40F] shadow-[0_0_20px_rgba(241,196,15,0.2)]" 
                           : "bg-[#0A0A0B] border-white/5 text-white/40 hover:border-white/20"
                     )}
                  >
                     <Headphones size={24} />
                     <span className="font-black tracking-widest uppercase">Solo</span>
                  </button>

                  <div className="bg-[#0A0A0B] rounded-2xl border border-white/5 p-2 px-3">
                     <label className="text-[9px] uppercase font-bold text-white/30 block mb-1">Output Routing</label>
                     <select 
                        value={stem.output}
                        onChange={(e) => setStemOutput(stem.id, parseInt(e.target.value))}
                        className="w-full bg-transparent text-sm font-black text-white outline-none appearance-none cursor-pointer"
                     >
                        <option value={1} className="bg-[#111112]">L (Click)</option>
                        <option value={2} className="bg-[#111112]">R (Tracks)</option>
                        <option value={3} className="bg-[#111112]">Stereo</option>
                     </select>
                  </div>
               </div>
            </div>

            {/* EQ Section */}
            <div className="bg-[#0A0A0B] rounded-2xl p-4 border border-white/5">
               <div className="text-[10px] uppercase font-black tracking-widest mb-4" style={{ color: trackColor }}>Equalizer</div>
               <div className="flex gap-4 h-32">
                  {['high', 'mid', 'low'].map((band) => {
                     const value = stem.eq?.[band as keyof typeof stem.eq] || 0;
                     const percentage = ((value + 24) / 48) * 100;
                     
                     return (
                        <div key={band} className="flex-1 flex flex-col items-center gap-2">
                           <div className="text-[10px] font-bold text-white/40 uppercase">{band}</div>
                           <div className="flex-1 relative w-full flex justify-center">
                              <div className="absolute inset-y-0 w-3 bg-[#111112] rounded-full border border-white/5" />
                              <div 
                                 className={cn(
                                    "absolute bottom-0 w-3 rounded-b-full transition-all",
                                    value > 0 ? "" : "bg-[#E74C3C]"
                                 )}
                                 style={{ height: `${percentage}%`, backgroundColor: value > 0 ? trackColor : undefined }}
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
                           <div className="text-[10px] font-mono tabular-nums text-white/60">
                              {value > 0 ? '+' : ''}{value}
                           </div>
                        </div>
                     );
                  })}
               </div>
            </div>

          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export const Mixer: React.FC = () => {
  const { currentSong } = usePlayerStore();
  const [selectedTrackId, setSelectedTrackId] = useState<string | null>(null);

  if (!currentSong) return null;

  const selectedStem = currentSong.stems.find(s => s.id === selectedTrackId);

  return (
    <div className="flex-1 flex overflow-x-auto bg-[#050505]/40 backdrop-blur-md custom-scrollbar relative h-full rounded-2xl mx-1 sm:mx-0">
      {/* Background Texture */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
        style={{ 
          backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
          backgroundSize: '24px 24px'
        }} 
      />
      
      {currentSong.stems.map((stem, index) => (
        <ChannelStrip key={stem.id} stem={stem} index={index} onOpenDetails={() => setSelectedTrackId(stem.id)} />
      ))}
      <div className="min-w-[40px]" />

      {selectedStem && (
         <TrackDetailsModal 
           stem={selectedStem} 
           index={currentSong.stems.findIndex(s => s.id === selectedStem.id)}
           onClose={() => setSelectedTrackId(null)} 
         />
      )}
    </div>
  );
};

