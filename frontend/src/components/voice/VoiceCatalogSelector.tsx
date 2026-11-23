import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Check,
  CircleAlert,
  Headphones,
  LoaderCircle,
  Sparkles,
  Volume2,
} from 'lucide-react';
import {
  fetchTtsHealth,
  fetchVoiceCatalog,
  synthesizeSpeech,
  type VoiceProfile,
} from '../../lib/api';
import { attachPlaybackReactivity, stopPlaybackReactivity } from '../../lib/audio-reactor';
import { useAppStore } from '../../lib/store';
import { useTtsStore } from '../../lib/tts';

type VoiceCatalogSelectorProps = {
  variant?: 'laboratory' | 'cockpit';
};

export function isBlend(voice: VoiceProfile): boolean {
  return voice.kind === 'blend' || voice.voice_id.includes(',');
}
export function groupVoiceProfiles(voices: VoiceProfile[]) {
  return [
    {
      id: 'original',
      title: 'Voces originales Kokoro',
      caption: 'Modelos de voz base',
      voices: voices.filter((voice) => !isBlend(voice)),
    },
    {
      id: 'blend',
      title: 'Mezclas de timbre',
      caption: 'Combinaciones, no modelos independientes',
      voices: voices.filter(isBlend),
    },
  ];
}

function voiceKindLabel(voice: VoiceProfile): string {
  return isBlend(voice)
    ? `Mezcla de ${voice.source_voices?.length || 2} timbres Kokoro`
    : 'Voz original de Kokoro';
}

export function VoiceCatalogSelector({ variant = 'laboratory' }: VoiceCatalogSelectorProps) {
  const settings = useAppStore((state) => state.settings);
  const updateSettings = useAppStore((state) => state.updateSettings);
  const [voices, setVoices] = useState<VoiceProfile[]>([]);
  const [catalogError, setCatalogError] = useState('');
  const [providerAvailable, setProviderAvailable] = useState<boolean | null>(null);
  const [previewing, setPreviewing] = useState<string | null>(null);
  const [prepared, setPrepared] = useState<Set<string>>(() => new Set());
  const [previewError, setPreviewError] = useState('');
  const previewAudio = useRef<HTMLAudioElement | null>(null);
  const previewUrl = useRef<string | null>(null);
  const previewController = useRef<AbortController | null>(null);

  const stopPreview = useCallback(() => {
    previewController.current?.abort();
    previewController.current = null;
    if (previewAudio.current) {
      previewAudio.current.onended = null;
      previewAudio.current.onerror = null;
      previewAudio.current.pause();
      previewAudio.current.src = '';
      previewAudio.current = null;
    }
    if (previewUrl.current) {
      URL.revokeObjectURL(previewUrl.current);
      previewUrl.current = null;
    }
    void stopPlaybackReactivity();
    setPreviewing(null);
  }, []);

  useEffect(() => {
    let active = true;
    setCatalogError('');
    fetchVoiceCatalog()
      .then((catalog) => {
        if (active) setVoices(catalog.voices);
      })
      .catch((error) => {
        if (active) {
          setCatalogError(error instanceof Error ? error.message : 'Catálogo de voces no disponible');
        }
      });
    return () => {
      active = false;
      stopPreview();
    };
  }, [stopPreview]);

  useEffect(() => {
    let active = true;
    setProviderAvailable(null);
    fetchTtsHealth('kokoro')
      .then((health) => {
        if (active) setProviderAvailable(health.available);
      })
      .catch((error) => {
        if (active) {
          setProviderAvailable(false);
          setCatalogError(error instanceof Error ? error.message : 'El motor Kokoro no responde');
        }
      });
    return () => { active = false; };
  }, []);

  const groups = useMemo(() => groupVoiceProfiles(voices), [voices]);

  const selectedVoice = voices.find((voice) => (
    settings.ttsProvider === 'kokoro' && settings.ttsVoiceId === voice.voice_id
  ));

  const selectVoice = (voice: VoiceProfile) => {
    stopPreview();
    useTtsStore.getState().stop();
    setPreviewError('');
    updateSettings({ ttsProvider: 'kokoro', ttsVoiceId: voice.voice_id });
  };

  const playPreview = async (voice: VoiceProfile) => {
    stopPreview();
    useTtsStore.getState().stop();
    setPreviewError('');
    setPreviewing(voice.id);
    const controller = new AbortController();
    previewController.current = controller;
    try {
      const blob = await synthesizeSpeech(voice.preview_text, {
        backend: voice.backend,
        voiceId: voice.voice_id,
        speed: settings.ttsVoiceSpeed,
        signal: controller.signal,
      });
      if (controller.signal.aborted) return;
      const url = URL.createObjectURL(blob);
      previewUrl.current = url;
      const audio = new Audio(url);
      previewAudio.current = audio;
      audio.volume = Math.max(0, Math.min(1, settings.ttsVoiceVolume));
      await attachPlaybackReactivity(audio);
      audio.onended = () => {
        setPrepared((current) => new Set(current).add(voice.id));
        stopPreview();
      };
      audio.onerror = () => {
        setPreviewError(`No se pudo reproducir la muestra de ${voice.name}.`);
        stopPreview();
      };
      await audio.play();
    } catch (error) {
      if (controller.signal.aborted) return;
      setPreviewError(error instanceof Error ? error.message : `No se pudo preparar ${voice.name}`);
      stopPreview();
    }
  };

  return (
    <section className={`voice-deck voice-deck--${variant}`} aria-label="Selector de voces de JARVIS">
      <div className="voice-deck__current" data-ready={providerAvailable === true}>
        <div className="voice-deck__current-icon"><Volume2 size={16} /></div>
        <div>
          <span>VOZ ACTIVA</span>
          <strong>{selectedVoice?.name || 'Selecciona una voz'}</strong>
        </div>
        <i aria-hidden="true" />
        <small>{providerAvailable === null ? 'COMPROBANDO' : providerAvailable ? 'KOKORO LISTO' : 'MOTOR SIN CONEXIÓN'}</small>
      </div>

      {catalogError && (
        <div className="voice-deck__error" role="alert">
          <CircleAlert size={15} /> <span>{catalogError}</span>
        </div>
      )}

      {groups.map((group) => (
        <div className="voice-deck__group" data-kind={group.id} key={group.id}>
          <div className="voice-deck__group-title">
            <div>
              <strong>{group.title}</strong>
              <span>{group.caption}</span>
            </div>
            <b>{group.voices.length.toString().padStart(2, '0')}</b>
          </div>
          <div className="voice-deck__grid">
            {group.voices.map((voice) => {
              const selected = selectedVoice?.id === voice.id;
              const loading = previewing === voice.id;
              return (
                <article
                  className="voice-deck-card"
                  data-selected={selected}
                  data-kind={isBlend(voice) ? 'blend' : 'original'}
                  key={voice.id}
                >
                  <div className="voice-deck-card__glow" aria-hidden="true" />
                  <div className="voice-deck-card__head">
                    <span className="voice-deck-card__avatar">{voice.name.slice(0, 1)}</span>
                    <div>
                      <h4>{voice.name}</h4>
                      <span>{variant === 'cockpit' ? voice.gender : `${voice.gender} · ${voice.accent}`}</span>
                    </div>
                    {selected && variant === 'laboratory' && (
                      <span className="voice-deck-card__active"><Check size={10} /> ACTIVA</span>
                    )}
                  </div>
                  <div className="voice-deck-card__kind">
                    {isBlend(voice) ? <Sparkles size={11} /> : <Volume2 size={11} />}
                    {voiceKindLabel(voice)}
                  </div>
                  {variant === 'laboratory' && <p>{voice.style}</p>}
                  {variant === 'laboratory' && (
                    <small className="voice-deck-card__delivery">
                      {prepared.has(voice.id) ? 'Muestra preparada en caché local' : voice.delivery}
                    </small>
                  )}
                  <div className="voice-deck-card__actions">
                    <button
                      type="button"
                      className="voice-deck-card__listen"
                      disabled={!voice.available || (previewing !== null && !loading)}
                      onClick={() => loading ? stopPreview() : void playPreview(voice)}
                      aria-label={`Escuchar muestra de ${voice.name}`}
                    >
                      {loading ? <LoaderCircle size={14} className="animate-spin" /> : <Headphones size={14} />}
                      {loading ? 'Detener' : 'Escuchar'}
                    </button>
                    <button
                      type="button"
                      className="voice-deck-card__select"
                      data-selected={selected}
                      aria-pressed={selected}
                      onClick={() => selectVoice(voice)}
                    >
                      {selected ? <Check size={14} /> : <Sparkles size={14} />}
                      {selected ? 'Seleccionada' : 'Seleccionar'}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      ))}

      {previewError && (
        <div className="voice-deck__error" role="alert">
          <CircleAlert size={15} /> <span>{previewError}</span>
        </div>
      )}

      <footer className="voice-deck__footer">
        Kokoro 82M · Apache-2.0 · procesamiento local
      </footer>
    </section>
  );
}

