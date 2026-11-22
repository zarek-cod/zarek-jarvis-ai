import { useEffect, useRef } from 'react';
import { MessageSquareText, Radio, Volume2, VolumeX } from 'lucide-react';
import { useNavigate } from 'react-router';
import { InputArea } from '../components/Chat/InputArea';
import { AssistantMarkdown } from '../components/Chat/MessageBubble';
import { ZarekCore } from '../components/ZarekCore';
import { stripThinkTags } from '../lib/message-text';
import { useAppStore } from '../lib/store';
import { useTtsStore } from '../lib/tts';
import { useVoiceLatencyStore } from '../lib/voice-latency';

export function VoiceModePage() {
  const navigate = useNavigate();
  const activeId = useAppStore((state) => state.activeId);
  const messages = useAppStore((state) => state.messages);
  const streamState = useAppStore((state) => state.streamState);
  const settings = useAppStore((state) => state.settings);
  const updateSettings = useAppStore((state) => state.updateSettings);
  const ttsState = useTtsStore((state) => state.state);
  const ttsAvailable = useTtsStore((state) => state.available);
  const firstAudioMs = useTtsStore((state) => state.firstAudioMs);
  const captureMs = useVoiceLatencyStore((state) => state.captureMs);
  const sttMs = useVoiceLatencyStore((state) => state.sttMs);
  const llmTtftMs = useVoiceLatencyStore((state) => state.llmTtftMs);
  const stopSpeaking = useTtsStore((state) => state.stop);
  const streamingConversationRef = useRef<string | null>(null);
  const streamingSpeechRef = useRef<{ messageId: string | null; cursor: number }>({ messageId: null, cursor: 0 });

  const isCurrentChatStreaming = streamState.isStreaming && streamState.conversationId === activeId;
  const lastUser = [...messages].reverse().find((message) => message.role === 'user');
  const lastAssistant = [...messages].reverse().find((message) => message.role === 'assistant' && message.content.trim());

  useEffect(() => {
    const changes: Partial<typeof settings> = {};
    if (!settings.speechEnabled) changes.speechEnabled = true;
    if (!settings.voiceOutputEnabled) changes.voiceOutputEnabled = true;
    if (!settings.voiceAutoplay) changes.voiceAutoplay = true;
    if (Object.keys(changes).length > 0) updateSettings(changes);
    void useTtsStore.getState().ensureHealth();
  }, [settings, updateSettings]);

  useEffect(() => {
    const previousConversation = streamingConversationRef.current;
    streamingConversationRef.current = isCurrentChatStreaming ? activeId : null;
    if (!previousConversation || previousConversation !== activeId || isCurrentChatStreaming) return;

    const latestMessages = useAppStore.getState().messages;
    const latest = latestMessages[latestMessages.length - 1];
    if (!latest || latest.role !== 'assistant' || !latest.content.trim()) return;
    const tts = useTtsStore.getState();
    if (tts.autoSpokenId === latest.id) return;

    const streamed = streamingSpeechRef.current;
    if (streamed.messageId === latest.id && streamed.cursor > 0) {
      const remainder = latest.content.slice(streamed.cursor).trim();
      tts.markAutoSpoken(latest.id);
      if (remainder) void tts.enqueue(latest.id, remainder);
      streamingSpeechRef.current = { messageId: null, cursor: 0 };
      return;
    }

    void tts.ensureHealth().then(() => {
      const current = useTtsStore.getState();
      const app = useAppStore.getState();
      if (current.available !== true || app.streamState.isStreaming) return;
      const currentLatest = app.messages[app.messages.length - 1];
      if (currentLatest?.id !== latest.id) return;
      current.markAutoSpoken(latest.id);
      void current.speak(latest.id, stripThinkTags(latest.content));
    });
  }, [activeId, isCurrentChatStreaming]);

  useEffect(() => {
    if (!isCurrentChatStreaming || !streamState.content) return;
    const latest = messages[messages.length - 1];
    if (!latest || latest.role !== 'assistant') return;
    const progress = streamingSpeechRef.current;
    if (progress.messageId !== latest.id) {
      progress.messageId = latest.id;
      progress.cursor = 0;
    }
    const pending = streamState.content.slice(progress.cursor);
    let completedLength = 0;
    for (const match of pending.matchAll(/[.!?;:]+(?:\s+|$)/g)) {
      completedLength = (match.index ?? 0) + match[0].length;
    }
    if (completedLength === 0) return;
    const phrase = pending.slice(0, completedLength).trim();
    progress.cursor += completedLength;
    if (!phrase) return;
    const tts = useTtsStore.getState();
    void tts.ensureHealth().then(() => {
      if (useTtsStore.getState().available === true) {
        void useTtsStore.getState().enqueue(latest.id, phrase);
      }
    });
  }, [isCurrentChatStreaming, messages, streamState.content]);

  const outputLabel = ttsState === 'speaking'
    ? 'JARVIS está hablando'
    : ttsState === 'loading'
      ? 'Preparando voz local…'
      : ttsAvailable === false
        ? 'Salida de voz no disponible'
        : 'Respuesta hablada automática';

  return (
    <div className="voice-mode-page">
      <header className="voice-mode-page__header">
        <div>
          <span className="voice-mode-page__eyebrow">ZAREK SYSTEMS // CANAL INMERSIVO</span>
          <h1>Modo Voz</h1>
          <p>Una conversación sin teclado. Habla, interrumpe y escucha la respuesta.</p>
        </div>
        <button type="button" onClick={() => navigate('/')} className="voice-mode-page__chat-link">
          <MessageSquareText size={17} />
          Volver al chat
        </button>
      </header>

      <main className="voice-mode-page__stage" data-state={ttsState === 'speaking' ? 'speaking' : isCurrentChatStreaming ? 'thinking' : 'ready'}>
        <div className="voice-mode-page__output-state">
          {ttsState === 'speaking' ? <Volume2 size={16} /> : <Radio size={16} />}
          <span>{outputLabel}</span>
          {firstAudioMs != null && <small>voz {firstAudioMs} ms</small>}
          {ttsState === 'speaking' && (
            <button type="button" onClick={stopSpeaking} title="Interrumpir voz de JARVIS">
              <VolumeX size={15} /> Detener
            </button>
          )}
        </div>

        <div className="voice-mode-page__latency" aria-label="Latencia de voz">
          <span>CAP/VAD <b>{captureMs == null ? '—' : `${captureMs} ms`}</b></span>
          <span>STT <b>{sttMs == null ? '—' : `${sttMs} ms`}</b></span>
          <span>LLM TTFT <b>{llmTtftMs == null ? '—' : `${llmTtftMs} ms`}</b></span>
          <span>TTS <b>{firstAudioMs == null ? '—' : `${firstAudioMs} ms`}</b></span>
        </div>

        <div className="voice-mode-page__core"><ZarekCore /></div>

        <div className="voice-mode-page__dialogue" aria-live="polite">
          <div className="voice-mode-page__you"><b>TÚ</b><span>{lastUser?.content || 'Esperando tu primera orden'}</span></div>
          <div className="voice-mode-page__jarvis prose max-w-none">
            <b>JARVIS</b>
            <div className="voice-mode-page__answer">
              <AssistantMarkdown
                content={isCurrentChatStreaming
                  ? (streamState.content || streamState.phase || 'Procesando…')
                  : lastAssistant
                    ? stripThinkTags(lastAssistant.content)
                    : 'A su servicio, señor Zarek.'}
                sources={isCurrentChatStreaming ? [] : lastAssistant?.researchSources}
              />
            </div>
          </div>
        </div>

        <InputArea variant="voice" />
      </main>
    </div>
  );
}
