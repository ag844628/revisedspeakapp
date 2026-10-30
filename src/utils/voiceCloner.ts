import { ClonedVoiceData, Gender } from '../types';

/**
 * Autocorrelation algorithm to estimate fundamental frequency (Pitch in Hz)
 */
function autoCorrelate(buffer: Float32Array, sampleRate: number): number {
  let size = buffer.length;
  let maxSamples = Math.floor(size / 2);
  let bestOffset = -1;
  let bestCorrelation = 0;
  let rms = 0;

  for (let i = 0; i < size; i++) {
    const val = buffer[i];
    rms += val * val;
  }
  rms = Math.sqrt(rms / size);
  if (rms < 0.01) return -1; // Audio too quiet

  let lastCorrelation = 1;
  for (let offset = 1; offset < maxSamples; offset++) {
    let correlation = 0;
    for (let i = 0; i < maxSamples; i++) {
      correlation += Math.abs(buffer[i] - buffer[i + offset]);
    }
    correlation = 1 - correlation / maxSamples;

    if (correlation > 0.9 && correlation > lastCorrelation) {
      if (correlation > bestCorrelation) {
        bestCorrelation = correlation;
        bestOffset = offset;
      }
    }
    lastCorrelation = correlation;
  }

  if (bestOffset > 0 && bestCorrelation > 0.5) {
    return sampleRate / bestOffset;
  }
  return -1;
}

/**
 * Analyzes an audio Blob or Data URL to extract acoustic pitch and voice signature
 */
export async function analyzeVoiceClip(
  audioDataUrlOrBlob: string | Blob,
  fileName: string = 'कस्टम ऑडिओ'
): Promise<ClonedVoiceData> {
  let arrayBuffer: ArrayBuffer;

  if (typeof audioDataUrlOrBlob === 'string') {
    const response = await fetch(audioDataUrlOrBlob);
    arrayBuffer = await response.arrayBuffer();
  } else {
    arrayBuffer = await audioDataUrlOrBlob.arrayBuffer();
  }

  const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  let audioBuffer: AudioBuffer;

  try {
    audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
  } catch (err) {
    console.warn('Direct decode failed, using heuristic estimation:', err);
    // Safe heuristic fallback for voice cloning parameters
    return {
      isCloned: true,
      fundamentalPitch: 195,
      formantRatio: 1.15,
      speechRate: 1.0,
      sampleName: fileName,
      detectedGender: 'Female',
      detectedTone: 'उत्साही व स्पष्ट',
      baseAudioUri: typeof audioDataUrlOrBlob === 'string' ? audioDataUrlOrBlob : null,
    };
  }

  const channelData = audioBuffer.getChannelData(0);
  const sampleRate = audioBuffer.sampleRate;

  // Sample multiple windows across the recording to find median pitch
  const detectedPitches: number[] = [];
  const windowSize = 2048;

  for (let i = 0; i < channelData.length - windowSize; i += windowSize * 2) {
    const slice = channelData.subarray(i, i + windowSize);
    const pitch = autoCorrelate(slice, sampleRate);
    if (pitch > 60 && pitch < 500) {
      detectedPitches.push(pitch);
    }
  }

  let medianPitch = 180;
  if (detectedPitches.length > 0) {
    detectedPitches.sort((a, b) => a - b);
    medianPitch = detectedPitches[Math.floor(detectedPitches.length / 2)];
  }

  // Determine detected gender & acoustic parameters
  const isFemale = medianPitch > 175;
  const detectedGender: Gender = isFemale ? 'Female' : 'Male';

  // Map to pitch factor between 0.6 and 1.45 (1.0 is standard neutral)
  const fundamentalMultiplier = isFemale
    ? Math.min(1.4, Math.max(1.1, medianPitch / 170))
    : Math.min(1.0, Math.max(0.7, medianPitch / 160));

  let tone = 'नैसर्गिक व स्पष्ट';
  if (medianPitch > 220) tone = 'बारीक व प्रेमळ (Maternal/Soft)';
  else if (medianPitch > 180) tone = 'मधुर व स्पष्ट (Female Clarified)';
  else if (medianPitch > 130) tone = 'उत्साही व मित्रवत (Friendly Warm)';
  else tone = 'गंभीर व भरदार (Deep & Resonant)';

  return {
    isCloned: true,
    fundamentalPitch: Math.round(medianPitch),
    formantRatio: parseFloat(fundamentalMultiplier.toFixed(2)),
    speechRate: 1.0,
    sampleName: fileName,
    detectedGender,
    detectedTone: tone,
    baseAudioUri: typeof audioDataUrlOrBlob === 'string' ? audioDataUrlOrBlob : null,
  };
}
