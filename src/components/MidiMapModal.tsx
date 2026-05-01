import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useMidiStore } from '../store/useMidiStore';
import { usePlayerStore } from '../store/usePlayerStore';
import { X, Settings, CircleDot, Trash2, ListMusic, AudioLines, Music } from 'lucide-react';
import { cn } from '../lib/utils';

export const MidiMapModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const { inputs, selectedInputId, mappings, isLearning, learningAction, learningLog, setSelectedInputId, setLearningAction, clearLearning, removeMapping } = useMidiStore();
  const { currentSong } = usePlayerStore();

  const handleLearn = (action: string, payload?: string) => {
    if (isLearning && learningAction?.action === action && learningAction?.payload === payload) {
      clearLearning();
    } else {
      setLearningAction({ action, payload });
    }
  };

  const isMapped = (action: string, payload?: string) => {
    return mappings.find(m => m.action === action && m.actionPayload === payload);
  };

  const getMappingText = (action: string, payload?: string) => {
    const m = isMapped(action, payload);
    if (!m) return "Não Mapeado";
    const typeStr = m.messageType >= 176 && m.messageType <= 191 ? 'CC' : 'Note';
    return `${typeStr} ${m.data1}`;
  };

  const renderMapButton = (action: string, payload?: string, label?: string) => {
    const isLearningThis = isLearning && learningAction?.action === action && learningAction?.payload === payload;
    const mapping = isMapped(action, payload);

    return (
      <div className="flex flex-col gap-1.5 p-3 rounded-xl bg-black/40 border border-white/5 w-full">
        <span className="text-[10px] uppercase font-black text-white/50 tracking-wider truncate" title={label}>{label}</span>
        <div className="flex items-center gap-1">
          {mapping && (
            <button
               onClick={() => removeMapping(mapping.id)}
               className="p-1.5 text-white/30 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors shrink-0"
               title="Remover Mapeamento"
            >
              <Trash2 size={12} />
            </button>
          )}
          <button
            onClick={() => handleLearn(action, payload)}
            className={cn(
              "flex-1 py-1.5 px-2 rounded-lg text-[10px] font-black tracking-widest transition-all flex items-center justify-center gap-1.5 truncate",
              isLearningThis ? "bg-[#00A3FF] text-white animate-pulse shadow-[0_0_15px_rgba(0,163,255,0.5)]" :
              mapping ? "bg-white/10 text-[#00A3FF] border border-[#00A3FF]/30" : "bg-white/5 text-white/40 border border-white/5 hover:border-white/20 hover:text-white"
            )}
            title={mapping ? getMappingText(action, payload) : 'Clique para mapear'}
          >
            {isLearningThis ? <CircleDot size={10} className="animate-ping" /> : null}
            {isLearningThis ? "Aguardando..." : getMappingText(action, payload)}
          </button>
        </div>
      </div>
    );
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
            className="bg-[#0a0a0a] border border-white/10 rounded-2xl md:rounded-3xl w-full max-w-2xl max-h-[90dvh] md:max-h-[85vh] overflow-hidden relative shadow-2xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-6 border-b border-white/5 shrink-0">
              <h2 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
                <Settings className="text-[#00A3FF]" size={20} />
                Mapeamento MIDI
              </h2>
              <button 
                onClick={onClose} 
                className="p-2 text-white/50 hover:text-white bg-black/50 hover:bg-white/10 rounded-full transition-all"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto custom-scrollbar flex flex-col gap-8">
              
              <div className="flex flex-col gap-3">
                 <label className="text-[10px] uppercase font-black text-white/40 tracking-widest pl-1 border-l-2 border-[#00A3FF]">Dispositivo de Entrada</label>
                 <select 
                    value={selectedInputId || ''}
                    onChange={(e) => setSelectedInputId(e.target.value || null)}
                    className="w-full bg-black/50 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-[#00A3FF] transition-colors appearance-none"
                 >
                    <option value="">Todos os Dispositivos</option>
                    {inputs.map(input => (
                       <option key={input.id} value={input.id}>{input.name || 'Dispositivo Desconhecido'} {input.manufacturer ? `(${input.manufacturer})` : ''}</option>
                    ))}
                 </select>
                 {inputs.length === 0 && (
                    <p className="text-xs text-[#FFB800] mt-1 flex items-center gap-1.5"><CircleDot size={12}/> Nenhum dispositivo MIDI detectado. Verifique a conexão USB.</p>
                 )}
              </div>

              <div className="flex flex-col gap-4">
                 <h3 className="text-[10px] uppercase font-black text-[#00A3FF] tracking-widest pl-1 border-l-2 border-[#00A3FF] flex items-center gap-2">
                    <ListMusic size={12} /> Controles Globais
                 </h3>
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {renderMapButton('play_pause', undefined, 'Play / Pause')}
                    {renderMapButton('stop', undefined, 'Stop')}
                    {renderMapButton('next', undefined, 'Próxima Música')}
                    {renderMapButton('prev', undefined, 'Música Anterior')}
                    {renderMapButton('tap_tempo', undefined, 'Tap Tempo')}
                    {renderMapButton('click', undefined, 'Metrônomo (Click)')}
                    {renderMapButton('loop', undefined, 'Loop (Região)')}
                    {renderMapButton('infinite_loop', undefined, 'Loop Infinito')}
                    {renderMapButton('fade_out', undefined, 'Fade Out')}
                    {renderMapButton('master_volume', undefined, 'Volume Master (Fader/Knob)')}
                    {renderMapButton('master_eq_low', undefined, 'Master EQ Low (Knob)')}
                    {renderMapButton('master_eq_mid', undefined, 'Master EQ Mid (Knob)')}
                    {renderMapButton('master_eq_high', undefined, 'Master EQ High (Knob)')}
                 </div>
              </div>

              {currentSong && currentSong.stems.length > 0 && (
                 <div className="flex flex-col gap-4">
                    <h3 className="text-[10px] uppercase font-black text-[#00A3FF] tracking-widest pl-1 border-l-2 border-[#00A3FF] flex items-center gap-2">
                       <AudioLines size={12} /> Stems (Música Atual) 
                    </h3>
                    <p className="text-[10px] text-white/30 uppercase tracking-wider mb-2">Nota: O mapeamento das stems é feito pelo NOME da track. Então aplicará para outras músicas que tiverem tracks com o mesmo nome.</p>
                    
                    <div className="grid grid-cols-1 gap-2">
                       {currentSong.stems.map((stem, i) => (
                          <div key={stem.id || i} className="p-3 rounded-xl bg-white/5 border border-white/5 flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
                             <div className="flex items-center gap-3 w-1/3 shrink-0">
                                <span className="text-sm font-black text-white px-3 py-1 rounded bg-black/60 truncate" title={stem.name}>{stem.name}</span>
                             </div>
                             <div className="flex-1 grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-2">
                                {renderMapButton('stem_volume', stem.name, 'Vol')}
                                {renderMapButton('stem_mute', stem.name, 'Mute')}
                                {renderMapButton('stem_solo', stem.name, 'Solo')}
                                {renderMapButton('stem_eq_low', stem.name, 'EQ Low')}
                                {renderMapButton('stem_eq_mid', stem.name, 'EQ Mid')}
                                {renderMapButton('stem_eq_high', stem.name, 'EQ High')}
                             </div>
                          </div>
                       ))}
                    </div>
                 </div>
              )}

            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
