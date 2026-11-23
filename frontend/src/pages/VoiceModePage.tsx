import { useEffect, useRef } from 'react';
import {
  Activity,
  MessageSquareText,
  Radio,
  SlidersHorizontal,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { useNavigate } from 'react-router';
import { InputArea } from '../components/Chat/InputArea';
import { AssistantMarkdown } from '../components/Chat/MessageBubble';
import { VoiceCatalogSelector } from '../components/voice/VoiceCatalogSelector';
import { ZarekCore } from '../components/ZarekCore';
import { useAudioReactor } from '../lib/audio-reactor';
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
  const sourceMode = useAudioReactor((state) => state.sourceMode);
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
  const cockpitState = sourceMode === 'listening'
    ? 'listening'
    : sourceMode === 'speaking' || ttsState === 'speaking'
      ? 'speaking'
      : isCurrentChatStreaming || ttsState === 'loading'
        ? 'thinking'
        : 'ready';

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

  const outputLabel = cockpitState === 'listening'
    ? 'Canal abierto · escuchando'
    : cockpitState === 'speaking'
      ? 'JARVIS está transmitiendo'
      : cockpitState === 'thinking'
        ? 'Núcleo cognitivo procesando'
        : ttsAvailable === false
          ? 'Salida de voz no disponible'
          : 'Canal de voz preparado';

  return (
    <div
      className="voice-mode-page"
      data-cockpit-state={cockpitState}
      data-quality={settings.graphicsQuality}
    >
      <div className="voice-mode-cosmos" aria-hidden="true">
        <div className="voice-mode-cosmos__nebula is-blue" />
        <div className="voice-mode-cosmos__nebula is-violet" />
        <div className="voice-mode-cosmos__stars is-near" />
        <div className="voice-mode-cosmos__stars is-far" />
        <div className="voice-mode-cosmos__beam" />
        <div className="voice-mode-cosmos__lightning is-left"><i /><i /><i /></div>
        <div className="voice-mode-cosmos__lightning is-right"><i /><i /><i /></div>
      </div>

      <header className="voice-mode-page__header">
        <div className="voice-mode-page__identity">
          <span className="voice-mode-page__eyebrow">ZAREK SYSTEMS // CÁMARA DE ENLACE 01</span>
          <div className="voice-mode-page__title-row">
            <h1>Modo Voz</h1>
            <span>1.3.1</span>
          </div>
          <p>Conversa sin teclado. El núcleo escucha, interpreta y responde en tiempo real.</p>
        </div>
        <div className={`voice-mode-page__channel is-${cockpitState}`} role="status" aria-live="polite">
          <Radio size={15} />
          <span>{outputLabel}</span>
          <i aria-hidden="true" />
        </div>
        <button type="button" onClick={() => navigate('/')} className="voice-mode-page__chat-link">
          <MessageSquareText size={17} />
          Volver al chat
        </button>
      </header>

      <main className="voice-mode-page__stage">
        <section className="voice-mode-page__reactor" aria-label="Núcleo de conversación">
          <div className="voice-mode-page__reactor-frame" aria-hidden="true">
            <span className="is-one" /><span className="is-two" /><span className="is-three" />
          </div>

          <div className="voice-mode-page__telemetry">
            <div className="voice-mode-page__output-state">
              {cockpitState === 'speaking' ? <Volume2 size={15} /> : <Activity size={15} />}
              <span>{outputLabel}</span>
              {firstAudioMs != null && <small>{firstAudioMs} ms</small>}
              {ttsState === 'speaking' && (
                <button type="button" onClick={stopSpeaking} title="Interrumpir voz de JARVIS">
                  <VolumeX size={14} /> Detener
                </button>
              )}
            </div>
            <div className="voice-mode-page__latency" aria-label="Latencia de voz">
              <span>CAP/VAD <b>{captureMs == null ? '—' : `${captureMs} ms`}</b></span>
              <span>STT <b>{sttMs == null ? '—' : `${sttMs} ms`}</b></span>
              <span>LLM <b>{llmTtftMs == null ? '—' : `${llmTtftMs} ms`}</b></span>
              <span>TTS <b>{firstAudioMs == null ? '—' : `${firstAudioMs} ms`}</b></span>
            </div>
          </div>

          <div className="voice-mode-page__core-zone">
            <div className="voice-mode-page__collision" aria-hidden="true"><i /><span /></div>
            <div className="voice-mode-page__core"><ZarekCore /></div>
          </div>

          <div className="voice-mode-page__dialogue" aria-live="polite">
            <div className="voice-mode-page__dialogue-head">
              <span>TRANSCRIPCIÓN EN VIVO</span>
              <i />
              <b>{isCurrentChatStreaming ? 'RECIBIENDO' : 'SINCRONIZADA'}</b>
            </div>
            <div className="voice-mode-page__you">
              <b>TÚ</b><span>{lastUser?.content || 'Esperando tu primera orden'}</span>
            </div>
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
        </section>

        <aside className="voice-mode-page__voice-dock" aria-label="Voces disponibles">
          <header>
            <div className="voice-mode-page__dock-icon"><SlidersHorizontal size={18} /></div>
            <div>
              <span>IDENTIDAD SONORA</span>
              <h2>Elige la voz de JARVIS</h2>
              <p>Cambia y escucha sin salir de la conversación.</p>
            </div>
          </header>
          <VoiceCatalogSelector variant="cockpit" />
        </aside>
      </main>
    </div>
  );
}
