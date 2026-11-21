import { create } from 'zustand';

export type ReactorMode =
  | 'standby'
  | 'listening'
  | 'thinking'
  | 'speaking'
  | 'executing'
  | 'success'
  | 'error';

interface AudioBands {
  level: number;
  bass: number;
  mid: number;
  treble: number;
}
interface AudioReactorState extends AudioBands {
  sourceMode: 'standby' | 'listening' | 'speaking';
  setSourceMode: (mode: AudioReactorState['sourceMode']) => void;
  setBands: (bands: AudioBands) => void;
}

const EMPTY_BANDS: AudioBands = { level: 0, bass: 0, mid: 0, treble: 0 };

export const useAudioReactor = create<AudioReactorState>((set) => ({
  ...EMPTY_BANDS,
  sourceMode: 'standby',
  setSourceMode: (sourceMode) => set({ sourceMode }),
  setBands: (bands) => set(bands),
}));

interface ActiveGraph {
  context: AudioContext;
  getFrame: () => number;
  disconnect: () => void;
}

let playbackGraph: ActiveGraph | null = null;
let microphoneGraph: ActiveGraph | null = null;

function average(data: Uint8Array<ArrayBuffer>, from: number, to: number): number {
  const end = Math.min(to, data.length);
  if (from >= end) return 0;
  let total = 0;
  for (let index = from; index < end; index += 1) total += data[index];
  return total / (end - from) / 255;
}

function driveAnalyser(
  context: AudioContext,
  analyser: AnalyserNode,
  sourceMode: 'listening' | 'speaking',
  disconnect: () => void,
): ActiveGraph {
  analyser.fftSize = 512;
  analyser.smoothingTimeConstant = 0.76;
  analyser.minDecibels = -88;
  analyser.maxDecibels = -18;
  const frequency = new Uint8Array(analyser.frequencyBinCount);
  let frame = 0;

  const sample = () => {
    analyser.getByteFrequencyData(frequency);
    const bass = average(frequency, 1, 12);
    const mid = average(frequency, 12, 64);
    const treble = average(frequency, 64, 180);
    const level = Math.max(0, Math.min(1, bass * 0.48 + mid * 0.38 + treble * 0.14));
    useAudioReactor.getState().setBands({ level, bass, mid, treble });
    frame = requestAnimationFrame(sample);
  };

  useAudioReactor.getState().setSourceMode(sourceMode);
  frame = requestAnimationFrame(sample);
  return { context, getFrame: () => frame, disconnect };
}

async function closeGraph(graph: ActiveGraph | null): Promise<void> {
  if (!graph) return;
  cancelAnimationFrame(graph.getFrame());
  graph.disconnect();
  if (graph.context.state !== 'closed') await graph.context.close().catch(() => {});
}

function settleToStandby(): void {
  const state = useAudioReactor.getState();
  state.setBands(EMPTY_BANDS);
  if (!playbackGraph && !microphoneGraph) state.setSourceMode('standby');
}

export async function attachPlaybackReactivity(element: HTMLAudioElement): Promise<void> {
  await stopPlaybackReactivity();
  // Unit-test DOMs and a few restricted WebViews do not expose Web Audio.
  // Playback must remain functional there; only the frequency-driven visual
  // enhancement is skipped.
  if (typeof AudioContext === 'undefined') {
    useAudioReactor.getState().setSourceMode('speaking');
    return;
  }
  const context = new AudioContext({ latencyHint: 'interactive' });
  const source = context.createMediaElementSource(element);
  const analyser = context.createAnalyser();
  source.connect(analyser);
  analyser.connect(context.destination);
  if (context.state === 'suspended') await context.resume();
  playbackGraph = driveAnalyser(context, analyser, 'speaking', () => {
    source.disconnect();
    analyser.disconnect();
  });
}

export async function stopPlaybackReactivity(): Promise<void> {
  const graph = playbackGraph;
  playbackGraph = null;
  await closeGraph(graph);
  settleToStandby();
}

export async function attachMicrophoneReactivity(stream: MediaStream): Promise<void> {
  await stopMicrophoneReactivity();
  if (typeof AudioContext === 'undefined') {
    useAudioReactor.getState().setSourceMode('listening');
    return;
  }
  const context = new AudioContext({ latencyHint: 'interactive' });
  const source = context.createMediaStreamSource(stream);
  const analyser = context.createAnalyser();
  source.connect(analyser);
  if (context.state === 'suspended') await context.resume();
  microphoneGraph = driveAnalyser(context, analyser, 'listening', () => {
    source.disconnect();
    analyser.disconnect();
  });
}

export async function stopMicrophoneReactivity(): Promise<void> {
  const graph = microphoneGraph;
  microphoneGraph = null;
  await closeGraph(graph);
  settleToStandby();
}
