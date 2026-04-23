import React from 'react';
import { usePlayerStore } from '../store/usePlayerStore';
import { Stem } from '../types';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';

interface ChannelStripProps {
  stem: Stem;
}

const ChannelStrip: React.FC<ChannelStripProps> = ({ stem }) => {
  const { updateStemVolume, toggleStemMute, toggleStemSolo, setStemOutput, isPlaying } = usePlayerStore();

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center w-24 h-full bg-[#0A0A0B] border-r border-white/5 py-6 group relative overflow-hidden"
    >
      {/* Background Glow */}
      <div className={cn(
        "absolute inset-0 transition-opacity duration-1000 pointer-events-none",
        stem.isSoloed ? "bg-[#F1C40F]/5" : stem.isMuted ? "bg-red-500/5" : "bg-[#00A3FF]/2"
      )} />

      {/* Output Selector */}
      <div className="relative z-10 mb-4 w-full px-2">
        <select 
          value={stem.output}
          onChange={(e) => setStemOutput(stem.id, parseInt(e.target.value))}
          className="w-full bg-white/5 text-[9px] font-black text-white/60 border border-white/10 rounded-lg px-2 py-1 outline-none focus:border-[#00a3ff] focus:text-white transition-all appearance-none cursor-pointer hover:bg-white/10 text-center"
        >
          <option value={1}>L (Click)</option>
          <option value={2}>R (Tracks)</option>
          <option value={3}>Stereo</option>
        </select>
      </div>

      {/* 3-Band EQ */}
      <div className="flex flex-col gap-3 py-2 w-full px-3 mb-4 z-10 bg-white/[0.02] border-t border-b border-white/5">
        {['high', 'mid', 'low'].map((band) => {
          const value = stem.eq?.[band as keyof typeof stem.eq] || 0;
          // Calculate percentage for visual bar (from -24 to +24)
          // -24 is 0%, 0 is 50%, 24 is 100%
          const percentage = ((value + 24) / 48) * 100;
          
          return (
            <div key={band} className="flex flex-col gap-1 items-center group/eq relative">
              <div className="w-full h-1 bg-white/10 rounded-full relative overflow-hidden">
                 {/* Visual Bar Fill */}
                 <div 
                   className={cn(
                     "absolute top-0 bottom-0 left-0 rounded-full",
                     value > 0 ? "bg-[#00A3FF]" : (value < 0 ? "bg-[#E74C3C]" : "bg-white/40")
                   )}
                   style={{ width: `${percentage}%` }}
                 />
                 <div className="absolute top-0 bottom-0 left-1/2 w-[1px] bg-white/20 -translate-x-1/2" />
              </div>

              <input
                type="range"
                min="-24"
                max="24"
                step="1"
                value={value}
                onChange={(e) => usePlayerStore.getState().setStemEQ(stem.id, band as 'high'|'mid'|'low', parseFloat(e.target.value))}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />
              <div className="flex justify-between w-full mt-0.5">
                <span className="text-[8px] uppercase font-black text-white/30 group-hover/eq:text-white/60">{band}</span>
                <span className={cn(
                  "text-[8px] uppercase font-black tabular-nums",
                  value > 0 ? "text-[#00A3FF]" : (value < 0 ? "text-[#E74C3C]" : "text-white/40")
                )}>
                  {value > 0 ? '+' : ''}{value}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Fader Area */}
      <div className="flex-1 relative flex flex-col items-center w-full z-10">
        {/* VU Meter Container */}
        <div className="absolute left-3 top-0 bottom-0 w-2 bg-black rounded-full overflow-hidden border border-white/5 shadow-inner">
          <motion.div 
            className="w-full bg-gradient-to-t from-[#2ECC71] via-[#F1C40F] to-[#E74C3C] shadow-[0_0_10px_rgba(46,204,113,0.5)]"
            animate={{ 
              height: !isPlaying || stem.isMuted ? '0%' : [`${Math.random() * 40}%`, `${Math.random() * 80}%`, `${Math.random() * 60}%`],
              opacity: stem.isMuted ? 0.2 : 1
            }}
            transition={{ 
              duration: 0.15, 
              repeat: isPlaying ? Infinity : 0,
              repeatType: "reverse"
            }}
          />
        </div>

        {/* Fader Track */}
        <div className="relative h-full w-10 flex justify-center">
          <div className="absolute inset-y-0 w-1.5 bg-black rounded-full border border-white/5 shadow-inner" />
          
          {/* Fader Tick Marks */}
          <div className="absolute inset-y-0 -left-4 flex flex-col justify-between py-1 pointer-events-none opacity-20">
            {[0, 1, 2, 3, 4, 5].map(i => (
              <div key={i} className="w-2 h-[1px] bg-white" />
            ))}
          </div>

          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={stem.volume}
            onChange={(e) => updateStemVolume(stem.id, parseFloat(e.target.value))}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20 [writing-mode:bt-lr] [appearance:slider-vertical]"
          />

          {/* Custom Fader Thumb */}
          <motion.div 
            className={cn(
              "absolute w-8 h-12 rounded-lg shadow-2xl z-10 pointer-events-none flex flex-col items-center justify-center gap-1.5 border border-white/20 transition-colors duration-300",
              stem.isMuted ? "bg-white/10" : "bg-gradient-to-br from-[#00A3FF] to-[#0066FF]"
            )}
            style={{ bottom: `${stem.volume * 100}%`, transform: 'translateY(50%)' }}
            animate={{ scale: stem.isMuted ? 0.9 : 1 }}
          >
            <div className="w-5 h-[2px] bg-white/40 rounded-full" />
            <div className="w-5 h-[2px] bg-white/40 rounded-full" />
            <div className="w-5 h-[2px] bg-white/40 rounded-full" />
            
            {/* Volume Tooltip */}
            <div className="absolute -right-12 bg-black/80 backdrop-blur-md px-1.5 py-0.5 rounded border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity">
              <span className="text-[8px] font-black text-white tabular-nums">{(stem.volume * 100).toFixed(0)}</span>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Solo/Mute Buttons */}
      <div className="mt-10 flex flex-col gap-3 z-10">
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => toggleStemSolo(stem.id)}
          className={cn(
            "w-10 h-10 rounded-2xl border text-[11px] font-black flex items-center justify-center transition-all shadow-lg",
            stem.isSoloed 
              ? "bg-[#F1C40F] border-[#F1C40F] text-black shadow-[#F1C40F]/20" 
              : "bg-white/5 border-white/10 text-white/40 hover:border-[#F1C40F]/50 hover:text-[#F1C40F]"
          )}
        >
          SOLO
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => toggleStemMute(stem.id)}
          className={cn(
            "w-10 h-10 rounded-2xl border text-[11px] font-black flex items-center justify-center transition-all shadow-lg",
            stem.isMuted 
              ? "bg-[#E74C3C] border-[#E74C3C] text-white shadow-[#E74C3C]/20" 
              : "bg-white/5 border-white/10 text-white/40 hover:border-[#E74C3C]/50 hover:text-[#E74C3C]"
          )}
        >
          MUTE
        </motion.button>
      </div>

      {/* Label */}
      <div className="mt-6 px-3 w-full z-10">
        <div className={cn(
          "py-2 rounded-xl border flex items-center justify-center transition-all duration-500",
          stem.isMuted ? "bg-white/5 border-white/5" : "bg-white/10 border-white/10 shadow-lg"
        )}>
          <span className={cn(
            "text-[10px] font-black uppercase truncate px-1 tracking-tighter",
            stem.isMuted ? "text-white/20" : "text-white"
          )}>
            {stem.name}
          </span>
        </div>
      </div>
    </motion.div>
  );
};

export const Mixer: React.FC = () => {
  const { currentSong } = usePlayerStore();

  if (!currentSong) return null;

  return (
    <div className="flex-1 flex overflow-x-auto bg-[#050506] custom-scrollbar relative h-full">
      {/* Background Texture */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
        style={{ 
          backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
          backgroundSize: '24px 24px'
        }} 
      />
      
      {currentSong.stems.map((stem) => (
        <ChannelStrip key={stem.id} stem={stem} />
      ))}
      <div className="min-w-[40px]" />
    </div>
  );
};
