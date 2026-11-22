import { useCallback, useEffect, useRef, useState } from 'react';
import { transcribeAudio, fetchSpeechHealth } from '../lib/api';
import { applyMicrophoneGain, buildAudioConstraints, rmsLevel } from '../lib/audio-input';
import { attachMicrophoneReactivity, stopMicrophoneReactivity } from '../lib/audio-reactor';
import { useAppStore } from '../lib/store';
import { useTtsStore } from '../lib/tts';

export type SpeechState = 'idle' | 'recording' | 'transcribing';

interface UseSpeechOptions {
  onTranscript?: (text: string) => void;
}

export function useSpeech({ onTranscript }: UseSpeechOptions = {}) {
  const settings = useAppStore((store) => store.settings);
  const [state, setState] = useState<SpeechState>('idle');
  const [error, setError] = useState<string | null>(null);
  const [available, setAvailable] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const contextRef = useRef<AudioContext | null>(null);
  const frameRef = useRef(0);
  const completionRef = useRef<Promise<string> | null>(null);
  const resolveRef = useRef<((text: string) => void) | null>(null);
  const rejectRef = useRef<((error: unknown) => void) | null>(null);
  const callbackRef = useRef(onTranscript);
  callbackRef.current = onTranscript;

  useEffect(() => {
    fetchSpeechHealth()
      .then((health) => setAvailable(health.available))
      .catch(() => setAvailable(false));
  }, []);

  const cleanupCapture = useCallback(() => {
    cancelAnimationFrame(frameRef.current);
    frameRef.current = 0;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    const context = contextRef.current;
    contextRef.current = null;
    if (context && context.state !== 'closed') void context.close();
    void stopMicrophoneReactivity();
  }, []);

  const startRecording = useCallback(async (): Promise<void> => {
    setError(null);
    if (!navigator.mediaDevices?.getUserMedia) {
      setError('Este sistema no ofrece acceso al micrófono.');
      return;
    }

    useTtsStore.getState().stop();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: buildAudioConstraints(settings),
      });
      streamRef.current = stream;
      const track = stream.getAudioTracks()[0];
      await applyMicrophoneGain(track, settings.microphoneGain);
      await attachMicrophoneReactivity(stream);

      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : undefined;
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      chunksRef.current = [];
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };

      completionRef.current = new Promise<string>((resolve, reject) => {
        resolveRef.current = resolve;
        rejectRef.current = reject;
      });
      recorder.onstop = async () => {
        setState('transcribing');
        cleanupCapture();
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || 'audio/webm' });
        chunksRef.current = [];
        try {
          const result = await transcribeAudio(blob);
          const text = result.text.trim();
          setState('idle');
          if (text) callbackRef.current?.(text);
          resolveRef.current?.(text);
        } catch (cause) {
          setState('idle');
          const message = cause instanceof Error ? cause.message : 'La transcripción local falló.';
          setError(message);
          rejectRef.current?.(cause);
        } finally {
          resolveRef.current = null;
          rejectRef.current = null;
        }
      };
      mediaRecorderRef.current = recorder;
      recorder.start(200);
      setState('recording');

      track.addEventListener('ended', () => {
        setError('El micrófono seleccionado se desconectó. Se usará el predeterminado en la próxima captura.');
        if (recorder.state === 'recording') recorder.stop();
      }, { once: true });

      if (settings.voiceActivationEnabled && typeof AudioContext !== 'undefined') {
        const context = new AudioContext({ latencyHint: 'interactive' });
        contextRef.current = context;
        const analyser = context.createAnalyser();
        analyser.fftSize = 256;
        const source = context.createMediaStreamSource(stream);
        source.connect(analyser);
        const samples = new Uint8Array(analyser.fftSize);
        const startedAt = performance.now();
        let hasSpeech = false;
        let lastSpeech = startedAt;
        const monitor = (now: number) => {
          analyser.getByteTimeDomainData(samples);
          if (rmsLevel(samples) >= settings.microphoneSensitivity) {
            hasSpeech = true;
            lastSpeech = now;
          }
          if (
            recorder.state === 'recording'
            && ((hasSpeech && now - lastSpeech >= settings.silenceTimeoutMs) || now - startedAt >= 20_000)
          ) {
            recorder.stop();
            return;
          }
          frameRef.current = requestAnimationFrame(monitor);
        };
        frameRef.current = requestAnimationFrame(monitor);
      }
    } catch (cause) {
      cleanupCapture();
      const name = cause instanceof DOMException ? cause.name : '';
      setError(name === 'NotAllowedError'
        ? 'Acceso al micrófono denegado. Revisa Privacidad > Micrófono en Windows.'
        : 'No se pudo abrir el micrófono seleccionado.');
      setState('idle');
    }
  }, [cleanupCapture, settings]);

  const stopRecording = useCallback(async (): Promise<string> => {
    const recorder = mediaRecorderRef.current;
    if (!recorder || recorder.state !== 'recording') {
      throw new Error('No hay una grabación activa.');
    }
    recorder.stop();
    return completionRef.current ?? '';
  }, []);

  useEffect(() => cleanupCapture, [cleanupCapture]);

  return {
    state,
    error,
    available,
    startRecording,
    stopRecording,
    isRecording: state === 'recording',
    isTranscribing: state === 'transcribing',
  };
}
