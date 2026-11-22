import { create } from 'zustand';

interface VoiceLatencyState {
  captureMs: number | null;
  sttMs: number | null;
  llmTtftMs: number | null;
  llmTotalMs: number | null;
  setCapture: (captureMs: number) => void;
  setStt: (sttMs: number) => void;
  startLlm: () => void;
  setLlmTtft: (llmTtftMs: number) => void;
  setLlmTotal: (llmTotalMs: number) => void;
}

export const useVoiceLatencyStore = create<VoiceLatencyState>((set) => ({
  captureMs: null,
  sttMs: null,
  llmTtftMs: null,
  llmTotalMs: null,
  setCapture: (captureMs) => set({ captureMs: Math.round(captureMs) }),
  setStt: (sttMs) => set({ sttMs: Math.round(sttMs) }),
  startLlm: () => set({ llmTtftMs: null, llmTotalMs: null }),
  setLlmTtft: (llmTtftMs) => set({ llmTtftMs: Math.round(llmTtftMs) }),
  setLlmTotal: (llmTotalMs) => set({ llmTotalMs: Math.round(llmTotalMs) }),
}));
