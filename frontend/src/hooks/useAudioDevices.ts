import { useCallback, useEffect, useRef, useState } from 'react';
import { applyMicrophoneGain, buildAudioConstraints, rmsLevel } from '../lib/audio-input';
import { useAudioReactor } from '../lib/audio-reactor';
import { useAppStore } from '../lib/store';

export type MicrophonePermission = 'unknown' | 'granted' | 'denied' | 'unsupported';

export function useAudioDevices() {
  const settings = useAppStore((state) => state.settings);
  const updateSettings = useAppStore((state) => state.updateSettings);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [permission, setPermission] = useState<MicrophonePermission>('unknown');
  const [level, setLevel] = useState(0);
  const [testing, setTesting] = useState(false);
  const [gainSupported, setGainSupported] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const stopTestRef = useRef<() => void>(() => {});

  const enumerate = useCallback(async () => {
    if (!navigator.mediaDevices?.enumerateDevices) {
      setPermission('unsupported');
      setDevices([]);
      return;
    }
    const next = (await navigator.mediaDevices.enumerateDevices()).filter(
      (device) => device.kind === 'audioinput',
    );
    setDevices(next);
  }, []);

  const requestAccess = useCallback(async () => {
    setError(null);
    if (!navigator.mediaDevices?.getUserMedia) {
      setPermission('unsupported');
      setError('Windows WebView no expone acceso al micrófono.');
      return false;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: buildAudioConstraints(settings),
      });
      stream.getTracks().forEach((track) => track.stop());
      setPermission('granted');
      await enumerate();
      return true;
    } catch (cause) {
      const name = cause instanceof DOMException ? cause.name : '';
      setPermission(name === 'NotAllowedError' ? 'denied' : 'unknown');
      setError(
        name === 'NotAllowedError'
          ? 'Permiso denegado. Activa el micrófono para ZAREK en Privacidad de Windows.'
          : 'No se pudo abrir el micrófono seleccionado. Comprueba que siga conectado.',
      );
      return false;
    }
  }, [enumerate, settings]);

  const stopTest = useCallback(() => stopTestRef.current(), []);

  const startTest = useCallback(async () => {
    stopTestRef.current();
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: buildAudioConstraints(settings),
      });
      setPermission('granted');
      const track = stream.getAudioTracks()[0];
      setGainSupported(await applyMicrophoneGain(track, settings.microphoneGain));

      const context = new AudioContext({ latencyHint: 'interactive' });
      const analyser = context.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.72;
      const source = context.createMediaStreamSource(stream);
      source.connect(analyser);
      if (context.state === 'suspended') await context.resume();
      const samples = new Uint8Array(analyser.fftSize);
      let frame = 0;
      let timeout = 0;

      const stop = () => {
        cancelAnimationFrame(frame);
        window.clearTimeout(timeout);
        source.disconnect();
        analyser.disconnect();
        stream.getTracks().forEach((item) => item.stop());
        void context.close();
        setTesting(false);
        setLevel(0);
        useAudioReactor.getState().setBands({ level: 0, bass: 0, mid: 0, treble: 0 });
        useAudioReactor.getState().setSourceMode('standby');
      };
      stopTestRef.current = stop;
      track.addEventListener('ended', () => {
        stop();
        setError('El micrófono se desconectó durante la prueba.');
        void enumerate();
      }, { once: true });

      const sample = () => {
        analyser.getByteTimeDomainData(samples);
        const nextLevel = rmsLevel(samples);
        setLevel(nextLevel);
        useAudioReactor.getState().setSourceMode('listening');
        useAudioReactor.getState().setBands({
          level: nextLevel,
          bass: nextLevel * 0.9,
          mid: nextLevel,
          treble: nextLevel * 0.72,
        });
        frame = requestAnimationFrame(sample);
      };
      setTesting(true);
      sample();
      timeout = window.setTimeout(stop, 12_000);
    } catch (cause) {
      const name = cause instanceof DOMException ? cause.name : '';
      setPermission(name === 'NotAllowedError' ? 'denied' : 'unknown');
      setError(name === 'NotAllowedError'
        ? 'Permiso de micrófono denegado por Windows.'
        : 'No se pudo probar el dispositivo seleccionado.');
    }
  }, [enumerate, settings]);

  useEffect(() => {
    void enumerate();
    const onDeviceChange = () => void enumerate();
    navigator.mediaDevices?.addEventListener('devicechange', onDeviceChange);
    return () => {
      navigator.mediaDevices?.removeEventListener('devicechange', onDeviceChange);
      stopTestRef.current();
    };
  }, [enumerate]);

  useEffect(() => {
    if (
      settings.audioInputDeviceId !== 'default'
      && devices.length > 0
      && !devices.some((device) => device.deviceId === settings.audioInputDeviceId)
    ) {
      updateSettings({ audioInputDeviceId: 'default' });
    }
  }, [devices, settings.audioInputDeviceId, updateSettings]);

  return {
    devices,
    permission,
    level,
    testing,
    gainSupported,
    error,
    refresh: enumerate,
    requestAccess,
    startTest,
    stopTest,
  };
}
