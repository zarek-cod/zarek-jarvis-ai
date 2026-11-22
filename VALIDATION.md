# Validación de ZAREK JARVIS AI

Fecha de última validación: 2026-11-22 (America/Lima).

## Versión 1.2.0 — validación final (2026-11-22)

| Prueba | Resultado observado |
|---|---|
| Frontend Vitest | 139/139 correctas |
| Rust/Tauri | 51/51 correctas |
| Backend dirigido de voz/API | 36/36 correctas |
| Backend ampliado (voz, herramientas, seguridad y API) | 2.016 correctas, 32 omitidas |
| Aplicación instalada | `FileVersion` y `ProductVersion` 1.2.0 |
| Backend instalado | Conectado, `multi / qwen3.5:4b` |
| Modo Voz | Ruta separada, núcleo grande, sin caja de escritura |
| Markdown | Títulos y listas observados como elementos renderizados, no texto crudo |
| Escucha continua | Visible como `Esperando “Jarvis”`; depende del consentimiento guardado |
| Audio sin voz | Descartado; no se creó ni envió una orden falsa |
| Kokoro local | `em_alex`, velocidad 0.96, WAV 24 kHz |
| STT real | Español, respuesta 200, confianza 0,644, no-voz 0,075 |
| Respaldo CUDA | Error real por `cublas64_12.dll` recuperado con CPU `int8` |
| Instalador NSIS | Generado, instalado y abierto correctamente |

Mediciones reales de la instalación:

- Kokoro: 3.470 ms en la primera síntesis medida y 1.004 ms en la segunda; WAV de 187.244 bytes.
- Faster-Whisper: 4.316 ms para audio español de 2,325 s. Produjo `Carvis, dime la hora, por favor.`; la tolerancia de una edición de la activación acepta esa variación de “Jarvis”.
- Modelo `qwen3.5:4b` en caliente: cabeceras en 32 ms, primer contenido en 4.540 ms y respuesta completa en 4.542 ms para una frase corta.
- La salida progresiva entrega la primera oración a TTS antes de terminar una respuesta larga y precarga las siguientes; se evita afirmar una reducción fija porque cambia con cada texto.

Artefacto final:

- Instalador: `C:\Users\joels\Desktop\Jarvis\frontend\src-tauri\target\release\bundle\nsis\ZAREK JARVIS AI_1.2.0_x64-setup.exe`
- Tamaño: 8.201.683 bytes.
- SHA-256: `A269FA4A92CF50EC311F588DFF7CC2D5A42625F0C3C0D84F85B935DC7E881BA4`.
- Ejecutable instalado: `C:\Users\joels\AppData\Local\ZAREK JARVIS AI\zarek-jarvis-desktop.exe`.
- Acceso directo: `C:\Users\joels\AppData\Roaming\Microsoft\Windows\Start Menu\Programs\ZAREK SYSTEMS\ZAREK JARVIS AI.lnk`.
- Firma Authenticode: no disponible en esta edición comunitaria.

La carpeta `Pruebas` se creó dentro del directorio autorizado para dejar evidencia revisable de la política `allowed_dirs`. Los detalles de implementación y límites están en `docs/ZAREK-V1.2-IMPLEMENTATION.md`.

Las 32 omisiones ampliadas corresponden a condiciones declaradas por plataforma o dependencias opcionales. Las pruebas de bits POSIX `0600/0700` se omiten en Windows porque `st_mode` no verifica una ACL de NTFS. La ejecución aislada sí se corrigió y probó con grupos de procesos y finalización de árbol específicos de Windows.

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
