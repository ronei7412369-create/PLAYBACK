import React, { useRef } from 'react';
import { usePlayerStore } from '../store/usePlayerStore';
import { ListMusic, Plus, Trash2, ChevronRight, Upload, Clock } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { audioEngine } from '../services/audioEngine';
import { Song } from '../types';
import { PlayList } from './PlayList';

export const Sidebar: React.FC = () => {
  const { setlist, currentSong, setCurrentSong, importSong } = usePlayerStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isImporting, setIsImporting] = React.useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []) as File[];
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
             buffer: null as any, // Not kept in memory state here, managed by Engine
             originalFile: file,
             volume: 1.0,
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
         buffersToSave.push({ id: data.id, buffer: data.arrayBuffer });
         if (data.duration > totalDuration) {
            totalDuration = data.duration;
         }
      }

      // Try extracting peaks once all stems are loaded
      const extractedPeaks = audioEngine.extractPeaks(120);
      
      const newSong: Song = {
        id: Math.random().toString(36).substr(2, 9),
        title: files.length > 1 ? "New Multitrack" : files[0].name.replace(/\.[^/.]+$/, ""),
        artist: "Imported Files",
        bpm: 120,
        key: "C",
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

  return (
    <aside className="w-80 bg-[#0A0A0B] border-r border-white/5 flex flex-col h-full overflow-hidden relative">
      <div className="p-8 border-b border-white/5 flex items-center justify-between bg-gradient-to-b from-white/5 to-transparent">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-[#00A3FF]/10 rounded-lg flex items-center justify-center">
            <ListMusic size={18} className="text-[#00A3FF]" />
          </div>
          <h2 className="text-white font-black uppercase tracking-[0.15em] text-xs">Setlist</h2>
        </div>
        <button 
          onClick={() => fileInputRef.current?.click()}
          disabled={isImporting}
          className={cn(
            "p-2 bg-white/5 rounded-xl text-white/40 hover:text-[#00A3FF] hover:bg-[#00A3FF]/10 transition-all border border-white/5",
            isImporting && "opacity-50 cursor-not-allowed"
          )}
        >
          {isImporting ? <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }}><Upload size={18} /></motion.div> : <Plus size={18} />}
        </button>
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

      <div className="p-8 bg-[#050506] border-t border-white/5 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#00A3FF]/20 to-transparent" />
        <div className="flex justify-between items-center mb-6">
          <div className="flex flex-col">
            <span className="text-[10px] text-white/20 uppercase font-black tracking-widest">Set Duration</span>
            <span className="text-white font-black text-xl tracking-tighter">04:00:00</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center">
            <Clock size={20} className="text-white/20" />
          </div>
        </div>
        <motion.button 
          whileTap={{ scale: 0.98 }}
          className="w-full py-4 bg-white/5 text-white/40 rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/20 transition-all border border-white/5 flex items-center justify-center gap-3 group"
        >
          <Trash2 size={16} className="group-hover:animate-bounce" />
          Clear Setlist
        </motion.button>
      </div>
    </aside>
  );
};
