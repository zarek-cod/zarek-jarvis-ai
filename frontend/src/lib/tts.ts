import { create } from 'zustand';
import { synthesizeSpeech, fetchTtsHealth } from './api';
import { splitSpeakableText } from './message-text';
import { attachPlaybackReactivity, stopPlaybackReactivity } from './audio-reactor';

export type TtsState = 'idle' | 'loading' | 'speaking';

/**
 * Voice output is a single shared resource: one utterance at a time, for the
 * whole app. The state lives in one store rather than per component, because a
 * per-component hook would give every message its own audio element -- two
 * replies would then talk over each other, and autoplay would make that the
 * normal case rather than the exception.
 */
interface TtsStore {
  state: TtsState;
  /** id of the message currently loading or speaking, if any. */
  speakingId: string | null;
  error: string | null;
  /** Message whose read-aloud attempt failed, if any. */
  errorId: string | null;
  /** null until the health probe has answered. */
  available: boolean | null;
  /** Last message spoken by autoplay, so a re-render never repeats it. */
  autoSpokenId: string | null;
  /** Time from speak() to the first audible chunk. */
  firstAudioMs: number | null;
  speak: (id: string, text: string) => Promise<void>;
  /** Append a completed streaming phrase without interrupting the same reply. */
  enqueue: (id: string, text: string) => Promise<void>;
  stop: () => void;
  ensureHealth: () => Promise<void>;
  markAutoSpoken: (id: string) => void;
}

// Playback handles are not render state -- keeping them out of the store avoids
// re-rendering every subscriber when an audio element is swapped.
let audio: HTMLAudioElement | null = null;
let objectUrl: string | null = null;
let controller: AbortController | null = null;
let token = 0;
let healthProbe: Promise<void> | null = null;
let queuedChunks: string[] = [];
let preparedChunk: Promise<{ blob?: Blob; error?: unknown }> | null = null;
let primeQueue: (() => void) | null = null;

/** Only a stream ending in the active conversation may trigger autoplay. */
export function shouldAutoplayFinishedReply(
  previousStreamingConversationId: string | null,
  activeId: string | null,
  streamIsActive: boolean,
  lastMessage: { id: string; role: string } | undefined,
  autoSpokenId: string | null,
): boolean {
  return previousStreamingConversationId !== null
    && previousStreamingConversationId === activeId
    && !streamIsActive
    && lastMessage !== undefined
    && lastMessage.role === 'assistant'
    && lastMessage.id !== autoSpokenId;
}

function teardown(): void {
  void stopPlaybackReactivity();
  if (audio) {
    // Detach first: clearing src re-runs the media load algorithm, which fails
    // on an empty source and dispatches an `error` event. With the handler
    // still attached that surfaces as a bogus "Playback failed" after every
    // successful utterance.
    audio.onended = null;
    audio.onerror = null;
    audio.pause();
    audio.src = '';
    audio = null;
  }
  if (objectUrl) {
    URL.revokeObjectURL(objectUrl);
    objectUrl = null;
  }
  if (controller) {
    controller.abort();
    controller = null;
  }
  queuedChunks = [];
  preparedChunk = null;
  primeQueue = null;
}

function releaseCurrentAudio(): void {
  void stopPlaybackReactivity();
  if (audio) {
    audio.onended = null;
    audio.onerror = null;
    audio.pause();
    audio.src = '';
    audio = null;
  }
  if (objectUrl) {
    URL.revokeObjectURL(objectUrl);
    objectUrl = null;
  }
}

export const useTtsStore = create<TtsStore>((set, get) => ({
  state: 'idle',
  speakingId: null,
  error: null,
  errorId: null,
  available: null,
  autoSpokenId: null,
  firstAudioMs: null,

  ensureHealth: () => {
    if (healthProbe) return healthProbe;
    healthProbe = fetchTtsHealth()
      .then((health) => {
        set({ available: health.available });
        if (!health.available) healthProbe = null;
      })
      .catch(() => {
        set({ available: false });
        healthProbe = null;
      });
    return healthProbe;
  },

  markAutoSpoken: (id: string) => set({ autoSpokenId: id }),

  enqueue: async (id: string, text: string) => {
    const chunks = splitSpeakableText(text);
    if (chunks.length === 0) return;
    const current = get();
    if (current.speakingId === id && current.state !== 'idle') {
      queuedChunks.push(...chunks);
      primeQueue?.();
      return;
    }
    await current.speak(id, text);
  },

  speak: async (id: string, text: string) => {
    const chunks = splitSpeakableText(text);
    if (chunks.length === 0) return;

    // Bump before teardown so a synthesis still in flight is both aborted and
    // fenced off by the token, even if the abort loses the race.
    token += 1;
    const mine = token;
    teardown();
    queuedChunks = chunks.slice(1);
    set({ state: 'loading', speakingId: id, error: null, errorId: null, firstAudioMs: null });

    const ac = new AbortController();
    controller = ac;
    const startedAt = performance.now();

    const fail = (err: unknown) => {
      if (mine !== token) return;
      if (err instanceof DOMException && err.name === 'AbortError') return;
      teardown();
      set({
        state: 'idle',
        speakingId: null,
        error: err instanceof Error ? err.message : 'Speech synthesis failed',
        errorId: id,
      });
    };

    const prime = () => {
      if (mine !== token || preparedChunk || queuedChunks.length === 0) return;
      const nextText = queuedChunks.shift()!;
      // Always resolve to a tagged result so an interrupted prefetch can never
      // become an unhandled promise rejection after its audio handler is gone.
      preparedChunk = synthesizeSpeech(nextText, { signal: ac.signal })
        .then((blob) => ({ blob }))
        .catch((error) => ({ error }));
    };
    primeQueue = prime;

    const playChunk = async (blob: Blob): Promise<void> => {
      if (mine !== token) return;
      releaseCurrentAudio();
      const url = URL.createObjectURL(blob);
      objectUrl = url;
      const el = new Audio(url);
      audio = el;
      await attachPlaybackReactivity(el);

      // Prefetch the following phrase while this one is playing.  The queue is
      // strictly ordered and fenced by the utterance token, so interruption
      // cannot duplicate or leak a stale response.
      prime();
      el.onended = () => {
        if (mine !== token) return;
        const next = preparedChunk;
        preparedChunk = null;
        if (!next) {
          teardown();
          set({ state: 'idle', speakingId: null });
          return;
        }
        releaseCurrentAudio();
        void next.then((result) => {
          if (result.error) fail(result.error);
          else if (result.blob) void playChunk(result.blob);
        });
      };
      el.onerror = () => fail(new Error('Playback failed'));
      await el.play();
      if (mine === token) {
        set({
          state: 'speaking',
          speakingId: id,
          firstAudioMs: get().firstAudioMs ?? Math.round(performance.now() - startedAt),
        });
      }
    };

    try {
      const blob = await synthesizeSpeech(chunks[0], { signal: ac.signal });
      if (mine !== token) return;
      await playChunk(blob);
    } catch (err) {
      fail(err);
    }
  },

  stop: () => {
    token += 1;
    teardown();
    set({ state: 'idle', speakingId: null, error: null, errorId: null });
  },
}));

/** Test seam: reset module-level playback handles between cases. */
export function __resetTtsForTests(): void {
  teardown();
  token = 0;
  healthProbe = null;
  useTtsStore.setState({
    state: 'idle',
    speakingId: null,
    error: null,
    errorId: null,
    available: null,
    autoSpokenId: null,
    firstAudioMs: null,
  });
}
