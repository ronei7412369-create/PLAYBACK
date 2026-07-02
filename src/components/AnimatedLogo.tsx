import React from 'react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';

interface AnimatedLogoProps {
  className?: string;
  size?: 'sm' | 'lg';
}

export const AnimatedLogo: React.FC<AnimatedLogoProps> = ({ className, size = 'sm' }) => {
  const isLg = size === 'lg';

  // Sizing configurations - 2:1 aspect ratio to fit the logo perfectly
  const containerSize = isLg ? "w-56 h-28" : "w-24 h-12";
  
  // SVG coordinates & dimensions
  const svgWidth = 180;
  const svgHeight = 90;

  return (
    <div className={cn("relative flex items-center justify-center select-none", containerSize, className)}>
      {/* Soft Ambient Neon Glow Behind the Logo - no solid border or card */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none blur-[24px] md:blur-[36px] opacity-75">
        <div className={cn("absolute rounded-full bg-[#FF007A]/40 mix-blend-screen", isLg ? "w-28 h-16 -translate-x-8" : "w-12 h-6 -translate-x-4")} />
        <div className={cn("absolute rounded-full bg-[#8B5CF6]/50 mix-blend-screen", isLg ? "w-24 h-16" : "w-10 h-6")} />
        <div className={cn("absolute rounded-full bg-[#00A3FF]/40 mix-blend-screen", isLg ? "w-28 h-16 translate-x-8" : "w-12 h-6 translate-x-4")} />
      </div>

      {/* Pure High-fidelity Neon SVG Waveform */}
      <div className="relative w-full h-full flex items-center justify-center overflow-visible">
        <svg 
          className="w-full h-full overflow-visible" 
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Definitions for Gradients and Glow Filters */}
          <defs>
            <linearGradient id="neon-logo-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#FF007A" />
              <stop offset="45%" stopColor="#8B5CF6" />
              <stop offset="55%" stopColor="#8B5CF6" />
              <stop offset="100%" stopColor="#00A3FF" />
            </linearGradient>

            {/* Advanced Multi-Stage Glow Filter */}
            <filter id="neon-glow-filter" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="8" result="heavy-glow" />
              <feGaussianBlur stdDeviation="3" result="mid-glow" />
              <feMerge>
                <feMergeNode in="heavy-glow" />
                <feMergeNode in="mid-glow" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* === LAYER 1: Deep Neon Aura Glow (Blurred Background Stroke) === */}
          <g filter="url(#neon-glow-filter)" opacity="0.8">
            {/* Left Wave */}
            <motion.path 
              style={{ originY: 0.5 }}
              animate={{
                scaleY: [1, 1.4, 0.7, 1.3, 0.6, 1.5, 0.8, 1.2, 0.7, 1.4, 1],
              }}
              transition={{
                duration: 2.2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              d="M 15 45 L 35 45 C 38 45 40 33 43 33 C 46 33 48 60 51 60 C 54 60 57 25 60 25 C 63 25 66 72 69 72 C 72 72 76 15 80 15" 
              stroke="url(#neon-logo-gradient)" 
              strokeWidth={isLg ? "10" : "13"} 
              strokeLinecap="round" 
              strokeLinejoin="round" 
            />
            {/* Left Pillar */}
            <motion.path 
              style={{ originY: 0.5 }}
              animate={{
                scaleY: [1, 0.6, 1.4, 0.5, 1.3, 0.7, 1.5, 0.8, 1.2, 0.6, 1],
              }}
              transition={{
                duration: 1.4,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              d="M 80 15 L 80 75" 
              stroke="#8B5CF6" 
              strokeWidth={isLg ? "10" : "13"} 
              strokeLinecap="round" 
            />
            {/* H Bridge */}
            <motion.path 
              style={{ originY: 0.5 }}
              animate={{
                scaleY: [1, 1.1, 0.9, 1.15, 0.85, 1.1, 0.9, 1],
              }}
              transition={{
                duration: 1.8,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              d="M 80 45 L 100 45" 
              stroke="#8B5CF6" 
              strokeWidth={isLg ? "10" : "13"} 
              strokeLinecap="round" 
            />
            {/* Right Pillar */}
            <motion.path 
              style={{ originY: 0.5 }}
              animate={{
                scaleY: [1, 1.5, 0.7, 1.3, 0.6, 1.4, 0.5, 1.2, 0.8, 1.3, 1],
              }}
              transition={{
                duration: 1.6,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              d="M 100 15 L 100 75" 
              stroke="#8B5CF6" 
              strokeWidth={isLg ? "10" : "13"} 
              strokeLinecap="round" 
            />
            {/* Right Wave */}
            <motion.path 
              style={{ originY: 0.5 }}
              animate={{
                scaleY: [1, 0.7, 1.3, 0.6, 1.5, 0.8, 1.2, 0.7, 1.4, 0.8, 1],
              }}
              transition={{
                duration: 2.0,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              d="M 100 15 C 104 15 108 72 111 72 C 114 72 117 25 120 25 C 123 25 126 60 129 60 C 132 60 134 33 137 33 C 140 33 142 45 145 45 L 165 45" 
              stroke="url(#neon-logo-gradient)" 
              strokeWidth={isLg ? "10" : "13"} 
              strokeLinecap="round" 
              strokeLinejoin="round" 
            />
          </g>

          {/* === LAYER 2: Ultra-Bright High-Energy Core (Foreground Sharp Stroke) === */}
          <g>
            {/* Left Wave */}
            <motion.path 
              style={{ originY: 0.5 }}
              animate={{
                scaleY: [1, 1.4, 0.7, 1.3, 0.6, 1.5, 0.8, 1.2, 0.7, 1.4, 1],
              }}
              transition={{
                duration: 2.2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              d="M 15 45 L 35 45 C 38 45 40 33 43 33 C 46 33 48 60 51 60 C 54 60 57 25 60 25 C 63 25 66 72 69 72 C 72 72 76 15 80 15" 
              stroke="url(#neon-logo-gradient)" 
              strokeWidth={isLg ? "3.5" : "4.5"} 
              strokeLinecap="round" 
              strokeLinejoin="round" 
            />
            {/* Left Pillar */}
            <motion.path 
              style={{ originY: 0.5 }}
              animate={{
                scaleY: [1, 0.6, 1.4, 0.5, 1.3, 0.7, 1.5, 0.8, 1.2, 0.6, 1],
              }}
              transition={{
                duration: 1.4,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              d="M 80 15 L 80 75" 
              stroke="#C084FC" 
              strokeWidth={isLg ? "3.5" : "4.5"} 
              strokeLinecap="round" 
            />
            {/* H Bridge */}
            <motion.path 
              style={{ originY: 0.5 }}
              animate={{
                scaleY: [1, 1.1, 0.9, 1.15, 0.85, 1.1, 0.9, 1],
              }}
              transition={{
                duration: 1.8,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              d="M 80 45 L 100 45" 
              stroke="#D8B4FE" 
              strokeWidth={isLg ? "3.5" : "4.5"} 
              strokeLinecap="round" 
            />
            {/* Right Pillar */}
            <motion.path 
              style={{ originY: 0.5 }}
              animate={{
                scaleY: [1, 1.5, 0.7, 1.3, 0.6, 1.4, 0.5, 1.2, 0.8, 1.3, 1],
              }}
              transition={{
                duration: 1.6,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              d="M 100 15 L 100 75" 
              stroke="#C084FC" 
              strokeWidth={isLg ? "3.5" : "4.5"} 
              strokeLinecap="round" 
            />
            {/* Right Wave */}
            <motion.path 
              style={{ originY: 0.5 }}
              animate={{
                scaleY: [1, 0.7, 1.3, 0.6, 1.5, 0.8, 1.2, 0.7, 1.4, 0.8, 1],
              }}
              transition={{
                duration: 2.0,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              d="M 100 15 C 104 15 108 72 111 72 C 114 72 117 25 120 25 C 123 25 126 60 129 60 C 132 60 134 33 137 33 C 140 33 142 45 145 45 L 165 45" 
              stroke="url(#neon-logo-gradient)" 
              strokeWidth={isLg ? "3.5" : "4.5"} 
              strokeLinecap="round" 
              strokeLinejoin="round" 
            />
          </g>

          {/* === LAYER 3: Animated Pulse Spark Nodes at endpoints === */}
          <g>
            {/* Left Floating Spark */}
            <motion.circle
              cx="15"
              cy="45"
              r={isLg ? "4" : "5"}
              fill="#FF007A"
              animate={{
                scale: [1, 1.5, 1],
                opacity: [0.7, 1, 0.7],
              }}
              transition={{
                duration: 1.2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
            {/* Right Floating Spark */}
            <motion.circle
              cx="165"
              cy="45"
              r={isLg ? "4" : "5"}
              fill="#00A3FF"
              animate={{
                scale: [1, 1.5, 1],
                opacity: [0.7, 1, 0.7],
              }}
              transition={{
                duration: 1.2,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 0.6
              }}
            />
          </g>
        </svg>
      </div>
    </div>
  );
};
