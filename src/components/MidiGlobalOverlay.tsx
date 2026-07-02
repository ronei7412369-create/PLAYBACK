import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useMidiStore } from '../store/useMidiStore';
import { X, Sliders, Trash2, Radio, Check, AlertCircle } from 'lucide-react';
import { cn } from '../lib/utils';

export const MidiGlobalOverlay: React.FC = () => {
  const { 
    contextMenu, setContextMenu,
    isLearning, learningAction, learningLog, clearLearning,
    mappings, removeMapping, setLearningAction 
  } = useMidiStore();

  const menuRef = useRef<HTMLDivElement>(null);
  const [successTimeout, setSuccessTimeout] = useState<NodeJS.Timeout | null>(null);

  // Close context menu on click outside
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (contextMenu && menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setContextMenu(null);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [contextMenu, setContextMenu]);

  // Handle auto-closing after a successful map
  useEffect(() => {
    if (learningLog === 'Map success!') {
      const timeout = setTimeout(() => {
        clearLearning();
      }, 1500);
      setSuccessTimeout(timeout);
    }
    return () => {
      if (successTimeout) clearTimeout(successTimeout);
    };
  }, [learningLog]);

  if (!contextMenu && !isLearning) return null;

  // Find if current action in context menu is already mapped
  const currentMapping = contextMenu 
    ? mappings.find(m => m.action === contextMenu.action && m.actionPayload === contextMenu.payload)
    : null;

  const handleStartLearn = () => {
    if (!contextMenu) return;
    setLearningAction({ action: contextMenu.action, payload: contextMenu.payload });
    setContextMenu(null);
  };

  const handleRemoveMapping = () => {
    if (currentMapping) {
      removeMapping(currentMapping.id);
    }
    setContextMenu(null);
  };

  // Adjust menu position to keep it on screen
  const getMenuPosition = () => {
    if (!contextMenu) return { top: 0, left: 0 };
    const width = 200;
    const height = 110;
    let x = contextMenu.x;
    let y = contextMenu.y;

    if (x + width > window.innerWidth) {
      x = window.innerWidth - width - 12;
    }
    if (y + height > window.innerHeight) {
      y = window.innerHeight - height - 12;
    }

    return { top: y, left: x };
  };

  const menuPos = getMenuPosition();

  return (
    <>
      {/* 1. Custom Floating Context Menu */}
      <AnimatePresence>
        {contextMenu && (
          <motion.div
            ref={menuRef}
            initial={{ opacity: 0, scale: 0.95, y: -5 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -5 }}
            transition={{ duration: 0.12, ease: 'easeOut' }}
            className="fixed z-[999] w-[210px] bg-[#141416]/95 border border-white/10 rounded-2xl p-1.5 shadow-[0_12px_32px_rgba(0,0,0,0.8)] backdrop-blur-xl flex flex-col gap-0.5"
            style={{ top: menuPos.top, left: menuPos.left }}
          >
            {/* Header / Control Title */}
            <div className="px-2.5 py-1.5 border-b border-white/5 mb-1">
              <p className="text-[9px] uppercase tracking-widest text-white/40 font-black">Mapeamento MIDI</p>
              <p className="text-[11px] text-white/90 font-extrabold truncate mt-0.5">{contextMenu.label}</p>
            </div>

            {/* Map Action */}
            <button
              onClick={handleStartLearn}
              className="w-full flex items-center gap-2.5 px-2.5 py-2 text-left rounded-xl text-[11px] font-bold text-white/80 hover:text-white hover:bg-white/5 transition-all"
            >
              <Sliders size={13} className="text-[#00A3FF]" />
              <span>{currentMapping ? 'Alterar Mapeamento' : 'Mapear Controle'}</span>
            </button>

            {/* Delete Action (if mapped) */}
            {currentMapping && (
              <button
                onClick={handleRemoveMapping}
                className="w-full flex items-center gap-2.5 px-2.5 py-2 text-left rounded-xl text-[11px] font-bold text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all"
              >
                <Trash2 size={13} />
                <span className="truncate">Remover Mapeamento</span>
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. Full-Screen MIDI Learning Modal */}
      <AnimatePresence>
        {isLearning && learningAction && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            {/* Backdrop Blur */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={clearLearning}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />

            {/* Modal Body */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              className="relative w-full max-w-sm ios-glass border border-white/15 rounded-[2rem] shadow-2xl overflow-hidden p-6 text-center flex flex-col items-center gap-5"
            >
              {/* Pulsing Visual Wave / State Indicator */}
              <div className="relative w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mt-2">
                {learningLog === 'Map success!' ? (
                  <motion.div
                    initial={{ scale: 0.5 }}
                    animate={{ scale: 1 }}
                    className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 border border-emerald-500/30"
                  >
                    <Check size={22} strokeWidth={2.5} />
                  </motion.div>
                ) : (
                  <>
                    <motion.div
                      animate={{ scale: [1, 1.4, 1], opacity: [0.3, 0.8, 0.3] }}
                      transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                      className="absolute inset-0 rounded-full bg-[#00A3FF]/15 border border-[#00A3FF]/20"
                    />
                    <Radio size={22} className="text-[#00A3FF] z-10 animate-pulse" />
                  </>
                )}
              </div>

              {/* Title & Info */}
              <div className="flex flex-col gap-1.5 w-full">
                <h3 className="text-sm uppercase tracking-widest font-black text-white/40">
                  {learningLog === 'Map success!' ? 'Mapeado!' : 'Aguardando Sinal MIDI...'}
                </h3>
                <h2 className="text-white font-black text-lg tracking-tight truncate px-1">
                  {contextMenu?.label || learningAction.action.replace(/_/g, ' ').toUpperCase()}
                </h2>
                <p className="text-white/40 text-[11px] leading-normal max-w-[240px] mx-auto mt-1">
                  {learningLog === 'Map success!' 
                    ? 'Dispositivo associado com sucesso!' 
                    : 'Mova um fader, gire um knob ou pressione um botão do seu controlador MIDI conectado.'
                  }
                </p>
              </div>

              {/* Learning Status Bar */}
              {learningLog && learningLog !== 'Map success!' && (
                <div className="w-full bg-black/40 border border-white/5 py-2 px-3 rounded-xl flex items-center justify-center gap-2 text-amber-400 text-[10px] font-black uppercase tracking-wider">
                  <AlertCircle size={12} />
                  <span>{learningLog}</span>
                </div>
              )}

              {/* Action Buttons */}
              <button
                onClick={clearLearning}
                className={cn(
                  "w-full py-3.5 rounded-2xl text-[11px] font-extrabold uppercase tracking-widest transition-all border",
                  learningLog === 'Map success!'
                    ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-400"
                    : "bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:text-white"
                )}
              >
                {learningLog === 'Map success!' ? 'Concluído' : 'Cancelar'}
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
