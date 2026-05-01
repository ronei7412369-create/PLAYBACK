import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { usePlayerStore } from '../store/usePlayerStore';
import { X, Mail, Lock, User, Users, Plus, CheckCircle2, Circle, Search, CalendarPlus, ShieldAlert, ShieldCheck, UserX, Ban } from 'lucide-react';
import { collection, query, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '../services/firebase';

export const AdminModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const { createInternalUser } = usePlayerStore();
  const [activeTab, setActiveTab] = useState<'manage' | 'create'>('manage');
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [status, setStatus] = useState<{ type: 'error' | 'success' | null, message: string }>({ type: null, message: '' });
  const [isLoading, setIsLoading] = useState(false);
  
  const [userList, setUserList] = useState<any[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetchUsers();
    }
  }, [isOpen]);

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

  const filteredUsers = useMemo(() => {
    return userList.filter(user => {
      const search = searchTerm.toLowerCase();
      return (user.email?.toLowerCase() || '').includes(search) || 
             (user.displayName?.toLowerCase() || '').includes(search);
    });
  }, [userList, searchTerm]);

  const toggleUserPaidStatus = async (userId: string, currentStatus: boolean) => {
    try {
      await updateDoc(doc(db, 'users', userId), {
        isPaid: !currentStatus,
        isBlocked: false // Unblock if making paid
      });
      fetchUsers(); // Refresh list
    } catch (err) {
      console.error("Error updating user status: ", err);
    }
  };

  const toggleUserBlockStatus = async (userId: string, currentStatus: boolean) => {
    try {
      const updateData: any = { isBlocked: !currentStatus };
      if (!currentStatus) {
        // If we are blocking the user, also remove their paid status
        updateData.isPaid = false;
      }
      
      await updateDoc(doc(db, 'users', userId), updateData);
      fetchUsers(); // Refresh list
    } catch (err) {
      console.error("Error blocking user status: ", err);
    }
  };

  const extendUserTrial = async (userId: string, days: number, currentTrialEndsAt?: any) => {
    try {
      let baseDate = new Date();
      if (currentTrialEndsAt && new Date() < currentTrialEndsAt.toDate()) {
        baseDate = currentTrialEndsAt.toDate();
      }
      const trialEndsAtDate = new Date(baseDate);
      trialEndsAtDate.setDate(trialEndsAtDate.getDate() + days);
      
      await updateDoc(doc(db, 'users', userId), {
        trialEndsAt: trialEndsAtDate,
        isBlocked: false // Unblock if giving trial
      });
      fetchUsers(); // Refresh list
    } catch (err) {
      console.error("Error extending user trial: ", err);
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
      fetchUsers();
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
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-8 bg-black/80 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className={`bg-[#0a0a0a] border border-white/10 rounded-3xl w-full max-w-5xl overflow-hidden relative shadow-2xl flex flex-col md:flex-row h-[85vh] transition-all duration-300`}
            onClick={(e) => e.stopPropagation()}
          >
            <button 
              onClick={onClose} 
              className="absolute top-4 right-4 p-2 text-white/50 hover:text-white bg-black/50 hover:bg-white/10 rounded-full transition-all z-50 border border-white/10 md:hidden"
            >
              <X size={20} />
            </button>

            {/* Sidebar */}
            <div className="w-full md:w-64 bg-black/40 border-b md:border-b-0 md:border-r border-white/5 flex flex-col shrink-0">
              <div className="p-6">
                <h2 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
                  <ShieldCheck className="text-[#00A3FF]" />
                  Admin
                </h2>
                <p className="text-xs text-white/40 mt-1">Gerenciamento de acessos</p>
              </div>
              
              <div className="flex md:flex-col gap-1 p-3 overflow-x-auto hide-scrollbar">
                <button 
                  onClick={() => setActiveTab('manage')} 
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${activeTab === 'manage' ? 'bg-[#00A3FF]/10 text-[#00A3FF]' : 'text-white/50 hover:bg-white/5 hover:text-white'}`}
                >
                  <Users size={18} />
                  Lista de Usuários
                </button>
                <button 
                  onClick={() => setActiveTab('create')} 
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${activeTab === 'create' ? 'bg-white text-black' : 'text-white/50 hover:bg-white/5 hover:text-white'}`}
                >
                  <Plus size={18} />
                  Cadastrar Usuário
                </button>
              </div>
            </div>
          
            {/* Main Content Area */}
            <div className="flex-1 overflow-y-auto w-full flex flex-col relative bg-[#111112]">
              <button 
                onClick={onClose} 
                className="absolute top-4 right-4 p-2 text-white/50 hover:text-white bg-black/50 hover:bg-white/10 rounded-full transition-all z-50 border border-white/10 hidden md:flex"
              >
                <X size={20} />
              </button>

              {activeTab === 'create' ? (
                <div className="p-6 md:p-10 max-w-xl mx-auto w-full my-auto">
                  <div className="mb-8">
                    <h3 className="text-2xl font-black text-white">Criar Novo Acesso</h3>
                    <p className="text-white/50 text-sm mt-2">Cadastre um novo usuário manualmente na plataforma. Ele poderá fazer login com este email e senha.</p>
                  </div>
                  
                  <form onSubmit={handleCreate} className="flex flex-col gap-5">
                    {status.type === 'error' && (
                      <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-xl flex items-start gap-3">
                        <ShieldAlert size={18} className="shrink-0 mt-0.5" />
                        {status.message}
                      </div>
                    )}
                    {status.type === 'success' && (
                      <div className="p-4 bg-green-500/10 border border-green-500/20 text-green-400 text-sm rounded-xl flex items-start gap-3">
                        <CheckCircle2 size={18} className="shrink-0 mt-0.5" />
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
                          className="w-full bg-black/50 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-white/30 transition-colors"
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
                          className="w-full bg-black/50 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-[#00A3FF] transition-colors"
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
                          className="w-full bg-black/50 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-[#00A3FF] transition-colors"
                          placeholder="Mínimo 6 caracteres"
                        />
                      </div>
                    </div>
                    
                    <button 
                      type="submit" 
                      disabled={isLoading}
                      className="mt-4 w-full py-4 bg-white hover:bg-gray-200 text-black font-black uppercase tracking-widest rounded-xl transition-all disabled:opacity-50 shrink-0"
                    >
                      {isLoading ? 'Cadastrando...' : 'Cadastrar Usuário'}
                    </button>
                  </form>
                </div>
              ) : (
                <div className="p-6 md:p-8 flex flex-col gap-6 h-full">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <h3 className="text-2xl font-black text-white">Gerenciar Usuários</h3>
                      <p className="text-white/50 text-sm mt-1">Controle acessos, libere trials e bloqueie contas.</p>
                    </div>
                    <div className="relative w-full md:w-72">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" size={18} />
                      <input 
                        type="text"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        placeholder="Pesquisar..."
                        className="w-full bg-black/50 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white placeholder-white/40 focus:outline-none focus:border-[#00A3FF] transition-colors"
                      />
                    </div>
                  </div>
                  
                  {isLoadingUsers ? (
                    <div className="flex-1 flex items-center justify-center text-white/50 text-sm">Carregando base de usuários...</div>
                  ) : filteredUsers.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-white/50 text-sm gap-4">
                      <UserX size={48} className="text-white/10" />
                      Nenhum usuário encontrado na busca.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 pb-10">
                      {filteredUsers.map(user => (
                        <div key={user.id} className="flex flex-col gap-4 p-5 md:p-6 bg-black/40 border border-white/5 rounded-2xl relative overflow-hidden group hover:border-white/10 transition-colors">
                          
                          {/* Status Indicator Bar */}
                          <div className={`absolute top-0 left-0 w-1.5 h-full ${user.isBlocked ? 'bg-red-600' : user.isPaid ? 'bg-[#00A3FF]' : (user.trialEndsAt && new Date() < user.trialEndsAt.toDate() ? 'bg-orange-500' : 'bg-red-500/30')}`} />
                          
                          <div className="flex justify-between items-start pl-2">
                            <div className="flex flex-col">
                              <span className="text-white font-bold text-lg leading-tight flex items-center gap-2">
                                {user.displayName || 'Sem Nome'}
                                {user.isBlocked && <Ban size={14} className="text-red-500" />}
                              </span>
                              <span className="text-white/50 text-xs mt-1">{user.email}</span>
                            </div>
                            <div className="flex flex-col items-end gap-1">
                              {user.isBlocked ? (
                                <span className="text-red-500 text-[10px] uppercase font-black tracking-widest bg-red-500/10 px-2.5 py-1 rounded-full">Bloqueado</span>
                              ) : user.isPaid ? (
                                <span className="text-[#00A3FF] text-[10px] uppercase font-black tracking-widest bg-[#00A3FF]/10 px-2.5 py-1 rounded-full">Acesso Vitalício</span>
                              ) : (
                                <div className="flex flex-col items-end">
                                  <span className={`text-[10px] uppercase font-black tracking-widest px-2.5 py-1 rounded-full ${user.trialEndsAt && new Date() < user.trialEndsAt.toDate() ? 'bg-orange-500/10 text-orange-400' : 'bg-red-500/10 text-red-400'}`}>
                                    {user.trialEndsAt && new Date() < user.trialEndsAt.toDate() ? 'Teste Ativo' : 'Expirado'}
                                  </span>
                                  {user.trialEndsAt && (
                                    <span className="text-[10px] text-white/40 mt-1.5 whitespace-nowrap bg-black/40 px-2 py-1 rounded-md">
                                      Vence: {user.trialEndsAt.toDate().toLocaleDateString('pt-BR')} {user.trialEndsAt.toDate().toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex flex-col gap-3 mt-auto pt-4 border-t border-white/5 pl-2">
                            {/* Extend trial section (only if not paid and not blocked) */}
                            {!user.isPaid && !user.isBlocked && (
                              <div className="flex flex-col gap-2">
                                <span className="text-[10px] uppercase font-bold tracking-widest text-white/30 flex items-center gap-1.5">
                                  <CalendarPlus size={12} />
                                  Conceder / Estender Teste (Dias):
                                </span>
                                <div className="flex gap-2">
                                  {[3, 7, 15, 30].map(days => (
                                    <button
                                      key={days}
                                      onClick={() => extendUserTrial(user.id, days, user.trialEndsAt)}
                                      className="flex-1 py-2 rounded-lg text-xs font-bold transition-all bg-orange-500/5 border border-orange-500/20 text-orange-400 hover:bg-orange-500/15 hover:border-orange-500/40"
                                    >
                                      +{days}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}
                            
                            {/* Master Controls */}
                            <div className="flex justify-between items-center mt-2 gap-2">
                              <button 
                                onClick={() => toggleUserBlockStatus(user.id, user.isBlocked)}
                                className={`flex flex-1 justify-center items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold transition-all border ${user.isBlocked ? 'bg-white/10 border-white/20 text-white hover:bg-white/20' : 'bg-red-500/5 border-red-500/20 text-red-500 hover:bg-red-500/10 hover:border-red-500/40'}`}
                              >
                                {user.isBlocked ? 'Desbloquear Conta' : 'Bloquear Conta'}
                              </button>
                              <button 
                                onClick={() => toggleUserPaidStatus(user.id, user.isPaid)}
                                disabled={user.isBlocked}
                                className={`flex flex-1 justify-center items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold transition-all border disabled:opacity-30 disabled:cursor-not-allowed ${user.isPaid ? 'bg-black/50 border-white/10 text-white hover:bg-white/5' : 'bg-[#00A3FF]/10 border-[#00A3FF]/30 text-[#00A3FF] hover:bg-[#00A3FF]/20 hover:border-[#00A3FF]/50'}`}
                              >
                                {user.isPaid ? 'Revogar Vitalício' : 'Dar Vitalício'}
                              </button>
                            </div>
                          </div>
                          
                        </div>
                      ))}
                    </div>
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
