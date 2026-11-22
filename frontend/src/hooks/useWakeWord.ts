import { useEffect, useRef, useState } from 'react';
import { transcribeAudio } from '../lib/api';
import {
  applyMicrophoneGain,
  assessTranscription,
  extractWakeCommand,
  playWakeChime,
  openMicrophone,
  rmsLevel,
} from '../lib/audio-input';
import { useAudioReactor } from '../lib/audio-reactor';
import { useAppStore } from '../lib/store';
import { useTtsStore } from '../lib/tts';

export type WakeStatus = 'off' | 'ready' | 'hearing' | 'transcribing' | 'armed' | 'error';

export function useWakeWord(onCommand: (command: string) => void) {
  const settings = useAppStore((state) => state.settings);
  const [status, setStatus] = useState<WakeStatus>('off');
  const [message, setMessage] = useState('Activación por voz desactivada');
  const commandRef = useRef(onCommand);
  commandRef.current = onCommand;

  const enabled = settings.speechEnabled
    && settings.wakeWordEnabled
    && settings.continuousListeningEnabled;

  useEffect(() => {
    if (!enabled) {
      setStatus('off');
      setMessage('Activación por voz desactivada');
      return;
    }
    let cancelled = false;
    let stream: MediaStream | null = null;
    let context: AudioContext | null = null;
    let frame = 0;
    let recorder: MediaRecorder | null = null;
    let segmentChunks: Blob[] = [];
    let capturing = false;
    let speechStartedAt = 0;
    let lastSpeechAt = 0;
    let armedUntil = 0;
    let processing = false;
    let ttsWasActive = false;

    const resetReactor = () => {
      useAudioReactor.getState().setBands({ level: 0, bass: 0, mid: 0, treble: 0 });
      useAudioReactor.getState().setSourceMode('standby');
    };

    const processSegment = async (blob: Blob) => {
      if (blob.size < 700 || cancelled) {
        processing = false;
        return;
      }
      setStatus('transcribing');
      setMessage('Interpretando audio local…');
      try {
        const result = await transcribeAudio(blob, 'wake.webm', settings.speechLanguage);
        if (cancelled) return;
        const assessment = assessTranscription(
          result,
          settings.speechLanguage,
          settings.transcriptionConfidence,
        );
        if (!assessment.accepted) {
          setStatus('ready');
          setMessage('Audio descartado · esperando una voz clara');
          return;
        }
        const wasArmed = performance.now() < armedUntil;
        const wake = extractWakeCommand(assessment.text, settings.wakeWord, wasArmed);
        if (!wake.detected) {
          setStatus('ready');
          setMessage(`Esperando “${settings.wakeWord || 'Jarvis'}”`);
          return;
        }
        if (!wasArmed && settings.wakeSoundEnabled) playWakeChime();
        if (wake.command.trim()) {
          armedUntil = 0;
          setStatus('armed');
          setMessage('Orden recibida');
          commandRef.current(wake.command.trim());
          window.setTimeout(() => {
            if (!cancelled) {
              setStatus('ready');
              setMessage(`Esperando “${settings.wakeWord || 'Jarvis'}”`);
            }
          }, 1500);
        } else {
          armedUntil = performance.now() + 8_000;
          setStatus('armed');
          setMessage('Sí, señor Zarek. Le escucho…');
        }
      } catch (cause) {
        if (!cancelled) {
          setStatus('error');
          setMessage(cause instanceof Error ? cause.message : 'Falló el reconocimiento local.');
        }
      } finally {
        processing = false;
      }
    };

    const start = async () => {
      try {
        const opened = await openMicrophone(settings);
        stream = opened.stream;
        if (opened.fellBackToDefault) {
          useAppStore.getState().updateSettings({ audioInputDeviceId: 'default' });
        }
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        const track = stream.getAudioTracks()[0];
        await applyMicrophoneGain(track, settings.microphoneGain);
        track.addEventListener('ended', () => {
          if (!cancelled) {
            setStatus('error');
            setMessage('Micrófono desconectado. Selecciona otro en Ajustes.');
          }
        }, { once: true });

        context = new AudioContext({ latencyHint: 'interactive' });
        const analyser = context.createAnalyser();
        analyser.fftSize = 256;
        analyser.smoothingTimeConstant = 0.68;
        const source = context.createMediaStreamSource(stream);
        source.connect(analyser);
        if (context.state === 'suspended') await context.resume();
        const samples = new Uint8Array(analyser.fftSize);
        let noiseFloor = 0.015;
        let calibrationSamples = 0;
        const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
          ? 'audio/webm;codecs=opus'
          : undefined;
        setStatus('ready');
        setMessage(`Esperando “${settings.wakeWord || 'Jarvis'}”`);

        const beginCapture = (now: number) => {
          segmentChunks = [];
          recorder = new MediaRecorder(stream!, mimeType ? { mimeType } : undefined);
          recorder.ondataavailable = (event) => {
            if (event.data.size > 0) segmentChunks.push(event.data);
          };
          recorder.onstop = () => {
            const blob = new Blob(segmentChunks, { type: recorder?.mimeType || 'audio/webm' });
            segmentChunks = [];
            recorder = null;
            void processSegment(blob);
          };
          recorder.start(160);
          capturing = true;
          speechStartedAt = now;
          lastSpeechAt = now;
          setStatus('hearing');
          setMessage(performance.now() < armedUntil ? 'Escuchando su orden…' : 'Analizando voz…');
          useAudioReactor.getState().setSourceMode('listening');
        };

        const finishCapture = () => {
          capturing = false;
          processing = true;
          resetReactor();
          if (recorder?.state === 'recording') {
            recorder.stop();
          } else {
            processing = false;
          }
        };

        const sample = (now: number) => {
          if (cancelled) return;
          // Do not let the always-on wake listener capture JARVIS through the
          // speakers and immediately cancel or loop its own reply. Explicit
          // barge-in still works: the large mic button and Ctrl+Shift+Space
          // call useSpeech(), which stops playback before opening the mic.
          const ttsActive = useTtsStore.getState().state !== 'idle';
          if (ttsActive) {
            if (!ttsWasActive) {
              ttsWasActive = true;
              setStatus('ready');
              setMessage('JARVIS está hablando · pulsa el micrófono para interrumpir');
              resetReactor();
            }
            frame = requestAnimationFrame(sample);
            return;
          }
          if (ttsWasActive) {
            ttsWasActive = false;
            setStatus('ready');
            setMessage(`Esperando “${settings.wakeWord || 'Jarvis'}”`);
          }
          analyser.getByteTimeDomainData(samples);
          const level = rmsLevel(samples);
          if (!capturing && !processing && calibrationSamples < 40) {
            noiseFloor = (noiseFloor * calibrationSamples + level) / (calibrationSamples + 1);
            calibrationSamples += 1;
          }
          const adaptiveThreshold = Math.max(settings.microphoneSensitivity, noiseFloor * 2.25);
          useAudioReactor.getState().setBands({
            level,
            bass: level * 0.86,
            mid: level,
            treble: level * 0.7,
          });
          if (level >= adaptiveThreshold) {
            lastSpeechAt = now;
            if (!capturing && !processing) {
              beginCapture(now);
            }
          }
          if (capturing && (
            (now - lastSpeechAt >= settings.silenceTimeoutMs && now - speechStartedAt > 360)
            || now - speechStartedAt >= 12_000
          )) {
            finishCapture();
          }
          if (armedUntil && now >= armedUntil && !capturing && !processing) {
            armedUntil = 0;
            setStatus('ready');
            setMessage(`Esperando “${settings.wakeWord || 'Jarvis'}”`);
          }
          frame = requestAnimationFrame(sample);
        };
        frame = requestAnimationFrame(sample);
      } catch (cause) {
        if (!cancelled) {
          setStatus('error');
          const name = cause instanceof DOMException ? cause.name : '';
          setMessage(name === 'NotAllowedError'
            ? 'Windows bloqueó el micrófono. Revisa los permisos.'
            : 'No se pudo iniciar la escucha continua.');
        }
      }
    };
    void start();

    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
      if (recorder?.state === 'recording') {
        recorder.onstop = null;
        recorder.stop();
      }
      stream?.getTracks().forEach((track) => track.stop());
      if (context && context.state !== 'closed') void context.close();
      resetReactor();
    };
  }, [enabled, settings]);

  return { status, message, enabled };
}
