import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, MessageCircle, AlertCircle, Download, RefreshCw, FileAudio } from 'lucide-react';
import { cn } from '../lib/utils';

interface TelegramFile {
  file_id: string;
  file_name: string;
  mime_type: string;
  file_size?: number;
  date: number;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onImport: (files: File[]) => void;
}

export const TelegramImportModal: React.FC<Props> = ({ isOpen, onClose, onImport }) => {
  const [botToken, setBotToken] = useState('');
  const [files, setFiles] = useState<TelegramFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const savedToken = localStorage.getItem('telegram_bot_token');
    if (savedToken) setBotToken(savedToken);
  }, []);

  const saveToken = (token: string) => {
    setBotToken(token);
    localStorage.setItem('telegram_bot_token', token);
  };

  const fetchUpdates = async () => {
    if (!botToken) {
      setError('Insira o Token do Bot');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`https://api.telegram.org/bot${botToken}/getUpdates`);
      const data = await res.json();
      
      if (!data.ok) throw new Error(data.description || 'Erro ao conectar com o Telegram');

      const extractedFiles: TelegramFile[] = [];
      
      // Parse Updates for audios and documents
      data.result.forEach((update: any) => {
        const msg = update.message || update.channel_post;
        if (!msg) return;

        if (msg.document) {
          extractedFiles.push({
            file_id: msg.document.file_id,
            file_name: msg.document.file_name || 'arquivo_desconhecido',
            mime_type: msg.document.mime_type,
            file_size: msg.document.file_size,
            date: msg.date
          });
        }
        if (msg.audio) {
          extractedFiles.push({
            file_id: msg.audio.file_id,
            file_name: msg.audio.file_name || `${msg.audio.performer || 'Audio'} - ${msg.audio.title || 'Unknown'}.mp3`,
            mime_type: msg.audio.mime_type,
            file_size: msg.audio.file_size,
            date: msg.date
          });
        }
      });

      // Remove duplicates based on file_id and sort by newest
      const uniqueFiles = Array.from(new Map(extractedFiles.map(item => [item.file_id, item])).values());
      uniqueFiles.sort((a, b) => b.date - a.date);
      
      setFiles(uniqueFiles);
      if (uniqueFiles.length === 0) {
         setError('Nenhum arquivo encontrado. Envie um arquivo de áudio para o seu bot no Telegram.');
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao buscar arquivos');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (file: TelegramFile) => {
    setDownloadingId(file.file_id);
    setError('');
    try {
      // 1. Get File Path
      const pathRes = await fetch(`https://api.telegram.org/bot${botToken}/getFile?file_id=${file.file_id}`);
      const pathData = await pathRes.json();
      
      if (!pathData.ok) {
        if (pathData.description?.includes('file is too big')) {
           throw new Error('O arquivo excede o limite de 20MB do Bot do Telegram.');
        }
        throw new Error(pathData.description || 'Erro ao obter informações do arquivo.');
      }

      // 2. Download File
      const filePath = pathData.result.file_path;
      const downloadUrl = `https://api.telegram.org/file/bot${botToken}/${filePath}`;
      
      const fileRes = await fetch(downloadUrl);
      const blob = await fileRes.blob();
      
      // 3. Create File Object
      const jsFile = new File([blob], file.file_name, { type: file.mime_type || 'audio/mpeg' });
      
      onImport([jsFile]);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Erro ao baixar o arquivo.');
    } finally {
      setDownloadingId(null);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-[#111112] border border-[#0088CC]/30 rounded-3xl w-full max-w-lg overflow-hidden relative shadow-[0_0_50px_rgba(0,136,204,0.15)]"
        >
          <div className="p-6 border-b border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#0088CC]/20 rounded-xl flex items-center justify-center">
                 <MessageCircle className="text-[#0088CC]" size={20} />
              </div>
              <h2 className="text-xl font-black text-white tracking-tight">Importar do Telegram</h2>
            </div>
            <button onClick={onClose} className="p-2 text-white/40 hover:text-white transition-colors bg-white/5 rounded-full hover:bg-white/10">
              <X size={20} />
            </button>
          </div>
          
          <div className="p-6 flex flex-col gap-6">
            <div className="bg-[#0088CC]/10 p-4 rounded-xl border border-[#0088CC]/20 flex gap-3 text-[#0088CC] text-sm">
              <AlertCircle size={20} className="shrink-0" />
              <div className="flex flex-col gap-1">
                <p>O limite de download via Bot API é de 20MB por arquivo.</p>
                <p className="opacity-80 text-xs">Crie um bot no @BotFather, cole o token abaixo e encaminhe suas músicas para o bot.</p>
              </div>
            </div>

            <div className="flex gap-2">
              <input 
                type="password"
                value={botToken}
                onChange={e => saveToken(e.target.value)}
                placeholder="Telegram Bot Token (Ex: 123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11)"
                className="flex-1 bg-black/50 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-[#0088CC] transition-colors text-sm"
              />
              <button 
                onClick={fetchUpdates}
                disabled={loading || !botToken}
                className="px-4 bg-[#0088CC] hover:bg-[#0077B3] text-white rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center"
              >
                {loading ? <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }}><RefreshCw size={18} /></motion.div> : 'Buscar'}
              </button>
            </div>

            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-xl">
                {error}
              </div>
            )}

            <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
              {files.map(file => (
                <div key={file.file_id} className="p-3 bg-white/5 border border-white/5 rounded-xl flex items-center justify-between group hover:border-[#0088CC]/30 transition-all">
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className="w-10 h-10 bg-[#0088CC]/10 rounded-lg flex items-center justify-center shrink-0 group-hover:bg-[#0088CC]/20 transition-all">
                      <FileAudio size={18} className="text-[#0088CC]" />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-white text-sm font-bold truncate">{file.file_name}</span>
                      <span className="text-white/40 text-xs text-left">
                         {file.file_size ? (file.file_size / 1024 / 1024).toFixed(2) + ' MB' : 'Desconhecido'}
                      </span>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleDownload(file)}
                    disabled={downloadingId === file.file_id || (file.file_size && file.file_size > 20971520)}
                    className="p-2 bg-white/5 text-white/60 hover:text-white hover:bg-[#0088CC] rounded-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed shrink-0"
                    title={(file.file_size && file.file_size > 20971520) ? "Arquivo excede 20MB" : "Importar"}
                  >
                    {downloadingId === file.file_id ? (
                      <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }}>
                        <RefreshCw size={18} />
                      </motion.div>
                    ) : (
                      <Download size={18} />
                    )}
                  </button>
                </div>
              ))}
              
              {!loading && files.length === 0 && botToken && !error && (
                 <div className="text-center py-8 text-white/30 text-sm italic">
                    Nenhum arquivo compatível encontrado.<br />Envie um áudio (.mp3, .wav) para o seu bot.
                 </div>
              )}
            </div>
            
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
