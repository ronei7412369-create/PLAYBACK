import React, { useState, useRef } from 'react';
import * as ort from 'onnxruntime-web';
import { DemucsProcessor, CONSTANTS } from 'demucs-web';
import { Mic, Upload, FileAudio, Loader, Play, Music, Settings, Hash, SkipForward } from 'lucide-react';
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
    }
  };

  const processAudio = async () => {
    if (!file) return;
    setIsProcessing(true);
    setStatus('Initializing AI...');
    setProgress(0);
    setDownloadProgress(0);

    try {
      const audioContext = new AudioContext({ sampleRate: CONSTANTS.SAMPLE_RATE });
      
      setStatus('Decoding audio...');
      const arrayBuffer = await file.arrayBuffer();
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
          console.log('WebGPU not available, falling back to WASM');
        }
      }

      const processor = new DemucsProcessor({
        ort,
        onProgress: (p) => {
          setProgress(p.progress * 100);
          setStatus(`Processing: ${Math.round(p.progress * 100)}% (Segment ${p.currentSegment}/${p.totalSegments})`);
        },
        onLog: (phase, msg) => {
          console.log(`[${phase}] ${msg}`);
          if(phase === 'Download') {
            setStatus('Downloading AI model...');
          }
        },
        onDownloadProgress: (loaded, total) => {
          const loadedMB = (loaded / 1024 / 1024).toFixed(1);
          const totalMB = (total / 1024 / 1024).toFixed(1);
          setStatus(`Downloading AI model: ${loadedMB}MB / ${totalMB}MB`);
          setDownloadProgress((loaded / total) * 100);
        }
      });

      setStatus('Loading model...');
      await processor.loadModel(CONSTANTS.DEFAULT_MODEL_URL);

      setStatus('AI Processing Audio (this may take a while)...');
      const result = await processor.separate(leftChannel, rightChannel);

      setStatus('Creating tracks...');
      
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
        title: file.name.replace(/\.[^/.]+$/, ""),
        artist: 'AI Processed',
        stems: [
          { id: `${songId}-vocals`, name: 'Vocals', file: vocalsUrl, output: 3, pan: 0, volume: 1, isMuted: false, isSoloed: false },
          { id: `${songId}-drums`, name: 'Drums', file: drumsUrl, output: 3, pan: 0, volume: 1, isMuted: false, isSoloed: false },
          { id: `${songId}-bass`, name: 'Bass', file: bassUrl, output: 3, pan: 0, volume: 1, isMuted: false, isSoloed: false },
          { id: `${songId}-other`, name: 'Instruments', file: otherUrl, output: 3, pan: 0, volume: 1, isMuted: false, isSoloed: false },
        ]
      });

      setStatus('Finished!');
      setFile(null);
    } catch (e: any) {
      console.error(e);
      setStatus(`Error: ${e.message || String(e)}`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#0A0A0B]/60 backdrop-blur-md p-6 overflow-y-auto custom-scrollbar relative">
      <div className="absolute inset-0 bg-gradient-to-br from-[#00A3FF]/5 to-transparent pointer-events-none" />
      
      <div className="max-w-2xl mx-auto w-full relative z-10 flex flex-col gap-6">
        
        <div className="text-center mb-4">
          <h2 className="text-3xl font-black mb-2 tracking-tight text-white">AI Stem Splitter</h2>
          <p className="text-white/60">Upload track and separate it into Vocals, Drums, Bass, and Instruments using AI directly in your browser. No server required!</p>
        </div>

        <div 
          onClick={() => !isProcessing && fileInputRef.current?.click()}
          className={cn(
            "border-2 border-dashed rounded-3xl p-12 flex flex-col items-center justify-center cursor-pointer transition-all duration-300",
            file ? "border-[#00A3FF]/50 bg-[#00A3FF]/5" : "border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20",
            isProcessing && "opacity-50 pointer-events-none"
          )}
        >
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept="audio/*" 
            onChange={handleFileChange}
          />
          
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#00A3FF] to-[#0066FF] flex items-center justify-center shadow-[0_0_30px_rgba(0,163,255,0.3)] mb-6">
            <Music size={32} className="text-white" />
          </div>
          
          <h3 className="text-xl font-bold text-white mb-2">
            {file ? file.name : "Select an Audio File"}
          </h3>
          <p className="text-white/50 text-sm">
            {file ? "Click to change file" : "MP3, WAV, FLAC"}
          </p>
        </div>

        {file && !isProcessing && (
          <button 
            onClick={processAudio}
            className="w-full py-4 rounded-2xl bg-white text-black font-black text-lg hover:bg-zinc-200 transition-all hover:scale-[1.02] shadow-[0_0_20px_rgba(255,255,255,0.1)]"
          >
            Start Split
          </button>
        )}

        <AnimatePresence>
          {isProcessing && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-[#050505]/80 border border-white/10 rounded-3xl p-6 overflow-hidden relative"
            >
              <div className="flex flex-col gap-4 relative z-10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Loader size={20} className="text-[#00A3FF] animate-spin" />
                    <span className="font-bold text-white">{status}</span>
                  </div>
                  <span className="text-[#00A3FF] font-mono font-bold">
                    {Math.round(progress > 0 ? progress : downloadProgress)}%
                  </span>
                </div>
                
                <div className="flex flex-col gap-2">
                   {downloadProgress > 0 && downloadProgress < 100 && (
                      <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                        <motion.div 
                          className="h-full bg-white/40"
                          style={{ width: `${downloadProgress}%` }}
                          transition={{ duration: 0.2 }}
                        />
                      </div>
                   )}
                   <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden">
                     <motion.div 
                       className="h-full bg-gradient-to-r from-[#00A3FF] to-[#0066FF]"
                       style={{ width: `${progress}%` }}
                       transition={{ duration: 0.2 }}
                     />
                   </div>
                </div>

                <p className="text-xs text-white/40 leading-relaxed">
                  The model executes entirely on your device via WebAssembly <br/>
                  (It'll download a 170MB ONNX model on the first run).
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

