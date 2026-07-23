import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { usePlayerStore } from '../store/usePlayerStore';
import { Stem } from '../types';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { Settings, X, Volume2, VolumeX, Headphones, SlidersHorizontal, Activity, Clock, Plus, Upload, Trash2, Check } from 'lucide-react';
import { audioEngine } from '../services/audioEngine';
import { handleMidiRightClick } from '../store/useMidiStore';

interface ChannelStripProps {
  stem: Stem;
  index: number;
  onOpenDetails: () => void;
  onRequestDelete: (stem: Stem) => void;
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

const ChannelStrip: React.FC<ChannelStripProps> = ({ stem, index, onOpenDetails, onRequestDelete }) => {
  const { updateStemVolume, isPlaying, toggleStemMute, toggleStemSolo, currentSong, themeMode } = usePlayerStore();
  const trackColor = TRACK_COLORS[index % TRACK_COLORS.length];
  const isHighContrast = themeMode === 'high-contrast';
  
  const meterRef = useRef<HTMLDivElement>(null);
  const ledRef = useRef<HTMLDivElement>(null);

  const handleDeleteTrack = (e: React.MouseEvent) => {
    e.stopPropagation();
    onRequestDelete(stem);
  };

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
      className={cn(
        "flex flex-col items-center w-16 sm:w-20 md:w-24 shrink-0 h-full py-3 group relative overflow-hidden transition-all",
        isHighContrast 
          ? "bg-[#0a0a0e] border-r-2 border-white/20 hover:bg-[#12121a]" 
          : "ios-glass border-r border-white/5 hover:bg-white/5"
      )}
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
      <div className="absolute top-2 right-2 z-20">
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
            "w-full py-2 rounded-xl flex items-center justify-center transition-all duration-300 border overflow-hidden",
            isHighContrast 
              ? "bg-[#000000] border-2 border-white/30 text-white font-black" 
              : "bg-black/40 hover:bg-black/20",
            stem.isMuted ? "border-white/10 opacity-55" : "shadow-lg"
          )}
          style={{ borderColor: stem.isMuted ? undefined : (isHighContrast ? '#FFFFFF' : `${trackColor}50`), color: isHighContrast ? '#FFFFFF' : trackColor }}
        >
          <span 
            className={cn(
               "text-[8px] md:text-[9.5px] font-extrabold uppercase text-center leading-tight tracking-wider px-1",
               stem.isMuted ? "text-white/35" : "text-white"
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
        <div className={cn(
           "absolute left-1 sm:left-2 md:left-3 top-4 bottom-4 w-1 sm:w-1.5 rounded-full overflow-hidden shadow-inner",
           isHighContrast ? "bg-[#000000] border-2 border-white/30" : "bg-black/60 border border-white/5"
        )}>
          <div 
            ref={meterRef}
            className="w-full transition-[height] duration-75 rounded-b-full"
            style={{ 
              position: 'absolute', bottom: 0, left: 0,
              background: isHighContrast 
                ? 'linear-gradient(to top, #00FF66, #00FFFF, #FFFF00, #FF0055)' 
                : `linear-gradient(to top, ${trackColor}, #FFD60A, #FF453A)`,
              height: '0%',
              opacity: stem.isMuted ? 0.15 : 1
            }}
          />
        </div>

        {/* Fader Track */}
        <div className="relative h-full w-full flex justify-center group/fader cursor-pointer" onClick={onOpenDetails}>
          <div className={cn(
             "absolute top-0 bottom-0 w-1 sm:w-1.5 rounded-full shadow-inner",
             isHighContrast ? "bg-[#000000] border-2 border-white/30" : "bg-black/60 border border-white/5"
          )} />
          
          {/* Fader Tick Marks */}
          <div className="absolute top-0 bottom-0 left-4 sm:left-6 md:left-8 flex flex-col justify-between py-1 pointer-events-none">
            {[0, 1, 2, 3, 4].map(i => {
              const isZeroDb = i === 2;
              return (
                <div key={i} className="flex items-center gap-1 relative">
                  <div className={cn("w-1.5 md:w-2 h-[1px]", isZeroDb ? "bg-[#2ECC71] w-2.5 md:w-3.5 h-[1.5px] shadow-[0_0_8px_#2ECC71]" : (isHighContrast ? "bg-white opacity-40" : "bg-white opacity-20"))} />
                  {isZeroDb && (
                    <span className="text-[6px] md:text-[7px] font-black text-[#2ECC71] absolute -right-2 md:-right-3 top-[-3.5px] hidden sm:block drop-shadow-[0_0_3px_rgba(46,204,113,0.4)]">
                      0dB
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={stem.volume}
            onChange={(e) => updateStemVolume(stem.id, parseFloat(e.target.value))}
            onClick={(e) => e.stopPropagation()}
            onContextMenu={(e) => handleMidiRightClick(e, 'stem_volume', `Volume ${stem.name}`, stem.name)}
            className="absolute top-0 bottom-0 left-0 w-full opacity-0 cursor-pointer z-20 [writing-mode:bt-lr] [appearance:slider-vertical]"
          />

          {/* Custom Fader Thumb */}
          <motion.div 
            className={cn(
              "absolute w-6 sm:w-8 md:w-9 h-7 sm:h-9 md:h-10 rounded-[10px] md:rounded-xl shadow-xl z-10 pointer-events-none flex flex-col items-center justify-center gap-0.5 border transition-all duration-300",
              stem.isMuted 
                ? "bg-white/10 border-white/10" 
                : (isHighContrast 
                    ? "bg-[#181822] border-2 border-white shadow-[0_0_15px_rgba(255,255,255,0.35)]" 
                    : "bg-gradient-to-br from-[#1E1E20] to-[#0D0D0E]")
            )}
            style={{ 
              bottom: `${stem.volume * 100}%`, transform: 'translateY(50%)',
              borderColor: stem.isMuted ? undefined : (isHighContrast ? '#FFFFFF' : `${trackColor}50`),
              boxShadow: stem.isMuted ? undefined : (isHighContrast ? `0 0 15px ${trackColor}` : `0 4px 15px ${trackColor}25`)
            }}
            animate={{ scale: stem.isMuted ? 0.85 : 1 }}
          >
            <div className={cn("w-3.5 sm:w-4 md:w-5 h-[1.5px] rounded-full", stem.isMuted ? "bg-white/10" : "")} style={{ backgroundColor: stem.isMuted ? undefined : (isHighContrast ? '#FFFFFF' : trackColor) }} />
            <div className={cn("w-3.5 sm:w-4 md:w-5 h-[1.5px] rounded-full", stem.isMuted ? "bg-white/10" : "")} style={{ backgroundColor: stem.isMuted ? undefined : (isHighContrast ? trackColor : trackColor) }} />
          </motion.div>
        </div>
      </div>

      {/* Quick Controls */}
      <div className="mt-1 flex flex-col gap-1 z-10 px-1.5 w-full">
         <div className="flex gap-1 w-full h-8">
            <button
               onClick={() => toggleStemMute(stem.id)}
               onContextMenu={(e) => handleMidiRightClick(e, 'stem_mute', `Mute ${stem.name}`, stem.name)}
               className={cn(
                 "flex-1 rounded-lg flex items-center justify-center transition-all border text-[10px]",
                 stem.isMuted 
                   ? (isHighContrast 
                       ? "bg-[#FF0033] text-white border-2 border-white shadow-[0_0_15px_#FF0033] font-black" 
                       : "bg-[#FF3B30] text-white border-[#FF3B30]/30 shadow-[0_0_12px_rgba(255,59,48,0.35)]") 
                   : (isHighContrast 
                       ? "bg-[#181822] text-white border-white/20 hover:border-white/50" 
                       : "bg-white/5 text-white/40 hover:bg-white/10 hover:text-white border-transparent")
               )}
            >
               <span className="font-black font-sans">M</span>
            </button>
            <button
               onClick={() => toggleStemSolo(stem.id)}
               onContextMenu={(e) => handleMidiRightClick(e, 'stem_solo', `Solo ${stem.name}`, stem.name)}
               className={cn(
                 "flex-1 rounded-lg flex items-center justify-center transition-all border text-[10px]",
                 stem.isSoloed 
                   ? (isHighContrast 
                       ? "bg-[#FFCC00] text-black border-2 border-black shadow-[0_0_15px_#FFCC00] font-black" 
                       : "bg-[#FFD60A] text-black border-[#FFD60A]/30 shadow-[0_0_12px_rgba(255,214,10,0.35)]") 
                   : (isHighContrast 
                       ? "bg-[#181822] text-white border-white/20 hover:border-white/50" 
                       : "bg-white/5 text-white/40 hover:bg-white/10 hover:text-white border-transparent")
               )}
            >
               <span className="font-black font-sans">S</span>
            </button>
            <button
               onClick={handleDeleteTrack}
               title={`Excluir track ${stem.name}`}
               className="w-7 rounded-lg flex items-center justify-center transition-all bg-white/5 hover:bg-red-500/20 text-white/30 hover:text-red-400 border border-transparent hover:border-red-500/30 shrink-0"
            >
               <Trash2 size={12} />
            </button>
         </div>
      </div>
    </motion.div>
  );
};

// SpectrumAnalyzer Component
interface SpectrumAnalyzerProps {
  stemId: string;
  trackColor: string;
  isPlaying: boolean;
  eq: { low: number; mid: number; high: number };
}

const SpectrumAnalyzer: React.FC<SpectrumAnalyzerProps> = ({ stemId, trackColor, isPlaying, eq }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number | null>(null);
  const peaksRef = useRef<number[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const resizeCanvas = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = container.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      
      if (peaksRef.current.length !== Math.floor(rect.width)) {
        peaksRef.current = new Array(Math.floor(rect.width)).fill(rect.height * dpr);
      }
    };

    resizeCanvas();

    const resizeObserver = new ResizeObserver(() => {
      resizeCanvas();
    });
    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  useEffect(() => {
    let active = true;

    const render = () => {
      if (!active) return;

      const canvas = canvasRef.current;
      if (!canvas) {
        animationRef.current = requestAnimationFrame(render);
        return;
      }

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        animationRef.current = requestAnimationFrame(render);
        return;
      }

      const width = canvas.width;
      const height = canvas.height;
      const dpr = window.devicePixelRatio || 1;

      // 1. Draw background
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = '#09090B';
      ctx.fillRect(0, 0, width, height);

      // Draw subtle horizontal dB lines
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
      ctx.lineWidth = 1 * dpr;
      const dbSteps = [0.15, 0.35, 0.55, 0.75, 0.9];
      const dbLabels = ['-3 dB', '-12 dB', '-24 dB', '-48 dB', '-60 dB'];
      dbSteps.forEach((step, idx) => {
        const y = height * step;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();

        ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.font = `${8 * dpr}px monospace`;
        ctx.fillText(dbLabels[idx], 8 * dpr, y - 4 * dpr);
      });

      // 2. Map Logarithmic Frequencies and Vertical Gridlines
      const minFreq = 20;
      const maxFreq = 20000;
      
      const getXForFreq = (f: number) => {
        return ((Math.log(f) - Math.log(minFreq)) / (Math.log(maxFreq) - Math.log(minFreq))) * width;
      };

      const freqLines = [50, 100, 200, 500, 1000, 2000, 5000, 10000, 15000];
      freqLines.forEach((f) => {
        const x = getXForFreq(f);
        if (x >= 0 && x <= width) {
          ctx.strokeStyle = f === 320 || f === 3200 ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.025)';
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, height);
          ctx.stroke();

          // Frequency labels at the bottom
          ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
          ctx.font = `${7 * dpr}px monospace`;
          const label = f >= 1000 ? `${(f / 1000).toFixed(0)}kHz` : `${f}Hz`;
          ctx.fillText(label, x + 3 * dpr, height - 6 * dpr);
        }
      });

      // Highlight the EQ crossover lines (320Hz / 3.2kHz) as vertical bands
      const x320 = getXForFreq(320);
      const x3200 = getXForFreq(3200);

      // Label bands
      ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.font = `bold ${8 * dpr}px sans-serif`;
      ctx.fillText('GRAVES', x320 / 2 - 20 * dpr, 18 * dpr);
      ctx.fillText('MÉDIOS', x320 + (x3200 - x320) / 2 - 20 * dpr, 18 * dpr);
      ctx.fillText('AGUDOS', x3200 + (width - x3200) / 2 - 20 * dpr, 18 * dpr);

      // 3. Draw EQ Curve Overlay (Interactive visualizer response)
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.18)';
      ctx.lineWidth = 1.2 * dpr;
      ctx.setLineDash([4 * dpr, 4 * dpr]);

      for (let x = 0; x < width; x += 2 * dpr) {
        const t = x / width;
        const f = minFreq * Math.pow(maxFreq / minFreq, t);

        const w_low = f / 320;
        const resp_low = (eq.low || 0) / (1 + w_low * w_low);

        const w_high = f / 3200;
        const resp_high = (eq.high || 0) * (w_high * w_high) / (1 + w_high * w_high);

        const x_mid = Math.log2(f / 1000);
        const resp_mid = (eq.mid || 0) * Math.exp(-0.8 * x_mid * x_mid);

        const totalDb = resp_low + resp_mid + resp_high;
        // Map totalDb (-24 to +24) to y coordinates (centered vertically)
        const eqY = (height / 2) - (totalDb / 24) * (height / 3.5);

        if (x === 0) {
          ctx.moveTo(x, eqY);
        } else {
          ctx.lineTo(x, eqY);
        }
      }
      ctx.stroke();
      ctx.setLineDash([]); // Reset dash

      // 4. Get real-time frequency data
      const dataArray = audioEngine.getStemFrequencyData(stemId, 512);

      if (dataArray && isPlaying) {
        const binCount = dataArray.length;
        const nyquist = (audioEngine.getContext()?.sampleRate || 44100) / 2;

        const points: { x: number; y: number }[] = [];

        for (let x = 0; x < width; x += dpr) {
          const t = x / width;
          const f = minFreq * Math.pow(maxFreq / minFreq, t);

          const exactIndex = (f / nyquist) * binCount;
          const binIndex = Math.floor(exactIndex);
          const nextIndex = Math.min(binIndex + 1, binCount - 1);
          const frac = exactIndex - binIndex;

          let val = 0;
          if (binIndex < binCount) {
            val = dataArray[binIndex] * (1 - frac) + dataArray[nextIndex] * frac;
          }

          const normalized = val / 255;
          const scaledHeight = normalized * height * 0.75;
          const y = height - scaledHeight - 2 * dpr;

          points.push({ x, y });
        }

        // Render filled gradient
        ctx.beginPath();
        ctx.moveTo(0, height);
        points.forEach(pt => ctx.lineTo(pt.x, pt.y));
        ctx.lineTo(width, height);
        ctx.closePath();

        const grad = ctx.createLinearGradient(0, 0, 0, height);
        grad.addColorStop(0, `${trackColor}35`);
        grad.addColorStop(0.5, `${trackColor}10`);
        grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = grad;
        ctx.fill();

        // Render line
        ctx.beginPath();
        points.forEach((pt, idx) => {
          if (idx === 0) ctx.moveTo(pt.x, pt.y);
          else ctx.lineTo(pt.x, pt.y);
        });
        ctx.strokeStyle = trackColor;
        ctx.lineWidth = 1.8 * dpr;
        ctx.stroke();

        // 5. Peak Hold logic
        if (peaksRef.current.length === points.length) {
          const peaks = peaksRef.current;
          points.forEach((pt, i) => {
            if (pt.y < peaks[i]) {
              peaks[i] = pt.y;
            } else {
              peaks[i] += 0.35 * dpr;
              if (peaks[i] > height) peaks[i] = height;
            }
          });

          ctx.beginPath();
          for (let i = 0; i < width; i += 3 * dpr) {
            const y = peaks[Math.floor(i)];
            if (y < height - 5 * dpr) {
              if (i === 0) ctx.moveTo(i, y);
              else ctx.lineTo(i, y);
            }
          }
          ctx.strokeStyle = `${trackColor}50`;
          ctx.lineWidth = 1 * dpr;
          ctx.stroke();
        }

      } else {
        // Draw standard resting baseline
        const pulse = 1 * Math.sin(Date.now() * 0.003);
        ctx.beginPath();
        ctx.moveTo(0, height - 12 * dpr + pulse);
        ctx.lineTo(width, height - 12 * dpr + pulse);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
        ctx.lineWidth = 1 * dpr;
        ctx.stroke();
      }

      animationRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      active = false;
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [stemId, trackColor, isPlaying, eq]);

  return (
    <div className="w-full flex flex-col gap-1.5 bg-black/40 border border-white/5 rounded-2xl p-3 shadow-inner">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-1.5">
          <Activity size={12} className="animate-pulse" style={{ color: trackColor }} />
          <span className="text-[10px] uppercase font-black text-white/40 tracking-wider">
            Analisador de Espectro de Frequência (Visual EQ)
          </span>
        </div>
        <div className="flex items-center gap-2 text-[8px] font-bold text-white/30 tracking-widest uppercase">
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#FF3B30' }} /> Graves (&lt; 320Hz)
          </span>
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: trackColor }} /> Médios (320Hz - 3.2kHz)
          </span>
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#0A84FF' }} /> Agudos (&gt; 3.2kHz)
          </span>
        </div>
      </div>
      
      <div ref={containerRef} className="w-full h-24 md:h-28 rounded-xl overflow-hidden relative border border-white/5">
        <canvas ref={canvasRef} className="absolute inset-0" />
      </div>
    </div>
  );
};

const TrackDetailsModal: React.FC<{ stem: Stem, index: number, onClose: () => void, onRequestDelete: (stem: Stem) => void }> = ({ stem, index, onClose, onRequestDelete }) => {
  const { updateStemVolume, toggleStemMute, toggleStemSolo, setStemOutput, setStemEQ, setStemCompressor, isPlaying, currentSong, setTimeSignature } = usePlayerStore();
  const trackColor = TRACK_COLORS[index % TRACK_COLORS.length];

  const isClickTrack = stem.name.toLowerCase().includes('click') || 
                       stem.name.toLowerCase().includes('tap') || 
                       stem.id.toLowerCase().includes('click') || 
                       stem.id.toLowerCase().includes('tap');

  const compressor = stem.compressor || {
    enabled: false,
    threshold: -24,
    ratio: 12,
    attack: 0.003,
    release: 0.25,
    makeupGain: 0
  };

  const toggleCompressor = () => {
    setStemCompressor(
      stem.id,
      !compressor.enabled,
      compressor.threshold,
      compressor.ratio,
      compressor.attack,
      compressor.release,
      compressor.makeupGain
    );
  };

  const applyPreset = (presetName: string) => {
    let enabled = true;
    let threshold = -24;
    let ratio = 12;
    let attack = 0.003;
    let release = 0.25;
    let makeupGain = 0;

    if (presetName === 'bypass') {
      enabled = false;
    } else if (presetName === 'vocal') {
      threshold = -18;
      ratio = 3;
      attack = 0.01;
      release = 0.15;
      makeupGain = 3;
    } else if (presetName === 'punch') {
      threshold = -25;
      ratio = 6;
      attack = 0.005;
      release = 0.08;
      makeupGain = 5;
    } else if (presetName === 'master') {
      threshold = -12;
      ratio = 2.0;
      attack = 0.03;
      release = 0.25;
      makeupGain = 6;
    }

    setStemCompressor(stem.id, enabled, threshold, ratio, attack, release, makeupGain);
  };

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
        className="w-full sm:w-[760px] max-w-full ios-glass border-t sm:border border-white/15 rounded-t-[2rem] sm:rounded-[2.25rem] shadow-2xl overflow-hidden"
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
            <div className="flex items-center gap-2">
              <button 
                onClick={() => {
                  onRequestDelete(stem);
                  onClose();
                }}
                title="Excluir esta track da música"
                className="p-2 bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white rounded-xl transition-all border border-red-500/20 flex items-center gap-1.5 text-[10px] font-extrabold uppercase"
              >
                <Trash2 size={14} />
                <span className="hidden sm:inline">Excluir</span>
              </button>
              <button onClick={onClose} className="p-1.5 bg-white/5 rounded-full text-white/40 hover:text-white hover:bg-white/10 transition-colors border border-white/5">
                <X size={16} />
              </button>
            </div>
          </div>

          <div className="p-5 flex flex-col gap-5 overflow-y-auto max-h-[80vh]">
            
            <SpectrumAnalyzer 
              stemId={stem.id} 
              trackColor={trackColor} 
              isPlaying={isPlaying} 
              eq={stem.eq || { low: 0, mid: 0, high: 0 }} 
            />

            {/* Time Signature Selector - Exclusively for Click / Tap Track */}
            {isClickTrack && (
              <div className="bg-gradient-to-r from-orange-500/10 via-amber-500/10 to-amber-600/10 border border-orange-500/25 rounded-2xl p-4 flex flex-col gap-3 shadow-xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-orange-500/20 border border-orange-500/30 flex items-center justify-center text-orange-400">
                      <Clock size={16} />
                    </div>
                    <div>
                      <span className="text-xs uppercase font-extrabold tracking-wider text-orange-300 block">
                        Fórmula de Compasso (Métrica do Click)
                      </span>
                      <span className="text-[10px] text-white/40 block font-medium">
                        Ajusta a acentuação do 1º tempo no áudio do click
                      </span>
                    </div>
                  </div>
                  <span className="text-xs font-mono font-black text-orange-300 bg-orange-500/20 border border-orange-500/40 px-3 py-1 rounded-xl shadow-inner">
                    {currentSong?.timeSignature || "4/4"}
                  </span>
                </div>

                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 pt-1">
                  {["4/4", "3/4", "6/8", "2/4", "12/8", "5/4"].map((sig) => {
                    const isSelected = (currentSong?.timeSignature || "4/4") === sig;
                    return (
                      <button
                        key={sig}
                        onClick={() => setTimeSignature(sig)}
                        className={cn(
                          "py-2.5 px-3 rounded-xl text-xs font-black transition-all border flex flex-col items-center justify-center gap-0.5",
                          isSelected
                            ? "bg-gradient-to-b from-orange-400 to-amber-500 text-black border-orange-300 font-extrabold shadow-[0_0_18px_rgba(249,115,22,0.4)] scale-[1.03]"
                            : "bg-black/50 text-white/70 border-white/10 hover:bg-white/10 hover:text-white hover:border-white/20"
                        )}
                      >
                        <span className="text-sm tracking-tight font-black">{sig}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-5">
              {/* Column 1: Primary Controls */}
            <div className="flex flex-col gap-4 w-full sm:w-1/3">
               {/* Fader */}
               <div className="bg-black/40 rounded-2xl p-4 border border-white/5 flex flex-col items-center flex-1">
                  <div className="flex justify-between w-full mb-3">
                     <VolumeX size={15} className="text-white/30" />
                     <Volume2 size={15} className={stem.volume > 0.8 ? "" : "text-white/30"} style={stem.volume > 0.8 ? { color: trackColor } : {}} />
                  </div>
                  
                  <div className="relative w-full h-44 flex justify-center py-2 shrink-0">
                     <div className="absolute inset-y-0 w-1.5 bg-black/60 rounded-full border border-white/5 shadow-inner" />
                     
                     {/* Fader Tick Marks */}
                     <div className="absolute top-0 bottom-0 left-[35%] flex flex-col justify-between py-1 pointer-events-none">
                       {[0, 1, 2, 3, 4].map(i => {
                         const isZeroDb = i === 2;
                         return (
                           <div key={i} className="flex items-center gap-1.5 relative">
                             <div className={cn("w-1.5 md:w-2.5 h-[1px]", isZeroDb ? "bg-[#2ECC71] w-3 md:w-4.5 h-[1.5px] shadow-[0_0_8px_#2ECC71]" : "bg-white opacity-20")} />
                             {isZeroDb && (
                               <span className="text-[7px] md:text-[8px] font-black text-[#2ECC71] absolute -right-5 md:-right-6 top-[-4.5px] hidden sm:block drop-shadow-[0_0_2px_rgba(46,204,113,0.4)]">
                                 0dB
                               </span>
                             )}
                           </div>
                         );
                       })}
                     </div>

                     <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.01"
                        value={stem.volume}
                        onChange={(e) => updateStemVolume(stem.id, parseFloat(e.target.value))}
                        onContextMenu={(e) => handleMidiRightClick(e, 'stem_volume', `Volume ${stem.name}`, stem.name)}
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

            {/* Column 2: EQ & Route */}
            <div className="flex flex-col gap-4 w-full sm:w-1/3">
               <div className="flex gap-3">
                  <button
                     onClick={() => toggleStemMute(stem.id)}
                     onContextMenu={(e) => handleMidiRightClick(e, 'stem_mute', `Mute ${stem.name}`, stem.name)}
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
                     onContextMenu={(e) => handleMidiRightClick(e, 'stem_solo', `Solo ${stem.name}`, stem.name)}
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
                                     onContextMenu={(e) => handleMidiRightClick(e, `stem_eq_${band}`, `EQ ${band.toUpperCase()} ${stem.name}`, stem.name)}
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

            {/* Column 3: Compressor */}
            <div className="flex flex-col gap-4 w-full sm:w-1/3 bg-black/25 rounded-2xl p-4 border border-white/5">
                <div className="flex items-center justify-between">
                   <div className="text-[10px] uppercase font-black tracking-widest" style={{ color: trackColor }}>
                      Compressor
                   </div>
                   <button
                      onClick={toggleCompressor}
                      className={cn(
                         "px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider transition-all border",
                         compressor.enabled
                            ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.2)]"
                            : "bg-white/5 border-white/10 text-white/40"
                      )}
                   >
                      {compressor.enabled ? "Ativo" : "Bypass"}
                   </button>
                </div>

                {/* Presets Grid */}
                <div className="grid grid-cols-2 gap-1.5">
                   <button
                      onClick={() => applyPreset('bypass')}
                      className={cn(
                         "py-1.5 rounded-lg text-[9px] font-bold uppercase transition-all border",
                         !compressor.enabled
                            ? "bg-white/10 border-white/20 text-white"
                            : "bg-black/20 border-white/5 text-white/30 hover:border-white/10"
                      )}
                   >
                      Bypass
                   </button>
                   <button
                      onClick={() => applyPreset('vocal')}
                      className={cn(
                         "py-1.5 rounded-lg text-[9px] font-bold uppercase transition-all border",
                         compressor.enabled && compressor.threshold === -18 && compressor.ratio === 3
                            ? "bg-white/10 border-white/20 text-white"
                            : "bg-black/20 border-white/5 text-white/30 hover:border-white/10"
                      )}
                   >
                      Vocal
                   </button>
                   <button
                      onClick={() => applyPreset('punch')}
                      className={cn(
                         "py-1.5 rounded-lg text-[9px] font-bold uppercase transition-all border",
                         compressor.enabled && compressor.threshold === -25 && compressor.ratio === 6
                            ? "bg-white/10 border-white/20 text-white"
                            : "bg-black/20 border-white/5 text-white/30 hover:border-white/10"
                      )}
                   >
                      Punch
                   </button>
                   <button
                      onClick={() => applyPreset('master')}
                      className={cn(
                         "py-1.5 rounded-lg text-[9px] font-bold uppercase transition-all border",
                         compressor.enabled && compressor.threshold === -12 && compressor.ratio === 2
                            ? "bg-white/10 border-white/20 text-white"
                            : "bg-black/20 border-white/5 text-white/30 hover:border-white/10"
                      )}
                   >
                      Master
                   </button>
                </div>

                {/* Sliders Container */}
                <div className="flex flex-col gap-3 flex-1 justify-center">
                   {/* Threshold */}
                   <div className="flex flex-col gap-1">
                      <div className="flex justify-between text-[9px] font-bold uppercase tracking-wider text-white/40">
                         <span>Threshold</span>
                         <span className="font-mono text-white/75">{compressor.threshold.toFixed(0)} dB</span>
                      </div>
                      <input
                         type="range"
                         min="-60"
                         max="0"
                         step="1"
                         disabled={!compressor.enabled}
                         value={compressor.threshold}
                         onChange={(e) => setStemCompressor(
                            stem.id,
                            compressor.enabled,
                            parseFloat(e.target.value),
                            compressor.ratio,
                            compressor.attack,
                            compressor.release,
                            compressor.makeupGain
                         )}
                         className={cn(
                            "w-full h-1.5 rounded-full appearance-none outline-none cursor-pointer transition-opacity",
                            compressor.enabled ? "bg-white/15" : "bg-white/5 opacity-40 pointer-events-none"
                         )}
                         style={{
                            background: compressor.enabled
                               ? `linear-gradient(to right, ${trackColor} 0%, ${trackColor} ${((compressor.threshold + 60) / 60) * 100}%, rgba(255,255,255,0.15) ${((compressor.threshold + 60) / 60) * 100}%, rgba(255,255,255,0.15) 100%)`
                               : undefined
                         }}
                      />
                   </div>

                   {/* Ratio */}
                   <div className="flex flex-col gap-1">
                      <div className="flex justify-between text-[9px] font-bold uppercase tracking-wider text-white/40">
                         <span>Ratio</span>
                         <span className="font-mono text-white/75">{compressor.ratio.toFixed(1)}:1</span>
                      </div>
                      <input
                         type="range"
                         min="1"
                         max="20"
                         step="0.5"
                         disabled={!compressor.enabled}
                         value={compressor.ratio}
                         onChange={(e) => setStemCompressor(
                            stem.id,
                            compressor.enabled,
                            compressor.threshold,
                            parseFloat(e.target.value),
                            compressor.attack,
                            compressor.release,
                            compressor.makeupGain
                         )}
                         className={cn(
                            "w-full h-1.5 rounded-full appearance-none outline-none cursor-pointer transition-opacity",
                            compressor.enabled ? "bg-white/15" : "bg-white/5 opacity-40 pointer-events-none"
                         )}
                         style={{
                            background: compressor.enabled
                               ? `linear-gradient(to right, ${trackColor} 0%, ${trackColor} ${((compressor.ratio - 1) / 19) * 100}%, rgba(255,255,255,0.15) ${((compressor.ratio - 1) / 19) * 100}%, rgba(255,255,255,0.15) 100%)`
                               : undefined
                         }}
                      />
                   </div>

                   {/* Attack */}
                   <div className="flex flex-col gap-1">
                      <div className="flex justify-between text-[9px] font-bold uppercase tracking-wider text-white/40">
                         <span>Ataque</span>
                         <span className="font-mono text-white/75">{(compressor.attack * 1000).toFixed(0)} ms</span>
                      </div>
                      <input
                         type="range"
                         min="1"
                         max="500"
                         step="1"
                         disabled={!compressor.enabled}
                         value={compressor.attack * 1000}
                         onChange={(e) => setStemCompressor(
                            stem.id,
                            compressor.enabled,
                            compressor.threshold,
                            compressor.ratio,
                            parseFloat(e.target.value) / 1000,
                            compressor.release,
                            compressor.makeupGain
                         )}
                         className={cn(
                            "w-full h-1.5 rounded-full appearance-none outline-none cursor-pointer transition-opacity",
                            compressor.enabled ? "bg-white/15" : "bg-white/5 opacity-40 pointer-events-none"
                         )}
                         style={{
                            background: compressor.enabled
                               ? `linear-gradient(to right, ${trackColor} 0%, ${trackColor} ${((compressor.attack * 1000 - 1) / 499) * 100}%, rgba(255,255,255,0.15) ${((compressor.attack * 1000 - 1) / 499) * 100}%, rgba(255,255,255,0.15) 100%)`
                               : undefined
                         }}
                      />
                   </div>

                   {/* Release */}
                   <div className="flex flex-col gap-1">
                      <div className="flex justify-between text-[9px] font-bold uppercase tracking-wider text-white/40">
                         <span>Release</span>
                         <span className="font-mono text-white/75">{(compressor.release * 1000).toFixed(0)} ms</span>
                      </div>
                      <input
                         type="range"
                         min="10"
                         max="1000"
                         step="10"
                         disabled={!compressor.enabled}
                         value={compressor.release * 1000}
                         onChange={(e) => setStemCompressor(
                            stem.id,
                            compressor.enabled,
                            compressor.threshold,
                            compressor.ratio,
                            compressor.attack,
                            parseFloat(e.target.value) / 1000,
                            compressor.makeupGain
                         )}
                         className={cn(
                            "w-full h-1.5 rounded-full appearance-none outline-none cursor-pointer transition-opacity",
                            compressor.enabled ? "bg-white/15" : "bg-white/5 opacity-40 pointer-events-none"
                         )}
                         style={{
                            background: compressor.enabled
                               ? `linear-gradient(to right, ${trackColor} 0%, ${trackColor} ${((compressor.release * 1000 - 10) / 990) * 100}%, rgba(255,255,255,0.15) ${((compressor.release * 1000 - 10) / 990) * 100}%, rgba(255,255,255,0.15) 100%)`
                               : undefined
                         }}
                      />
                   </div>

                   {/* Makeup Gain */}
                   <div className="flex flex-col gap-1 bg-black/30 p-2 rounded-xl border border-white/5 mt-1">
                      <div className="flex justify-between text-[9px] font-bold uppercase tracking-wider text-white/40">
                         <span className="flex items-center gap-1">
                            Gain Boost
                         </span>
                         <span className="font-mono text-emerald-400 font-extrabold">+{compressor.makeupGain.toFixed(1)} dB</span>
                      </div>
                      <input
                         type="range"
                         min="0"
                         max="18"
                         step="0.5"
                         disabled={!compressor.enabled}
                         value={compressor.makeupGain}
                         onChange={(e) => setStemCompressor(
                            stem.id,
                            compressor.enabled,
                            compressor.threshold,
                            compressor.ratio,
                            compressor.attack,
                            compressor.release,
                            parseFloat(e.target.value)
                         )}
                         className={cn(
                            "w-full h-1.5 rounded-full appearance-none outline-none cursor-pointer transition-opacity",
                            compressor.enabled ? "bg-white/15" : "bg-white/5 opacity-40 pointer-events-none"
                         )}
                         style={{
                            background: compressor.enabled
                               ? `linear-gradient(to right, #10B981 0%, #10B981 ${(compressor.makeupGain / 18) * 100}%, rgba(255,255,255,0.15) ${(compressor.makeupGain / 18) * 100}%, rgba(255,255,255,0.15) 100%)`
                               : undefined
                         }}
                      />
                   </div>
                </div>
             </div>

            </div>
          </div>
        </motion.div>
      </motion.div>,
    document.body
  );
};

interface AddTrackModalProps {
  onClose: () => void;
}

const AddTrackModal: React.FC<AddTrackModalProps> = ({ onClose }) => {
  const { addStemToCurrentSong, currentSong } = usePlayerStore();
  const [file, setFile] = useState<File | null>(null);
  const [trackName, setTrackName] = useState('');
  const [outputRouting, setOutputRouting] = useState<number>(3);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const quickTemplates = [
    'CLICK / TAP',
    'VOCAIS',
    'BATERIA',
    'BAIXO',
    'GUITARRAS',
    'VIOLÃO',
    'TECLAS / PIANO',
    'SYNTH / PADS',
    'PERCUSSÃO',
    'BACKING VOCALS',
    'GUIA VERBAL',
    'EFEITOS / FX'
  ];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      if (!trackName) {
        const cleanName = selectedFile.name.replace(/\.[^/.]+$/, "");
        setTrackName(cleanName.toUpperCase());
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setIsLoading(true);
    try {
      await addStemToCurrentSong(trackName || file.name, file, outputRouting);
      onClose();
    } catch (err) {
      console.error("Failed to add stem", err);
      alert('Erro ao carregar o arquivo de áudio. Verifique se o formato é válido.');
    } finally {
      setIsLoading(false);
    }
  };

  return createPortal(
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[110] flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className="w-full max-w-lg bg-[#0d0d12] border border-white/15 rounded-[2rem] shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b border-white/10 bg-gradient-to-r from-cyan-500/15 via-blue-500/10 to-transparent">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.3)]">
              <Plus size={20} />
            </div>
            <div>
              <h3 className="text-white font-extrabold text-base tracking-normal uppercase">Adicionar Nova Track</h3>
              <p className="text-white/40 text-[10px] uppercase font-bold tracking-wider mt-0.5">
                Música: <span className="text-cyan-300 font-extrabold">{currentSong?.title}</span>
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 bg-white/5 rounded-full text-white/40 hover:text-white hover:bg-white/10 transition-colors border border-white/5">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-black uppercase text-white/50 tracking-wider">
              1. Selecionar Arquivo de Áudio
            </label>
            <div
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                "border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center gap-3 cursor-pointer transition-all",
                file
                  ? "border-cyan-500/50 bg-cyan-500/10 shadow-[0_0_20px_rgba(6,182,212,0.15)]"
                  : "border-white/15 bg-white/[0.02] hover:bg-white/[0.05] hover:border-cyan-400/40"
              )}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="audio/*,.mp3,.wav,.m4a,.aac,.ogg,.flac"
                onChange={handleFileChange}
                className="hidden"
              />
              <div className={cn(
                "w-12 h-12 rounded-2xl flex items-center justify-center transition-transform",
                file ? "bg-cyan-500 text-black scale-110 shadow-lg" : "bg-white/10 text-white/60"
              )}>
                {file ? <Check size={24} /> : <Upload size={24} />}
              </div>
              <div className="text-center">
                {file ? (
                  <>
                    <p className="text-sm font-extrabold text-white truncate max-w-xs">{file.name}</p>
                    <p className="text-[10px] text-cyan-300 font-mono mt-1">{(file.size / (1024 * 1024)).toFixed(2)} MB • Pronto para carregar</p>
                  </>
                ) : (
                  <>
                    <p className="text-xs font-bold text-white">Clique para escolher ou arraste o áudio</p>
                    <p className="text-[10px] text-white/35 uppercase tracking-wider font-semibold mt-1">MP3, WAV, AAC, M4A, FLAC, OGG</p>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-black uppercase text-white/50 tracking-wider">
              2. Nome da Track / Instrumento
            </label>
            <input
              type="text"
              value={trackName}
              onChange={(e) => setTrackName(e.target.value)}
              placeholder="Ex: VIOLÃO EXTRA, GUITARRAS, BACKING VOCAL..."
              className="w-full bg-black/60 border border-white/15 rounded-xl px-4 py-3 text-sm font-bold text-white uppercase outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all placeholder:text-white/20"
              required
            />

            <div className="flex flex-wrap gap-1.5 pt-1">
              {quickTemplates.map((tpl) => (
                <button
                  key={tpl}
                  type="button"
                  onClick={() => setTrackName(tpl)}
                  className={cn(
                    "px-2.5 py-1 rounded-lg text-[9px] font-extrabold uppercase transition-all border",
                    trackName === tpl
                      ? "bg-cyan-500 text-black border-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.4)]"
                      : "bg-white/5 text-white/60 border-white/10 hover:bg-white/10 hover:text-white"
                  )}
                >
                  {tpl}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-black uppercase text-white/50 tracking-wider">
              3. Roteamento de Saída
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: 3, label: 'Stereo', sub: 'Padrão' },
                { value: 1, label: 'L (Esquerda)', sub: 'Click / Guia' },
                { value: 2, label: 'R (Direita)', sub: 'Playbacks' }
              ].map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setOutputRouting(opt.value)}
                  className={cn(
                    "p-2.5 rounded-xl border flex flex-col items-center text-center transition-all",
                    outputRouting === opt.value
                      ? "bg-cyan-500/20 border-cyan-400 text-cyan-300 font-extrabold shadow-[0_0_12px_rgba(6,182,212,0.25)]"
                      : "bg-black/40 border-white/10 text-white/50 hover:bg-white/5 hover:text-white"
                  )}
                >
                  <span className="text-xs font-black">{opt.label}</span>
                  <span className="text-[9px] opacity-60 font-medium">{opt.sub}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 font-bold text-xs uppercase tracking-wider transition-all"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!file || isLoading}
              className={cn(
                "px-6 py-2.5 rounded-xl font-extrabold text-xs uppercase tracking-wider transition-all flex items-center gap-2 shadow-lg",
                file && !isLoading
                  ? "bg-gradient-to-r from-cyan-400 to-blue-500 text-black hover:scale-105 shadow-[0_0_20px_rgba(6,182,212,0.4)]"
                  : "bg-white/10 text-white/30 cursor-not-allowed"
              )}
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  Carregando Áudio...
                </>
              ) : (
                <>
                  <Plus size={16} />
                  Adicionar Track
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>,
    document.body
  );
};

interface DeleteTrackConfirmModalProps {
  stem: Stem;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

const DeleteTrackConfirmModal: React.FC<DeleteTrackConfirmModalProps> = ({ stem, onClose, onConfirm }) => {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleConfirm = async () => {
    setIsDeleting(true);
    try {
      await onConfirm();
    } catch (err) {
      console.error("Error deleting track:", err);
    } finally {
      setIsDeleting(false);
      onClose();
    }
  };

  return createPortal(
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[120] flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className="w-full max-w-sm bg-[#0d0d14] border border-red-500/40 rounded-[2rem] shadow-[0_0_50px_rgba(239,68,68,0.3)] overflow-hidden p-6 flex flex-col gap-5 text-center"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-16 h-16 rounded-2xl bg-red-500/20 border border-red-500/40 text-red-500 flex items-center justify-center mx-auto shadow-lg shadow-red-500/20 animate-pulse">
          <Trash2 size={32} />
        </div>

        <div>
          <h3 className="text-white font-extrabold text-xl uppercase tracking-tight">Excluir Track?</h3>
          <p className="text-white/70 text-xs font-semibold mt-2 leading-relaxed">
            Deseja apagar a track <span className="text-red-400 font-extrabold uppercase">{stem.name}</span> desta música?
          </p>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="flex-1 py-3 rounded-xl bg-white/10 hover:bg-white/15 text-white/80 font-extrabold text-xs uppercase tracking-wider transition-all border border-white/10"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isDeleting}
            className="flex-1 py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-black text-xs uppercase tracking-wider transition-all shadow-lg shadow-red-600/40 flex items-center justify-center gap-2 border border-red-400/30"
          >
            {isDeleting ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Trash2 size={16} />
                Sim, Excluir
              </>
            )}
          </button>
        </div>
      </motion.div>
    </motion.div>,
    document.body
  );
};

export const Mixer: React.FC = () => {
  const { currentSong, resetAllVolumesToZeroDb, themeMode, removeStemFromCurrentSong } = usePlayerStore();
  const [selectedTrackId, setSelectedTrackId] = useState<string | null>(null);
  const [isAddTrackOpen, setIsAddTrackOpen] = useState(false);
  const [stemToDelete, setStemToDelete] = useState<Stem | null>(null);

  if (!currentSong) return null;

  const isHighContrast = themeMode === 'high-contrast';
  const selectedStem = currentSong.stems.find(s => s.id === selectedTrackId);

  return (
    <div 
      className={cn(
         "flex-1 flex overflow-x-auto custom-scrollbar relative h-full rounded-[20px] mx-1 sm:mx-0 transition-colors duration-300",
         isHighContrast 
           ? "bg-[#030305] border-2 border-white/25 shadow-2xl" 
           : "bg-white/[0.02] backdrop-blur-md border border-white/5"
      )}
    >
      {/* Background Texture Grid */}
      <div 
        className={cn(
           "absolute inset-0 pointer-events-none transition-opacity duration-300",
           isHighContrast ? "opacity-[0.08]" : "opacity-[0.02]"
        )} 
        style={{ 
          backgroundImage: 'radial-gradient(circle at 1.5px 1.5px, white 1px, transparent 0)',
          backgroundSize: '18px 18px'
        }} 
      />
      
      {currentSong.stems.map((stem, index) => (
        <ChannelStrip 
          key={stem.id} 
          stem={stem} 
          index={index} 
          onOpenDetails={() => setSelectedTrackId(stem.id)} 
          onRequestDelete={(s) => setStemToDelete(s)}
        />
      ))}

      {/* Botão para Adicionar Nova Track */}
      <div className={cn(
         "flex flex-col items-center justify-center w-20 sm:w-24 md:w-28 shrink-0 h-full p-3 text-center transition-all border-l border-white/5",
         isHighContrast ? "border-l-2 border-white/20 bg-[#08080c] hover:bg-[#101018]" : "bg-cyan-500/[0.02] hover:bg-cyan-500/[0.06]"
      )}>
         <button
           onClick={() => setIsAddTrackOpen(true)}
           title="Adicionar nova track/instrumento a esta música"
           className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-cyan-500/15 border-2 border-cyan-400/40 hover:border-cyan-400 hover:bg-cyan-500 hover:text-black hover:shadow-[0_0_20px_rgba(6,182,212,0.6)] text-cyan-300 transition-all flex flex-col items-center justify-center gap-1 group shadow-lg"
         >
           <Plus size={22} className="group-hover:scale-125 transition-transform" />
         </button>
         <span className={cn(
            "text-[9px] md:text-[10px] font-black mt-2.5 uppercase tracking-wider leading-tight text-cyan-300"
         )}>Adicionar<br/>Track</span>
      </div>

      {/* Botão de reset rápido para 0dB */}
      <div className={cn(
         "flex flex-col items-center justify-center w-16 sm:w-20 md:w-24 shrink-0 h-full p-3 text-center transition-all",
         isHighContrast ? "border-l-2 border-white/20 bg-[#08080c] hover:bg-[#101018]" : "border-l border-white/5 bg-white/[0.01] hover:bg-white/[0.03]"
      )}>
         <span className="text-[8px] md:text-[9.5px] font-black uppercase tracking-widest text-[#2ECC71] drop-shadow-[0_0_4px_rgba(46,204,113,0.3)] mb-3">0dB nominal</span>
         <button
           onClick={resetAllVolumesToZeroDb}
           title="Colocar todos os volumes em 0dB"
           className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-[#2ECC71]/10 border border-[#2ECC71]/30 hover:bg-[#2ECC71] hover:text-black hover:shadow-[0_0_15px_#2ECC71] text-[#2ECC71] transition-all flex items-center justify-center group"
         >
           <Activity size={18} className="group-hover:scale-110 transition-transform animate-pulse" />
         </button>
         <span className={cn(
            "text-[8px] md:text-[9.5px] font-bold mt-3 uppercase leading-tight",
            isHighContrast ? "text-white/80" : "text-white/40"
         )}>Resetar<br/>Volumes</span>
      </div>

      <div className="min-w-[40px]" />

      <AnimatePresence>
        {selectedStem && (
           <TrackDetailsModal 
             key="track-details-modal"
             stem={selectedStem} 
             index={currentSong.stems.findIndex(s => s.id === selectedStem.id)}
             onClose={() => setSelectedTrackId(null)} 
             onRequestDelete={(s) => setStemToDelete(s)}
           />
         )}
        {isAddTrackOpen && (
           <AddTrackModal
             key="add-track-modal"
             onClose={() => setIsAddTrackOpen(false)}
           />
        )}
        {stemToDelete && (
           <DeleteTrackConfirmModal
             key="delete-track-confirm-modal"
             stem={stemToDelete}
             onClose={() => setStemToDelete(null)}
             onConfirm={async () => {
               await removeStemFromCurrentSong(stemToDelete.id);
             }}
           />
        )}
      </AnimatePresence>
    </div>
  );
};
