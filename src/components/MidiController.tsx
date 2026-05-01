import React, { useEffect, useRef } from 'react';
import { useMidiStore } from '../store/useMidiStore';
import { usePlayerStore } from '../store/usePlayerStore';

export const MidiController: React.FC = () => {
  const { inputs, selectedInputId, mappings, isLearning, learningAction, setInputs, addMapping, setLearningLog, clearLearning } = useMidiStore();
  const playerStore = usePlayerStore();
  const midiAccessRef = useRef<any>(null);

  useEffect(() => {
    let access: any = null;

    const onMIDIMessage = (message: any) => {
      const [status, data1, data2] = message.data;
      const command = status & 0xf0; // Extract command (e.g., 144 Note On, 176 CC)
      
      // We ignore Note Off (128) for most actions, maybe we need to filter? 
      // If we are learning, and it's not a Note Off or CC value 0
      if (useMidiStore.getState().isLearning) {
        const action = useMidiStore.getState().learningAction;
        if (action) {
          if (command === 128 || (command === 176 && data2 === 0)) return; // Ignore release for learning
          
          addMapping({
            id: action.payload ? `${action.action}-${action.payload}` : action.action,
            action: action.action,
            actionPayload: action.payload,
            messageType: command,
            data1: data1
          });
          
          setTimeout(() => setLearningLog(null), 2000);
        }
        return;
      }

      // Check for mappings
      const stateMappings = useMidiStore.getState().mappings;
      const matchedMappings = stateMappings.filter(m => m.messageType === command && m.data1 === data1);
      
      matchedMappings.forEach(mapping => {
        executeMapping(mapping, data2);
      });
    };

    const executeMapping = (mapping: any, value: number) => {
      // value is data2 (velocity or CC value 0-127)
      const store = usePlayerStore.getState();
      
      switch (mapping.action) {
        case 'play_pause':
          if (value > 0) store.togglePlay();
          break;
        case 'stop':
          if (value > 0) store.stop();
          break;
        case 'next':
          if (value > 0) { // Add next logic if available in store, we might need a Next function or just clear
             const currentIdx = store.setlist.findIndex(s => s.id === store.currentSong?.id);
             if (currentIdx !== -1 && currentIdx < store.setlist.length - 1) {
                store.setCurrentSong(store.setlist[currentIdx + 1]);
             }
          }
          break;
        case 'prev':
          if (value > 0) {
             const currentIdx = store.setlist.findIndex(s => s.id === store.currentSong?.id);
             if (currentIdx > 0) {
                store.setCurrentSong(store.setlist[currentIdx - 1]);
             }
          }
          break;
        case 'tap_tempo':
          if (value > 0) store.tapTempo();
          break;
        case 'click':
          if (value > 0) store.toggleMetronome();
          break;
        case 'fade_out':
          if (value > 0) store.triggerFadeOut();
          break;
        case 'loop':
          if (value > 0) store.toggleLoop();
          break;
        case 'infinite_loop':
          if (value > 0) store.toggleInfiniteLoop();
          break;
        case 'master_volume':
          // CC value 0-127 mapped to 0-1
          store.setMasterVolume(value / 127);
          break;
        case 'master_eq_low':
          store.setMasterEQ('low', ((value / 127) * 48) - 24);
          break;
        case 'master_eq_mid':
          store.setMasterEQ('mid', ((value / 127) * 48) - 24);
          break;
        case 'master_eq_high':
          store.setMasterEQ('high', ((value / 127) * 48) - 24);
          break;
        case 'stem_volume':
          if (mapping.actionPayload) {
            const currentSong = store.currentSong;
            if (currentSong) {
              const stem = currentSong.stems.find(s => s.name === mapping.actionPayload);
              if (stem) store.updateStemVolume(stem.id, value / 127);
            }
          }
          break;
        case 'stem_mute':
          if (value > 0 && mapping.actionPayload) {
             const currentSong = store.currentSong;
             if (currentSong) {
               const stem = currentSong.stems.find(s => s.name === mapping.actionPayload);
               if (stem) store.toggleStemMute(stem.id);
             }
          }
          break;
        case 'stem_solo':
          if (value > 0 && mapping.actionPayload) {
             const currentSong = store.currentSong;
             if (currentSong) {
               const stem = currentSong.stems.find(s => s.name === mapping.actionPayload);
               if (stem) store.toggleStemSolo(stem.id);
             }
          }
          break;
        case 'stem_eq_low':
          if (mapping.actionPayload) {
             const currentSong = store.currentSong;
             if (currentSong) {
               const stem = currentSong.stems.find(s => s.name === mapping.actionPayload);
               if (stem) store.setStemEQ(stem.id, 'low', ((value / 127) * 48) - 24);
             }
          }
          break;
        case 'stem_eq_mid':
          if (mapping.actionPayload) {
             const currentSong = store.currentSong;
             if (currentSong) {
               const stem = currentSong.stems.find(s => s.name === mapping.actionPayload);
               if (stem) store.setStemEQ(stem.id, 'mid', ((value / 127) * 48) - 24);
             }
          }
          break;
        case 'stem_eq_high':
          if (mapping.actionPayload) {
             const currentSong = store.currentSong;
             if (currentSong) {
               const stem = currentSong.stems.find(s => s.name === mapping.actionPayload);
               if (stem) store.setStemEQ(stem.id, 'high', ((value / 127) * 48) - 24);
             }
          }
          break;
        case 'ambient_pad':
           // Pad trigger
           if (mapping.actionPayload) {
             // For pads we might want volume or toggle. If note on, maybe trigger if value > 0?
             // But we don't have direct access to pad freqs easily here without hardcoding.
             // We can map 'ambient_pad' with actionPayload = note like C, C#, etc.
             // We'd need a helper to get freq or just let the store find it.
             // It's mostly toggleAmbientPad(note, freq). We don't have freq...
             // So maybe we add a triggerPadByNote if we want.
           }
           break;
      }
    };

    const updateInputs = (midiAccess: any) => {
      const inputsList: any[] = [];
      midiAccess.inputs.forEach((input: any) => {
        inputsList.push({ id: input.id, name: input.name, manufacturer: input.manufacturer });
        
        // Remove old listener just in case
        input.onmidimessage = null;
        
        // Add if selected or if no selection just listen to all?
        // Let's listen to the selected one, or all if none selected
        if (!useMidiStore.getState().selectedInputId || useMidiStore.getState().selectedInputId === input.id) {
            input.onmidimessage = onMIDIMessage;
        }
      });
      setInputs(inputsList);
    };

    if (navigator.requestMIDIAccess) {
      navigator.requestMIDIAccess({ sysex: false }).then(
        (midiAccess) => {
          midiAccessRef.current = midiAccess;
          updateInputs(midiAccess);
          
          midiAccess.onstatechange = () => {
            updateInputs(midiAccess);
          };
        },
        () => console.warn("MIDI access denied.")
      );
    }

    return () => {
      if (midiAccessRef.current) {
        midiAccessRef.current.onstatechange = null;
        midiAccessRef.current.inputs.forEach((input: any) => {
          input.onmidimessage = null;
        });
      }
    };
  }, [selectedInputId, setInputs, addMapping, setLearningLog]); // Re-bind when selected input changes

  return null; // Invisible component
};
