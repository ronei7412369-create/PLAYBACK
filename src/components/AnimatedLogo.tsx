import React from 'react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';

interface AnimatedLogoProps {
  className?: string;
  size?: 'sm' | 'lg';
}

export const AnimatedLogo: React.FC<AnimatedLogoProps> = ({ className, size = 'sm' }) => {
  const isLg = size === 'lg';
  return (
    <div className={cn("relative flex items-center justify-center", className)}>
      <motion.div 
        className={cn(
          "bg-gradient-to-br from-[#00A3FF] to-[#0055FF] rounded-xl flex items-center justify-center shadow-lg shadow-[#00A3FF]/30",
          isLg ? "w-16 h-16 rounded-2xl" : "w-10 h-10 rounded-xl"
        )}
        animate={{
          boxShadow: ['0px 0px 10px rgba(0, 163, 255, 0.3)', '0px 0px 30px rgba(0, 163, 255, 0.6)', '0px 0px 10px rgba(0, 163, 255, 0.3)'],
        }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      >
        <div className="flex items-end gap-1">
          <motion.div 
            className="w-1.5 bg-white rounded-full"
            initial={{ height: isLg ? 16 : 8 }}
            animate={{ height: [isLg ? 16 : 8, isLg ? 32 : 16, isLg ? 12 : 6, isLg ? 16 : 8] }}
            transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div 
            className="w-1.5 bg-white rounded-full"
            initial={{ height: isLg ? 24 : 12 }}
            animate={{ height: [isLg ? 24 : 12, isLg ? 12 : 6, isLg ? 36 : 20, isLg ? 24 : 12] }}
            transition={{ duration: 1.0, repeat: Infinity, ease: "easeInOut", delay: 0.1 }}
          />
          <motion.div 
            className="w-1.5 bg-white rounded-full"
            initial={{ height: isLg ? 20 : 10 }}
            animate={{ height: [isLg ? 20 : 10, isLg ? 28 : 14, isLg ? 12 : 6, isLg ? 20 : 10] }}
            transition={{ duration: 1.1, repeat: Infinity, ease: "easeInOut", delay: 0.2 }}
          />
        </div>
      </motion.div>
    </div>
  );
};
