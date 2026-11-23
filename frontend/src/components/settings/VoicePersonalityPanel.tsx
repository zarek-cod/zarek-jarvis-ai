import {
  Cloud,
  Gauge,
  Sparkles,
  Volume2,
  WandSparkles,
} from 'lucide-react';
import { useAppStore, type Settings, type TtsProvider } from '../../lib/store';
import { useTtsStore } from '../../lib/tts';
import { sanitizePreferredName } from '../../lib/personality';
import { VoiceCatalogSelector } from '../voice/VoiceCatalogSelector';

export function VoicePersonalityPanel() {
  const settings = useAppStore((state) => state.settings);
  const updateSettings = useAppStore((state) => state.updateSettings);
  const update = (partial: Partial<Settings>) => updateSettings(partial);

  const selectProvider = (provider: TtsProvider) => {
    useTtsStore.getState().stop();
    if (provider === 'kokoro') {
      const known = /^e[fm]_[a-z]+(?:,e[fm]_[a-z]+)?$/i.test(settings.ttsVoiceId);
      update({ ttsProvider: provider, ttsVoiceId: known ? settings.ttsVoiceId : 'em_alex' });
    } else {
      update({ ttsProvider: provider, ttsVoiceId: '' });
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
        <div className="voice-provider-state is-ready">
          <span />
          CATÁLOGO COMPARTIDO
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
        <VoiceCatalogSelector variant="laboratory" />
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
