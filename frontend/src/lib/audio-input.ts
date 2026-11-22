import type { Settings } from './store';

export type AudioCaptureSettings = Pick<
  Settings,
  | 'audioInputDeviceId'
  | 'microphoneGain'
  | 'noiseSuppression'
  | 'echoCancellation'
  | 'autoGainControl'
>;

export function buildAudioConstraints(settings: AudioCaptureSettings): MediaTrackConstraints {
  return {
    deviceId:
      settings.audioInputDeviceId && settings.audioInputDeviceId !== 'default'
        ? { exact: settings.audioInputDeviceId }
        : undefined,
    channelCount: 1,
    noiseSuppression: settings.noiseSuppression,
    echoCancellation: settings.echoCancellation,
    autoGainControl: settings.autoGainControl,
  };
}

export async function applyMicrophoneGain(
  track: MediaStreamTrack,
  gain: number,
): Promise<boolean> {
  const capabilities = track.getCapabilities?.() as MediaTrackCapabilities & {
    volume?: { min: number; max: number };
  };
  if (!capabilities?.volume || !track.applyConstraints) return false;
  const value = Math.max(capabilities.volume.min, Math.min(capabilities.volume.max, gain));
  try {
    await track.applyConstraints({ advanced: [{ volume: value } as MediaTrackConstraintSet] });
    return true;
  } catch {
    return false;
  }
}

export function rmsLevel(data: Uint8Array): number {
  let sum = 0;
  for (const sample of data) {
    const normalized = (sample - 128) / 128;
    sum += normalized * normalized;
  }
  return Math.min(1, Math.sqrt(sum / Math.max(1, data.length)) * 3.4);
}

function normalizeSpeech(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('es')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function isWakeWordMatch(candidate: string, target: string): boolean {
  if (candidate === target) return true;
  if (target.length < 4 || Math.abs(candidate.length - target.length) > 1) return false;

  let previous = Array.from({ length: target.length + 1 }, (_, index) => index);
  for (let row = 1; row <= candidate.length; row += 1) {
    const current = [row];
    for (let column = 1; column <= target.length; column += 1) {
      const substitution = previous[column - 1]
        + (candidate[row - 1] === target[column - 1] ? 0 : 1);
      current[column] = Math.min(
        current[column - 1] + 1,
        previous[column] + 1,
        substitution,
      );
    }
    previous = current;
  }
  return previous[target.length] <= 1;
}

export interface WakeCommandResult {
  detected: boolean;
  command: string;
}

export function extractWakeCommand(
  transcript: string,
  wakeWord: string,
  alreadyArmed = false,
): WakeCommandResult {
  const normalized = normalizeSpeech(transcript);
  const target = normalizeSpeech(wakeWord) || 'jarvis';
  if (alreadyArmed) return { detected: true, command: transcript.trim() };

  const words = normalized.split(' ');
  const wakeWords = target.split(' ');
  const start = words.findIndex((_, index) =>
    wakeWords.every((part, offset) => isWakeWordMatch(words[index + offset] || '', part)),
  );
  if (start < 0) return { detected: false, command: '' };

  const command = words.slice(start + wakeWords.length).join(' ').trim();
  return { detected: true, command };
}

export function playWakeChime(): void {
  if (typeof AudioContext === 'undefined') return;
  const context = new AudioContext({ latencyHint: 'interactive' });
  const gain = context.createGain();
  gain.gain.setValueAtTime(0.0001, context.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.14, context.currentTime + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.24);
  gain.connect(context.destination);
  [660, 990].forEach((frequency, index) => {
    const oscillator = context.createOscillator();
    oscillator.type = 'sine';
    oscillator.frequency.value = frequency;
    oscillator.connect(gain);
    oscillator.start(context.currentTime + index * 0.055);
    oscillator.stop(context.currentTime + 0.25);
  });
  window.setTimeout(() => void context.close(), 350);
}
