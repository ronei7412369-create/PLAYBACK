import { create } from 'zustand';
import { PlayerState, Song, Stem } from '../types';
import { audioEngine } from '../services/audioEngine';
import { storageEngine } from '../services/storageEngine';
import { getCoverUrl } from '../lib/coverArt';
import { detectKeyAndBpm } from '../lib/songHelpers';
import { generateClickPCM, createWavFileFromPCM } from '../utils/beatDetector';

import { auth, signInWithGoogle, signOut, signInWithEmail, signUpWithEmail, createInternalUserWithEmail, db } from '../services/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';

let lastTaps: number[] = [];

export const usePlayerStore = create<PlayerState & { hasAccess: boolean }>((set, get) => {
  // Listen to Firebase auth state
  onAuthStateChanged(auth, (user) => {
    const adminEmails = ["rudson.p48@icloud.com", "rudson.p48@gmail.com", "rudson.p48@iclou.com", "ronei7412369@gmail.com"];
    const isAdmin = user ? adminEmails.includes(user.email || "") : false;

    if (!user) {
      audioEngine.pause();
      audioEngine.clearStems();
      set({ 
        isAuthenticated: false, 
        user: null, 
        isAdmin: false, 
        hasAccess: false,
        setlist: [],
        savedSetlists: [],
        currentSong: null,
        isPlaying: false,
        currentTime: 0,
        preloadingSongId: null,
        preloadedSongIds: [],
        downloadedSongIds: [],
        customPads: {},
        activePadKey: null
      });
      return;
    }

    const doSync = async () => {
      try {
        await storageEngine.init(user.uid);
        await storageEngine.syncFromCloud();
        const [savedSongs, savedSetlists] = await Promise.all([
          storageEngine.loadSongs(),
          storageEngine.loadSetlists().catch(() => [])
        ]);
        set({
          setlist: (savedSongs || []).map(song => ({
            ...song,
            coverUrl: song.coverUrl || getCoverUrl(song.title, song.artist)
          })).sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
          savedSetlists: savedSetlists || []
        });
        get().refreshDownloadedSongs().catch(console.error);
        if (get() && typeof get().loadCustomPads === 'function') {
          get().loadCustomPads();
        }
      } catch (e) {
        console.error("Sync error during auth state change:", e);
      }
    };

    if (isAdmin) {
      set({ isAuthenticated: true, user, isAdmin, hasAccess: true });
      doSync();
      return;
    }

    // Use onSnapshot to immediately catch document creation and subsequent admin changes
    onSnapshot(doc(db, 'users', user.uid), async (userDoc) => {
      let hasAccess = false;
      if (userDoc.exists()) {
        const data = userDoc.data();
        if (data.isBlocked) {
          hasAccess = false;
        } else if (data.isPaid) {
          hasAccess = true;
        } else if (data.trialEndsAt) {
          try {
            const trialEnd = data.trialEndsAt.toDate();
            if (new Date() < trialEnd) {
              hasAccess = true;
            }
          } catch (e) {
            console.error("Error parsing date", e);
            if (data.trialEndsAt instanceof Date && new Date() < data.trialEndsAt) {
              hasAccess = true;
            }
          }
        }
      }
      set({ isAuthenticated: true, user, isAdmin, hasAccess });
      doSync();
    }, (error) => {
      console.error("Error listening to user access data", error);
      // In case of permission errors while doc is created, we don't grant default access.
    });
  });

  return {
  isAuthenticated: false,
  hasAccess: false,
  isAdmin: false,
  user: null,
  isStageMode: false,
  themeMode: (typeof window !== 'undefined' && (localStorage.getItem('app_theme_mode') as 'default' | 'high-contrast')) || 'default',
  isLoadingSong: false,
  isSavingSetlist: false,
  isSidebarOpen: false,
  preloadingSongId: null,
  preloadedSongIds: [],
  downloadedSongIds: [],
  activePadKey: null,
  padVolume: 0.5,
  padEq: { low: 0, mid: 0, high: 0 },
  customPads: {},
  currentSong: null,
  globalBpm: 120,
  isPlaying: false,
  currentTime: 0,
  masterVolume: 0.5,
  masterVolumeL: 0.5,
  masterVolumeR: 0.5,
  isMasterLinked: true,
  masterEq: { low: 0, mid: 0, high: 0 },
  isLooping: false,
  isInfiniteLoop: false,
  isFadeOut: false,
  setlist: [],
  savedSetlists: [],
  playbackRate: 1.0,
  metronomeEnabled: false,
  isLRSplit: false,
  pitchShift: 0,

  initPersistence: async () => {
    try {
      const activeUserId = auth.currentUser?.uid;
      await storageEngine.init(activeUserId);
      const [savedSongs, savedSetlists] = await Promise.all([
        storageEngine.loadSongs(),
        storageEngine.loadSetlists().catch(() => [])
      ]);
      
      const newState: any = {};
      if (savedSongs && savedSongs.length > 0) {
        newState.setlist = savedSongs.map(song => ({
          ...song,
          coverUrl: song.coverUrl || getCoverUrl(song.title, song.artist)
        })).sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
      }
      if (savedSetlists && savedSetlists.length > 0) {
        newState.savedSetlists = savedSetlists;
      }
      
      if (Object.keys(newState).length > 0) {
        set(newState);
      }
      
      get().loadCustomPads();
    } catch (e) {
      console.error("Failed to init storage", e);
    }
  },

  importSong: async (song, buffers) => {
    audioEngine.pause();
    
    const songWithOrder = {
      ...song,
      order: get().setlist.length
    };

    // Save to persistence
    if (buffers) {
      try {
        await storageEngine.saveSong(songWithOrder, buffers);
      } catch (e) {
        console.error("Failed to save song to DB", e);
      }
    }

    set((state) => ({ 
      setlist: [...state.setlist, songWithOrder],
      currentSong: songWithOrder,
      currentTime: 0,
      isPlaying: false,
      playbackRate: 1.0
    }));

    audioEngine.setPlaybackRate(1.0);
    get().refreshDownloadedSongs().catch(console.error);
  },

  addProcessedSong: async (partialSong) => {
    const stemNames = partialSong.stems ? partialSong.stems.map(s => s.name) : [];
    const { key: detectedKey, bpm: detectedBpm } = detectKeyAndBpm(partialSong.title || "", stemNames);

    const fullSong: Song = {
      ...partialSong,
      duration: 0, // We could try to read duration but 0 is fine until decoded
      bpm: partialSong.bpm || detectedBpm,
      key: detectedKey,
      timeSignature: partialSong.timeSignature || '4/4',
      markers: [],
      order: get().setlist.length
    };

    const buffers: { id: string; buffer: ArrayBuffer }[] = [];
    if (fullSong.stems) {
      for (const stem of fullSong.stems) {
         if (stem.originalFile) {
            const buf = await stem.originalFile.arrayBuffer();
            buffers.push({ id: stem.id, buffer: buf });
         }
      }
    }

    try {
      await storageEngine.saveSong(fullSong, buffers);
    } catch (e) {
      console.error("Failed to save processed song to DB", e);
    }

    set((state) => ({ 
      setlist: [...state.setlist, fullSong],
    }));

    get().refreshDownloadedSongs().catch(console.error);
    await get().setCurrentSong(fullSong);
  },

  setCurrentSong: async (song) => {
    audioEngine.pause();
    const currentSongInState = get().currentSong;

    if (currentSongInState?.id === song.id) return;
    
    set({ isLoadingSong: true });
    
    try {
       // Only unload/load if it's actually an entirely different audio context than what is currently loaded.
       // Because importSong pushes immediately to memory and clears stems, we don't swap if it's already there?
       // Let's clear and re-load to be robust. We can optimize later by comparing IDs.
       audioEngine.clearStems();
       
       const stemsToLoadFromDb: typeof song.stems = [];
       for (const stem of song.stems) {
         const duration = await audioEngine.loadStemFromCache(stem.id);
         if (duration !== null) {
            audioEngine.setStemVolume(stem.id, stem.volume);
            audioEngine.setStemPan(stem.id, stem.output === 1 ? -1 : stem.output === 2 ? 1 : 0);
         } else if (stem.originalFile) {
            await audioEngine.loadStem(stem.id, stem.originalFile);
            audioEngine.setStemVolume(stem.id, stem.volume);
            audioEngine.setStemPan(stem.id, stem.output === 1 ? -1 : stem.output === 2 ? 1 : 0);
         } else {
            stemsToLoadFromDb.push(stem);
         }
       }

       if (stemsToLoadFromDb.length > 0) {
         const stemIds = stemsToLoadFromDb.map(s => s.id);
         const buffersMap = await storageEngine.loadStemBuffers(stemIds);
         
         const decodePromises = stemsToLoadFromDb.map(async (stem) => {
           const buffer = buffersMap.get(stem.id);
           if (buffer) {
             await audioEngine.loadStemFromArrayBuffer(stem.id, buffer);
             audioEngine.setStemVolume(stem.id, stem.volume);
             audioEngine.setStemPan(stem.id, stem.output === 1 ? -1 : stem.output === 2 ? 1 : 0);
           }
         });
         await Promise.all(decodePromises);
       }
       
       const maxDuration = audioEngine.getDuration();
       if ((song.duration === 0 || !song.duration) && maxDuration > 0) {
          song.duration = maxDuration;
       }
       
       if (!song.waveformPeaks || song.waveformPeaks.length === 0) {
          const extractedPeaks = audioEngine.extractPeaks(120);
          if (extractedPeaks && extractedPeaks.length > 0) {
             song.waveformPeaks = extractedPeaks;
          }
       }

       const { setlist } = get();
       set({ setlist: setlist.map(s => s.id === song.id ? { ...s, duration: song.duration, waveformPeaks: song.waveformPeaks } : s) });
       storageEngine.saveSong({ ...song }, []).catch(() => {});
       
       // Force eq and compressor re-application with defaults/fallbacks to prevent leakage
       const hasAnySolo = song.stems?.some(s => s.isSoloed) ?? false;
       if (song.stems) {
         for (const stem of song.stems) {
           // Calculate proper volume based on solo and mute states
           let activeVolume = stem.volume;
           if (hasAnySolo) {
             activeVolume = stem.isSoloed ? stem.volume : 0;
           } else if (stem.isMuted) {
             activeVolume = 0;
           }
           audioEngine.setStemVolume(stem.id, activeVolume);
           
           // Apply panning based on output and isLRSplit
           const pan = get().isLRSplit ? (stem.output === 1 ? -1 : stem.output === 2 ? 1 : 0) : 0;
           audioEngine.setStemPan(stem.id, pan);

           // EQ configuration (using defaults if missing)
           const low = stem.eq?.low ?? 0;
           const mid = stem.eq?.mid ?? 0;
           const high = stem.eq?.high ?? 0;
           audioEngine.setStemEQ(stem.id, 'low', low);
           audioEngine.setStemEQ(stem.id, 'mid', mid);
           audioEngine.setStemEQ(stem.id, 'high', high);

           // Compressor configuration (using bypassed default if missing)
           const comp = stem.compressor ?? {
             enabled: false,
             threshold: -24,
             ratio: 4,
             attack: 0.003,
             release: 0.25,
             makeupGain: 0
           };
           audioEngine.setStemCompressor(
             stem.id,
             comp.enabled,
             comp.threshold,
             comp.ratio,
             comp.attack,
             comp.release,
             comp.makeupGain
           );
         }
       }
    } catch (e) {
       console.error("Failed to load song stems on switch", e);
    }
    
    // Cleanup cache: keep active song, preloaded/preloading, next 2 songs, and previous 1 song in setlist
    const { preloadingSongId, preloadedSongIds } = get();
    const keepStemIds = new Set<string>();
    
    song.stems.forEach(s => keepStemIds.add(s.id));
    if (preloadingSongId) {
       const preloadingSong = get().setlist.find(s => s.id === preloadingSongId);
       if (preloadingSong) preloadingSong.stems.forEach(s => keepStemIds.add(s.id));
    }
    preloadedSongIds.forEach(id => {
       const sSong = get().setlist.find(s => s.id === id);
       if (sSong) sSong.stems.forEach(s => keepStemIds.add(s.id));
    });

    const currentIndexInSetlist = get().setlist.findIndex(s => s.id === song.id);
    if (currentIndexInSetlist !== -1) {
       if (currentIndexInSetlist > 0) {
          get().setlist[currentIndexInSetlist - 1].stems.forEach(s => keepStemIds.add(s.id));
       }
       for (let i = 1; i <= 2; i++) {
          if (currentIndexInSetlist + i < get().setlist.length) {
             get().setlist[currentIndexInSetlist + i].stems.forEach(s => keepStemIds.add(s.id));
          }
       }
    }
    audioEngine.clearDecodeCache(Array.from(keepStemIds));

    // Load song-specific mastering and global settings
    const targetMasterVolume = song.masterVolume !== undefined ? song.masterVolume : 0.5;
    const targetMasterEq = song.masterEq || { low: 0, mid: 0, high: 0 };
    const targetPlaybackRate = song.playbackRate !== undefined ? song.playbackRate : 1.0;
    const targetPitchShift = song.pitchShift !== undefined ? song.pitchShift : 0;

    audioEngine.setMasterVolume(targetMasterVolume);
    audioEngine.setMasterEQ('low', targetMasterEq.low);
    audioEngine.setMasterEQ('mid', targetMasterEq.mid);
    audioEngine.setMasterEQ('high', targetMasterEq.high);
    audioEngine.setPlaybackRate(targetPlaybackRate);
    audioEngine.setPitchShift(targetPitchShift);
    audioEngine.updateMetronomeParams(song.bpm || 120, song.timeSignature || "4/4");

    set({ 
      currentSong: song, 
      currentTime: 0, 
      isPlaying: false, 
      globalBpm: song.bpm || 120,
      playbackRate: targetPlaybackRate, 
      isLoadingSong: false, 
      pitchShift: targetPitchShift,
      masterVolume: targetMasterVolume,
      masterEq: targetMasterEq
    });

    get().refreshDownloadedSongs().catch(console.error);
    get().triggerBackgroundPreload();
  },

  preloadSong: async (songId) => {
    const { setlist, preloadingSongId, preloadedSongIds } = get();
    if (preloadingSongId === songId || preloadedSongIds.includes(songId)) return;
    
    const song = setlist.find(s => s.id === songId);
    if (!song) return;

    set({ preloadingSongId: songId });
    
    try {
       const stemsToLoad: typeof song.stems = [];
       for (const stem of song.stems) {
         if (stem.originalFile) {
            await audioEngine.preloadStem(stem.id, stem.originalFile);
         } else {
            stemsToLoad.push(stem);
         }
       }

       if (stemsToLoad.length > 0) {
         const stemIds = stemsToLoad.map(s => s.id);
         const buffersMap = await storageEngine.loadStemBuffers(stemIds);
         
         const preloadPromises = stemsToLoad.map(async (stem) => {
            const buffer = buffersMap.get(stem.id);
            if (buffer) {
               await audioEngine.preloadStemFromArrayBuffer(stem.id, buffer);
            }
         });
         await Promise.all(preloadPromises);
       }
       
       set(state => ({ preloadedSongIds: [...state.preloadedSongIds, songId] }));
       get().refreshDownloadedSongs().catch(console.error);
    } catch(e) {
       console.error("Failed to preload", e);
    } finally {
       if (get().preloadingSongId === songId) {
         set({ preloadingSongId: null });
       }
       setTimeout(() => {
         get().triggerBackgroundPreload();
       }, 100);
    }
  },

  triggerBackgroundPreload: async () => {
    const { setlist, currentSong, preloadingSongId, preloadedSongIds } = get();
    if (!currentSong) return;
    const currentIndex = setlist.findIndex(s => s.id === currentSong.id);
    if (currentIndex === -1) return;

    for (let i = currentIndex + 1; i < setlist.length; i++) {
       const nextSongId = setlist[i].id;
       if (!preloadedSongIds.includes(nextSongId)) {
          if (!preloadingSongId) {
             await get().preloadSong(nextSongId);
          }
          break;
       }
    }
  },

  refreshDownloadedSongs: async () => {
    const { setlist } = get();
    if (setlist.length === 0) {
      set({ downloadedSongIds: [] });
      return;
    }
    try {
      const downloadedStemIds = await storageEngine.getAllDownloadedStemIds();
      const downloadedStemSet = new Set(downloadedStemIds);
      
      const downloadedIds: string[] = [];
      for (const song of setlist) {
        if (!song.stems || song.stems.length === 0) {
          downloadedIds.push(song.id);
          continue;
        }
        const allStemsExist = song.stems.every(stem => downloadedStemSet.has(stem.id) || stem.originalFile);
        if (allStemsExist) {
          downloadedIds.push(song.id);
        }
      }
      set({ downloadedSongIds: downloadedIds });
    } catch (e) {
      console.error("Failed to refresh downloaded songs:", e);
    }
  },

  downloadSongForOffline: async (songId: string) => {
    const { setlist } = get();
    const song = setlist.find(s => s.id === songId);
    if (!song) return;
    
    try {
      const stemIdsToLoad = song.stems
        .filter(stem => !stem.originalFile)
        .map(stem => stem.id);
        
      if (stemIdsToLoad.length > 0) {
        await storageEngine.loadStemBuffers(stemIdsToLoad);
      }
      await get().refreshDownloadedSongs();
    } catch (e) {
      console.error("Failed to download song for offline use:", e);
    }
  },

  downloadSetlistForOffline: async () => {
    const { setlist } = get();
    if (setlist.length === 0) return;
    
    const allStemIds: string[] = [];
    for (const song of setlist) {
      if (song.stems) {
        for (const stem of song.stems) {
          if (!stem.originalFile) {
            allStemIds.push(stem.id);
          }
        }
      }
    }
    
    if (allStemIds.length === 0) {
      await get().refreshDownloadedSongs();
      return;
    }
    
    try {
      await storageEngine.loadStemBuffers(allStemIds);
      await get().refreshDownloadedSongs();
    } catch (e) {
      console.error("Failed to download setlist for offline use:", e);
    }
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
    audioEngine.setMasterVolumeL(volume);
    audioEngine.setMasterVolumeR(volume);
    set((state) => {
      if (!state.currentSong) return { masterVolume: volume, masterVolumeL: volume, masterVolumeR: volume };
      const updatedSong = { ...state.currentSong, masterVolume: volume, masterVolumeL: volume, masterVolumeR: volume };
      const updatedSetlist = state.setlist.map(s => s.id === updatedSong.id ? updatedSong : s);
      storageEngine.saveSong(updatedSong, []).catch(console.error);
      return {
        masterVolume: volume,
        masterVolumeL: volume,
        masterVolumeR: volume,
        currentSong: updatedSong,
        setlist: updatedSetlist
      };
    });
  },

  setMasterVolumeL: (volume) => {
    audioEngine.setMasterVolumeL(volume);
    const { isMasterLinked, masterVolumeR } = get();
    let nextR = masterVolumeR;
    if (isMasterLinked) {
      nextR = volume;
      audioEngine.setMasterVolumeR(volume);
    }
    const avg = (volume + nextR) / 2;
    set((state) => {
      if (!state.currentSong) return { masterVolumeL: volume, masterVolumeR: nextR, masterVolume: avg };
      const updatedSong = { ...state.currentSong, masterVolumeL: volume, masterVolumeR: nextR, masterVolume: avg };
      const updatedSetlist = state.setlist.map(s => s.id === updatedSong.id ? updatedSong : s);
      storageEngine.saveSong(updatedSong, []).catch(console.error);
      return {
        masterVolumeL: volume,
        masterVolumeR: nextR,
        masterVolume: avg,
        currentSong: updatedSong,
        setlist: updatedSetlist
      };
    });
  },

  setMasterVolumeR: (volume) => {
    audioEngine.setMasterVolumeR(volume);
    const { isMasterLinked, masterVolumeL } = get();
    let nextL = masterVolumeL;
    if (isMasterLinked) {
      nextL = volume;
      audioEngine.setMasterVolumeL(volume);
    }
    const avg = (nextL + volume) / 2;
    set((state) => {
      if (!state.currentSong) return { masterVolumeL: nextL, masterVolumeR: volume, masterVolume: avg };
      const updatedSong = { ...state.currentSong, masterVolumeL: nextL, masterVolumeR: volume, masterVolume: avg };
      const updatedSetlist = state.setlist.map(s => s.id === updatedSong.id ? updatedSong : s);
      storageEngine.saveSong(updatedSong, []).catch(console.error);
      return {
        masterVolumeL: nextL,
        masterVolumeR: volume,
        masterVolume: avg,
        currentSong: updatedSong,
        setlist: updatedSetlist
      };
    });
  },

  toggleMasterLink: () => {
    set((state) => ({ isMasterLinked: !state.isMasterLinked }));
  },

  setMasterEQ: (band, value) => {
    audioEngine.setMasterEQ(band, value);
    set((state) => {
      const currentEq = state.masterEq || { low: 0, mid: 0, high: 0 };
      const newMasterEq = { ...currentEq, [band]: value };
      if (!state.currentSong) return { masterEq: newMasterEq };
      
      const updatedSong = { ...state.currentSong, masterEq: newMasterEq };
      const updatedSetlist = state.setlist.map(s => s.id === updatedSong.id ? updatedSong : s);
      storageEngine.saveSong(updatedSong, []).catch(console.error);
      return {
        masterEq: newMasterEq,
        currentSong: updatedSong,
        setlist: updatedSetlist
      };
    });
  },

  setPlaybackRate: (rate) => {
    audioEngine.setPlaybackRate(rate);
    set((state) => {
      if (!state.currentSong) return { playbackRate: rate };
      const updatedSong = { ...state.currentSong, playbackRate: rate };
      const updatedSetlist = state.setlist.map(s => s.id === updatedSong.id ? updatedSong : s);
      storageEngine.saveSong(updatedSong, []).catch(console.error);
      return {
        playbackRate: rate,
        currentSong: updatedSong,
        setlist: updatedSetlist
      };
    });
  },

  setPitchShift: (semitones) => {
    audioEngine.setPitchShift(semitones);
    set((state) => {
      if (!state.currentSong) return { pitchShift: semitones };
      const updatedSong = { ...state.currentSong, pitchShift: semitones };
      const updatedSetlist = state.setlist.map(s => s.id === updatedSong.id ? updatedSong : s);
      storageEngine.saveSong(updatedSong, []).catch(console.error);
      return {
        pitchShift: semitones,
        currentSong: updatedSong,
        setlist: updatedSetlist
      };
    });
  },

  toggleMetronome: () => {
    const { metronomeEnabled, currentSong, globalBpm } = get();
    const newState = !metronomeEnabled;
    audioEngine.toggleMetronome(newState, currentSong?.bpm || globalBpm || 120, currentSong?.timeSignature || "4/4");
    set({ metronomeEnabled: newState });
  },

  setBpm: (targetBpm: number) => {
    const newBpm = Math.max(30, Math.min(targetBpm, 300));
    const { currentSong, setlist } = get();
    if (!currentSong) {
      audioEngine.updateMetronomeParams(newBpm, "4/4");
      set({ globalBpm: newBpm });
      return;
    }

    const timeSig = currentSong.timeSignature || "4/4";
    audioEngine.updateMetronomeParams(newBpm, timeSig);

    const updatedSong = { ...currentSong, bpm: newBpm };
    const newSetlist = setlist.map(s => s.id === updatedSong.id ? updatedSong : s);
    storageEngine.saveSong(updatedSong, []);

    set({ currentSong: updatedSong, setlist: newSetlist, globalBpm: newBpm });
  },

  updateBpm: (delta: number) => {
    const { currentSong, globalBpm } = get();
    const current = currentSong ? currentSong.bpm : globalBpm;
    get().setBpm(current + delta);
  },

  tapTempo: () => {
    const now = performance.now();
    
    // Reset taps if more than 2 seconds have passed since last tap
    if (lastTaps.length > 0 && now - lastTaps[lastTaps.length - 1] > 2000) {
      lastTaps = [];
    }
    
    lastTaps.push(now);
    
    // Calculate average BPM if we have at least 2 taps (preferably 3 or 4)
    if (lastTaps.length >= 2) {
      const diffs = [];
      for (let i = 1; i < lastTaps.length; i++) {
        diffs.push(lastTaps[i] - lastTaps[i - 1]);
      }
      const avgDiff = diffs.reduce((a, b) => a + b, 0) / diffs.length;
      
      let newBpm = Math.round(60000 / avgDiff);
      newBpm = Math.max(30, Math.min(newBpm, 300));
      
      get().setBpm(newBpm);
    }
    
    // Keep max 5 taps for moving average
    if (lastTaps.length > 5) {
      lastTaps.shift();
    }
  },

  cycleTimeSignature: () => {
    const { currentSong } = get();
    if (!currentSong) return;

    // Common time signatures
    const signatures = ["4/4", "3/4", "6/8", "2/4", "12/8", "5/4"];
    const currentIdx = signatures.indexOf(currentSong.timeSignature || "4/4");
    const nextIdx = (currentIdx + 1) % signatures.length;
    const nextSig = signatures[nextIdx];

    get().setTimeSignature(nextSig);
  },

  setTimeSignature: async (nextSig: string) => {
    const { currentSong, setlist } = get();
    if (!currentSong) return;

    audioEngine.updateMetronomeParams(currentSong.bpm, nextSig);

    const updatedStems = [...currentSong.stems];
    const clickStemIndex = updatedStems.findIndex(
      s => s.name.toLowerCase().includes('click') || s.name.toLowerCase().includes('tap') || s.id.toLowerCase().includes('click')
    );

    if (clickStemIndex !== -1 && currentSong.duration > 0) {
      try {
        const sampleRate = 44100;
        const totalSamples = Math.floor(currentSong.duration * sampleRate);
        const offsetSec = currentSong.firstBeatOffset || 0;
        const pcm = generateClickPCM(totalSamples, currentSong.bpm || 120, offsetSec, nextSig, sampleRate);
        const wav = createWavFileFromPCM(pcm.clickLeft, pcm.clickRight, 'click.wav', sampleRate);

        updatedStems[clickStemIndex] = {
          ...updatedStems[clickStemIndex],
          file: wav.url,
          originalFile: wav.file,
        };

        await audioEngine.loadStem(updatedStems[clickStemIndex].id, wav.file, true);
      } catch (e) {
        console.warn('Could not regenerate click stem buffer:', e);
      }
    }
    
    const updatedSong = { ...currentSong, timeSignature: nextSig, stems: updatedStems };
    const newSetlist = setlist.map(s => s.id === updatedSong.id ? updatedSong : s);
    
    set({ currentSong: updatedSong, setlist: newSetlist });
    storageEngine.saveSong(updatedSong, []);
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
    set((state) => {
      if (!state.currentSong) return {};
      const updatedStems = state.currentSong.stems.map(s => s.id === stemId ? { ...s, volume } : s);
      const updatedSong = { ...state.currentSong, stems: updatedStems };
      const updatedSetlist = state.setlist.map(s => s.id === updatedSong.id ? updatedSong : s);
      
      // Async update database
      storageEngine.saveSong(updatedSong, []).catch(console.error);

      return {
        currentSong: updatedSong,
        setlist: updatedSetlist
      };
    });
  },
  
  resetAllVolumesToZeroDb: () => {
    audioEngine.setMasterVolume(0.5);
    audioEngine.setPadVolume(0.5);
    
    const { currentSong } = get();
    if (currentSong) {
      currentSong.stems.forEach(stem => {
        if (!stem.isMuted) {
          audioEngine.setStemVolume(stem.id, 0.5);
        }
      });
      
      set((state) => {
        if (!state.currentSong) return {};
        const updatedStems = state.currentSong.stems.map(s => ({ ...s, volume: 0.5 }));
        const updatedSong = { ...state.currentSong, stems: updatedStems };
        const updatedSetlist = state.setlist.map(s => s.id === updatedSong.id ? updatedSong : s);
        
        // Async update database
        storageEngine.saveSong(updatedSong, []).catch(console.error);

        return {
          masterVolume: 0.5,
          padVolume: 0.5,
          currentSong: updatedSong,
          setlist: updatedSetlist
        };
      });
    } else {
      set({
        masterVolume: 0.5,
        padVolume: 0.5
      });
    }
  },

  addStemToCurrentSong: async (name: string, file: File, output: number = 3) => {
    const { currentSong, setlist, isLRSplit } = get();
    if (!currentSong) return;

    const stemId = `${currentSong.id}-stem-${Date.now()}`;
    const fileUrl = URL.createObjectURL(file);

    const newStem: Stem = {
      id: stemId,
      name: name.trim() || file.name.replace(/\.[^/.]+$/, ""),
      file: fileUrl,
      originalFile: file,
      output: output,
      volume: 0.5,
      isMuted: false,
      isSoloed: false,
      pan: isLRSplit ? (output === 1 ? -1 : output === 2 ? 1 : 0) : 0,
      eq: { low: 0, mid: 0, high: 0 },
      compressor: {
        enabled: false,
        threshold: -24,
        ratio: 4,
        attack: 0.003,
        release: 0.25,
        makeupGain: 0
      }
    };

    // Load stem into Web Audio engine
    await audioEngine.loadStem(stemId, file);
    audioEngine.setStemVolume(stemId, 0.5);
    audioEngine.setStemPan(stemId, newStem.pan);

    const updatedStems = [...currentSong.stems, newStem];
    const updatedSong = { ...currentSong, stems: updatedStems };
    const updatedSetlist = setlist.map(s => s.id === updatedSong.id ? updatedSong : s);

    // Save to persistent DB
    try {
      const buffer = await file.arrayBuffer();
      await storageEngine.saveSong(updatedSong, [{ id: stemId, buffer }]);
    } catch (err) {
      console.error("Failed to save new stem to database:", err);
    }

    set({
      currentSong: updatedSong,
      setlist: updatedSetlist
    });
  },

  removeStemFromCurrentSong: async (stemId: string) => {
    const { currentSong, setlist } = get();
    if (!currentSong) return;

    // 1. Stop and remove from Web Audio Engine immediately
    audioEngine.removeStem(stemId);

    const updatedStems = currentSong.stems.filter(s => s.id !== stemId);
    const updatedSong = { ...currentSong, stems: updatedStems };
    const updatedSetlist = setlist.map(s => s.id === updatedSong.id ? updatedSong : s);

    // 2. Update Zustand state immediately so UI re-renders without track instantly
    set({
      currentSong: updatedSong,
      setlist: updatedSetlist
    });

    // 3. Perform IndexedDB and storage deletion asynchronously in background
    (async () => {
      try {
        await storageEngine.deleteStem(stemId);
        await storageEngine.saveSong(updatedSong, []);
      } catch (e) {
        console.error("Failed to persist stem deletion:", e);
      }
    })();
  },
  
  toggleStemMute: (stemId) => {
    const { currentSong } = get();
    if (!currentSong) return;
    const stem = currentSong.stems.find(s => s.id === stemId);
    if (stem) {
      audioEngine.setStemVolume(stemId, !stem.isMuted ? 0 : stem.volume);
    }
    set((state) => {
      if (!state.currentSong) return {};
      const updatedStems = state.currentSong.stems.map(s => s.id === stemId ? { ...s, isMuted: !s.isMuted } : s);
      const updatedSong = { ...state.currentSong, stems: updatedStems };
      const updatedSetlist = state.setlist.map(s => s.id === updatedSong.id ? updatedSong : s);
      
      // Async update database
      storageEngine.saveSong(updatedSong, []).catch(console.error);

      return {
        currentSong: updatedSong,
        setlist: updatedSetlist
      };
    });
  },
  
  toggleStemSolo: (stemId) => set((state) => {
    if (!state.currentSong) return state;
    const isCurrentlySoloed = state.currentSong.stems.find(s => s.id === stemId)?.isSoloed;
    const updatedSong = {
      ...state.currentSong,
      stems: state.currentSong.stems.map(s => s.id === stemId ? { ...s, isSoloed: !isCurrentlySoloed } : s)
    };
    
    const stems = updatedSong.stems;
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

    const updatedSetlist = state.setlist.map(s => s.id === updatedSong.id ? updatedSong : s);

    // Keep state and setlist in sync
    return {
      currentSong: updatedSong,
      setlist: updatedSetlist
    };
  }),
  
  login: async () => {
    try {
      await signInWithGoogle();
    } catch (e: any) {
      if (e?.code !== 'auth/popup-closed-by-user' && e?.code !== 'auth/cancelled-popup-request') {
        console.error("Login failed", e);
      }
    }
  },
  loginWithEmail: async (email, password) => {
    try {
      await signInWithEmail(email, password);
    } catch (e) {
      console.error("Login with Email failed", e);
      throw e; // Maybe front end needs to catch it to show error
    }
  },
  signUpWithEmail: async (email, password, displayName) => {
    try {
      await signUpWithEmail(email, password, displayName);
    } catch (e) {
      console.error("Sign up failed", e);
      throw e;
    }
  },
  createInternalUser: async (email, password, displayName) => {
    try {
      await createInternalUserWithEmail(email, password, displayName);
    } catch (e) {
      console.error("Create internal user failed", e);
      throw e;
    }
  },
  logout: async () => {
    try {
      await signOut();
    } catch (e) {
      console.error("Logout failed", e);
    }
  },
  toggleStageMode: () => set((state) => ({ isStageMode: !state.isStageMode })),
  setThemeMode: (mode) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('app_theme_mode', mode);
    }
    set({ themeMode: mode });
  },
  toggleThemeMode: () => {
    const nextMode = get().themeMode === 'high-contrast' ? 'default' : 'high-contrast';
    if (typeof window !== 'undefined') {
      localStorage.setItem('app_theme_mode', nextMode);
    }
    set({ themeMode: nextMode });
  },
  setShowSidebar: (show) => set({ isSidebarOpen: show }),

  setStemOutput: (stemId, output) => {
    const { isLRSplit } = get();
    const pan = isLRSplit ? (output === 1 ? -1 : output === 2 ? 1 : 0) : 0;
    audioEngine.setStemPan(stemId, pan);

    set((state) => {
      if (!state.currentSong) return {};
      const updatedStems = state.currentSong.stems.map(s => s.id === stemId ? { ...s, output, pan } : s);
      const updatedSong = { ...state.currentSong, stems: updatedStems };
      const updatedSetlist = state.setlist.map(s => s.id === updatedSong.id ? updatedSong : s);
      
      // Async update database
      storageEngine.saveSong(updatedSong, []).catch(console.error);

      return {
        currentSong: updatedSong,
        setlist: updatedSetlist
      };
    });
  },

  setStemEQ: (stemId, band, value) => {
    audioEngine.setStemEQ(stemId, band, value);
    set((state) => {
      if (!state.currentSong) return {};
      const updatedStems = state.currentSong.stems.map(s => 
        s.id === stemId ? { ...s, eq: { ...(s.eq || { low: 0, mid: 0, high: 0 }), [band]: value } } : s
      );
      const updatedSong = { ...state.currentSong, stems: updatedStems };
      const updatedSetlist = state.setlist.map(s => s.id === updatedSong.id ? updatedSong : s);
      
      // Async update database
      storageEngine.saveSong(updatedSong, []).catch(console.error);

      return {
        currentSong: updatedSong,
        setlist: updatedSetlist
      };
    });
  },

  setStemCompressor: (stemId, enabled, threshold, ratio, attack, release, makeupGain) => {
    audioEngine.setStemCompressor(stemId, enabled, threshold, ratio, attack, release, makeupGain);
    set((state) => {
      if (!state.currentSong) return {};
      const updatedStems = state.currentSong.stems.map(s => 
        s.id === stemId ? { 
          ...s, 
          compressor: { enabled, threshold, ratio, attack, release, makeupGain } 
        } : s
      );
      const updatedSong = { ...state.currentSong, stems: updatedStems };
      const updatedSetlist = state.setlist.map(s => s.id === updatedSong.id ? updatedSong : s);
      
      // Async update database
      storageEngine.saveSong(updatedSong, []).catch(console.error);

      return {
        currentSong: updatedSong,
        setlist: updatedSetlist
      };
    });
  },

  updateSongMetadata: (id, title, artist, coverUrl, bpm, key) => {
    set((state) => {
       const existingSong = state.setlist.find(s => s.id === id);
       // Use explicitly provided coverUrl, or fallback to existing song's coverUrl, or generate a new one
       const finalCoverUrl = coverUrl !== undefined ? coverUrl : (existingSong?.coverUrl || getCoverUrl(title, artist));
       const finalBpm = bpm !== undefined ? bpm : (existingSong?.bpm || 120);
       const finalKey = key !== undefined ? key : (existingSong?.key || 'C');

       const updatedSetlist = state.setlist.map(s => s.id === id ? { ...s, title, artist, coverUrl: finalCoverUrl, bpm: finalBpm, key: finalKey } : s);
       const updatedSong = state.currentSong?.id === id ? { ...state.currentSong, title, artist, coverUrl: finalCoverUrl, bpm: finalBpm, key: finalKey } : state.currentSong;
       
       if (updatedSong) {
         storageEngine.saveSong(updatedSong, []).catch(console.error);
       } else {
         const foundSong = updatedSetlist.find(s => s.id === id);
         if (foundSong) storageEngine.saveSong(foundSong, []).catch(console.error);
       }

       return {
         setlist: updatedSetlist,
         currentSong: updatedSong
       };
    });
  },

  updateSongKey: (id, key) => {
    set((state) => {
       const updatedSetlist = state.setlist.map(s => s.id === id ? { ...s, key } : s);
       const updatedSong = state.currentSong?.id === id ? { ...state.currentSong, key } : state.currentSong;
       
       if (updatedSong) {
         storageEngine.saveSong(updatedSong, []).catch(console.error);
       } else {
         const foundSong = updatedSetlist.find(s => s.id === id);
         if (foundSong) storageEngine.saveSong(foundSong, []).catch(console.error);
       }

       return {
         setlist: updatedSetlist,
         currentSong: updatedSong
       };
    });
  },

  updateSongLyrics: (id, lyrics) => {
    set((state) => {
       const updatedSetlist = state.setlist.map(s => s.id === id ? { ...s, lyrics } : s);
       const updatedSong = state.currentSong?.id === id ? { ...state.currentSong, lyrics } : state.currentSong;
       
       if (updatedSong) {
         storageEngine.saveSong(updatedSong, []).catch(console.error);
       } else {
         const foundSong = updatedSetlist.find(s => s.id === id);
         if (foundSong) storageEngine.saveSong(foundSong, []).catch(console.error);
       }

       return {
         setlist: updatedSetlist,
         currentSong: updatedSong
       };
    });
  },

  removeFromSetlist: (id) => {
    set((state) => ({
       setlist: state.setlist.filter(s => s.id !== id),
       currentSong: state.currentSong?.id === id ? null : state.currentSong
    }));
    get().refreshDownloadedSongs().catch(console.error);
  },

  reorderSetlist: (startIndex, endIndex) => {
    set((state) => {
      const newSetlist = Array.from(state.setlist);
      const [removed] = newSetlist.splice(startIndex, 1);
      newSetlist.splice(endIndex, 0, removed);
      
      const updatedSetlist = newSetlist.map((song, idx) => {
        const updatedSong = { ...song, order: idx };
        storageEngine.saveSong(updatedSong, []).catch(console.error);
        return updatedSong;
      });

      return {
        setlist: updatedSetlist
      };
    });
    
    get().refreshDownloadedSongs().catch(console.error);
    get().triggerBackgroundPreload();
  },
  
  clearSetlist: () => {
    set({ setlist: [], currentSong: null, downloadedSongIds: [] });
    audioEngine.pause();
    audioEngine.clearStems();
  },

  saveCurrentSetlist: async (name) => {
    const { setlist, savedSetlists, masterEq } = get();
    if (setlist.length === 0) return;
    
    set({ isSavingSetlist: true });
    
    try {
      // Explicitly save/update all current songs in the setlist to ensure all EQ, volume and other metadata settings are persisted to local DB & cloud!
      // We do NOT need to reload or re-upload the heavy stem audio buffers, as they are already saved/uploaded during song import.
      for (const song of setlist) {
        try {
          await storageEngine.saveSong(song, []);
        } catch (e) {
          console.error("Failed to persist song metadata on playlist save", e);
        }
      }

      // Build a complete snapshot of songs in the setlist preserving references
      const songsSnapshot = setlist.map(song => ({
        ...song,
        stems: song.stems.map(stem => ({
          ...stem,
          originalFile: stem.originalFile,
          buffer: stem.buffer,
          eq: stem.eq ? { ...stem.eq } : undefined,
          compressor: stem.compressor ? { ...stem.compressor } : undefined
        })),
        markers: song.markers.map(marker => ({ ...marker })),
        waveformPeaks: song.waveformPeaks ? [...song.waveformPeaks] : undefined,
        masterEq: song.masterEq ? { ...song.masterEq } : undefined
      }));

      const newSetlist = {
        id: Math.random().toString(36).substr(2, 9),
        name,
        songIds: setlist.map(s => s.id),
        songs: songsSnapshot,
        masterEq: { ...masterEq }
      };
      
      await storageEngine.saveSetlist(newSetlist);
      set({ savedSetlists: [...savedSetlists, newSetlist] });
    } catch (e) {
      console.error("Failed to save setlist", e);
    } finally {
      set({ isSavingSetlist: false });
    }
  },

  loadSavedSetlist: async (id) => {
    const { savedSetlists } = get();
    const targetSetlist = savedSetlists.find(s => s.id === id);
    if (!targetSetlist) return;
    
    try {
      let loadedSongs: Song[] = [];
      if (targetSetlist.songs && targetSetlist.songs.length > 0) {
        loadedSongs = targetSetlist.songs;
      } else {
        const allSongs = await storageEngine.loadSongs();
        loadedSongs = targetSetlist.songIds
          .map(songId => allSongs.find(s => s.id === songId))
          .filter(s => !!s) as Song[];
      }
        
      set({ setlist: loadedSongs });
      
      if (loadedSongs.length > 0) {
        await get().setCurrentSong(loadedSongs[0]);
      }

      if (targetSetlist.masterEq) {
        const eq = targetSetlist.masterEq;
        audioEngine.setMasterEQ('low', eq.low);
        audioEngine.setMasterEQ('mid', eq.mid);
        audioEngine.setMasterEQ('high', eq.high);
        set({ masterEq: { ...eq } });
      }
    } catch (e) {
      console.error("Failed to load setlist songs", e);
    }
  },

  deleteSavedSetlist: async (id) => {
    const { savedSetlists } = get();
    try {
      await storageEngine.deleteSetlist(id);
      set({ savedSetlists: savedSetlists.filter(s => s.id !== id) });
    } catch (e) {
      console.error("Failed to delete setlist", e);
    }
  },

  toggleAmbientPad: (key, frequency) => {
    const { activePadKey, padVolume } = get();
    if (activePadKey === key) {
       audioEngine.stopPad();
       set({ activePadKey: null });
    } else {
       if (audioEngine.hasCustomPad(key)) {
         audioEngine.playCustomPad(key, padVolume);
       } else {
         audioEngine.playPad(frequency, padVolume);
       }
       set({ activePadKey: key });
    }
  },

  setPadVolume: (volume) => {
    audioEngine.setPadVolume(volume);
    set({ padVolume: volume });
  },

  setPadEQ: (band, value) => {
    audioEngine.setPadEQ(band, value);
    set((state) => ({ padEq: { ...state.padEq, [band]: value } }));
  },

  loadCustomPads: async () => {
    try {
      const keys = await storageEngine.getCustomPadNotes();
      const customPadsMap: Record<string, boolean> = {};
      for (const k of keys) {
        customPadsMap[k] = true;
        const buffer = await storageEngine.loadPadBuffer(k);
        if (buffer) {
          await audioEngine.preloadCustomPad(k, buffer);
        }
      }
      set({ customPads: customPadsMap });
    } catch(e) {
      console.error("Failed to load custom pads", e);
    }
  },

  setCustomPad: async (note: string, file: File) => {
    try {
      const buffer = await file.arrayBuffer();
      await storageEngine.savePadBuffer(note, buffer);
      
      // Load into memory
      await audioEngine.preloadCustomPad(note, buffer.slice(0));
      
      set(state => ({
        customPads: { ...state.customPads, [note]: true }
      }));
    } catch(e) {
      console.error("Failed to set custom pad", e);
    }
  }
  };
});


