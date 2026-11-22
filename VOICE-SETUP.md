# Configuración de voz

## Entrada de Windows y activación “Jarvis”

La matriz de audio enumera entradas físicas y virtuales mediante `mediaDevices.enumerateDevices`, conserva el `deviceId` seleccionado y vuelve a abrir exactamente ese dispositivo. Vigila `devicechange` y desconexiones de pista, muestra RMS en vivo y respeta las capacidades que el controlador expone.

Flujos disponibles:

- **Modo Voz**: pantalla independiente sin teclado, con núcleo grande, transcripción visible y lectura automática de cada respuesta.
- Botón de micrófono: inicia dictado local; vuelve a pulsarlo para terminar.
- `Ctrl + Shift + Espacio`: atajo global de Windows; trae ZAREK al frente y alterna el micrófono.
- “Jarvis, <orden>”: detecta palabra y orden en la misma frase.
- “Jarvis” y, tras el tono, `<orden>`: mantiene una ventana de ocho segundos.
- Interrumpir una respuesta: pulse el micrófono grande, **Detener** o `Ctrl + Shift + Espacio`; la reproducción se corta antes de abrir el micrófono.

La palabra de activación es configurable y admite una variación de reconocimiento de un carácter (por ejemplo, `Yarvis`) sin aceptar frases arbitrarias. Cada segmento se graba en un WebM independiente para evitar marcas de tiempo acumuladas y latencia creciente. La transcripción y la detección se ejecutan en el equipo.

La escucha continua requiere consentimiento explícito y se guarda como una preferencia local; viene desactivada por defecto. Se recomienda mantener **Cancelación de eco** activa para impedir que los altavoces reactiven al asistente.

Mientras Kokoro reproduce una respuesta, la detección continua se pausa para que JARVIS no se transcriba ni se interrumpa a sí mismo. El botón grande y el atajo global siguen disponibles como interrupción intencional.

## Predeterminado local

- STT: Faster-Whisper `small`, idioma `es`, CPU `int8`.
- TTS: Kokoro 82M.
- Voz: `em_alex`, masculina en español.
- Velocidad: `0.96`.

La primera transcripción y la primera síntesis descargan modelos públicos y pueden tardar. Después quedan en caché local.

La CPU es intencional: deja los 8 GB de VRAM disponibles para el LLM y evita
depender del toolkit CUDA/cuBLAS, que no forma parte del controlador NVIDIA de
Windows. El Core Ultra de 24 núcleos ofrece margen suficiente para STT local.

## ElevenLabs opcional

OpenJarvis ya incluye un backend ElevenLabs con saneamiento de errores y selección de voz/modelo. Para usarlo, configure la clave desde una pantalla segura de la aplicación o en el entorno local; nunca la escriba en Git:

```powershell
$env:ELEVENLABS_API_KEY = '<configurada localmente>'
```

Cambie en `%USERPROFILE%\.openjarvis\config.toml`:

```toml
[speech]
tts_backend = "elevenlabs"
voice_id = "<voice-id>"
```

Si ElevenLabs no está disponible, la resolución TTS recorre proveedores saludables y vuelve al motor local Kokoro. No se eluden créditos ni límites del proveedor.

## Sincronización visual

La reproducción del blob TTS pasa por un `MediaElementAudioSourceNode` conectado a un `AnalyserNode` y al destino de audio. El núcleo utiliza las frecuencias reales. Al cancelar o terminar la reproducción se cierra el `AudioContext`, se revoca el Object URL y el núcleo vuelve a standby.

## Privacidad

El micrófono solo se activa por acción del usuario. Las pistas se detienen al finalizar o desmontar el componente. El modo predeterminado no sube audio a servicios externos.
