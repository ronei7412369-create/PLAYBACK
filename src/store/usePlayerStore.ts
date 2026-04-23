import { create } from 'zustand';
import { PlayerState, Song } from '../types';
import { audioEngine } from '../services/audioEngine';
import { storageEngine } from '../services/storageEngine';

export const usePlayerStore = create<PlayerState>((set, get) => ({
  isAuthenticated: false,
  isStageMode: false,
  isLoadingSong: false,
  isSidebarOpen: false,
  activePadKey: null,
  padVolume: 0.5,
  currentSong: null,
  isPlaying: false,
  currentTime: 0,
  masterVolume: 0.8,
  isLooping: false,
  isInfiniteLoop: false,
  isFadeOut: false,
  setlist: [],
  playbackRate: 1.0,
  metronomeEnabled: false,
  isLRSplit: false,

  initPersistence: async () => {
    try {
      const savedSongs = await storageEngine.loadSongs();
      if (savedSongs && savedSongs.length > 0) {
        set({ setlist: savedSongs });
        // Optional: auto-load the first song if needed, 
        // but wait for user to click it so we don't block main thread too much
      }
    } catch (e) {
      console.error("Failed to init storage", e);
    }
  },

  importSong: async (song, buffers) => {
    audioEngine.pause();
    
    // Save to persistence
    if (buffers) {
      try {
        await storageEngine.saveSong(song, buffers);
      } catch (e) {
        console.error("Failed to save song to DB", e);
      }
    }

    set((state) => ({ 
      setlist: [...state.setlist, song],
      currentSong: song,
      currentTime: 0,
      isPlaying: false,
      playbackRate: 1.0
    }));

    audioEngine.setPlaybackRate(1.0);
  },

  setCurrentSong: async (song) => {
    audioEngine.pause();
    const currentSongInState = get().currentSong;

    // Do nothing if we are clicking on already playing song
    if (currentSongInState?.id === song.id) return;
    
    set({ isLoadingSong: true });
    
    try {
       // Only unload/load if it's actually an entirely different audio context than what is currently loaded.
       // Because importSong pushes immediately to memory and clears stems, we don't swap if it's already there?
       // Let's clear and re-load to be robust. We can optimize later by comparing IDs.
       audioEngine.clearStems();
       
       const loadPromises = song.stems.map(async (stem) => {
         if (stem.originalFile) {
            await audioEngine.loadStem(stem.id, stem.originalFile);
            audioEngine.setStemVolume(stem.id, stem.volume);
            audioEngine.setStemPan(stem.id, stem.output === 1 ? -1 : stem.output === 2 ? 1 : 0);
         } else {
            // Re-load from persistence
            const buffer = await storageEngine.loadStemBuffer(stem.id);
            if (buffer) {
               await audioEngine.loadStemFromArrayBuffer(stem.id, buffer);
               audioEngine.setStemVolume(stem.id, stem.volume);
               audioEngine.setStemPan(stem.id, stem.output === 1 ? -1 : stem.output === 2 ? 1 : 0);
            }
         }
       });

       await Promise.all(loadPromises);
       
       // Force eq re-application
       if (song.stems) {
         for (const stem of song.stems) {
           if (stem.eq) {
             audioEngine.setStemEQ(stem.id, 'low', stem.eq.low);
             audioEngine.setStemEQ(stem.id, 'mid', stem.eq.mid);
             audioEngine.setStemEQ(stem.id, 'high', stem.eq.high);
           }
         }
       }
    } catch (e) {
       console.error("Failed to load song stems on switch", e);
    }

    set({ currentSong: song, currentTime: 0, isPlaying: false, playbackRate: 1.0, isLoadingSong: false });
    audioEngine.setPlaybackRate(1.0);
  },

  updatePeaks: (peaks: number[]) => {
    set((state) => ({
      currentSong: state.currentSong ? { ...state.currentSong, waveformPeaks: peaks } : null
    }));
  },

  togglePlay: () => {
    const { isPlaying, currentTime, currentSong, metronomeEnabled } = get();
    if (isPlaying) {
      audioEngine.pause();
    } else {
      audioEngine.play(currentTime);
      audioEngine.toggleMetronome(metronomeEnabled, currentSong?.bpm || 120);
    }
    set({ isPlaying: !isPlaying });
  },

  stop: () => {
    audioEngine.pause();
    set({ isPlaying: false, currentTime: 0 });
  },

  seek: (time) => {
    const { isPlaying } = get();
    audioEngine.seek(time);
    // Force a UI update of the time right away
    set({ currentTime: time });
  },

  setMasterVolume: (volume) => {
    audioEngine.setMasterVolume(volume);
    set({ masterVolume: volume });
  },

  setPlaybackRate: (rate) => {
    audioEngine.setPlaybackRate(rate);
    set({ playbackRate: rate });
  },

  toggleMetronome: () => {
    const { metronomeEnabled, currentSong } = get();
    const newState = !metronomeEnabled;
    audioEngine.toggleMetronome(newState, currentSong?.bpm || 120);
    set({ metronomeEnabled: newState });
  },

  toggleLRSplit: () => {
    const { isLRSplit, currentSong } = get();
    const newState = !isLRSplit;
    set({ isLRSplit: newState });
    
    if (currentSong) {
      currentSong.stems.forEach(stem => {
        const pan = newState ? (stem.output === 1 ? -1 : stem.output === 2 ? 1 : 0) : 0;
        audioEngine.setStemPan(stem.id, pan);
      });
    }
  },

  toggleLoop: () => set((state) => ({ isLooping: !state.isLooping })),
  toggleInfiniteLoop: () => set((state) => ({ isInfiniteLoop: !state.isInfiniteLoop })),
  
  triggerFadeOut: () => {
    audioEngine.fadeOut(5);
    set({ isFadeOut: true });
    // Reset after fade
    setTimeout(() => {
      set({ isFadeOut: false, isPlaying: false, currentTime: 0 });
    }, 5500);
  },
  
  updateStemVolume: (stemId, volume) => {
    audioEngine.setStemVolume(stemId, volume);
    set((state) => ({
      currentSong: state.currentSong ? {
        ...state.currentSong,
        stems: state.currentSong.stems.map(s => s.id === stemId ? { ...s, volume } : s)
      } : null
    }));
  },
  
  toggleStemMute: (stemId) => {
    const { currentSong } = get();
    if (!currentSong) return;
    const stem = currentSong.stems.find(s => s.id === stemId);
    if (stem) {
      audioEngine.setStemVolume(stemId, !stem.isMuted ? 0 : stem.volume);
    }
    set((state) => ({
      currentSong: state.currentSong ? {
        ...state.currentSong,
        stems: state.currentSong.stems.map(s => s.id === stemId ? { ...s, isMuted: !s.isMuted } : s)
      } : null
    }));
  },
  
  toggleStemSolo: (stemId) => set((state) => {
    if (!state.currentSong) return state;
    const isCurrentlySoloed = state.currentSong.stems.find(s => s.id === stemId)?.isSoloed;
    const newState = {
      currentSong: {
        ...state.currentSong,
        stems: state.currentSong.stems.map(s => s.id === stemId ? { ...s, isSoloed: !isCurrentlySoloed } : s)
      }
    };
    
    const stems = newState.currentSong.stems;
    const hasAnySolo = stems.some(s => s.isSoloed);
    
    stems.forEach(s => {
      let finalVolume = 0;
      if (hasAnySolo) {
        finalVolume = s.isSoloed ? s.volume : 0;
      } else {
        finalVolume = s.isMuted ? 0 : s.volume;
      }
      audioEngine.setStemVolume(s.id, finalVolume);
    });

    return newState;
  }),
  
  login: () => set({ isAuthenticated: true }),
  logout: () => set({ isAuthenticated: false }),
  toggleStageMode: () => set((state) => ({ isStageMode: !state.isStageMode })),
  setShowSidebar: (show) => set({ isSidebarOpen: show }),

  setStemOutput: (stemId, output) => {
    const { isLRSplit } = get();
    const pan = isLRSplit ? (output === 1 ? -1 : output === 2 ? 1 : 0) : 0;
    audioEngine.setStemPan(stemId, pan);

    set((state) => ({
      currentSong: state.currentSong ? {
        ...state.currentSong,
        stems: state.currentSong.stems.map(s => s.id === stemId ? { ...s, output } : s)
      } : null
    }));
  },

  setStemEQ: (stemId, band, value) => {
    audioEngine.setStemEQ(stemId, band, value);
    set((state) => ({
      currentSong: state.currentSong ? {
        ...state.currentSong,
        stems: state.currentSong.stems.map(s => 
          s.id === stemId ? { ...s, eq: { ...s.eq, [band]: value } } : s
        )
      } : null
    }));
  },

  updateSongMetadata: (id, title, artist) => {
    set((state) => {
       const updatedSetlist = state.setlist.map(s => s.id === id ? { ...s, title, artist } : s);
       return {
         setlist: updatedSetlist,
         currentSong: state.currentSong?.id === id ? { ...state.currentSong, title, artist } : state.currentSong
       };
    });
  },

  updateSongLyrics: (id, lyrics) => {
    set((state) => {
       const updatedSetlist = state.setlist.map(s => s.id === id ? { ...s, lyrics } : s);
       return {
         setlist: updatedSetlist,
         currentSong: state.currentSong?.id === id ? { ...state.currentSong, lyrics } : state.currentSong
       };
    });
  },

  removeFromSetlist: (id) => {
    set((state) => ({
       setlist: state.setlist.filter(s => s.id !== id),
       currentSong: state.currentSong?.id === id ? null : state.currentSong
    }));
  },

  toggleAmbientPad: (key, frequency) => {
    const { activePadKey, padVolume } = get();
    if (activePadKey === key) {
       audioEngine.stopPad();
       set({ activePadKey: null });
    } else {
       audioEngine.playPad(frequency, padVolume);
       set({ activePadKey: key });
    }
  },

  setPadVolume: (volume) => {
    audioEngine.setPadVolume(volume);
    set({ padVolume: volume });
  }
}));


