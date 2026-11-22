import { describe, expect, it, vi } from 'vitest';
import { assessTranscription, buildAudioConstraints, extractWakeCommand, openMicrophone, rmsLevel } from './audio-input';

describe('audio input', () => {
  it('uses the selected device and audio processing constraints', () => {
    expect(buildAudioConstraints({
      audioInputDeviceId: 'usb-mic', microphoneGain: 1,
      noiseSuppression: true, echoCancellation: true, autoGainControl: false,
    })).toMatchObject({ deviceId: { exact: 'usb-mic' }, noiseSuppression: true, autoGainControl: false });
  });

  it('falls back to the Windows default when a saved device disappeared', async () => {
    const fallback = {} as MediaStream;
    const getUserMedia = vi.fn()
      .mockRejectedValueOnce(new DOMException('gone', 'NotFoundError'))
      .mockResolvedValueOnce(fallback);
    vi.stubGlobal('navigator', { mediaDevices: { getUserMedia } });
    const result = await openMicrophone({
      audioInputDeviceId: 'missing', microphoneGain: 1,
      noiseSuppression: true, echoCancellation: true, autoGainControl: true,
    });
    expect(result).toEqual({ stream: fallback, fellBackToDefault: true });
    expect(getUserMedia.mock.calls[1][0].audio.deviceId).toBeUndefined();
    vi.unstubAllGlobals();
  });

  it('extracts commands following the configurable wake word', () => {
    expect(extractWakeCommand('Jarvis, abre el panel', 'Jarvis')).toEqual({
      detected: true,
      command: 'abre el panel',
      rawTranscript: 'Jarvis, abre el panel',
    });
    expect(extractWakeCommand('buenos días', 'Jarvis').detected).toBe(false);
  });

  it('accepts the next utterance while armed', () => {
    expect(extractWakeCommand('Qué tiempo hará hoy', 'Jarvis', true)).toEqual({
      detected: true,
      command: 'Qué tiempo hará hoy',
      rawTranscript: 'Qué tiempo hará hoy',
    });
  });

  it('accepts a one-character recognition variation of the wake word', () => {
    expect(extractWakeCommand('Yarvis dime la hora', 'Jarvis')).toEqual({
      detected: true,
      command: 'dime la hora',
      rawTranscript: 'Yarvis dime la hora',
    });
  });

  it('preserves accents and casing in the command after wake matching', () => {
    expect(extractWakeCommand('JARVIS, ¿Qué hora es en Perú?', 'Jarvis').command)
      .toBe('¿Qué hora es en Perú?');
  });

  it('rejects silence hallucinations and low-confidence orders', () => {
    const base = { language: 'es', duration_seconds: 1, average_log_probability: -0.2 };
    expect(assessTranscription({ ...base, text: 'Поехали', confidence: 0.8, no_speech_probability: 0.1 }).accepted).toBe(false);
    expect(assessTranscription({ ...base, text: 'borra todo', confidence: 0.05, no_speech_probability: 0.1 }).accepted).toBe(false);
    expect(assessTranscription({ ...base, text: '¿Qué hora es?', confidence: 0.72, no_speech_probability: 0.03 })).toMatchObject({ accepted: true });
  });

  it('normalizes time-domain samples into a safe level', () => {
    expect(rmsLevel(new Uint8Array([128, 128, 128]))).toBe(0);
    expect(rmsLevel(new Uint8Array([0, 255, 0, 255]))).toBeLessThanOrEqual(1);
  });
});
