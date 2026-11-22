import { Check, Headphones, Mic, Radio, RefreshCw, ShieldCheck, Volume2, Zap } from 'lucide-react';
import { useAudioDevices } from '../../hooks/useAudioDevices';
import { useAppStore, type Settings } from '../../lib/store';

function Toggle({ checked, disabled = false, onChange, label }: {
  checked: boolean;
  disabled?: boolean;
  onChange: (checked: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className="zarek-switch"
      data-active={checked}
    >
      <span />
    </button>
  );
}

function Row({ title, description, children }: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="audio-setting-row">
      <div>
        <div className="audio-setting-row__title">{title}</div>
        <div className="audio-setting-row__description">{description}</div>
      </div>
      <div className="audio-setting-row__control">{children}</div>
    </div>
  );
}

export function AudioSettingsPanel() {
  const settings = useAppStore((state) => state.settings);
  const updateSettings = useAppStore((state) => state.updateSettings);
  const audio = useAudioDevices();
  const update = (partial: Partial<Settings>) => updateSettings(partial);
  const selectedMissing = settings.audioInputDeviceId !== 'default'
    && !audio.devices.some((device) => device.deviceId === settings.audioInputDeviceId);

  return (
    <section className="zarek-audio-console" aria-labelledby="audio-console-title">
      <div className="zarek-audio-console__beam" aria-hidden="true" />
      <header className="zarek-audio-console__header">
        <div className="zarek-audio-console__icon"><Mic size={22} /></div>
        <div>
          <div className="hud-kicker">MATRIZ DE AUDIO / ENTRADA LOCAL</div>
          <h3 id="audio-console-title">Micrófono y activación de JARVIS</h3>
          <p>Dispositivos de Windows, nivel en vivo y palabra de activación; todo se procesa en este equipo.</p>
        </div>
        <div className="audio-saved-pill"><Check size={12} /> Guardado local</div>
      </header>

      <div className="zarek-audio-console__grid">
        <div className="audio-device-card">
          <div className="audio-device-card__title"><Headphones size={16} /> Dispositivo de entrada</div>
          <div className="audio-device-select-row">
            <select
              aria-label="Micrófono de entrada"
              value={selectedMissing ? 'default' : settings.audioInputDeviceId}
              onChange={(event) => update({ audioInputDeviceId: event.target.value })}
            >
              <option value="default">Predeterminado de Windows</option>
              {audio.devices.filter((device) => device.deviceId !== 'default').map((device, index) => (
                <option key={device.deviceId} value={device.deviceId}>
                  {device.label || `Micrófono ${index + 1}`}
                </option>
              ))}
            </select>
            <button type="button" className="audio-icon-button" onClick={() => void audio.refresh()} title="Detectar cambios">
              <RefreshCw size={16} />
            </button>
          </div>
          {selectedMissing && <div className="audio-warning">El dispositivo guardado se desconectó; se usará el predeterminado.</div>}
          <div className="audio-meter" aria-label={`Nivel ${Math.round(audio.level * 100)}%`}>
            <span style={{ width: `${Math.round(audio.level * 100)}%` }} />
            <i style={{ left: `${Math.round(settings.microphoneSensitivity * 100)}%` }} />
          </div>
          <div className="audio-meter-labels"><span>NIVEL EN TIEMPO REAL</span><strong>{Math.round(audio.level * 100)}%</strong></div>
          <div className="audio-device-actions">
            <button type="button" className="zarek-action-button" onClick={() => void audio.requestAccess()}>
              <ShieldCheck size={15} /> Dar acceso
            </button>
            <button
              type="button"
              className="zarek-action-button is-primary"
              onClick={() => audio.testing ? audio.stopTest() : void audio.startTest()}
            >
              <Volume2 size={15} /> {audio.testing ? 'Detener prueba' : 'Probar micrófono'}
            </button>
          </div>
          <div className={`audio-permission is-${audio.permission}`}>
            {audio.permission === 'granted' ? 'Permiso concedido'
              : audio.permission === 'denied' ? 'Permiso bloqueado'
                : audio.permission === 'unsupported' ? 'Audio no compatible'
                  : 'Esperando permiso'}
          </div>
          {audio.error && <div className="audio-error">{audio.error}</div>}
        </div>

        <div className="audio-controls-card">
          <Row title="Entrada por voz" description="Habilita el botón de micrófono y la transcripción local.">
            <Toggle label="Entrada por voz" checked={settings.speechEnabled} onChange={(speechEnabled) => update({ speechEnabled })} />
          </Row>
          <Row title="Sensibilidad" description={`${Math.round(settings.microphoneSensitivity * 100)}% · umbral de voz`}>
            <input type="range" min="0.02" max="0.5" step="0.01" value={settings.microphoneSensitivity}
              onChange={(event) => update({ microphoneSensitivity: Number(event.target.value) })} />
          </Row>
          <Row title="Ganancia" description={audio.gainSupported === false ? 'No expuesta por este dispositivo' : `${settings.microphoneGain.toFixed(1)}× cuando el controlador lo permite`}>
            <input type="range" min="0.5" max="2" step="0.1" value={settings.microphoneGain}
              disabled={audio.gainSupported === false}
              onChange={(event) => update({ microphoneGain: Number(event.target.value) })} />
          </Row>
          <Row title="Supresión de ruido" description="Reduce ventiladores y ruido ambiental antes de transcribir.">
            <Toggle label="Supresión de ruido" checked={settings.noiseSuppression} onChange={(noiseSuppression) => update({ noiseSuppression })} />
          </Row>
          <Row title="Cancelación de eco" description="Evita que JARVIS se escuche a sí mismo por los altavoces.">
            <Toggle label="Cancelación de eco" checked={settings.echoCancellation} onChange={(echoCancellation) => update({ echoCancellation })} />
          </Row>
          <Row title="Ganancia automática" description="Normaliza conversaciones con volumen irregular.">
            <Toggle label="Ganancia automática" checked={settings.autoGainControl} onChange={(autoGainControl) => update({ autoGainControl })} />
          </Row>
          <Row title="Corte por silencio" description={`${(settings.silenceTimeoutMs / 1000).toFixed(1)} s antes de enviar`}>
            <input type="range" min="600" max="2400" step="100" value={settings.silenceTimeoutMs}
              onChange={(event) => update({ silenceTimeoutMs: Number(event.target.value) })} />
          </Row>
        </div>
      </div>

      <div className="wake-word-card">
        <div className="wake-word-card__signal"><Radio size={21} /><span /></div>
        <div className="wake-word-card__body">
          <div className="hud-kicker">PROTOCOLO DE ACTIVACIÓN</div>
          <div className="wake-word-card__title">Di “{settings.wakeWord || 'Jarvis'}” para activar</div>
          <div className="wake-word-card__description">
            La detección usa el motor de voz local. Tras reconocer la palabra, puedes dictar la orden en la misma frase o después del tono.
          </div>
          <div className="wake-word-card__options">
            <label>
              <span>Palabra</span>
              <input value={settings.wakeWord} maxLength={24}
                onChange={(event) => update({ wakeWord: event.target.value || 'Jarvis' })} />
            </label>
            <label className="wake-sound-option">
              <Toggle label="Confirmación sonora" checked={settings.wakeSoundEnabled} onChange={(wakeSoundEnabled) => update({ wakeSoundEnabled })} />
              <span>Tono de confirmación</span>
            </label>
          </div>
        </div>
        <div className="wake-word-card__toggles">
          <Toggle label="Palabra de activación" checked={settings.wakeWordEnabled}
            onChange={(wakeWordEnabled) => update({ wakeWordEnabled, speechEnabled: wakeWordEnabled || settings.speechEnabled })} />
          <span>{settings.wakeWordEnabled ? 'ACTIVA' : 'INACTIVA'}</span>
        </div>
      </div>

      <div className={`continuous-consent ${settings.continuousListeningEnabled ? 'is-enabled' : ''}`}>
        <div className="continuous-consent__icon"><Zap size={18} /></div>
        <div>
          <strong>Escucha continua con consentimiento</strong>
          <p>Necesaria para detectar “{settings.wakeWord || 'Jarvis'}” sin pulsar el botón. El audio no sale del equipo y puedes desactivarla al instante.</p>
        </div>
        <button
          type="button"
          className={`zarek-action-button ${settings.continuousListeningEnabled ? '' : 'is-primary'}`}
          disabled={!settings.wakeWordEnabled}
          onClick={() => update({ continuousListeningEnabled: !settings.continuousListeningEnabled })}
        >
          {settings.continuousListeningEnabled ? 'Desactivar escucha' : 'Acepto y activar'}
        </button>
      </div>
    </section>
  );
}
