# Validación de ZAREK JARVIS AI

Fecha: 2026-11-21 (America/Lima).

## Línea base antes de personalizar

| Prueba | Resultado |
|---|---|
| Instalación Python 3.12 + extensión Rust | Correcta |
| Frontend Vitest | 126/126 correctas |
| Build web TypeScript/Vite | Correcto |
| Rust/Tauri | 50/50 correctas |
| Backend: core, voz y rutas | 476 correctas, 3 omitidas, 1 aserción POSIX incompatible con Windows |
| Instalador NSIS x64 | Correcto, 8,186,047 bytes |
| Windows Defender | Sin amenazas, salida 0 |

El único fallo fue `tests/core/test_credentials.py::test_file_permissions`: compara `st_mode` con `0600`, semántica POSIX no representativa de ACL NTFS. Se conserva visible como deuda de seguridad/documentación.

## Matriz de escenarios

| Escenario | Estado |
|---|---|
| Iniciar aplicación Tauri | Aprobado |
| Backend `/health` | Aprobado (`status=ok`) |
| Modelo principal | Aprobado: `qwen3.5:4b` |
| Identidad | Aprobado: “ZAREK JARVIS AI” / “señor Zarek” |
| Transcribir español | Aprobado con Faster-Whisper `small`, CPU `int8`, 3.79 s, confianza 1.0 |
| Respuesta por voz local | Aprobado con Kokoro `em_alex`, 24 kHz |
| Núcleo sincronizado con audio real | Aprobado visualmente durante generación y reproducción |
| Interrumpir reproducción | Control “Detener lectura” visible y operativo |
| Modelos instalados | Aprobado: solo `qwen3.5:4b` y `qwen3.5:2b` en el selector local |
| Privacidad inicial | Aprobado: sin modal de analítica, sorteo o leaderboard |
| Persistir modelo/preferencias | Aprobado tras relanzamiento |

## Rendimiento observado

- Primera carga de `qwen3.5:4b`: 5.16 s.
- Respuesta en caliente: 0.54 s; entre 49 y 55 tokens/s en la prueba directa.
- Conversación completa desde la UI: 10.4 s para 22 tokens de salida, incluido arranque de contexto.
- Memoria GPU del modelo: aproximadamente 3.7 GB; ejecución íntegra en la RTX 5060 Laptop.
- Kokoro: muestra de 5.65 s, WAV de 24 kHz y 271,244 bytes.
- Instalador SHA-256: `61D7AE6E50E15F3CCB7C97567F1143132C9B07A6CCA7BF5C835B948728137A09`.
- Firma Authenticode: no firmada; no se dispone de certificado comercial en esta publicación comunitaria.

No se considera aprobado ningún escenario que no se haya observado o medido.
