# Validación de ZAREK JARVIS AI

Fecha: 2026-11-21 (America/Lima).

## Versión 1.1.0 — validación final

| Prueba | Resultado observado |
|---|---|
| Frontend Vitest | 131/131 correctas |
| TypeScript + Vite | Build de producción correcto |
| Rust/Tauri | 51/51 correctas |
| Backend voz, configuración y rutas críticas | 280 correctas, 1 omitida |
| NSIS x64 y MSI x64 | Generados correctamente |
| Instalación silenciosa y apertura | Correctas |
| Backend instalado `/health` | `{"status":"ok"}` |
| Consola visible al iniciar | Ninguna (`WindowsTerminal`: 0 ventanas) |
| Bandeja, acceso de Escritorio y menú Inicio | Presentes |
| Micrófonos de Windows | 4 dispositivos reales enumerados más el predeterminado |
| Palabra “Jarvis” | Aprobada de extremo a extremo |
| Atajo `Ctrl + Shift + Espacio` | Aprobado: abrió el chat y activó escucha |
| TTS local | Kokoro disponible, `em_alex`, velocidad 0.96 |
| Modo Voz instalado | Aprobado: ruta `/voice`, núcleo grande y sin caja de mensaje |
| Respuesta hablada automática | Aprobada: estados `Preparando voz local…` y `JARVIS está hablando`, control **Detener** visible |
| Interrupción | Aprobada: el micrófono detuvo la reproducción y devolvió el estado a `Esperando “Jarvis”` |
| Actualización de frontend Tauri | Aprobada: caché heredado eliminado y conversaciones/preferencias conservadas |

La prueba de activación reprodujo una muestra real por los altavoces: “Jarvis, dime cuál es tu nombre”. La aplicación la capturó con `Microphone Array (Realtek(R) Audio)`, creó la conversación `dime cual es tu nombre`, ejecutó `qwen3.5:4b` y respondió: “A su servicio, señor Zarek… Mi nombre es ZAREK JARVIS AI.” No se da por aprobada solo por pruebas unitarias: se observó el flujo dentro de la instalación NSIS.

En la prueba final del nuevo apartado, **Modo Voz** recibió una orden sin teclado, mostró la respuesta generada, sintetizó con Kokoro y alcanzó el estado visible **JARVIS está hablando** con botón **Detener**. La escucha continua permaneció suspendida durante la salida para no capturar el altavoz; al interrumpir, volvió a **Esperando “Jarvis”**.

Dispositivos enumerados durante la prueba:

- Comunicaciones — Microphone (4- Usb Audio Device).
- Microphone Array (Realtek(R) Audio).
- Microphone (4- Usb Audio Device).
- VoiceWave Microphone (EaseUS Virtual Device).

Artefacto final: `ZAREK JARVIS AI_1.1.0_x64-setup.exe`, 8,196,365 bytes, SHA-256 `006157F5EFAD4E226DE2CE4777AB22B3C287FF0103CE2525B67DB58D66B669B3`. No está firmado con Authenticode.

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
- Instalador final SHA-256: `006157F5EFAD4E226DE2CE4777AB22B3C287FF0103CE2525B67DB58D66B669B3`.
- Firma Authenticode: no firmada; no se dispone de certificado comercial en esta publicación comunitaria.

No se considera aprobado ningún escenario que no se haya observado o medido.
