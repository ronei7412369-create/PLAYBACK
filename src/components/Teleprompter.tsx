import React, { useState, useRef, useEffect } from 'react';
import { usePlayerStore } from '../store/usePlayerStore';
import { Edit2, Save, X, Sparkles, Loader2 } from 'lucide-react';
import { cn } from '../lib/utils';
import ReactMarkdown from 'react-markdown';
import { generateLyricsAndChords } from '../services/autoLyrics';

export const Teleprompter: React.FC = () => {
  const { currentSong, currentTime, updateSongLyrics } = usePlayerStore();
  const [isEditing, setIsEditing] = useState(false);
  const [localLyrics, setLocalLyrics] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (currentSong?.lyrics !== undefined) {
      setLocalLyrics(currentSong.lyrics);
    } else {
      setLocalLyrics('## Your Lyrics Here\n\n```\n[C]       [G]\nAmazing Grace, how sweet the sound\n```\n\nEdit to add your content.');
    }
  }, [currentSong?.id]);

  useEffect(() => {
    if (!isEditing && scrollContainerRef.current && currentSong && currentSong.duration > 0) {
      const el = scrollContainerRef.current;
      const progress = currentTime / currentSong.duration;
      const maxScroll = el.scrollHeight - el.clientHeight;
      if (maxScroll > 0) {
         el.scrollTop = progress * maxScroll;
      }
    }
  }, [currentTime, currentSong?.duration, isEditing]);

  const handleSave = () => {
    if (currentSong) {
      updateSongLyrics(currentSong.id, localLyrics);
      setIsEditing(false);
    }
  };

  const handleAutoGenerate = async () => {
    if (!currentSong) return;
    setIsGenerating(true);
    try {
      const result = await generateLyricsAndChords(currentSong.title, currentSong.artist);
      setLocalLyrics(result);
      updateSongLyrics(currentSong.id, result);
      setIsEditing(false);
    } catch (err) {
      console.error(err);
      alert('Erro ao buscar letra.');
    } finally {
      setIsGenerating(false);
    }
  };

  if (!currentSong) return null;

  return (
    <div className="flex flex-col h-full relative">
      <div className="absolute top-4 right-4 z-20 flex gap-2">
        {isEditing ? (
          <>
            <button 
              onClick={() => setIsEditing(false)}
              className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-white/50 border border-white/10"
              title="Cancelar"
            >
              <X size={16} />
            </button>
            <button 
              onClick={handleSave}
              className="p-2 bg-[#00A3FF] hover:bg-[#0090FF] rounded-lg text-white border border-[#00A3FF]"
              title="Salvar"
            >
              <Save size={16} />
            </button>
          </>
        ) : (
          <>
            <button 
              onClick={handleAutoGenerate}
              disabled={isGenerating}
              className="p-2 bg-purple-500/20 hover:bg-purple-500/40 rounded-lg text-purple-400 border border-purple-500/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2"
              title="Letra Automática com IA"
            >
              {isGenerating ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
            </button>
            <button 
              onClick={() => setIsEditing(true)}
              className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-white/50 border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity"
              title="Editar Manualmente"
            >
              <Edit2 size={16} />
            </button>
          </>
        )}
      </div>

      <div 
        ref={scrollContainerRef}
        className={cn(
          "flex-1 overflow-y-auto px-6 py-8 custom-scrollbar relative",
          isEditing && "p-0"
        )}
      >
        {isEditing ? (
          <textarea
            value={localLyrics}
            onChange={(e) => setLocalLyrics(e.target.value)}
            className="w-full h-full bg-black/40 text-white p-6 outline-none resize-none font-mono text-sm leading-relaxed"
            placeholder="Paste your lyrics/chords here..."
          />
        ) : (
          <div className="max-w-2xl mx-auto pb-10">
             <div className="markdown-body text-xl md:text-3xl font-bold leading-relaxed text-center text-white">
                <ReactMarkdown
                   components={{
                     code({node, className, children, ...props}: any) {
                        return <pre className="text-[#00A3FF] font-mono text-lg md:text-2xl whitespace-pre-wrap">{children}</pre>;
                     },
                     h2({children}) {
                        return <h2 className="text-white/40 uppercase tracking-[0.3em] text-sm md:text-base mb-6 mt-12">{children}</h2>
                     }
                   }}
                >
                  {currentSong.lyrics || '## Sem Letra\nClique em editar ou use a IA para adicionar.'}
                </ReactMarkdown>
             </div>
          </div>
        )}
      </div>
    </div>
  );
};
