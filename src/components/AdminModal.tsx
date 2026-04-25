import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { usePlayerStore } from '../store/usePlayerStore';
import { X, Mail, Lock, User, Users, Plus, CheckCircle2, Circle } from 'lucide-react';
import { collection, query, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '../services/firebase';

export const AdminModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const { createInternalUser } = usePlayerStore();
  const [activeTab, setActiveTab] = useState<'create' | 'manage'>('create');
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [status, setStatus] = useState<{ type: 'error' | 'success' | null, message: string }>({ type: null, message: '' });
  const [isLoading, setIsLoading] = useState(false);
  
  const [userList, setUserList] = useState<any[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);

  useEffect(() => {
    if (isOpen && activeTab === 'manage') {
      fetchUsers();
    }
  }, [isOpen, activeTab]);

  const fetchUsers = async () => {
    setIsLoadingUsers(true);
    try {
      const q = query(collection(db, 'users'));
      const querySnapshot = await getDocs(q);
      const users: any[] = [];
      querySnapshot.forEach((doc) => {
        users.push({ id: doc.id, ...doc.data() });
      });
      setUserList(users);
    } catch (err) {
      console.error("Error fetching users: ", err);
    } finally {
      setIsLoadingUsers(false);
    }
  };

  const toggleUserPaidStatus = async (userId: string, currentStatus: boolean) => {
    try {
      await updateDoc(doc(db, 'users', userId), {
        isPaid: !currentStatus
      });
      fetchUsers(); // Refresh list
    } catch (err) {
      console.error("Error updating user status: ", err);
    }
  };

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
            className="bg-[#111112] border border-white/10 rounded-3xl w-full max-w-md overflow-hidden relative shadow-2xl flex flex-col max-h-[80vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Absolute close button requested by user */}
            <button 
              onClick={onClose} 
              className="absolute top-4 right-4 p-2 text-white/50 hover:text-white bg-black/50 hover:bg-white/10 rounded-full transition-all z-50 border border-white/10"
            >
              <X size={20} />
            </button>

            <div className="p-6 border-b border-white/5 flex flex-col gap-4 pr-14 shrink-0">
              <h2 className="text-xl font-black text-white tracking-tight">Painel Admin</h2>
              <div className="flex gap-2">
                <button 
                  onClick={() => setActiveTab('create')} 
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all ${activeTab === 'create' ? 'bg-[#00A3FF] text-white' : 'bg-white/5 text-white/50 hover:bg-white/10'}`}
                >
                  <Plus size={14} />
                  Criar Usuário
                </button>
                <button 
                  onClick={() => setActiveTab('manage')} 
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all ${activeTab === 'manage' ? 'bg-[#00A3FF] text-white' : 'bg-white/5 text-white/50 hover:bg-white/10'}`}
                >
                  <Users size={14} />
                  Gerenciar
                </button>
              </div>
            </div>
          
            <div className="overflow-y-auto w-full group overflow-x-hidden">
            {activeTab === 'create' ? (
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
                  className="mt-2 w-full py-4 bg-white hover:bg-white/90 text-black font-black uppercase tracking-widest rounded-xl transition-all disabled:opacity-50 shrink-0"
                >
                  {isLoading ? 'Criando...' : 'Criar Conta'}
                </button>
              </form>
            ) : (
              <div className="p-6 flex flex-col gap-4">
                {isLoadingUsers ? (
                  <div className="text-center text-white/50 text-sm py-8">Carregando usuários...</div>
                ) : userList.length === 0 ? (
                  <div className="text-center text-white/50 text-sm py-8">Nenhum usuário encontrado</div>
                ) : (
                  userList.map(user => (
                    <div key={user.id} className="flex flex-col gap-3 p-4 bg-black/50 border border-white/5 rounded-xl">
                      <div className="flex justify-between items-start">
                        <div className="flex flex-col">
                          <span className="text-white font-bold">{user.displayName || 'Sem Nome'}</span>
                          <span className="text-white/50 text-xs">{user.email}</span>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          {user.isPaid ? (
                            <span className="text-green-400 text-[10px] uppercase font-black tracking-widest bg-green-400/10 px-2 py-0.5 rounded-full">Pago</span>
                          ) : (
                            <span className="text-white/40 text-[10px] uppercase font-black tracking-widest bg-white/5 px-2 py-0.5 rounded-full">
                              {user.trialEndsAt && new Date() < user.trialEndsAt.toDate() ? 'Teste' : 'Expirado'}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex justify-between items-center mt-2 pt-3 border-t border-white/5">
                        <span className="text-[10px] text-white/40">Status Flex</span>
                        <button 
                          onClick={() => toggleUserPaidStatus(user.id, user.isPaid)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all border ${user.isPaid ? 'border-red-500/30 text-red-400 hover:bg-red-500/10' : 'border-[#00A3FF]/30 text-[#00A3FF] hover:bg-[#00A3FF]/10'}`}
                        >
                          {user.isPaid ? 'Remover Acesso' : 'Desbloquear'}
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
