import React, { useState } from 'react';
import { usePlayerStore } from '../store/usePlayerStore';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';
import { FileMusic, Search, Edit3, Save, X, Trash2 } from 'lucide-react';

export const PlayList: React.FC = () => {
  const { setlist, currentSong, setCurrentSong, removeFromSetlist, updateSongMetadata, isLoadingSong, preloadedSongIds, preloadingSongId } = usePlayerStore();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editArtist, setEditArtist] = useState('');

  const startEdit = (song: any) => {
    if (isLoadingSong) return;
    setEditingId(song.id);
    setEditTitle(song.title);
    setEditArtist(song.artist);
  };

  const saveEdit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (editingId) {
      updateSongMetadata(editingId, editTitle, editArtist);
      setEditingId(null);
    }
  };

  const handleDragStart = (e: React.DragEvent, id: string) => {
     if (isLoadingSong) {
       e.preventDefault();
       return;
     }
     // For future drag-to-reorder support
     e.dataTransfer.setData("text/plain", id);
  };

  return (
    <div className="flex flex-col flex-1 h-full bg-transparent overflow-hidden">
      {isLoadingSong && (
         <div className="absolute inset-0 z-50 bg-black/60 flex items-center justify-center backdrop-blur-sm">
            <div className="flex flex-col items-center gap-2">
               <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }} className="text-[#00A3FF]">
                 <FileMusic size={32} />
               </motion.div>
               <span className="text-white/80 font-bold text-xs tracking-widest uppercase">Carregando Stems...</span>
            </div>
         </div>
      )}
      {/* Setlist List */}
      <div className="flex-1 overflow-y-auto w-full custom-scrollbar py-2 relative">
        {setlist.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-white/20 p-6 text-center gap-4">
            <FileMusic size={32} />
            <span className="text-sm">Import tracks above to build your setlist</span>
          </div>
        ) : (
          <div className="flex flex-col gap-2 px-4">
            {setlist.map((song, idx) => (
              <motion.div
                key={song.id}
                draggable
                onDragStart={(e: any) => handleDragStart(e, song.id)}
                className={cn(
                  "flex flex-col gap-2 p-3 rounded-xl border transition-all cursor-pointer relative group",
                  currentSong?.id === song.id 
                    ? "bg-[#00A3FF]/10 border-[#00A3FF]/30 shadow-[0_0_15px_rgba(0,163,255,0.1)]" 
                    : "bg-white/5 border-white/5 hover:bg-white/10"
                )}
                onClick={(e) => {
                  e.stopPropagation();
                  if (editingId !== song.id && !isLoadingSong) setCurrentSong(song);
                }}
              >
                {/* Number indicator */}
                <div className="absolute top-3 left-3 w-5 h-5 rounded-full bg-black/40 flex items-center justify-center text-[9px] font-black tracking-widest text-[#00A3FF]">
                  {(idx + 1).toString().padStart(2, '0')}
                </div>

                {/* Edit Form */}
                {editingId === song.id ? (
                  <form onSubmit={saveEdit} className="flex flex-col gap-2 pl-7 w-full pr-8">
                    <input 
                      autoFocus
                      className="bg-black/40 border border-[#00A3FF]/50 outline-none text-white font-bold rounded px-2 py-1 text-sm w-full"
                      value={editTitle}
                      onChange={e => setEditTitle(e.target.value)}
                    />
                    <input 
                      className="bg-black/40 border border-white/10 outline-none text-white/50 font-medium rounded px-2 py-1 text-xs w-full"
                      value={editArtist}
                      onChange={e => setEditArtist(e.target.value)}
                    />
                    <div className="flex gap-2 justify-end mt-1">
                      <button type="button" onClick={() => setEditingId(null)} className="p-1.5 hover:bg-white/10 rounded-md text-white/40 hover:text-white transition-colors">
                        <X size={14} />
                      </button>
                      <button type="submit" className="p-1.5 hover:bg-[#00A3FF]/20 rounded-md text-[#00A3FF] transition-colors">
                        <Save size={14} />
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="flex flex-col pl-7 pr-8 w-full truncate">
                     <span className={cn("font-bold text-sm truncate", currentSong?.id === song.id ? "text-white" : "text-white/80")}>
                       {song.title}
                     </span>
                     <span className={cn("font-medium text-xs truncate", currentSong?.id === song.id ? "text-white/60" : "text-white/40")}>
                       {song.artist} • {song.bpm} BPM
                     </span>
                  </div>
                )}

                {/* Hover Actions */}
                {editingId !== song.id && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-l from-[#0f0f0f] via-[#0f0f0f] to-transparent pl-4 py-2">
                    <button 
                      onClick={(e) => { e.stopPropagation(); startEdit(song); }}
                      className="p-1.5 hover:bg-white/10 rounded-md text-white/40 hover:text-white transition-colors"
                    >
                      <Edit3 size={14} />
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); removeFromSetlist(song.id); }}
                      className="p-1.5 hover:bg-red-500/20 rounded-md text-red-500/60 hover:text-red-400 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                )}

                {/* Active Indicator / Preload Status */}
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                  {currentSong?.id === song.id && editingId !== song.id ? (
                    <motion.div 
                      layoutId="activeIndicator"
                      className="w-1.5 h-1.5 rounded-full bg-[#00A3FF] shadow-[0_0_10px_#00A3FF]"
                    />
                  ) : preloadingSongId === song.id ? (
                    <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }} className="w-3 h-3 border-2 border-white/20 border-t-[#00A3FF] rounded-full" title="Preloading in background..." />
                  ) : preloadedSongIds.includes(song.id) ? (
                    <div className="w-1.5 h-1.5 rounded-full bg-[#2ECC71] shadow-[0_0_5px_#2ECC71]" title="Preloaded and ready" />
                  ) : null}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
