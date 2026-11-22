import { describe, expect, it } from 'vitest';
import { buildAudioConstraints, extractWakeCommand, rmsLevel } from './audio-input';

describe('audio input', () => {
  it('uses the selected device and audio processing constraints', () => {
    expect(buildAudioConstraints({
      audioInputDeviceId: 'usb-mic', microphoneGain: 1,
      noiseSuppression: true, echoCancellation: true, autoGainControl: false,
    })).toMatchObject({ deviceId: { exact: 'usb-mic' }, noiseSuppression: true, autoGainControl: false });
  });

  it('extracts commands following the configurable wake word', () => {
    expect(extractWakeCommand('Jarvis, abre el panel', 'Jarvis')).toEqual({
      detected: true,
      command: 'abre el panel',
    });
    expect(extractWakeCommand('buenos días', 'Jarvis').detected).toBe(false);
  });

  it('accepts the next utterance while armed', () => {
    expect(extractWakeCommand('Qué tiempo hará hoy', 'Jarvis', true)).toEqual({
      detected: true,
      command: 'Qué tiempo hará hoy',
    });
  });

  it('accepts a one-character recognition variation of the wake word', () => {
    expect(extractWakeCommand('Yarvis dime la hora', 'Jarvis')).toEqual({
      detected: true,
      command: 'dime la hora',
    });
  });

  it('normalizes time-domain samples into a safe level', () => {
    expect(rmsLevel(new Uint8Array([128, 128, 128]))).toBe(0);
    expect(rmsLevel(new Uint8Array([0, 255, 0, 255]))).toBeLessThanOrEqual(1);
  });
});
