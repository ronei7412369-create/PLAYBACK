export interface Stem {
  id: string;
  name: string;
  file?: string;
  buffer?: any; // For Web Audio API
  originalFile?: any;
  output: number; // 1 = L, 2 = R, 3 = Stereo
  volume: number; // 0.0 to 1.0
  isMuted: boolean;
  isSoloed: boolean;
  pan: number;
  eq?: {
    low: number;  // -24 to 24 dB
    mid: number;  // -24 to 24 dB
    high: number; // -24 to 24 dB
  };
}

export interface Marker {
  id: string;
  label: string;
  startTime: number;
  endTime?: number;
  color: string;
}

export interface Song {
  id: string;
  title: string;
  artist: string;
  bpm: number;
  key: string;
  timeSignature: string;
  duration: number;
  stems: Stem[];
  markers: Marker[];
  waveformPeaks?: number[]; // Extracted audio data
  lyrics?: string; // Teleprompter lyrics
}

export interface PlayerState {
  // App State
  isAuthenticated: boolean;
  isAdmin: boolean;
  user: any | null; // Firebase user
  isStageMode: boolean;
  isLoadingSong: boolean;
  isSidebarOpen: boolean;
  preloadingSongId?: string | null;
  preloadedSongIds: string[];

  currentSong: Song | null;
  isPlaying: boolean;
  currentTime: number;
  masterVolume: number;
  masterEq: { low: number; mid: number; high: number };
  isLooping: boolean;
  isInfiniteLoop: boolean;
  isFadeOut: boolean;
  setlist: Song[];
  
  // Real-time parameters
  playbackRate: number; // Tempo
  metronomeEnabled: boolean;
  isLRSplit: boolean; // Stereo vs L/R Mode
  pitchShift: number; // Semitones (-12 to 12)
  
  // Pad parameters
  activePadKey: string | null;
  padVolume: number;
  customPads: Record<string, boolean>;

  // Actions
  login: () => void;
  loginWithEmail?: (e: string, p: string) => Promise<void>;
  signUpWithEmail?: (e: string, p: string) => Promise<void>;
  createInternalUser?: (e: string, p: string, d?: string) => Promise<void>;
  logout: () => void;
  toggleStageMode: () => void;
  setShowSidebar: (show: boolean) => void;

  updateSongMetadata: (id: string, title: string, artist: string) => void;
  updateSongLyrics: (id: string, lyrics: string) => void;
  removeFromSetlist: (id: string) => void;

  toggleAmbientPad: (key: string, frequency: number) => void;
  setPadVolume: (volume: number) => void;
  setCustomPad: (note: string, file: File) => Promise<void>;
  loadCustomPads: () => Promise<void>;

  importSong: (song: Song, buffers?: {id:string, buffer:ArrayBuffer}[]) => void;
  addProcessedSong: (song: Omit<Song, 'duration' | 'bpm' | 'key' | 'timeSignature' | 'markers'>) => void;
  setCurrentSong: (song: Song) => Promise<void>;
  preloadSong: (songId: string) => Promise<void>;
  updatePeaks?: (peaks: number[]) => void;
  togglePlay: () => void;
  stop: () => void;
  seek: (time: number) => void;
  setMasterVolume: (volume: number) => void;
  setMasterEQ: (band: 'low' | 'mid' | 'high', value: number) => void;
  setPlaybackRate: (rate: number) => void;
  setPitchShift: (semitones: number) => void;
  toggleMetronome: () => void;
  toggleLRSplit: () => void;
  
  tapTempo: () => void;
  updateBpm: (delta: number) => void;
  cycleTimeSignature: () => void;
  
  toggleLoop: () => void;
  toggleInfiniteLoop: () => void;
  triggerFadeOut: () => void;
  updateStemVolume: (stemId: string, volume: number) => void;
  toggleStemMute: (stemId: string) => void;
  toggleStemSolo: (stemId: string) => void;
  setStemOutput: (stemId: string, output: number) => void;
  setStemEQ: (stemId: string, band: 'low' | 'mid' | 'high', value: number) => void;

  initPersistence: () => Promise<void>;
}

