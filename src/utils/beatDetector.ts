export interface BeatDetectionResult {
  bpm: number;
  offset: number; // offset in seconds
  clickLeft: Float32Array;
  clickRight: Float32Array;
}

/**
 * Generates a Click/Tap PCM audio buffer with accented beats according to time signature.
 */
export function generateClickPCM(
  totalSamples: number,
  bpm: number,
  offsetSec: number = 0,
  timeSignatureStr: string = '4/4',
  sampleRate: number = 44100
): { clickLeft: Float32Array; clickRight: Float32Array } {
  const clickLeft = new Float32Array(totalSamples);
  const clickRight = new Float32Array(totalSamples);
  if (totalSamples <= 0 || bpm <= 0) return { clickLeft, clickRight };

  const parts = timeSignatureStr.split('/');
  const numerator = parseInt(parts[0], 10) || 4;
  const denominator = parseInt(parts[1], 10) || 4;

  // Calculate pulse interval in samples
  let samplesPerPulse = (60 * sampleRate) / bpm;
  if (denominator === 8) {
    samplesPerPulse = (60 * sampleRate) / (bpm * 2);
  } else if (denominator === 2) {
    samplesPerPulse = ((60 * sampleRate) / bpm) * 2;
  }

  const startSample = Math.max(0, Math.round(offsetSec * sampleRate));
  const clickDurationSamples = Math.floor(sampleRate * 0.025); // 25ms per click

  let beatIndex = 0;
  for (let p = startSample; p < totalSamples; p += samplesPerPulse) {
    const currentSample = Math.round(p);
    const beatInMeasure = beatIndex % numerator;

    const isDownbeat = beatInMeasure === 0;
    let isSecondaryAccent = false;

    if (timeSignatureStr === '6/8') {
      isSecondaryAccent = beatInMeasure === 3;
    } else if (timeSignatureStr === '12/8') {
      isSecondaryAccent = beatInMeasure === 3 || beatInMeasure === 6 || beatInMeasure === 9;
    } else if (timeSignatureStr === '5/4') {
      isSecondaryAccent = beatInMeasure === 3;
    }

    const freq = isDownbeat ? 1600 : isSecondaryAccent ? 1300 : 1000;
    const volume = isDownbeat ? 0.95 : isSecondaryAccent ? 0.82 : 0.70;

    for (let i = 0; i < clickDurationSamples; i++) {
      const targetIdx = currentSample + i;
      if (targetIdx >= totalSamples) break;

      const tSec = i / sampleRate;
      const attack = Math.min(1.0, i / (sampleRate * 0.001));
      const decay = Math.exp(-i / (sampleRate * 0.004));
      const envelope = attack * decay * volume;

      const tone = Math.sin(2 * Math.PI * freq * tSec) + 0.3 * Math.sin(2 * Math.PI * (freq * 1.5) * tSec);
      const val = tone * envelope * 0.5;

      clickLeft[targetIdx] += val;
      clickRight[targetIdx] += val;
    }

    beatIndex++;
  }

  return { clickLeft, clickRight };
}

/**
 * Creates a WAV File and Object URL from stereo PCM Float32Arrays.
 */
export function createWavFileFromPCM(
  left: Float32Array,
  right: Float32Array,
  filename: string = 'click.wav',
  sampleRate: number = 44100
): { file: File; url: string } {
  const numChannels = 2;
  const length = left.length;
  const buffer = new ArrayBuffer(44 + length * numChannels * 2);
  const view = new DataView(buffer);

  const writeString = (offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };

  writeString(0, 'RIFF');
  view.setUint32(4, 36 + length * numChannels * 2, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * numChannels * 2, true);
  view.setUint16(32, numChannels * 2, true);
  view.setUint16(34, 16, true);
  writeString(36, 'data');
  view.setUint32(40, length * numChannels * 2, true);

  let offset = 44;
  for (let i = 0; i < length; i++) {
    let l = Math.max(-1, Math.min(1, left[i]));
    let r = Math.max(-1, Math.min(1, right[i]));
    view.setInt16(offset, l < 0 ? l * 0x8000 : l * 0x7FFF, true);
    view.setInt16(offset + 2, r < 0 ? r * 0x8000 : r * 0x7FFF, true);
    offset += 4;
  }

  const blob = new Blob([buffer], { type: 'audio/wav' });
  const file = new File([blob], filename, { type: 'audio/wav' });
  const url = URL.createObjectURL(file);

  return { file, url };
}

/**
 * Detects BPM and first beat offset from audio channels (preferring drums stem or full mix),
 * and generates a high-quality, synchronized click/tap PCM track.
 */
export function detectBeatAndGenerateClick(
  leftChannel: Float32Array,
  rightChannel: Float32Array,
  sampleRate: number = 44100,
  timeSignatureStr: string = '4/4'
): BeatDetectionResult {
  const totalSamples = leftChannel.length;
  if (totalSamples === 0) {
    return {
      bpm: 120,
      offset: 0,
      clickLeft: new Float32Array(0),
      clickRight: new Float32Array(0),
    };
  }

  // 1. Create mono mix
  const mono = new Float32Array(totalSamples);
  for (let i = 0; i < totalSamples; i++) {
    mono[i] = 0.5 * (leftChannel[i] + rightChannel[i]);
  }

  // 2. Onset Detection Envelope
  const hopSize = 512;
  const numFrames = Math.floor(totalSamples / hopSize);
  const onset = new Float32Array(numFrames);

  let prevEnergy = 0;
  for (let f = 0; f < numFrames; f++) {
    let energy = 0;
    const start = f * hopSize;
    const end = Math.min(start + hopSize, totalSamples);
    
    for (let i = start; i < end - 1; i++) {
      const diff = mono[i + 1] - mono[i];
      energy += diff * diff;
    }
    
    const diffEnergy = energy - prevEnergy;
    onset[f] = diffEnergy > 0 ? diffEnergy : 0;
    prevEnergy = energy;
  }

  let maxOnset = 0;
  for (let f = 0; f < numFrames; f++) {
    if (onset[f] > maxOnset) maxOnset = onset[f];
  }
  if (maxOnset > 0) {
    for (let f = 0; f < numFrames; f++) {
      onset[f] /= maxOnset;
    }
  }

  // 3. Autocorrelation for BPM estimation
  const minBpm = 65;
  const maxBpm = 180;
  const minLag = Math.floor((60 * sampleRate) / (maxBpm * hopSize));
  const maxLag = Math.ceil((60 * sampleRate) / (minBpm * hopSize));

  let maxCorr = -1;
  let bestLag = Math.floor((60 * sampleRate) / (120 * hopSize));

  for (let lag = minLag; lag <= maxLag; lag++) {
    let corr = 0;
    const limit = numFrames - lag;
    for (let f = 0; f < limit; f++) {
      corr += onset[f] * onset[f + lag];
    }

    const bpmForLag = (60 * sampleRate) / (lag * hopSize);
    let weight = 1.0;
    if (bpmForLag >= 90 && bpmForLag <= 150) {
      weight = 1.15;
    }

    const weightedCorr = corr * weight;
    if (weightedCorr > maxCorr) {
      maxCorr = weightedCorr;
      bestLag = lag;
    }
  }

  let rawBpm = (60 * sampleRate) / (bestLag * hopSize);
  let bpm = Math.round(rawBpm);
  if (bpm < 60) bpm *= 2;
  if (bpm > 190) bpm = Math.round(bpm / 2);

  const samplesPerBeat = (60 * sampleRate) / bpm;

  // 4. Phase Offset Detection
  const stepSamples = Math.floor(sampleRate * 0.01); // 10ms step
  let maxPhaseEnergy = -1;
  let bestOffsetSamples = 0;

  for (let o = 0; o < samplesPerBeat; o += stepSamples) {
    let energySum = 0;
    for (let p = o; p < totalSamples; p += samplesPerBeat) {
      const frameIdx = Math.floor(p / hopSize);
      if (frameIdx < numFrames) {
        energySum += onset[frameIdx];
      }
    }
    if (energySum > maxPhaseEnergy) {
      maxPhaseEnergy = energySum;
      bestOffsetSamples = o;
    }
  }

  let fineOffsetSamples = bestOffsetSamples;
  let fineMaxEnergy = -1;
  const fineStep = Math.floor(sampleRate * 0.002); // 2ms step
  for (
    let o = Math.max(0, bestOffsetSamples - stepSamples);
    o <= Math.min(totalSamples - 1, bestOffsetSamples + stepSamples);
    o += fineStep
  ) {
    let energySum = 0;
    for (let p = o; p < totalSamples; p += samplesPerBeat) {
      const frameIdx = Math.floor(p / hopSize);
      if (frameIdx < numFrames) {
        energySum += onset[frameIdx];
      }
    }
    if (energySum > fineMaxEnergy) {
      fineMaxEnergy = energySum;
      fineOffsetSamples = o;
    }
  }

  const offsetSec = fineOffsetSamples / sampleRate;

  // 5. Generate Click PCM Track using time signature
  const { clickLeft, clickRight } = generateClickPCM(
    totalSamples,
    bpm,
    offsetSec,
    timeSignatureStr,
    sampleRate
  );

  return {
    bpm,
    offset: offsetSec,
    clickLeft,
    clickRight,
  };
}

/**
 * Refines the first beat phase offset (in seconds) for a known BPM by finding the phase shift
 * that maximizes transient onset alignment across the track.
 */
export function refineOffsetForBpm(
  leftChannel: Float32Array,
  rightChannel: Float32Array,
  bpm: number,
  sampleRate: number = 44100
): number {
  const totalSamples = leftChannel.length;
  if (totalSamples === 0 || bpm <= 0) return 0;

  const mono = new Float32Array(totalSamples);
  for (let i = 0; i < totalSamples; i++) {
    mono[i] = 0.5 * (leftChannel[i] + rightChannel[i]);
  }

  const hopSize = 512;
  const numFrames = Math.floor(totalSamples / hopSize);
  const onset = new Float32Array(numFrames);

  let prevEnergy = 0;
  for (let f = 0; f < numFrames; f++) {
    let energy = 0;
    const start = f * hopSize;
    const end = Math.min(start + hopSize, totalSamples);
    for (let i = start; i < end - 1; i++) {
      const diff = mono[i + 1] - mono[i];
      energy += diff * diff;
    }
    const diffEnergy = energy - prevEnergy;
    onset[f] = diffEnergy > 0 ? diffEnergy : 0;
    prevEnergy = energy;
  }

  let maxOnset = 0;
  for (let f = 0; f < numFrames; f++) {
    if (onset[f] > maxOnset) maxOnset = onset[f];
  }
  if (maxOnset > 0) {
    for (let f = 0; f < numFrames; f++) {
      onset[f] /= maxOnset;
    }
  }

  const samplesPerBeat = (60 * sampleRate) / bpm;
  const stepSamples = Math.floor(sampleRate * 0.005); // 5ms step
  let maxPhaseEnergy = -1;
  let bestOffsetSamples = 0;

  for (let o = 0; o < samplesPerBeat; o += stepSamples) {
    let energySum = 0;
    for (let p = o; p < totalSamples; p += samplesPerBeat) {
      const frameIdx = Math.floor(p / hopSize);
      if (frameIdx < numFrames) {
        energySum += onset[frameIdx];
      }
    }
    if (energySum > maxPhaseEnergy) {
      maxPhaseEnergy = energySum;
      bestOffsetSamples = o;
    }
  }

  let fineOffsetSamples = bestOffsetSamples;
  let fineMaxEnergy = -1;
  const fineStep = Math.floor(sampleRate * 0.001); // 1ms fine step
  for (
    let o = Math.max(0, bestOffsetSamples - stepSamples);
    o <= Math.min(totalSamples - 1, bestOffsetSamples + stepSamples);
    o += fineStep
  ) {
    let energySum = 0;
    for (let p = o; p < totalSamples; p += samplesPerBeat) {
      const frameIdx = Math.floor(p / hopSize);
      if (frameIdx < numFrames) {
        energySum += onset[frameIdx];
      }
    }
    if (energySum > fineMaxEnergy) {
      fineMaxEnergy = energySum;
      fineOffsetSamples = o;
    }
  }

  return fineOffsetSamples / sampleRate;
}
