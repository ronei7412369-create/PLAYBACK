import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { usePlayerStore } from '../store/usePlayerStore';
import { X, Save, FolderOpen, Trash2, ListMusic } from 'lucide-react';

export const SetlistModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const { savedSetlists, saveCurrentSetlist, loadSavedSetlist, deleteSavedSetlist, setlist } = usePlayerStore();
  const [activeTab, setActiveTab] = useState<'load' | 'save'>('load');
  const [newSetName, setNewSetName] = useState('');

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSetName.trim()) return;
    await saveCurrentSetlist(newSetName);
    setNewSetName('');
    setActiveTab('load');
  };

  const handleLoad = async (id: string) => {
    await loadSavedSetlist(id);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={onClose}
          />
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-[#0a0a0a] border border-white/10 rounded-3xl w-full max-w-md overflow-hidden relative shadow-2xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-6 border-b border-white/5">
              <h2 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
                <ListMusic className="text-[#00A3FF]" size={20} />
                Setlists
              </h2>
              <button 
                onClick={onClose} 
                className="p-2 text-white/50 hover:text-white bg-black/50 hover:bg-white/10 rounded-full transition-all"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="flex border-b border-white/5">
              <button 
                onClick={() => setActiveTab('load')}
                className={`flex-1 py-4 text-sm font-bold flex items-center justify-center gap-2 transition-colors ${activeTab === 'load' ? 'text-[#00A3FF] border-b-2 border-[#00A3FF]' : 'text-white/50 hover:bg-white/5 hover:text-white'}`}
              >
                <FolderOpen size={18} />
                Carregar
              </button>
              <button 
                onClick={() => setActiveTab('save')}
                className={`flex-1 py-4 text-sm font-bold flex items-center justify-center gap-2 transition-colors ${activeTab === 'save' ? 'text-[#00A3FF] border-b-2 border-[#00A3FF]' : 'text-white/50 hover:bg-white/5 hover:text-white'}`}
              >
                <Save size={18} />
                Salvar Atual
              </button>
            </div>
            
            <div className="p-6 h-[400px] overflow-y-auto">
              {activeTab === 'load' ? (
                savedSetlists.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-white/20 gap-4">
                    <FolderOpen size={48} />
                    <p className="text-sm font-medium">Nenhum setlist salvo.</p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    {savedSetlists.map(set => (
                      <div key={set.id} className="p-4 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 transition-all flex items-center justify-between group">
                        <div className="flex-1 cursor-pointer" onClick={() => handleLoad(set.id)}>
                          <span className="text-white font-bold block">{set.name}</span>
                          <span className="text-xs text-white/40 block mt-1">{set.songIds.length} músicas</span>
                        </div>
                        <button 
                          onClick={() => deleteSavedSetlist(set.id)}
                          className="p-2.5 rounded-lg text-white/20 hover:text-red-500 hover:bg-red-500/10 transition-all"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    ))}
                  </div>
                )
              ) : (
                <form onSubmit={handleSave} className="flex flex-col gap-4">
                  <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                    <span className="text-[10px] text-white/40 uppercase font-black tracking-widest block mb-2">Setlist Atual</span>
                    <span className="text-white font-medium text-sm">{setlist.length} músicas carregadas</span>
                  </div>
                  
                  <div className="flex flex-col gap-1.5 mt-2">
                    <label className="text-[10px] uppercase font-black tracking-widest text-white/40 ml-1">Nome do Setlist</label>
                    <input 
                      type="text"
                      value={newSetName}
                      onChange={e => setNewSetName(e.target.value)}
                      className="w-full bg-black/50 border border-white/10 rounded-xl py-4 px-4 text-white focus:outline-none focus:border-[#00A3FF] transition-colors"
                      placeholder="Ex: Culto de Domingo"
                      required
                    />
                  </div>
                  
                  <button
                    type="submit"
                    disabled={setlist.length === 0 || !newSetName.trim()}
                    className="w-full mt-4 py-4 rounded-xl font-black text-sm transition-all bg-[#00A3FF] text-white hover:bg-[#0088CC] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Salvar Setlist
                  </button>
                </form>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
