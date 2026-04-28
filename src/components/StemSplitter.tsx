import React, { useState, useRef } from 'react';
import * as ort from 'onnxruntime-web';
import { DemucsProcessor, CONSTANTS } from 'demucs-web';
import { Music, Loader, UploadCloud } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { usePlayerStore } from '../store/usePlayerStore';

export const StemSplitter: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('');
  const [downloadProgress, setDownloadProgress] = useState(0);
  const { addProcessedSong } = usePlayerStore();

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      processAudio(selectedFile);
    }
  };

  const processAudio = async (selectedFile: File) => {
    setIsProcessing(true);
    setStatus('Initializing AI...');
    setProgress(0);
    setDownloadProgress(0);

    try {
      const audioContext = new AudioContext({ sampleRate: CONSTANTS.SAMPLE_RATE });
      
      setStatus('Decoding audio...');
      const arrayBuffer = await selectedFile.arrayBuffer();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      
      const leftChannel = audioBuffer.getChannelData(0);
      const rightChannel = audioBuffer.numberOfChannels > 1 
        ? audioBuffer.getChannelData(1) 
        : leftChannel;

      ort.env.wasm.numThreads = navigator.hardwareConcurrency || 4;
      if ('gpu' in navigator) {
        try {
          const adapter = await (navigator as any).gpu.requestAdapter();
          if (adapter) {
            // @ts-ignore
            ort.env.webgpu = { powerPreference: 'high-performance' };
          }
        } catch (e) {
          console.log('WebGPU not available');
        }
      }

      const processor = new DemucsProcessor({
        ort,
        onProgress: (p) => {
          setProgress(p.progress * 100);
          setStatus(`Processing: ${Math.round(p.progress * 100)}%`);
        },
        onLog: (phase, msg) => {
          if(phase === 'Download') {
            setStatus('Downloading model...');
          }
        },
        onDownloadProgress: (loaded, total) => {
          setDownloadProgress((loaded / total) * 100);
        }
      });

      setStatus('Loading model...');
      await processor.loadModel(CONSTANTS.DEFAULT_MODEL_URL);

      setStatus('Splitting stems...');
      const result = await processor.separate(leftChannel, rightChannel);

      setStatus('Saving tracks...');
      
      const createWavUrl = (left: Float32Array, right: Float32Array) => {
        const numChannels = 2;
        const sampleRate = CONSTANTS.SAMPLE_RATE;
        const length = left.length;
        const buffer = new ArrayBuffer(44 + length * numChannels * 2);
        const view = new DataView(buffer);

        const writeString = (offset: number, string: string) => {
          for (let i = 0; i < string.length; i++) {
            view.setUint8(offset + i, string.charCodeAt(i));
          }
        };

        writeString(0, 'RIFF');
        view.setUint32(4, 36 + length * numChannels * 2, true);
        writeString(8, 'WAVE');
        writeString(12, 'fmt ');
        view.setUint32(16, 16, true);
        view.setUint16(20, 1, true);
        view.setUint16(22, numChannels, true);
        view.setUint32(24, sampleRate, true);
        view.setUint32(28, sampleRate * numChannels * 2, true);
        view.setUint16(32, numChannels * 2, true);
        view.setUint16(34, 16, true);
        writeString(36, 'data');
        view.setUint32(40, length * numChannels * 2, true);

        let offset = 44;
        for (let i = 0; i < length; i++) {
          let l = Math.max(-1, Math.min(1, left[i]));
          let r = Math.max(-1, Math.min(1, right[i]));
          view.setInt16(offset, l < 0 ? l * 0x8000 : l * 0x7FFF, true);
          view.setInt16(offset + 2, r < 0 ? r * 0x8000 : r * 0x7FFF, true);
          offset += 4;
        }

        const blob = new Blob([buffer], { type: 'audio/wav' });
        return URL.createObjectURL(blob);
      };

      const drumsUrl = createWavUrl(result.drums.left, result.drums.right);
      const bassUrl = createWavUrl(result.bass.left, result.bass.right);
      const otherUrl = createWavUrl(result.other.left, result.other.right);
      const vocalsUrl = createWavUrl(result.vocals.left, result.vocals.right);

      const songId = Math.random().toString(36).substring(7);
      
      addProcessedSong({
        id: songId,
        title: selectedFile.name.replace(/\.[^/.]+$/, ""),
        artist: 'AI Processed',
        stems: [
          { id: `${songId}-vocals`, name: 'Vocals', file: vocalsUrl, output: 3, pan: 0, volume: 1, isMuted: false, isSoloed: false },
          { id: `${songId}-drums`, name: 'Drums', file: drumsUrl, output: 3, pan: 0, volume: 1, isMuted: false, isSoloed: false },
          { id: `${songId}-bass`, name: 'Bass', file: bassUrl, output: 3, pan: 0, volume: 1, isMuted: false, isSoloed: false },
          { id: `${songId}-other`, name: 'Instruments', file: otherUrl, output: 3, pan: 0, volume: 1, isMuted: false, isSoloed: false },
        ]
      });

      setStatus('Finished!');
      setTimeout(() => {
        setIsProcessing(false);
        setFile(null);
      }, 2000);
    } catch (e: any) {
      console.error(e);
      setStatus(`Error: ${e.message || String(e)}`);
      setTimeout(() => setIsProcessing(false), 3000);
    }
  };

  return (
    <div className="flex items-center">
      <input 
        type="file" 
        ref={fileInputRef} 
        className="hidden" 
        accept="audio/*" 
        onChange={handleFileChange}
      />
      
      <AnimatePresence mode="wait">
        {!isProcessing ? (
          <motion.button
            key="button"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 bg-[#00A3FF]/10 hover:bg-[#00A3FF]/20 text-[#00A3FF] border border-[#00A3FF]/20 px-4 py-2 rounded-xl transition-all font-bold text-sm h-10 w-[240px] justify-center"
          >
            <UploadCloud size={16} />
            <span>AI Stem Splitter</span>
          </motion.button>
        ) : (
          <motion.div
            key="progress"
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: '240px' }}
            exit={{ opacity: 0 }}
            className="flex flex-col justify-center bg-[#050505] border border-[#00A3FF]/30 px-3 py-1.5 rounded-xl h-10 overflow-hidden relative shadow-[0_0_15px_rgba(0,163,255,0.1)]"
          >
             <div className="flex items-center justify-between gap-2 z-10 relative mb-1">
               <div className="flex items-center gap-1.5 text-xs font-bold text-[#00A3FF] truncate">
                 <Loader size={12} className="animate-spin shrink-0" />
                 <span className="truncate">{status}</span>
               </div>
               <span className="text-[10px] font-mono font-black text-white/70 tabular-nums">
                 {Math.round(progress > 0 ? progress : downloadProgress)}%
               </span>
             </div>
             <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden shrink-0">
               <motion.div 
                 className="h-full bg-gradient-to-r from-[#00A3FF] to-[#0066FF]"
                 style={{ width: `${progress > 0 ? progress : downloadProgress}%` }}
                 transition={{ duration: 0.2 }}
               />
             </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

