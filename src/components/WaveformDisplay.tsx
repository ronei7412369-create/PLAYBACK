import React, { useRef, useMemo, useEffect } from 'react';
import { usePlayerStore } from '../store/usePlayerStore';
import { motion } from 'motion/react';

export const WaveformDisplay: React.FC = () => {
  const { currentSong, currentTime, seek, isPlaying, isLooping } = usePlayerStore();
  const containerRef = useRef<HTMLDivElement>(null);

  // Vamp logic: If looping is enabled, loop between current marker and next marker
  useEffect(() => {
    if (isPlaying && isLooping && currentSong) {
      // Find what marker we are currently in
      let currentMarkerIndex = -1;
      for (let i = 0; i < currentSong.markers.length; i++) {
         if (currentTime >= currentSong.markers[i].startTime) {
           currentMarkerIndex = i;
         }
      }
      
      const nextMarkerInfo = currentSong.markers[currentMarkerIndex + 1];
      const endTime = nextMarkerInfo ? nextMarkerInfo.startTime : currentSong.duration;
      const startTime = currentMarkerIndex >= 0 ? currentSong.markers[currentMarkerIndex].startTime : 0;

      // If we crossed the end of the section
      if (currentTime >= endTime - 0.05) { // 50ms buffer
        seek(startTime);
      }
    }
  }, [currentTime, isPlaying, isLooping, currentSong, seek]);

  if (!currentSong) return null;

  const handleSeek = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, x / rect.width));
    seek(percentage * currentSong.duration);
  };

  const validDuration = currentSong.duration > 0 ? currentSong.duration : 1;
  const playheadPosition = (currentTime / validDuration) * 100;
  
  // Use real peaks if available, else fallback logic
  const renderPeaks = currentSong.waveformPeaks || Array.from({ length: 120 }).map(() => 0);

  return (
    <div className="h-48 md:h-56 bg-[#050505]/40 backdrop-blur-md relative overflow-hidden border-b border-white/5 group flex-shrink-0">
      {/* Background Grid */}
      <div className="absolute inset-0 opacity-10 pointer-events-none" 
        style={{ 
          backgroundImage: 'linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)',
          backgroundSize: '40px 40px'
        }} 
      />

      {/* Markers */}
      <div className="absolute top-0 left-0 w-full h-10 flex z-20 pointer-events-none">
        {currentSong.markers.map((marker) => (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            key={marker.id}
            className="absolute h-full border-l border-white/10 px-3 flex items-center cursor-pointer hover:bg-white/5 transition-colors pointer-events-auto"
            style={{ left: `${(marker.startTime / currentSong.duration) * 100}%` }}
            onClick={(e) => {
              e.stopPropagation();
              seek(marker.startTime);
            }}
          >
            <div 
              className="flex items-center gap-2 px-2 py-1 rounded-lg border backdrop-blur-md shadow-lg"
              style={{ 
                backgroundColor: `${marker.color}15`, 
                borderColor: `${marker.color}40`,
                color: marker.color 
              }}
            >
              <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: marker.color }} />
              <span className="text-[10px] font-black uppercase tracking-widest hidden md:inline">
                {marker.label}
              </span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Waveform Visualization */}
      <div 
        ref={containerRef}
        onClick={handleSeek}
        className="absolute inset-0 flex items-center justify-between px-2 md:px-8 cursor-pointer z-10"
      >
        {renderPeaks.map((height, i) => {
          const position = (i / renderPeaks.length) * 100;
          const isPlayed = position < playheadPosition;
          
          return (
            <motion.div
              key={i}
              className="w-[2px] md:w-1 rounded-full transition-all duration-300"
              animate={{ 
                height: height > 0 ? `${Math.max(5, height)}%` : '2px',
                backgroundColor: isPlayed ? '#00A3FF' : '#1A1A1B',
                boxShadow: isPlayed ? '0 0 10px rgba(0, 163, 255, 0.4)' : 'none',
                opacity: isPlayed ? 1 : 0.6
              }}
            />
          );
        })}
      </div>

      {/* Playhead */}
      <motion.div
        className="absolute top-0 bottom-0 w-[2px] bg-white z-30 pointer-events-none shadow-[0_0_20px_rgba(255,255,255,0.5)]"
        animate={{ left: `${playheadPosition}%` }}
        transition={{ duration: 0, ease: "linear" }}
      >
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-4 h-4 bg-white rounded-full border-4 border-[#00A3FF] shadow-lg hidden md:block" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-4 bg-white rounded-full border-4 border-[#00A3FF] shadow-lg" />
      </motion.div>

      {/* Time Display Overlay */}
      <div className="absolute bottom-4 md:bottom-6 left-4 md:left-8 z-40 flex items-center gap-4">
        <div className="bg-white/5 backdrop-blur-xl px-3 md:px-4 py-1.5 md:py-2 rounded-2xl border border-white/10 flex items-baseline gap-2 shadow-2xl">
          <span className="text-white font-black text-xl md:text-2xl tracking-tighter tabular-nums">
            {Math.floor(currentTime / 60)}:{(Math.floor(currentTime) % 60).toString().padStart(2, '0')}
          </span>
          <span className="text-white/20 font-black text-xs md:text-sm tracking-widest uppercase hidden md:inline">
            / {Math.floor(currentSong.duration / 60)}:{Math.floor(currentSong.duration % 60).toString().padStart(2, '0')}
          </span>
        </div>

        {/* Visual Metronome */}
        {isPlaying && (
          <motion.div 
            animate={{ 
              scale: [1, 1.2, 1],
              opacity: [0.3, 1, 0.3]
            }}
            transition={{ 
              duration: 60 / currentSong.bpm, 
              repeat: Infinity, 
              ease: "easeOut" 
            }}
            className="w-3 h-3 md:w-4 md:h-4 rounded-full bg-[#00A3FF] shadow-[0_0_20px_rgba(0,163,255,0.8)]"
          />
        )}
      </div>

      {/* Progress Bar Background */}
      <div className="absolute bottom-0 left-0 h-1 bg-white/5 w-full z-0">
        <motion.div 
          className="h-full bg-gradient-to-r from-[#00A3FF] to-[#0066FF] shadow-[0_0_20px_rgba(0,163,255,0.5)]"
          animate={{ width: `${playheadPosition}%` }}
          transition={{ duration: 0, ease: "linear" }}
        />
      </div>
    </div>
  );
};

