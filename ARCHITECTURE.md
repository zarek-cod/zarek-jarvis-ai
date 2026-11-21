# Arquitectura de ZAREK JARVIS AI

```text
Tauri 2 / React 19
  ├─ Chat, ajustes, memoria y telemetría
  ├─ Captura de micrófono (MediaRecorder)
  └─ Núcleo ZAREK (Canvas 2D + AudioContext/AnalyserNode)
                    │ API local / SSE
FastAPI / OpenJarvis Python
  ├─ Engine Registry ── Ollama ── qwen3.5
  ├─ Speech Registry ── Faster-Whisper
  ├─ TTS Registry ───── Kokoro / ElevenLabs opcional
  ├─ Agents + Tools ─── confirmación y políticas
  ├─ Memory ─────────── SQLite/FTS + memoria local
  └─ Telemetry ──────── CPU/RAM/NVIDIA GPU/VRAM
                    │
Extensión Rust / PyO3
  └─ seguridad, memoria y rutas nativas de alto rendimiento
```

## Núcleo audiovisual

`frontend/src/lib/audio-reactor.ts` crea grafos Web Audio independientes para micrófono y reproducción TTS. Un `AnalyserNode` calcula 256 bins de frecuencia; el reactor agrega bandas de graves, medios y agudos y publica niveles normalizados. `frontend/src/components/ZarekCore.tsx` consume esos valores y dibuja anillos, partículas, aura y pulsación. La animación no usa valores aleatorios para simular voz.

La tasa visual objetivo es 60 FPS; se limita el DPR a 2, se reduce la frecuencia con `prefers-reduced-motion` y se baja a ~8 FPS cuando la ventana está oculta.

## Configuración e identidad

La configuración fuente vive en `configs/zarek/config.toml`. `scripts/zarek/setup.ps1` la instala en `%USERPROFILE%\.openjarvis\config.toml` y coloca el prompt separado en el mismo directorio. Las claves no se incorporan al repositorio.

## Extensión

Se conservan los registries de OpenJarvis para Engines, Speech, TTS, Tools, Agents, Skills y Channels. Un nuevo proveedor debe implementar la interfaz correspondiente y registrarse, sin acoplarse al núcleo visual.
