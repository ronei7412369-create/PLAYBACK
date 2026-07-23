import React, { useRef, useState } from 'react';
import { usePlayerStore } from '../store/usePlayerStore';
import { ListMusic, Plus, Trash2, ChevronRight, Upload, Clock, MessageCircle } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { audioEngine } from '../services/audioEngine';
import { Song } from '../types';
import { PlayList } from './PlayList';
import { TelegramImportModal } from './TelegramImportModal';
import { SetlistModal } from './SetlistModal';
import { getCoverUrl } from '../lib/coverArt';
import { detectKeyAndBpm } from '../lib/songHelpers';

export const Sidebar: React.FC = () => {
  const { setlist, currentSong, setCurrentSong, importSong, clearSetlist } = usePlayerStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isImporting, setIsImporting] = useState(false);
  const [showTelegramModal, setShowTelegramModal] = useState(false);
  const [showSetlistModal, setShowSetlistModal] = useState(false);

  const handleFiles = async (files: File[]) => {
    if (files.length === 0) return;

    setIsImporting(true);
    
    try {
      // Clear current stems in engine
      audioEngine.clearStems();

      const stems: any[] = [];
      const buffersToSave: {id: string, buffer: ArrayBuffer}[] = [];
      let totalDuration = 0;

      const stemPromises = files.map(async (file) => {
        const id = Math.random().toString(36).substr(2, 9);
        const name = file.name.replace(/\.[^/.]+$/, "");
        
        const arrayBuffer = await file.arrayBuffer();
        
        const duration = await audioEngine.loadStemFromArrayBuffer(id, arrayBuffer);
        
        return {
           loadedStem: {
             id,
             name,
             buffer: null as any,
             originalFile: file,
             volume: 0.5,
             isMuted: false,
             isSoloed: false,
             output: file.name.toLowerCase().includes('click') || file.name.toLowerCase().includes('guide') ? 1 : 3,
             eq: { low: 0, mid: 0, high: 0 }
           },
           duration,
           arrayBuffer,
           id
        };
      });

      const loadedData = await Promise.all(stemPromises);
      
      for (const data of loadedData) {
         stems.push(data.loadedStem);
         if (data.arrayBuffer && data.arrayBuffer.byteLength > 0) {
            buffersToSave.push({ id: data.id, buffer: data.arrayBuffer.slice(0) });
         }
         if (data.duration > totalDuration) {
            totalDuration = data.duration;
         }
      }

      // Try extracting peaks once all stems are loaded
      const extractedPeaks = audioEngine.extractPeaks(120);
      
      const songTitle = files.length > 1 ? "New Multitrack" : files[0].name.replace(/\.[^/.]+$/, "");
      const songArtist = "Imported Files";
      const stemNames = stems.map(s => s.name);
      const { key: detectedKey, bpm: detectedBpm } = detectKeyAndBpm(songTitle, stemNames);

      const newSong: Song = {
        id: Math.random().toString(36).substr(2, 9),
        title: songTitle,
        artist: songArtist,
        coverUrl: getCoverUrl(songTitle, songArtist),
        bpm: detectedBpm,
        key: detectedKey,
        timeSignature: "4/4",
        duration: totalDuration,
        waveformPeaks: extractedPeaks,
        stems: stems,
        markers: [
          { id: 'm1', label: 'Start', startTime: 0, color: '#00A3FF' },
        ],
      };

      importSong(newSong, buffersToSave);
    } catch (error) {
      console.error("Error importing stems:", error);
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []) as File[];
    handleFiles(files);
  };

  return (
    <aside className="w-[85vw] max-w-[320px] ios-glass border-r border-white/10 flex flex-col h-full overflow-hidden relative shadow-2xl shrink-0">
      <div className="p-6 border-b border-white/10 flex items-center justify-between bg-gradient-to-b from-white/5 to-transparent">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-[#00A3FF]/15 border border-[#00A3FF]/20 rounded-xl flex items-center justify-center shadow-lg shadow-[#00A3FF]/10 animate-pulse">
            <ListMusic size={15} className="text-[#00A3FF]" />
          </div>
          <h2 className="text-white font-extrabold uppercase tracking-[0.2em] text-[10px]">Setlist</h2>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setShowTelegramModal(true)}
            disabled={isImporting}
            title="Importar do Telegram"
            className="p-2.5 bg-[#0088CC]/15 rounded-xl text-[#26A5E4] hover:bg-[#0088CC]/25 transition-all border border-[#0088CC]/30 hover:shadow-[0_0_12px_rgba(38,165,228,0.2)]"
          >
            <MessageCircle size={15} />
          </button>
          <button 
            onClick={() => fileInputRef.current?.click()}
            disabled={isImporting}
            className={cn(
              "p-2.5 bg-white/5 rounded-xl text-white/40 hover:text-[#00A3FF] hover:bg-[#00A3FF]/15 transition-all border border-white/10 hover:border-[#001D3D]/30",
              isImporting && "opacity-50 cursor-not-allowed"
            )}
          >
            {isImporting ? <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }}><Upload size={15} /></motion.div> : <Plus size={15} />}
          </button>
        </div>
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileUpload} 
          className="hidden" 
          multiple
          accept="audio/*"
        />
      </div>

       <div className="flex-1 overflow-y-auto w-full custom-scrollbar">
          <PlayList />
       </div>

      <div className="p-6 bg-black/40 backdrop-blur-md border-t border-white/10 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#00A3FF]/20 to-transparent" />
        <div className="flex justify-between items-center mb-5">
          <div className="flex flex-col">
            <span className="text-[9px] text-white/30 uppercase font-black tracking-[0.2em]">Set Duration</span>
            <span className="text-white font-black text-xl tracking-tighter tabular-nums mt-0.5">04:00:00</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center shadow-inner">
            <Clock size={16} className="text-white/30" />
          </div>
        </div>
        <div className="flex gap-2">
          <motion.button 
            onClick={() => setShowSetlistModal(true)}
            whileTap={{ scale: 0.96 }}
            className="flex-1 py-3 bg-white/5 text-white/90 rounded-2xl font-extrabold text-[10px] uppercase tracking-[0.15em] hover:bg-white/10 hover:text-white hover:border-white/25 transition-all border border-white/10 flex items-center justify-center gap-2 shadow-lg"
          >
            <ListMusic size={14} className="text-[#00A3FF]" />
            Setlists
          </motion.button>
          
          <motion.button 
            onClick={() => clearSetlist()}
            whileTap={{ scale: 0.96 }}
            title="Limpar Setlist"
            className="w-12 py-3 bg-white/5 text-white/40 rounded-2xl font-extrabold text-[10px] uppercase tracking-[0.15em] hover:bg-[#FF3B30]/15 hover:text-[#FF3B30] hover:border-[#FF3B30]/35 transition-all border border-white/10 flex items-center justify-center group"
          >
            <Trash2 size={14} className="group-hover:rotate-12 transition-transform" />
          </motion.button>
        </div>
      </div>
      
      <TelegramImportModal 
        isOpen={showTelegramModal} 
        onClose={() => setShowTelegramModal(false)}
        onImport={handleFiles} 
      />
      
      <SetlistModal
        isOpen={showSetlistModal}
        onClose={() => setShowSetlistModal(false)}
      />
    </aside>
  );
};
