import React, { useState, useRef } from 'react';
import * as ort from 'onnxruntime-web';
import { DemucsProcessor, CONSTANTS } from 'demucs-web';
import { Music, Loader, UploadCloud, Youtube, Link, X, Sparkles, CheckCircle, Search, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { usePlayerStore } from '../store/usePlayerStore';
import { getCoverUrl } from '../lib/coverArt';
import { detectBeatAndGenerateClick, generateClickPCM, refineOffsetForBpm } from '../utils/beatDetector';

export const StemSplitter: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'file' | 'youtube'>('file');
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('');
  const [downloadProgress, setDownloadProgress] = useState(0);

  // YouTube Link Specific State
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [isFetchingInfo, setIsFetchingInfo] = useState(false);
  const [youtubeError, setYoutubeError] = useState('');
  const [videoInfo, setVideoInfo] = useState<{ title: string; artist: string; coverUrl: string; duration: number } | null>(null);

  const { addProcessedSong } = usePlayerStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      processAudio(selectedFile);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const selectedFile = e.dataTransfer.files?.[0];
    if (selectedFile && selectedFile.type.startsWith('audio/')) {
      setFile(selectedFile);
      processAudio(selectedFile);
    }
  };

  const fetchYoutubeInfo = async () => {
    if (!youtubeUrl.trim()) return;
    setIsFetchingInfo(true);
    setYoutubeError('');
    setVideoInfo(null);
    try {
      const res = await fetch(`/api/youtube-info?url=${encodeURIComponent(youtubeUrl)}`).catch((networkErr) => {
        throw new Error('Erro de conexão ao servidor. Verifique sua conexão com a internet ou tente novamente.');
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Não foi possível buscar as informações do vídeo.');
      }
      const data = await res.json();
      setVideoInfo(data);
    } catch (err: any) {
      setYoutubeError(err.message || 'Erro ao buscar vídeo. Verifique se o link está correto.');
    } finally {
      setIsFetchingInfo(false);
    }
  };

  const handleSplitYoutube = async () => {
    if (!videoInfo) return;
    setIsProcessing(true);
    setStatus('Iniciando download do YouTube...');
    setProgress(0);
    setDownloadProgress(0);

    try {
      const response = await fetch(`/api/youtube-download?url=${encodeURIComponent(youtubeUrl)}`).catch((networkErr) => {
        throw new Error('Erro de rede ao baixar o áudio do YouTube. Caso persista, envie o arquivo MP3/WAV diretamente.');
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.error || 'Erro ao baixar áudio do YouTube. Envie o arquivo de áudio diretamente.');
      }

      setStatus('Carregando áudio...');
      const blob = await response.blob();
      const fileObj = new File([blob], `${videoInfo.title}.mp3`, { type: 'audio/mpeg' });

      await processAudio(fileObj, videoInfo.title, videoInfo.artist, videoInfo.coverUrl);
    } catch (err: any) {
      console.error(err);
      setStatus(`Erro: ${err.message || String(err)}`);
      setTimeout(() => setIsProcessing(false), 5000);
    }
  };

  const processAudio = async (
    selectedFile: File, 
    customTitle?: string, 
    customArtist?: string, 
    customCoverUrl?: string
  ) => {
    setIsProcessing(true);
    setStatus('Inicializando IA...');
    setProgress(0);
    setDownloadProgress(0);

    try {
      // Configure ONNX Runtime Web WASM CDN paths and thread capabilities
      ort.env.wasm.wasmPaths = 'https://cdn.jsdelivr.net/npm/onnxruntime-web@1.24.3/dist/';
      const hasSharedArrayBuffer = typeof self !== 'undefined' && typeof (self as any).SharedArrayBuffer !== 'undefined';
      ort.env.wasm.numThreads = hasSharedArrayBuffer ? Math.min(navigator.hardwareConcurrency || 4, 4) : 1;

      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const audioContext = new AudioContextClass({ sampleRate: CONSTANTS.SAMPLE_RATE || 44100 });
      if (audioContext.state === 'suspended') {
        await audioContext.resume();
      }
      
      setStatus('Decodificando áudio...');
      const arrayBuffer = await selectedFile.arrayBuffer();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer.slice(0));
      
      const leftChannel = audioBuffer.getChannelData(0);
      const rightChannel = audioBuffer.numberOfChannels > 1 
        ? audioBuffer.getChannelData(1) 
        : leftChannel;

      if ('gpu' in navigator) {
        try {
          const adapter = await (navigator as any).gpu.requestAdapter();
          if (adapter) {
            // @ts-ignore
            ort.env.webgpu = { powerPreference: 'high-performance' };
          }
        } catch (e) {
          console.log('WebGPU não disponível');
        }
      }

      const processor = new DemucsProcessor({
        ort,
        onProgress: (p) => {
          setProgress(p.progress * 100);
          setStatus(`Separando tracks: ${Math.round(p.progress * 100)}%`);
        },
        onLog: (phase, msg) => {
          if(phase === 'Download') {
            setStatus('Baixando modelo de IA...');
          }
        },
        onDownloadProgress: (loaded, total) => {
          setDownloadProgress((loaded / total) * 100);
        }
      });

      setStatus('Carregando modelo de IA...');
      await processor.loadModel(CONSTANTS.DEFAULT_MODEL_URL);

      setStatus('Executando separação (Split)...');
      const result = await processor.separate(leftChannel, rightChannel);

      setStatus('Sincronizando Click/Metrônomo (BPM)...');

      const songTitle = customTitle || selectedFile.name.replace(/\.[^/.]+$/, "");
      const songArtist = customArtist || 'AI Processed';
      const coverUrl = customCoverUrl || getCoverUrl(songTitle, songArtist);

      // Use drum stem as primary beat detection source, falling back to full audio if drum stem is silent
      const hasDrums = result.drums.left.some(v => Math.abs(v) > 0.001);
      const beatLeft = hasDrums ? result.drums.left : leftChannel;
      const beatRight = hasDrums ? result.drums.right : rightChannel;

      const beatAnalysis = detectBeatAndGenerateClick(beatLeft, beatRight, CONSTANTS.SAMPLE_RATE || 44100);

      let finalBpm = beatAnalysis.bpm || 120;
      let finalTimeSig = '4/4';
      let finalOffset = beatAnalysis.offset || 0;

      setStatus('IA Decifrando Tempo e Compasso...');
      try {
        const aiResponse = await fetch('/api/ai-tempo-detect', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: songTitle,
            artist: songArtist,
            dspBpm: beatAnalysis.bpm,
            dspOffset: beatAnalysis.offset,
            duration: audioBuffer.duration,
          })
        });

        if (aiResponse.ok) {
          const aiData = await aiResponse.json();
          if (aiData.bpm && typeof aiData.bpm === 'number') {
            finalBpm = aiData.bpm;
          }
          if (aiData.timeSignature && typeof aiData.timeSignature === 'string') {
            finalTimeSig = aiData.timeSignature;
          }
        }
      } catch (err) {
        console.warn('Falha na IA para tempo, mantendo detecção DSP:', err);
      }

      // Refine 100% synchronized beat offset for the final BPM
      finalOffset = refineOffsetForBpm(beatLeft, beatRight, finalBpm, CONSTANTS.SAMPLE_RATE || 44100);

      // Generate click track 100% synchronized with AI deciphered BPM & Time Signature
      const { clickLeft, clickRight } = generateClickPCM(
        leftChannel.length,
        finalBpm,
        finalOffset,
        finalTimeSig,
        CONSTANTS.SAMPLE_RATE || 44100
      );

      setStatus('Renderizando stems...');
      
      const createWavData = (left: Float32Array, right: Float32Array, filename: string) => {
        const numChannels = 2;
        const sampleRate = CONSTANTS.SAMPLE_RATE || 44100;
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
        view.setUint16(20, 1, true); // 1 = PCM
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
        const fileObj = new File([blob], filename, { type: 'audio/wav' });
        return {
           url: URL.createObjectURL(blob),
           file: fileObj
        };
      };

      const songId = Math.random().toString(36).substring(7);

      const clickData = createWavData(clickLeft, clickRight, 'click.wav');
      const drumsData = createWavData(result.drums.left, result.drums.right, 'drums.wav');
      const bassData = createWavData(result.bass.left, result.bass.right, 'bass.wav');
      const otherData = createWavData(result.other.left, result.other.right, 'other.wav');
      const vocalsData = createWavData(result.vocals.left, result.vocals.right, 'vocals.wav');

      addProcessedSong({
        id: songId,
        title: songTitle,
        artist: songArtist,
        coverUrl: coverUrl,
        bpm: finalBpm,
        timeSignature: finalTimeSig,
        firstBeatOffset: finalOffset,
        stems: [
          { id: `${songId}-click`, name: 'Click / Tap', file: clickData.url, originalFile: clickData.file, output: 3, pan: 0, volume: 0.5, isMuted: false, isSoloed: false },
          { id: `${songId}-vocals`, name: 'Vocals', file: vocalsData.url, originalFile: vocalsData.file, output: 3, pan: 0, volume: 0.5, isMuted: false, isSoloed: false },
          { id: `${songId}-drums`, name: 'Drums', file: drumsData.url, originalFile: drumsData.file, output: 3, pan: 0, volume: 0.5, isMuted: false, isSoloed: false },
          { id: `${songId}-bass`, name: 'Bass', file: bassData.url, originalFile: bassData.file, output: 3, pan: 0, volume: 0.5, isMuted: false, isSoloed: false },
          { id: `${songId}-other`, name: 'Instruments', file: otherData.url, originalFile: otherData.file, output: 3, pan: 0, volume: 0.5, isMuted: false, isSoloed: false },
        ]
      });

      setStatus('Concluído com Sucesso!');
      setTimeout(() => {
        setIsProcessing(false);
        setFile(null);
        setVideoInfo(null);
        setYoutubeUrl('');
        setIsOpen(false);
      }, 2000);
    } catch (e: any) {
      console.error(e);
      setStatus(`Erro: ${e.message || String(e)}`);
      setTimeout(() => setIsProcessing(false), 4000);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex items-center">
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-0 2xl:gap-2 bg-[#00A3FF]/10 hover:bg-[#00A3FF]/20 text-[#00A3FF] border border-[#00A3FF]/20 px-0 2xl:px-4 rounded-xl transition-all font-bold text-sm h-10 w-10 2xl:w-[240px] justify-center shadow-lg shadow-[#00A3FF]/5 hover:scale-[1.02] shrink-0"
        title="AI Stem Splitter"
      >
        <UploadCloud size={16} className="shrink-0" />
        <span className="hidden 2xl:inline">AI Stem Splitter</span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
              onClick={() => !isProcessing && setIsOpen(false)}
            />

            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#0a0a0a] border border-white/10 rounded-3xl w-full max-w-lg overflow-hidden relative shadow-2xl flex flex-col z-10"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-white/5">
                <h2 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
                  <Sparkles className="text-[#00A3FF] animate-pulse" size={20} />
                  AI Stem Splitter
                </h2>
                {!isProcessing && (
                  <button 
                    onClick={() => setIsOpen(false)} 
                    className="p-2 text-white/50 hover:text-white bg-black/50 hover:bg-white/10 rounded-full transition-all"
                  >
                    <X size={20} />
                  </button>
                )}
              </div>

              {/* Progress Panel */}
              {isProcessing ? (
                <div className="p-8 flex flex-col items-center justify-center h-[320px] text-center">
                  <div className="relative mb-6">
                    <Loader size={48} className="animate-spin text-[#00A3FF]" />
                    <div className="absolute inset-0 flex items-center justify-center text-[10px] font-mono font-black text-white/70">
                      {Math.round(progress > 0 ? progress : downloadProgress)}%
                    </div>
                  </div>
                  
                  <h3 className="text-white font-bold text-lg mb-2">Processando Faixa</h3>
                  <p className="text-sm text-[#00A3FF] font-medium animate-pulse mb-6">{status}</p>

                  <div className="w-full max-w-xs h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <motion.div 
                      className="h-full bg-gradient-to-r from-[#00A3FF] to-[#0066FF]"
                      style={{ width: `${progress > 0 ? progress : downloadProgress}%` }}
                      transition={{ duration: 0.2 }}
                    />
                  </div>
                  <span className="text-[10px] text-white/30 uppercase tracking-widest font-black mt-3">
                    Isso pode levar alguns minutos
                  </span>
                </div>
              ) : (
                <>
                  {/* Tabs */}
                  <div className="flex border-b border-white/5">
                    <button 
                      onClick={() => setActiveTab('file')}
                      className={`flex-1 py-4 text-sm font-bold flex items-center justify-center gap-2 transition-colors ${activeTab === 'file' ? 'text-[#00A3FF] border-b-2 border-[#00A3FF]' : 'text-white/50 hover:bg-white/5 hover:text-white'}`}
                    >
                      <UploadCloud size={18} />
                      Arquivo Local
                    </button>
                    <button 
                      onClick={() => setActiveTab('youtube')}
                      className={`flex-1 py-4 text-sm font-bold flex items-center justify-center gap-2 transition-colors ${activeTab === 'youtube' ? 'text-[#00A3FF] border-b-2 border-[#00A3FF]' : 'text-white/50 hover:bg-white/5 hover:text-white'}`}
                    >
                      <Youtube size={18} />
                      Link do YouTube
                    </button>
                  </div>

                  {/* Body Content */}
                  <div className="p-6 min-h-[260px] flex flex-col justify-center">
                    {activeTab === 'file' ? (
                      <div 
                        ref={dragRef}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                        className={cn(
                          "border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center gap-4 cursor-pointer transition-all h-[200px] text-center",
                          isDragging 
                            ? "border-[#00A3FF] bg-[#00A3FF]/5 text-white" 
                            : "border-white/10 hover:border-[#00A3FF]/50 bg-white/5 text-white/50 hover:text-white"
                        )}
                      >
                        <input 
                          type="file" 
                          ref={fileInputRef} 
                          className="hidden" 
                          accept="audio/*" 
                          onChange={handleFileChange}
                        />
                        <UploadCloud size={40} className="text-[#00A3FF]" />
                        <div>
                          <p className="font-bold text-sm">Arraste um áudio aqui ou clique para buscar</p>
                          <p className="text-xs text-white/30 mt-1">Aceita MP3, WAV, AAC, M4A, etc.</p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-4">
                        <div className="flex gap-2">
                          <div className="relative flex-1">
                            <input 
                              type="text"
                              value={youtubeUrl}
                              onChange={e => setYoutubeUrl(e.target.value)}
                              placeholder="Cole o link do YouTube aqui..."
                              className="w-full bg-black/50 border border-white/10 rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:border-[#00A3FF] transition-colors pr-10"
                            />
                            <Youtube size={18} className="absolute right-3 top-3.5 text-white/30" />
                          </div>
                          <button
                            onClick={fetchYoutubeInfo}
                            disabled={isFetchingInfo || !youtubeUrl.trim()}
                            className="bg-white/10 hover:bg-white/20 text-white font-bold text-sm px-5 py-3 rounded-xl transition-all flex items-center gap-1.5 disabled:opacity-40 shrink-0"
                          >
                            {isFetchingInfo ? (
                              <Loader size={16} className="animate-spin" />
                            ) : (
                              <Search size={16} />
                            )}
                            Buscar
                          </button>
                        </div>

                        {/* Error state */}
                        {youtubeError && (
                          <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-xs">
                            <AlertCircle size={16} className="shrink-0" />
                            <span>{youtubeError}</span>
                          </div>
                        )}

                        {/* Video Preview */}
                        {videoInfo && (
                          <motion.div 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="p-4 rounded-2xl bg-white/5 border border-white/5 flex gap-4 items-center"
                          >
                            <img 
                              src={videoInfo.coverUrl} 
                              alt={videoInfo.title}
                              className="w-20 h-20 rounded-xl object-cover border border-white/10 shrink-0"
                              referrerPolicy="no-referrer"
                            />
                            <div className="flex-1 min-w-0">
                              <span className="text-white font-bold block truncate text-sm" title={videoInfo.title}>
                                {videoInfo.title}
                              </span>
                              <span className="text-xs text-white/40 block mt-1 truncate">
                                {videoInfo.artist}
                              </span>
                              <span className="text-[10px] font-mono bg-white/10 text-white px-2 py-0.5 rounded-full inline-block mt-2 font-black">
                                {formatDuration(videoInfo.duration)}
                              </span>
                            </div>
                          </motion.div>
                        )}

                        {/* Action Split Button */}
                        {videoInfo && (
                          <motion.button
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            onClick={handleSplitYoutube}
                            className="w-full py-4 rounded-xl font-black text-sm transition-all bg-gradient-to-r from-[#00A3FF] to-[#0066FF] text-white hover:opacity-90 shadow-lg shadow-[#00A3FF]/20 flex items-center justify-center gap-2"
                          >
                            <Sparkles size={16} />
                            Dividir Faixas da Música
                          </motion.button>
                        )}
                      </div>
                    )}
                  </div>
                </>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
