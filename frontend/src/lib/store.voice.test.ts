import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

class MemoryStorage {
  private data = new Map<string, string>();
  getItem(key: string) { return this.data.get(key) ?? null; }
  setItem(key: string, value: string) { this.data.set(key, value); }
  removeItem(key: string) { this.data.delete(key); }
  clear() { this.data.clear(); }
}

beforeEach(() => {
  vi.resetModules();
  vi.stubGlobal('localStorage', new MemoryStorage());
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('voice preference persistence', () => {
  it('restores the selected profile after a fresh store import', async () => {
    const first = await import('./store');
    first.useAppStore.getState().updateSettings({
      ttsProvider: 'kokoro',
      ttsVoiceId: 'em_alex,em_santa',
      ttsVoiceSpeed: 1.04,
      ttsVoiceVolume: 0.7,
    });

    vi.resetModules();
    const restored = await import('./store');
    expect(restored.useAppStore.getState().settings).toMatchObject({
      ttsProvider: 'kokoro',
      ttsVoiceId: 'em_alex,em_santa',
      ttsVoiceSpeed: 1.04,
      ttsVoiceVolume: 0.7,
    });
  });
});
