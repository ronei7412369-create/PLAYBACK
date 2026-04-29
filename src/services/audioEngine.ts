
import * as Tone from 'tone';

export class AudioEngine {
  private context: AudioContext;
  public masterGain: GainNode;
  public masterEqLow: BiquadFilterNode;
  public masterEqMid: BiquadFilterNode;
  public masterEqHigh: BiquadFilterNode;
  private pitchShift: any; // using any for Tone node
  private stems: Map<string, { 
    buffer: AudioBuffer; 
    gain: GainNode; 
    panner: StereoPannerNode; 
    eqLow: BiquadFilterNode;
    eqMid: BiquadFilterNode;
    eqHigh: BiquadFilterNode;
    source: AudioBufferSourceNode | null;
  }> = new Map();
  
  private startTime: number = 0;
  private pauseTime: number = 0;
  private isPlaying: boolean = false;
  private playbackRate: number = 1.0;

  // Metronome state
  private clickTrackEnabled: boolean = false;
  private bpm: number = 120;
  private timeSignature: [number, number] = [4, 4];
  private currentBeat: number = 0;
  private nextClickTime: number = 0;
  private clickTimerId: number | null = null;
  private clickGain: GainNode;

  // Pad State
  private padGain: GainNode;
  private padOscillators: OscillatorNode[] = [];
  private customPadBufferNode: AudioBufferSourceNode | null = null;
  private padDecodedCache: Map<string, AudioBuffer> = new Map();

  private stemDuration: number = 0;
  private decodedCache: Map<string, AudioBuffer> = new Map();

  constructor() {
    this.context = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    // Set up Tone.js using our native context
    Tone.setContext(this.context);
    
    // Create PitchShift node
    this.pitchShift = new Tone.PitchShift({
      pitch: 0,
      windowSize: 0.1,
      delayTime: 0,
      feedback: 0
    });

    this.masterGain = this.context.createGain();

    this.masterEqLow = this.context.createBiquadFilter();
    this.masterEqLow.type = 'lowshelf';
    this.masterEqLow.frequency.value = 320;

    this.masterEqMid = this.context.createBiquadFilter();
    this.masterEqMid.type = 'peaking';
    this.masterEqMid.frequency.value = 1000;
    this.masterEqMid.Q.value = 0.5;

    this.masterEqHigh = this.context.createBiquadFilter();
    this.masterEqHigh.type = 'highshelf';
    this.masterEqHigh.frequency.value = 3200;
    
    // Connect Master -> EQ -> PitchShift -> Destination
    this.masterGain.connect(this.masterEqLow);
    this.masterEqLow.connect(this.masterEqMid);
    this.masterEqMid.connect(this.masterEqHigh);
    Tone.connect(this.masterEqHigh, this.pitchShift);
    Tone.connect(this.pitchShift, this.context.destination);

    this.clickGain = this.context.createGain();
    this.clickGain.gain.value = 0.8;
    this.clickGain.connect(this.context.destination); // Click bypasses pitch shift

    this.padGain = this.context.createGain();
    this.padGain.gain.value = 0;
    this.padGain.connect(this.masterGain);
  }

  public setPitchShift(semitones: number) {
    if (this.pitchShift) {
      this.pitchShift.pitch = semitones;
    }
  }

  public async preloadCustomPad(note: string, arrayBuffer: ArrayBuffer) {
     const audioBuffer = await this.context.decodeAudioData(arrayBuffer);
     this.padDecodedCache.set(note, audioBuffer);
  }

  public hasCustomPad(note: string): boolean {
     return this.padDecodedCache.has(note);
  }

  public playCustomPad(note: string, masterVolume: number) {
     this.stopPad(); 

     const audioBuffer = this.padDecodedCache.get(note);
     if (!audioBuffer) return;

     this.padGain.gain.cancelScheduledValues(this.context.currentTime);
     this.padGain.gain.setValueAtTime(0, this.context.currentTime);
     this.padGain.gain.linearRampToValueAtTime(masterVolume, this.context.currentTime + 1.5);

     this.customPadBufferNode = this.context.createBufferSource();
     this.customPadBufferNode.buffer = audioBuffer;
     this.customPadBufferNode.loop = true;
     this.customPadBufferNode.connect(this.padGain);
     this.customPadBufferNode.start();
  }

  public playPad(frequency: number, masterVolume: number) {
    this.stopPad(); // ensure any existing ones fade out

    const filter = this.context.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 800; // slightly brighter
    filter.Q.value = 1.0;

    // Movement on the filter
    const filterLfo = this.context.createOscillator();
    filterLfo.type = 'sine';
    filterLfo.frequency.value = 0.1; // Very slow sweep
    const filterGain = this.context.createGain();
    filterGain.gain.value = 300;
    filterLfo.connect(filterGain);
    filterGain.connect(filter.frequency);
    filterLfo.start();
    this.padOscillators.push(filterLfo);

    // Add a simple delay for a lush "reverb" effect
    const delay = this.context.createDelay();
    delay.delayTime.value = 0.5; // 500ms
    const feedback = this.context.createGain();
    feedback.gain.value = 0.6; // 60% feedback
    
    // Smooth envelope attack
    this.padGain.gain.cancelScheduledValues(this.context.currentTime);
    this.padGain.gain.setValueAtTime(0, this.context.currentTime);
    this.padGain.gain.linearRampToValueAtTime(masterVolume, this.context.currentTime + 2.0);

    // Routing
    filter.connect(this.padGain);
    
    // Delay routing
    filter.connect(delay);
    delay.connect(feedback);
    feedback.connect(delay);
    delay.connect(this.padGain);

    // Create a thick pad with root, 5th, and octave
    const freqs = [frequency / 2, frequency, frequency * 1.498]; // Perfect fifth is ~1.498

    freqs.forEach(f => {
      // Multiple detuned oscillators
      [-6, -3, 0, 3, 6].forEach(detune => {
         const osc = this.context.createOscillator();
         osc.type = 'sawtooth';
         osc.frequency.value = f;
         osc.detune.value = detune;

         // Gentle LFO for movement
         const lfo = this.context.createOscillator();
         lfo.type = 'sine';
         lfo.frequency.value = 0.2 + Math.random() * 0.3;
         const lfoGain = this.context.createGain();
         lfoGain.gain.value = 10;
         lfo.connect(lfoGain);
         lfoGain.connect(osc.detune);
         lfo.start();

         const oscGain = this.context.createGain();
         oscGain.gain.value = 0.2; // reduce volume due to many oscillators
         osc.connect(oscGain);
         oscGain.connect(filter);
         
         osc.start();
         this.padOscillators.push(osc);
         this.padOscillators.push(lfo);
      });
    });
  }

  public stopPad() {
    this.padGain.gain.cancelScheduledValues(this.context.currentTime);
    this.padGain.gain.linearRampToValueAtTime(0, this.context.currentTime + 1.5);

    const oscToStop = [...this.padOscillators];
    this.padOscillators = [];
    const customNodeToStop = this.customPadBufferNode;
    this.customPadBufferNode = null;

    // Stop them after the fade-out completes
    setTimeout(() => {
      oscToStop.forEach(osc => {
         try { osc.stop(); osc.disconnect(); } catch (e) {}
      });
      if (customNodeToStop) {
         try { customNodeToStop.stop(); customNodeToStop.disconnect(); } catch (e) {}
      }
    }, 2000);
  }

  public setPadVolume(volume: number) {
    // If it's currently active (not fading out/0), set the target volume directly
    if (this.padOscillators.length > 0) {
       this.padGain.gain.setTargetAtTime(volume, this.context.currentTime, 0.1);
    }
  }

  public async loadStemFromCache(id: string): Promise<number | null> {
    const audioBuffer = this.decodedCache.get(id);
    if (!audioBuffer) return null;

    // Create Nodes
    const gain = this.context.createGain();
    const panner = this.context.createStereoPanner();
    
    const eqLow = this.context.createBiquadFilter();
    eqLow.type = 'lowshelf';
    eqLow.frequency.value = 320; // 320 Hz
    eqLow.gain.value = 0;

    const eqMid = this.context.createBiquadFilter();
    eqMid.type = 'peaking';
    eqMid.frequency.value = 1000; // 1kHz
    eqMid.Q.value = 0.5;
    eqMid.gain.value = 0;

    const eqHigh = this.context.createBiquadFilter();
    eqHigh.type = 'highshelf';
    eqHigh.frequency.value = 3200; // 3.2kHz
    eqHigh.gain.value = 0;
    
    // Connect Chain: Source -> Gain -> EQ Low -> EQ Mid -> EQ High -> Panner -> Master
    gain.connect(eqLow);
    eqLow.connect(eqMid);
    eqMid.connect(eqHigh);
    eqHigh.connect(panner);
    panner.connect(this.masterGain);

    this.stems.set(id, { buffer: audioBuffer, gain, panner, eqLow, eqMid, eqHigh, source: null });
    return audioBuffer.duration;
  }

  public async preloadStemFromArrayBuffer(id: string, arrayBuffer: ArrayBuffer) {
    if (!this.decodedCache.has(id)) {
      const audioBuffer = await this.context.decodeAudioData(arrayBuffer);
      this.decodedCache.set(id, audioBuffer);
    }
  }

  public async preloadStem(id: string, file: File) {
    if (!this.decodedCache.has(id)) {
      const arrayBuffer = await file.arrayBuffer();
      await this.preloadStemFromArrayBuffer(id, arrayBuffer);
    }
  }

  public clearDecodeCache(excludeStemIds: string[]) {
    for (const [id] of this.decodedCache.entries()) {
      if (!excludeStemIds.includes(id)) {
        this.decodedCache.delete(id);
      }
    }
  }

  public async loadStemFromArrayBuffer(id: string, arrayBuffer: ArrayBuffer): Promise<number> {
    let audioBuffer = this.decodedCache.get(id);
    if (!audioBuffer) {
      audioBuffer = await this.context.decodeAudioData(arrayBuffer);
      this.decodedCache.set(id, audioBuffer);
    }
    
    // Create Nodes
    const gain = this.context.createGain();
    const panner = this.context.createStereoPanner();
    
    const eqLow = this.context.createBiquadFilter();
    eqLow.type = 'lowshelf';
    eqLow.frequency.value = 320; // 320 Hz
    eqLow.gain.value = 0;

    const eqMid = this.context.createBiquadFilter();
    eqMid.type = 'peaking';
    eqMid.frequency.value = 1000; // 1kHz
    eqMid.Q.value = 0.5;
    eqMid.gain.value = 0;

    const eqHigh = this.context.createBiquadFilter();
    eqHigh.type = 'highshelf';
    eqHigh.frequency.value = 3200; // 3.2kHz
    eqHigh.gain.value = 0;
    
    // Connect Chain: Source -> Gain -> EQ Low -> EQ Mid -> EQ High -> Panner -> Master
    gain.connect(eqLow);
    eqLow.connect(eqMid);
    eqMid.connect(eqHigh);
    eqHigh.connect(panner);
    panner.connect(this.masterGain);

    this.stems.set(id, { buffer: audioBuffer, gain, panner, eqLow, eqMid, eqHigh, source: null });
    return audioBuffer.duration;
  }



  public async loadStem(id: string, file: File): Promise<number> {
    const arrayBuffer = await file.arrayBuffer();
    // Keep a copy in memory to pass to storage if needed, but for now we just decode
    return this.loadStemFromArrayBuffer(id, arrayBuffer);
  }

  public getDuration(): number {
    let maxDuration = 0;
    this.stems.forEach((stem) => {
      if (stem.buffer.duration > maxDuration) { maxDuration = stem.buffer.duration; }
    });
    return maxDuration;
  }

  public getCurrentTime(): number {
    if (!this.isPlaying) return this.pauseTime;
    return this.pauseTime + (this.context.currentTime - this.startTime) * this.playbackRate;
  }

  public play(offset: number = 0) {
    if (this.isPlaying) return;
    
    if (this.context.state === 'suspended') {
      this.context.resume();
    }
    
    this.masterGain.gain.cancelScheduledValues(this.context.currentTime);
    this.masterGain.gain.setValueAtTime(this.masterGain.gain.value || 1, this.context.currentTime);

    this.startTime = this.context.currentTime;
    this.pauseTime = offset;
    
    this.stems.forEach((stem) => {
      if (stem.source) stem.source.stop();
      
      const source = this.context.createBufferSource();
      source.buffer = stem.buffer;
      source.connect(stem.gain);
      source.playbackRate.value = this.playbackRate;
      
      source.start(0, offset);
      stem.source = source;
    });

    this.isPlaying = true;
    
    // Reset or calculate currentBeat if needed. If starting from beginning, beat is 0.
    // If starting from an offset, calculate the initial beat
    const beatsPassed = (offset / 60.0) * this.bpm;
    this.currentBeat = Math.floor(beatsPassed) % Math.max(1, this.timeSignature[0]);

    if (this.clickTrackEnabled) {
      this.nextClickTime = this.context.currentTime;
      this.scheduleMetronome();
    }
  }

  public pause() {
    if (!this.isPlaying) return;
    
    this.pauseTime += (this.context.currentTime - this.startTime) * this.playbackRate;
    
    this.stems.forEach((stem) => {
      if (stem.source) {
        stem.source.stop();
        stem.source = null;
      }
    });

    if (this.clickTimerId) {
      clearTimeout(this.clickTimerId);
      this.clickTimerId = null;
    }
    
    this.isPlaying = false;
  }

  public seek(time: number) {
    const wasPlaying = this.isPlaying;
    if (wasPlaying) this.pause();
    this.pauseTime = time;
    if (wasPlaying) this.play(time);
  }

  public fadeOut(durationSeconds: number = 5) {
    if (!this.isPlaying) return;
    const currTime = this.context.currentTime;
    this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, currTime);
    this.masterGain.gain.linearRampToValueAtTime(0.001, currTime + durationSeconds);
    
    setTimeout(() => {
      this.pause();
      this.masterGain.gain.setValueAtTime(1, this.context.currentTime);
    }, durationSeconds * 1000);
  }

  public setMasterVolume(volume: number) {
    this.masterGain.gain.setTargetAtTime(Math.max(0.001, volume), this.context.currentTime, 0.05);
  }

  public setMasterEQ(band: 'low' | 'mid' | 'high', value: number) {
    if (band === 'low') this.masterEqLow.gain.setTargetAtTime(value, this.context.currentTime, 0.05);
    if (band === 'mid') this.masterEqMid.gain.setTargetAtTime(value, this.context.currentTime, 0.05);
    if (band === 'high') this.masterEqHigh.gain.setTargetAtTime(value, this.context.currentTime, 0.05);
  }

  public setStemVolume(id: string, volume: number) {
    const stem = this.stems.get(id);
    if (stem) {
      stem.gain.gain.setTargetAtTime(Math.max(0, volume), this.context.currentTime, 0.05);
    }
  }

  public setStemPan(id: string, pan: number) {
    const stem = this.stems.get(id);
    if (stem) {
      stem.panner.pan.setTargetAtTime(Math.max(-1, Math.min(1, pan)), this.context.currentTime, 0.05);
    }
  }

  public setStemEQ(id: string, band: 'low' | 'mid' | 'high', value: number) {
    const stem = this.stems.get(id);
    if (stem) {
      if (band === 'low') stem.eqLow.gain.setTargetAtTime(value, this.context.currentTime, 0.05);
      if (band === 'mid') stem.eqMid.gain.setTargetAtTime(value, this.context.currentTime, 0.05);
      if (band === 'high') stem.eqHigh.gain.setTargetAtTime(value, this.context.currentTime, 0.05);
    }
  }

  public setPlaybackRate(rate: number) {
    this.playbackRate = rate;
    if (this.isPlaying) {
      this.stems.forEach((stem) => {
        if (stem.source) stem.source.playbackRate.value = rate;
      });
      // Adjust start time so calculation holds
      const currentPos = this.getCurrentTime();
      this.pauseTime = currentPos;
      this.startTime = this.context.currentTime;
    }
  }

  public toggleMetronome(enabled: boolean, bpm: number, timeSignatureStr: string = "4/4") {
    this.clickTrackEnabled = enabled;
    this.bpm = bpm;
    
    const parts = timeSignatureStr.split('/');
    if (parts.length === 2) {
      this.timeSignature = [parseInt(parts[0], 10) || 4, parseInt(parts[1], 10) || 4];
    }

    if (enabled && this.isPlaying) {
      this.nextClickTime = this.context.currentTime;
      this.scheduleMetronome();
    } else if (!enabled && this.clickTimerId) {
      clearTimeout(this.clickTimerId);
      this.clickTimerId = null;
    }
  }

  public updateMetronomeParams(bpm: number, timeSignatureStr: string) {
    this.bpm = bpm;
    const parts = timeSignatureStr.split('/');
    if (parts.length === 2) {
      this.timeSignature = [parseInt(parts[0], 10) || 4, parseInt(parts[1], 10) || 4];
    }
  }

  private scheduleMetronome() {
    if (!this.isPlaying || !this.clickTrackEnabled) return;
    
    const secondsPerBeat = 60.0 / (this.bpm * this.playbackRate);
    // Lookahead scheduling
    while (this.nextClickTime < this.context.currentTime + 0.1) {
      // Determine if beat is accented
      const isAccent = this.currentBeat === 0;
      this.playClick(this.nextClickTime, isAccent);
      
      this.nextClickTime += secondsPerBeat;
      this.currentBeat = (this.currentBeat + 1) % this.timeSignature[0];
    }
    
    this.clickTimerId = window.setTimeout(() => this.scheduleMetronome(), 25);
  }

  private playClick(time: number, isAccent: boolean) {
    const osc = this.context.createOscillator();
    const env = this.context.createGain();
    
    osc.connect(env);
    env.connect(this.clickGain);
    
    // Beat frequency
    osc.frequency.setValueAtTime(isAccent ? 1200 : 800, time);
    env.gain.setValueAtTime(isAccent ? 1 : 0.6, time);
    env.gain.exponentialRampToValueAtTime(0.001, time + 0.1);
    
    osc.start(time);
    osc.stop(time + 0.1);
  }

  public extractPeaks(buckets: number = 120): number[] {
    const peaks = new Array(buckets).fill(0);
    if (this.stems.size === 0) return peaks;

    // Use the first available stem or a specific master track if identified
    let bufferToAnalyze: AudioBuffer | null = null;
    for (const stem of this.stems.values()) {
        bufferToAnalyze = stem.buffer;
        break; 
    }

    if (!bufferToAnalyze) return peaks;

    const channelData = bufferToAnalyze.getChannelData(0);
    const blockSize = Math.floor(channelData.length / buckets);

    for (let i = 0; i < buckets; i++) {
        let max = 0;
        const start = i * blockSize;
        for (let j = 0; j < blockSize && start + j < channelData.length; j++) {
            const val = Math.abs(channelData[start + j]);
            if (val > max) max = val;
        }
        peaks[i] = max;
    }
    
    // Normalize
    const maxPeak = Math.max(...peaks) || 1;
    return peaks.map(p => (p / maxPeak) * 100);
  }

  public clearStems() {
    this.pause();
    this.stems.clear();
  }

  public getContext() {
    return this.context;
  }
}

export const audioEngine = new AudioEngine();

