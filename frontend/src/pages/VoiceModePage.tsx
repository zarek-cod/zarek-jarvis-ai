import { useEffect, useRef } from 'react';
import { MessageSquareText, Radio, Volume2, VolumeX } from 'lucide-react';
import { useNavigate } from 'react-router';
import { InputArea } from '../components/Chat/InputArea';
import { ZarekCore } from '../components/ZarekCore';
import { stripThinkTags } from '../lib/message-text';
import { useAppStore } from '../lib/store';
import { useTtsStore } from '../lib/tts';

export function VoiceModePage() {
  const navigate = useNavigate();
  const activeId = useAppStore((state) => state.activeId);
  const messages = useAppStore((state) => state.messages);
  const streamState = useAppStore((state) => state.streamState);
  const settings = useAppStore((state) => state.settings);
  const updateSettings = useAppStore((state) => state.updateSettings);
  const ttsState = useTtsStore((state) => state.state);
  const ttsAvailable = useTtsStore((state) => state.available);
  const stopSpeaking = useTtsStore((state) => state.stop);
  const streamingConversationRef = useRef<string | null>(null);

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

      <main className="voice-mode-page__stage">
        <div className="voice-mode-page__output-state">
          {ttsState === 'speaking' ? <Volume2 size={16} /> : <Radio size={16} />}
          <span>{outputLabel}</span>
          {ttsState === 'speaking' && (
            <button type="button" onClick={stopSpeaking} title="Interrumpir voz de JARVIS">
              <VolumeX size={15} /> Detener
            </button>
          )}
        </div>

        <div className="voice-mode-page__core"><ZarekCore /></div>

        <div className="voice-mode-page__dialogue" aria-live="polite">
          {lastUser ? <p className="voice-mode-page__you">TÚ · {lastUser.content}</p> : <p className="voice-mode-page__you">TÚ · Esperando tu primera orden</p>}
          {isCurrentChatStreaming
            ? <p className="voice-mode-page__jarvis">JARVIS · {streamState.content || streamState.phase || 'Procesando…'}</p>
            : lastAssistant
              ? <p className="voice-mode-page__jarvis">JARVIS · {stripThinkTags(lastAssistant.content)}</p>
              : <p className="voice-mode-page__jarvis">JARVIS · A su servicio, señor Zarek.</p>}
        </div>

        <InputArea variant="voice" />
      </main>
    </div>
  );
}
