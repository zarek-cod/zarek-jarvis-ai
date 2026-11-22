import type { Settings } from './store';
import type { TranscriptionResult } from './api';

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

/** Open the selected device and recover transparently when Windows removed it. */
export async function openMicrophone(
  settings: AudioCaptureSettings,
): Promise<{ stream: MediaStream; fellBackToDefault: boolean }> {
  try {
    return {
      stream: await navigator.mediaDevices.getUserMedia({ audio: buildAudioConstraints(settings) }),
      fellBackToDefault: false,
    };
  } catch (error) {
    const selected = settings.audioInputDeviceId && settings.audioInputDeviceId !== 'default';
    const name = error instanceof DOMException ? error.name : '';
    if (!selected || !['NotFoundError', 'OverconstrainedError', 'DevicesNotFoundError'].includes(name)) {
      throw error;
    }
    return {
      stream: await navigator.mediaDevices.getUserMedia({
        audio: buildAudioConstraints({ ...settings, audioInputDeviceId: 'default' }),
      }),
      fellBackToDefault: true,
    };
  }
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

export function normalizeSpeech(value: string): string {
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
  /** Exact recognizer output before wake-word normalization. */
  rawTranscript: string;
}

export function extractWakeCommand(
  transcript: string,
  wakeWord: string,
  alreadyArmed = false,
): WakeCommandResult {
  const normalized = normalizeSpeech(transcript);
  const target = normalizeSpeech(wakeWord) || 'jarvis';
  if (alreadyArmed) return {
    detected: true,
    command: transcript.trim(),
    rawTranscript: transcript.trim(),
  };

  const originalWords = transcript.trim().split(/\s+/).filter(Boolean);
  const words = originalWords.map((word) => normalizeSpeech(word));
  const wakeWords = target.split(' ');
  const start = words.findIndex((_, index) =>
    wakeWords.every((part, offset) => isWakeWordMatch(words[index + offset] || '', part)),
  );
  if (start < 0) return { detected: false, command: '', rawTranscript: transcript.trim() };

  const command = originalWords
    .slice(start + wakeWords.length)
    .join(' ')
    .replace(/^[\s,.;:!?-]+/, '')
    .trim();
  return { detected: true, command, rawTranscript: transcript.trim() };
}

export interface TranscriptionAssessment {
  accepted: boolean;
  text: string;
  reason?: 'empty' | 'silence' | 'low-confidence' | 'wrong-language' | 'hallucination';
}

const SILENCE_HALLUCINATIONS = new Set([
  'поехали', 'спасибо за просмотр', 'thank you for watching',
  'subtitles by', 'amara org', 'gracias por ver', 'suscríbete',
]);

/**
 * Gate STT output before it can become either a prompt or an executable order.
 * The raw text remains untouched; normalization is used only for comparisons.
 */
export function assessTranscription(
  result: TranscriptionResult,
  expectedLanguage = 'es',
  minimumConfidence = 0.18,
): TranscriptionAssessment {
  const text = result.text.trim();
  if (!text) return { accepted: false, text, reason: 'empty' };
  if ((result.no_speech_probability ?? 0) >= 0.68) {
    return { accepted: false, text, reason: 'silence' };
  }
  const normalized = normalizeSpeech(text);
  if ([...SILENCE_HALLUCINATIONS].some((phrase) => normalized === normalizeSpeech(phrase))) {
    return { accepted: false, text, reason: 'hallucination' };
  }
  if (result.confidence != null && result.confidence < minimumConfidence) {
    return { accepted: false, text, reason: 'low-confidence' };
  }
  if (
    expectedLanguage
    && result.language
    && result.language.toLowerCase() !== expectedLanguage.toLowerCase()
    && (result.confidence ?? 0) >= 0.45
  ) {
    return { accepted: false, text, reason: 'wrong-language' };
  }
  const words = normalized.split(' ').filter(Boolean);
  if (words.length >= 6 && new Set(words).size <= 2) {
    return { accepted: false, text, reason: 'hallucination' };
  }
  return { accepted: true, text };
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
