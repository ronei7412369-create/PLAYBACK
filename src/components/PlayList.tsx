import React, { useState } from 'react';
import { usePlayerStore } from '../store/usePlayerStore';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { FileMusic, Search, Edit3, Save, X, Trash2, Image, Upload } from 'lucide-react';
import { getCoverUrl } from '../lib/coverArt';

const AVAILABLE_KEYS = [
  'C', 'Cm', 'C#', 'C#m', 'Db', 'Dbm', 'D', 'Dm', 'D#', 'D#m', 'Eb', 'Ebm',
  'E', 'Em', 'F', 'Fm', 'F#', 'F#m', 'Gb', 'Gbm', 'G', 'Gm', 'G#', 'G#m',
  'Ab', 'Abm', 'A', 'Am', 'A#', 'A#m', 'Bb', 'Bbm', 'B', 'Bm'
];

export const PlayList: React.FC = () => {
  const { setlist, currentSong, setCurrentSong, removeFromSetlist, updateSongMetadata, isLoadingSong, preloadedSongIds, preloadingSongId } = usePlayerStore();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editArtist, setEditArtist] = useState('');
  const [editCoverUrl, setEditCoverUrl] = useState('');
  const [editBpm, setEditBpm] = useState<number>(120);
  const [editKey, setEditKey] = useState<string>('C');

  const handleCoverFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setEditCoverUrl(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const startEdit = (song: any) => {
    if (isLoadingSong) return;
    setEditingId(song.id);
    setEditTitle(song.title);
    setEditArtist(song.artist);
    setEditCoverUrl(song.coverUrl || '');
    setEditBpm(song.bpm || 120);
    setEditKey(song.key || 'C');
  };

  const saveEdit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (editingId) {
      updateSongMetadata(editingId, editTitle, editArtist, editCoverUrl, editBpm, editKey);
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
         <div className="absolute inset-0 z-50 bg-black/80 flex items-center justify-center backdrop-blur-md">
            <div className="flex flex-col items-center gap-3">
               <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }} className="text-[#00A3FF] drop-shadow-[0_0_10px_#00A3FF]">
                 <FileMusic size={36} />
               </motion.div>
               <span className="text-white/90 font-extrabold text-[10px] tracking-widest uppercase">Carregando Stems...</span>
            </div>
         </div>
      )}
      {/* Setlist List */}
      <div className="flex-1 overflow-y-auto w-full custom-scrollbar py-3 relative">
        {setlist.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-white/15 p-6 text-center gap-4">
            <FileMusic size={28} className="text-white/20 animate-pulse" />
            <span className="text-xs font-semibold tracking-wide text-white/40">Import tracks above to build your setlist</span>
          </div>
        ) : (
          <div className="flex flex-col gap-2 px-3">
            {setlist.map((song, idx) => (
              <motion.div
                key={song.id}
                draggable
                onDragStart={(e: any) => handleDragStart(e, song.id)}
                whileHover={{ scale: 1.01, translateY: -1 }}
                onClick={(e) => {
                  e.stopPropagation();
                  if (editingId !== song.id && !isLoadingSong) setCurrentSong(song);
                }}
                className={cn(
                  "flex flex-col gap-2 p-3.5 rounded-2xl border transition-all cursor-pointer relative group",
                  currentSong?.id === song.id 
                    ? "ios-glass-accent border-white/20 shadow-[0_8px_24px_rgba(0,163,255,0.15)] ring-1 ring-white/10" 
                    : "bg-black/30 border-white/5 hover:bg-white/5 hover:border-white/10"
                )}
              >
                <div className="flex items-center gap-3 w-full min-w-0">
                  {/* Song Cover Banner Thumbnail */}
                  <div 
                    onClick={(e) => {
                      if (editingId === song.id) {
                        e.stopPropagation();
                        document.getElementById(`cover-upload-${song.id}`)?.click();
                      }
                    }}
                    className={cn(
                      "relative w-10 h-10 rounded-xl overflow-hidden bg-black/40 border border-white/10 shrink-0 shadow-lg transition-all flex items-center justify-center",
                      editingId === song.id ? "ring-2 ring-[#00A3FF]/40 cursor-pointer hover:border-[#00A3FF]" : "group-hover:border-[#00A3FF]/30"
                    )}
                  >
                    <img 
                      src={editingId === song.id ? (editCoverUrl || getCoverUrl(editTitle, editArtist)) : (song.coverUrl || getCoverUrl(song.title, song.artist))} 
                      alt={song.title} 
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      referrerPolicy="no-referrer"
                    />
                    {editingId === song.id ? (
                      <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-0.5 opacity-100 transition-all text-white hover:bg-black/80">
                        <Edit3 size={10} className="text-[#00A3FF]" />
                        <span className="text-[7px] uppercase tracking-wider font-extrabold leading-none text-white/80">Capa</span>
                        <input 
                          type="file" 
                          id={`cover-upload-${song.id}`}
                          accept="image/*" 
                          className="hidden" 
                          onChange={handleCoverFileChange}
                        />
                      </div>
                    ) : (
                      /* Dark gradient overlay for number */
                      <div className="absolute inset-0 bg-black/30 flex items-center justify-center group-hover:bg-black/50 transition-all">
                        <span className="text-[10px] font-black text-white/90 font-mono tracking-tighter">
                          {(idx + 1).toString().padStart(2, '0')}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Edit Form / Text details */}
                  {editingId === song.id ? (
                    <form onSubmit={saveEdit} className="flex flex-col gap-2 w-full pr-8" onClick={(e) => e.stopPropagation()}>
                      <input 
                        autoFocus
                        className="bg-black/60 border border-[#00A3FF]/40 outline-none text-white font-extrabold rounded-lg px-2.5 py-1 text-xs w-full focus:border-[#00A3FF] focus:ring-1 focus:ring-[#00A3FF] transition-all"
                        value={editTitle}
                        onChange={e => setEditTitle(e.target.value)}
                        placeholder="Nome da canção"
                      />
                      <input 
                        className="bg-black/60 border border-white/10 outline-none text-white/50 font-medium rounded-lg px-2.5 py-1 text-[10px] w-full focus:border-white/20 transition-all"
                        value={editArtist}
                        onChange={e => setEditArtist(e.target.value)}
                        placeholder="Artista / Ministério"
                      />

                      <div className="flex gap-2 w-full">
                        <div className="flex-1 flex flex-col gap-0.5">
                          <label className="text-[8px] font-bold text-white/40 uppercase tracking-wide">BPM</label>
                          <input 
                            type="number"
                            className="bg-black/60 border border-white/10 outline-none text-white font-mono rounded-lg px-2.5 py-1 text-[10px] w-full focus:border-white/20 transition-all"
                            value={editBpm}
                            onChange={e => setEditBpm(parseInt(e.target.value) || 120)}
                            placeholder="120"
                            min={40}
                            max={250}
                          />
                        </div>
                        <div className="flex-1 flex flex-col gap-0.5">
                          <label className="text-[8px] font-bold text-white/40 uppercase tracking-wide">Tom Original</label>
                          <select 
                            className="bg-black/60 border border-white/10 outline-none text-white/80 font-mono rounded-lg px-2 py-1 text-[10px] w-full focus:border-white/20 transition-all cursor-pointer"
                            value={editKey}
                            onChange={e => setEditKey(e.target.value)}
                          >
                            {AVAILABLE_KEYS.map(k => (
                              <option key={k} value={k} className="bg-[#0A0A0B] text-white">{k}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                      
                      {/* Optional Web URL cover field */}
                      <div className="flex items-center gap-1.5 mt-0.5 bg-black/20 p-1.5 rounded-lg border border-white/5">
                        <Image size={10} className="text-white/40 shrink-0" />
                        <input 
                          className="bg-transparent border-none outline-none text-white/60 font-medium text-[9px] w-full placeholder-white/20"
                          value={editCoverUrl}
                          onChange={e => setEditCoverUrl(e.target.value)}
                          placeholder="Link da Capa (opcional)"
                        />
                      </div>

                      <div className="flex gap-2 justify-end mt-1">
                        <button type="button" onClick={() => setEditingId(null)} className="p-1.5 hover:bg-white/10 rounded-lg text-white/40 hover:text-white transition-colors">
                          <X size={12} />
                        </button>
                        <button type="submit" className="p-1.5 hover:bg-[#00A3FF]/20 rounded-lg text-[#00A3FF] transition-colors">
                          <Save size={12} />
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className="flex flex-col pr-8 w-full truncate">
                       <span className={cn("font-extrabold text-xs truncate transition-colors", currentSong?.id === song.id ? "text-white" : "text-white/80 group-hover:text-white")}>
                         {song.title}
                       </span>
                       <span className={cn("font-medium text-[10px] truncate mt-0.5 transition-colors", currentSong?.id === song.id ? "text-white/60" : "text-white/35 group-hover:text-white/50")}>
                         {song.artist} • <span className="font-mono">{song.bpm}</span> BPM • Tom: <span className="font-mono font-semibold text-[#F1C40F]">{song.key || "C"}</span>
                       </span>
                    </div>
                  )}
                </div>

                {/* Hover Actions */}
                {editingId !== song.id && (
                  <div className="absolute right-3.5 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-l from-black/80 via-black/85 to-transparent pl-5 py-2.5 rounded-r-2xl">
                    <button 
                      onClick={(e) => { e.stopPropagation(); startEdit(song); }}
                      className="p-1.5 hover:bg-white/10 rounded-lg text-white/40 hover:text-white transition-all hover:scale-110"
                    >
                      <Edit3 size={13} />
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); removeFromSetlist(song.id); }}
                      className="p-1.5 hover:bg-[#FF3B30]/15 rounded-lg text-white/40 hover:text-[#FF3B30] transition-all hover:scale-110"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                )}

                {/* Active Indicator / Preload Status */}
                <div className="absolute right-3.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
                  {currentSong?.id === song.id && editingId !== song.id ? (
                    <motion.div 
                      layoutId="activeIndicator"
                      className="w-1.5 h-1.5 rounded-full bg-[#00A3FF] shadow-[0_0_12px_#00A3FF]"
                    />
                  ) : preloadingSongId === song.id ? (
                    <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }} className="w-3 h-3 border-2 border-white/20 border-t-[#00A3FF] rounded-full" title="Preloading in background..." />
                  ) : preloadedSongIds.includes(song.id) ? (
                    <div className="w-1.5 h-1.5 rounded-full bg-[#30D158] shadow-[0_0_8px_#30D158]" title="Preloaded and ready" />
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
