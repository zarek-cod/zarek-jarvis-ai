import { useEffect, useRef, useState } from 'react';
import {
  Check,
  Cloud,
  Download,
  Gauge,
  Headphones,
  LoaderCircle,
  Sparkles,
  Volume2,
  WandSparkles,
} from 'lucide-react';
import {
  fetchTtsHealth,
  fetchVoiceCatalog,
  synthesizeSpeech,
  type VoiceProfile,
} from '../../lib/api';
import { attachPlaybackReactivity, stopPlaybackReactivity } from '../../lib/audio-reactor';
import { useAppStore, type Settings, type TtsProvider } from '../../lib/store';
import { useTtsStore } from '../../lib/tts';
import { sanitizePreferredName } from '../../lib/personality';

export function VoicePersonalityPanel() {
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
  const update = (partial: Partial<Settings>) => updateSettings(partial);

  const stopPreview = () => {
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
  };

  useEffect(() => {
    let active = true;
    fetchVoiceCatalog()
      .then((catalog) => {
        if (active) setVoices(catalog.voices);
      })
      .catch((error) => {
        if (active) {
          setCatalogError(error instanceof Error ? error.message : 'Catálogo no disponible');
        }
      });
    return () => {
      active = false;
      stopPreview();
    };
  }, []);

  useEffect(() => {
    let active = true;
    setProviderAvailable(null);
    fetchTtsHealth(settings.ttsProvider)
      .then((health) => {
        if (active) setProviderAvailable(health.available);
      })
      .catch(() => {
        if (active) setProviderAvailable(false);
      });
    return () => { active = false; };
  }, [settings.ttsProvider]);

  const selectProvider = (provider: TtsProvider) => {
    stopPreview();
    useTtsStore.getState().stop();
    if (provider === 'kokoro') {
      const known = voices.some((voice) => voice.voice_id === settings.ttsVoiceId);
      update({ ttsProvider: provider, ttsVoiceId: known ? settings.ttsVoiceId : 'em_alex' });
    } else {
      update({ ttsProvider: provider, ttsVoiceId: '' });
    }
  };

  const selectVoice = (voice: VoiceProfile) => {
    stopPreview();
    useTtsStore.getState().stop();
    update({ ttsProvider: 'kokoro', ttsVoiceId: voice.voice_id });
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
      setPreviewError(error instanceof Error ? error.message : 'No se pudo preparar la voz');
      stopPreview();
    }
  };

  return (
    <section className="voice-personality" aria-labelledby="voice-personality-title">
      <div className="voice-personality__aura" aria-hidden="true" />
      <header className="voice-personality__header">
        <div className="voice-personality__emblem"><WandSparkles size={24} /></div>
        <div>
          <div className="hud-kicker">IDENTIDAD SONORA / PERSONALIDAD</div>
          <h3 id="voice-personality-title">Voz y personalidad</h3>
          <p>Elija un timbre español real, escuche una muestra y aplíquelo sin reiniciar.</p>
        </div>
        <div className={`voice-provider-state ${providerAvailable ? 'is-ready' : ''}`}>
          <span />
          {providerAvailable === null ? 'COMPROBANDO'
            : providerAvailable ? 'MOTOR LISTO' : 'NO DISPONIBLE'}
        </div>
      </header>

      <div className="voice-provider-tabs" role="tablist" aria-label="Proveedor de voz">
        <button
          type="button"
          role="tab"
          aria-selected={settings.ttsProvider === 'kokoro'}
          data-active={settings.ttsProvider === 'kokoro'}
          onClick={() => selectProvider('kokoro')}
        >
          <Sparkles size={16} /> Kokoro local <span>GRATIS</span>
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={settings.ttsProvider === 'elevenlabs'}
          data-active={settings.ttsProvider === 'elevenlabs'}
          onClick={() => selectProvider('elevenlabs')}
        >
          <Cloud size={16} /> ElevenLabs <span>OPCIONAL</span>
        </button>
      </div>

      {settings.ttsProvider === 'kokoro' ? (
        <>
          {catalogError && <div className="voice-catalog-error">{catalogError}</div>}
          <div className="voice-catalog-grid">
            {voices.map((voice) => {
              const selected = settings.ttsVoiceId === voice.voice_id;
              const loading = previewing === voice.id;
              return (
                <article className="voice-card" data-selected={selected} key={voice.id}>
                  <div className="voice-card__scan" aria-hidden="true" />
                  <div className="voice-card__topline">
                    <div className="voice-card__avatar">{voice.name.slice(0, 1)}</div>
                    <div>
                      <h4>{voice.name}</h4>
                      <span>{voice.gender} · {voice.language}</span>
                    </div>
                    <span className="voice-card__availability">
                      <i /> {voice.available ? 'DISPONIBLE' : 'NO DISPONIBLE'}
                    </span>
                  </div>
                  <div className="voice-card__accent">{voice.accent} · {voice.backend.toUpperCase()}</div>
                  <p>{voice.style}</p>
                  <div className="voice-card__delivery">
                    <Download size={12} />
                    {prepared.has(voice.id) ? 'Preparada en caché local' : voice.delivery}
                  </div>
                  <div className="voice-card__actions">
                    <button
                      type="button"
                      className="voice-preview-button"
                      disabled={!voice.available || (previewing !== null && !loading)}
                      onClick={() => loading ? stopPreview() : void playPreview(voice)}
                    >
                      {loading ? <LoaderCircle size={15} className="animate-spin" /> : <Headphones size={15} />}
                      {loading ? 'Preparando…' : 'Escuchar muestra'}
                    </button>
                    <button
                      type="button"
                      className="voice-select-button"
                      data-selected={selected}
                      onClick={() => selectVoice(voice)}
                    >
                      {selected ? <Check size={15} /> : <Sparkles size={15} />}
                      {selected ? 'Seleccionada' : 'Seleccionar'}
                    </button>
                  </div>
                  <a href={voice.license_url} target="_blank" rel="noreferrer">
                    {voice.license} · modelo y licencia
                  </a>
                </article>
              );
            })}
          </div>
        </>
      ) : (
        <div className="premium-provider-panel">
          <Cloud size={24} />
          <div>
            <strong>Proveedor premium opcional</strong>
            <p>Guarde `ELEVENLABS_API_KEY` en API Keys y pegue el identificador de una voz de su cuenta.</p>
          </div>
          <label>
            <span>ID de voz ElevenLabs</span>
            <input
              value={settings.ttsVoiceId}
              placeholder="JBFqnCBsd6RMkjVDRZzb"
              onChange={(event) => update({ ttsVoiceId: event.target.value.trim() })}
            />
          </label>
        </div>
      )}

      {previewError && <div className="voice-catalog-error">{previewError}</div>}

      <div className="voice-output-switches" aria-label="Activación de voz">
        <button
          type="button"
          role="switch"
          aria-checked={settings.voiceOutputEnabled}
          data-active={settings.voiceOutputEnabled}
          onClick={() => update({ voiceOutputEnabled: !settings.voiceOutputEnabled })}
        >
          <Volume2 size={17} />
          <span><strong>Salida hablada</strong><small>Mostrar controles para oír las respuestas</small></span>
          <i />
        </button>
        <button
          type="button"
          role="switch"
          aria-checked={settings.voiceAutoplay}
          data-active={settings.voiceAutoplay && settings.voiceOutputEnabled}
          disabled={!settings.voiceOutputEnabled}
          onClick={() => update({ voiceAutoplay: !settings.voiceAutoplay })}
        >
          <Sparkles size={17} />
          <span><strong>Respuesta automática</strong><small>Hablar al terminar cada respuesta</small></span>
          <i />
        </button>
      </div>

      <div className="voice-personality__controls">
        <label>
          <span><Gauge size={14} /> Velocidad</span>
          <input
            type="range"
            min="0.78"
            max="1.22"
            step="0.02"
            value={settings.ttsVoiceSpeed}
            onChange={(event) => update({ ttsVoiceSpeed: Number(event.target.value) })}
          />
          <strong>{settings.ttsVoiceSpeed.toFixed(2)}×</strong>
        </label>
        <label>
          <span><Volume2 size={14} /> Volumen</span>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={settings.ttsVoiceVolume}
            onChange={(event) => update({ ttsVoiceVolume: Number(event.target.value) })}
          />
          <strong>{Math.round(settings.ttsVoiceVolume * 100)}%</strong>
        </label>
        <label className="is-disabled">
          <span><WandSparkles size={14} /> Tono</span>
          <input type="range" min="-4" max="4" value="0" disabled readOnly />
          <strong>No compatible</strong>
        </label>
      </div>

      <div className="personality-addressing">
        <div>
          <div className="hud-kicker">TRATO PERSONAL</div>
          <strong>Cómo debe dirigirse JARVIS a usted</strong>
          <p>Esta preferencia se guarda localmente y se añade al contexto de cada conversación.</p>
        </div>
        <input
          aria-label="Nombre preferido"
          value={settings.preferredName}
          maxLength={32}
          onChange={(event) => update({ preferredName: sanitizePreferredName(event.target.value) })}
        />
        <select
          aria-label="Forma de tratamiento"
          value={settings.addressPreference}
          onChange={(event) => update({
            addressPreference: event.target.value as Settings['addressPreference'],
          })}
        >
          <option value="formal">Señor + nombre</option>
          <option value="name">Solo nombre</option>
          <option value="neutral">Sin tratamiento fijo</option>
        </select>
      </div>
    </section>
  );
}
