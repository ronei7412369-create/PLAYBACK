import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { usePlayerStore } from '../store/usePlayerStore';
import { X, Mail, Lock, User } from 'lucide-react';

export const AdminModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const { createInternalUser } = usePlayerStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [status, setStatus] = useState<{ type: 'error' | 'success' | null, message: string }>({ type: null, message: '' });
  const [isLoading, setIsLoading] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !createInternalUser) return;
    
    setIsLoading(true);
    setStatus({ type: null, message: '' });
    
    try {
      await createInternalUser(email, password, displayName);
      setStatus({ type: 'success', message: 'Usuário criado com sucesso!' });
      setEmail('');
      setPassword('');
      setDisplayName('');
    } catch (err: any) {
      setStatus({ type: 'error', message: err.message || 'Erro ao criar usuário' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-[#111112] border border-white/10 rounded-3xl w-full max-w-md overflow-hidden relative shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Absolute close button requested by user */}
            <button 
              onClick={onClose} 
              className="absolute top-4 right-4 p-2 text-white/50 hover:text-white bg-black/50 hover:bg-white/10 rounded-full transition-all z-50 border border-white/10"
            >
              <X size={20} />
            </button>

            <div className="p-6 border-b border-white/5 flex items-center justify-between pr-14">
            <h2 className="text-xl font-black text-white tracking-tight">Criar Usuário</h2>
          </div>
          
          <form onSubmit={handleCreate} className="p-6 flex flex-col gap-5">
            {status.type === 'error' && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-xl">
                {status.message}
              </div>
            )}
            {status.type === 'success' && (
              <div className="p-3 bg-green-500/10 border border-green-500/20 text-green-400 text-sm rounded-xl">
                {status.message}
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] uppercase font-black tracking-widest text-white/40 ml-1">Nome (Opcional)</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={18} />
                <input 
                  type="text"
                  value={displayName}
                  onChange={e => setDisplayName(e.target.value)}
                  className="w-full bg-black/50 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none focus:border-[#00A3FF] transition-colors"
                  placeholder="Nome do usuário"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] uppercase font-black tracking-widest text-white/40 ml-1">Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={18} />
                <input 
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  className="w-full bg-black/50 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none focus:border-[#00A3FF] transition-colors"
                  placeholder="Email de acesso"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] uppercase font-black tracking-widest text-white/40 ml-1">Senha</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={18} />
                <input 
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full bg-black/50 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none focus:border-[#00A3FF] transition-colors"
                  placeholder="Min 6 caracteres"
                />
              </div>
            </div>
            
            <button 
              type="submit" 
              disabled={isLoading}
              className="mt-2 w-full py-4 bg-white hover:bg-white/90 text-black font-black uppercase tracking-widest rounded-xl transition-all disabled:opacity-50"
            >
              {isLoading ? 'Criando...' : 'Criar Conta'}
            </button>
          </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
