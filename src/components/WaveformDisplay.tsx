import React, { useRef, useMemo, useEffect } from 'react';
import { usePlayerStore } from '../store/usePlayerStore';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';

export const WaveformDisplay: React.FC = () => {
  const { currentSong, currentTime, seek, isPlaying, isLooping, themeMode } = usePlayerStore();
  const containerRef = useRef<HTMLDivElement>(null);

  const isHighContrast = themeMode === 'high-contrast';

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
    <div 
      className={cn(
        "h-24 sm:h-32 md:h-40 lg:h-44 relative overflow-hidden border-b group flex-shrink-0 transition-colors duration-300",
        isHighContrast ? "bg-[#000000] border-white/30" : "bg-white/5 backdrop-blur-md border-white/10"
      )}
    >
      {/* Background Grid */}
      <div 
        className={cn(
          "absolute inset-0 pointer-events-none transition-opacity duration-300",
          isHighContrast ? "opacity-[0.14]" : "opacity-[0.03]"
        )} 
        style={{ 
          backgroundImage: isHighContrast 
            ? 'linear-gradient(to right, #ffffff 1.5px, transparent 1.5px), linear-gradient(to bottom, #ffffff 1.5px, transparent 1.5px)'
            : 'linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)',
          backgroundSize: '36px 36px'
        }} 
      />

      {/* Markers */}
      <div className="absolute top-0 left-0 w-full h-10 flex z-20 pointer-events-none">
        {currentSong.markers.map((marker) => (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            key={marker.id}
            className={cn(
              "absolute h-full border-l px-3 flex items-center cursor-pointer hover:bg-white/5 transition-colors pointer-events-auto",
              isHighContrast ? "border-white/40" : "border-white/10"
            )}
            style={{ left: `${(marker.startTime / currentSong.duration) * 100}%` }}
            onClick={(e) => {
              e.stopPropagation();
              seek(marker.startTime);
            }}
          >
            <div 
              className={cn(
                "flex items-center gap-2 px-2.5 py-1 rounded-[10px] border font-sans font-extrabold shadow-lg",
                isHighContrast ? "bg-black border-2 text-white font-black" : "backdrop-blur-xl"
              )}
              style={{ 
                backgroundColor: isHighContrast ? '#000000' : `${marker.color}20`, 
                borderColor: isHighContrast ? marker.color : `${marker.color}50`,
                color: isHighContrast ? '#FFFFFF' : marker.color 
              }}
            >
              <div 
                className="w-2 h-2 rounded-full ring-2 ring-white/20" 
                style={{ backgroundColor: marker.color }} 
              />
              <span className="text-[9px] uppercase tracking-widest hidden md:inline">
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
              className={cn(
                "rounded-full transition-all duration-300",
                isHighContrast ? "w-[2.5px] md:w-1.5" : "w-[2px] md:w-1"
              )}
              animate={{ 
                height: height > 0 ? `${Math.max(5, height)}%` : '2px',
                backgroundColor: isPlayed 
                  ? (isHighContrast ? '#00FFFF' : '#00A3FF') 
                  : (isHighContrast ? '#6E6E78' : '#2C2C2E'),
                boxShadow: isPlayed 
                  ? (isHighContrast ? '0 0 16px #00FFFF, 0 0 6px #FFFFFF' : '0 0 12px rgba(0, 163, 255, 0.45)') 
                  : 'none',
                opacity: isPlayed ? 1 : (isHighContrast ? 0.85 : 0.4)
              }}
            />
          );
        })}
      </div>

      {/* Playhead */}
      <motion.div
        className={cn(
          "absolute top-0 bottom-0 pointer-events-none z-30 transition-colors duration-300",
          isHighContrast 
            ? "w-[3px] bg-[#FFFF00] shadow-[0_0_20px_#FFFF00]" 
            : "w-[2px] bg-white shadow-[0_0_20px_rgba(255,255,255,0.6)]"
        )}
        animate={{ left: `${playheadPosition}%` }}
        transition={{ duration: 0, ease: "linear" }}
      >
        <div 
          className={cn(
            "absolute top-0 left-1/2 -translate-x-1/2 w-3.5 h-3.5 rounded-full shadow-lg hidden md:block border-[3.5px]",
            isHighContrast ? "bg-[#FFFF00] border-black" : "bg-white border-[#00A3FF]"
          )} 
        />
        <div 
          className={cn(
            "absolute bottom-0 left-1/2 -translate-x-1/2 w-3.5 h-3.5 rounded-full shadow-lg border-[3.5px]",
            isHighContrast ? "bg-[#FFFF00] border-black" : "bg-white border-[#00A3FF]"
          )} 
        />
      </motion.div>

      {/* Time Display Overlay */}
      <div className="absolute bottom-3 md:bottom-4 left-4 md:left-8 z-40 flex items-center gap-3">
        <div 
          className={cn(
             "px-3 md:px-4 py-1.5 md:py-2 rounded-2xl border flex items-baseline gap-2 shadow-xl transition-all duration-300",
             isHighContrast 
               ? "bg-[#0a0a0d] border-2 border-amber-400 text-white font-black" 
               : "ios-glass-accent backdrop-blur-2xl border-white/10"
          )}
        >
          <span className="text-white font-black text-lg md:text-xl tracking-wider tabular-nums font-mono">
            {Math.floor(currentTime / 60)}:{(Math.floor(currentTime) % 60).toString().padStart(2, '0')}
          </span>
          <span className={cn(
             "font-extrabold text-[10px] md:text-xs tracking-widest uppercase hidden md:inline font-mono",
             isHighContrast ? "text-amber-300/80" : "text-white/30"
          )}>
            / {Math.floor(currentSong.duration / 60)}:{Math.floor(currentSong.duration % 60).toString().padStart(2, '0')}
          </span>
        </div>

        {/* Visual Metronome */}
        {isPlaying && (
          <motion.div 
            animate={{ 
              scale: [1, 1.25, 1],
              opacity: [0.3, 1, 0.3]
            }}
            transition={{ 
              duration: 60 / currentSong.bpm, 
              repeat: Infinity, 
              ease: "easeOut" 
            }}
            className={cn(
              "w-3 h-3 md:w-4 md:h-4 rounded-full",
              isHighContrast 
                ? "bg-amber-400 shadow-[0_0_20px_#FBBF24]" 
                : "bg-[#00A3FF] shadow-[0_0_20px_rgba(0,163,255,0.8)]"
            )}
          />
        )}
      </div>

      {/* Progress Bar Background */}
      <div className="absolute bottom-0 left-0 h-1 bg-white/10 w-full z-0">
        <motion.div 
          className={cn(
             "h-full",
             isHighContrast 
               ? "bg-[#00FFFF] shadow-[0_0_20px_#00FFFF]" 
               : "bg-gradient-to-r from-[#00A3FF] to-[#0066FF] shadow-[0_0_20px_rgba(0,163,255,0.5)]"
          )}
          animate={{ width: `${playheadPosition}%` }}
          transition={{ duration: 0, ease: "linear" }}
        />
      </div>
    </div>
  );
};

