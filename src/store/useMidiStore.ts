import React from 'react';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface MidiMapping {
  id: string; // unique ID representing the map, can be "action-payload"
  action: string;
  actionPayload?: string; // e.g. stemId
  messageType: number; // e.g. 144 (Note On ch1), 176 (CC ch1) -> we might just ignore channel and use command (messageType & 0xF0)
  data1: number; // note or CC number
}

interface MidiState {
  inputs: any[];
  selectedInputId: string | null;
  mappings: MidiMapping[];
  isLearning: boolean;
  learningAction: { action: string; payload?: string } | null;
  learningLog: string | null;
  contextMenu: { action: string; payload?: string; label: string; x: number; y: number } | null;
  
  setInputs: (inputs: any[]) => void;
  setSelectedInputId: (id: string | null) => void;
  addMapping: (mapping: MidiMapping) => void;
  removeMapping: (id: string) => void;
  setLearningAction: (action: { action: string; payload?: string } | null) => void;
  setLearningLog: (log: string | null) => void;
  clearLearning: () => void;
  setContextMenu: (menu: { action: string; payload?: string; label: string; x: number; y: number } | null) => void;
}

export const useMidiStore = create<MidiState>()(
  persist(
    (set) => ({
      inputs: [],
      selectedInputId: null,
      mappings: [],
      isLearning: false,
      learningAction: null,
      learningLog: null,
      contextMenu: null,
      
      setInputs: (inputs) => set({ inputs }),
      setSelectedInputId: (id) => set({ selectedInputId: id }),
      addMapping: (mapping) => set((state) => {
        // Remove any existing mapping for the same action+payload
        const newMappings = state.mappings.filter(m => m.id !== mapping.id);
        return { 
          mappings: [...newMappings, mapping],
          isLearning: false,
          learningAction: null,
          learningLog: "Map success!"
        };
      }),
      removeMapping: (id) => set((state) => ({ mappings: state.mappings.filter(m => m.id !== id) })),
      setLearningAction: (action) => set({ learningAction: action, isLearning: !!action, learningLog: "Waiting for MIDI..." }),
      setLearningLog: (log) => set({ learningLog: log }),
      clearLearning: () => set({ isLearning: false, learningAction: null, learningLog: null }),
      setContextMenu: (contextMenu) => set({ contextMenu })
    }),
    {
      name: 'midi-storage',
      partialize: (state) => ({ mappings: state.mappings, selectedInputId: state.selectedInputId })
    }
  )
);

export const handleMidiRightClick = (e: React.MouseEvent, action: string, label: string, payload?: string) => {
  e.preventDefault();
  e.stopPropagation();
  useMidiStore.getState().setContextMenu({
    action,
    payload,
    label,
    x: e.clientX,
    y: e.clientY
  });
};

