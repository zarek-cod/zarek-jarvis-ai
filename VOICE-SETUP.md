# Configuración de voz

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
