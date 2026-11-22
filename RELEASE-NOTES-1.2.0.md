# ZAREK JARVIS AI 1.2.0

Esta versión continúa sobre la base 1.1.0. No reemplaza el chat, la memoria, los agentes, Tauri, FastAPI, Ollama ni Kokoro.

## Voz que entiende y responde

- Faster-Whisper queda fijado a español, con VAD, métricas de confianza y descarte de silencio, repeticiones y alucinaciones conocidas como `Поехали`.
- Si CUDA está disponible se intenta usar la RTX; si falta una DLL del runtime, la sesión cambia automáticamente a CPU `int8` en lugar de dejar de escuchar.
- La palabra “Jarvis” admite una variación fonética corta del reconocedor, conserva la transcripción original y no ejecuta una orden cuando solo se pronuncia el nombre.
- Kokoro local reproduce la respuesta por frases: empieza con la primera oración completa, precarga la siguiente y permite interrumpir sin duplicar audio.
- Se muestran métricas de captura/VAD, STT, primer token del modelo y preparación TTS.

## Conversación y diseño

- **Modo Voz** permanece separado del chat: núcleo grande, sin campo de escritura, respuesta extensa con Markdown legible y control de interrupción.
- El chat y Modo Voz comparten el mismo renderizador Markdown; títulos, listas y código ya no aparecen como símbolos sin formato.
- Nuevo escenario galáctico con calidad Baja, Equilibrada o Ultra, parallax, estrellas, partículas y núcleo adaptativo.
- Presupuestos de respuesta de 768, 2.048, 4.096 u 8.192 tokens según la complejidad de la petición.
- Personalidad de mayordomo técnico: “señor Zarek”, confirmación de ambigüedades y prohibición de reejecutar órdenes antiguas.

## Seguridad y permisos

- Nueva sección de carpetas autorizadas, persistida en `~/.openjarvis/config.toml`.
- Solo se aceptan rutas absolutas existentes; las confirmaciones para acciones sensibles continúan activas.
- No se incluye ninguna clave privada. ElevenLabs sigue siendo opcional.

## Verificación

- Frontend: 139/139 pruebas.
- Rust/Tauri: 51/51 pruebas.
- Backend ampliado de voz, herramientas, seguridad y API: 2.016 aprobadas, 32 omitidas por plataforma o dependencias opcionales.
- Ejecución aislada corregida para grupos de procesos y terminación de árboles en Windows.
- Aplicación 1.2.0 instalada y abierta desde el ejecutable final.
- Kokoro real: WAV 24 kHz, 187.244 bytes; 3,47 s en frío y 1,00 s en caliente.
- STT real sobre audio español: 4,32 s, confianza 0,644, probabilidad de no-voz 0,075.
- Modelo local en caliente: primer contenido en 4,54 s.

## Instalador x64

- Archivo: `ZAREK JARVIS AI_1.2.0_x64-setup.exe`
- SHA-256: `A269FA4A92CF50EC311F588DFF7CC2D5A42625F0C3C0D84F85B935DC7E881BA4`
- Tamaño: 8.201.683 bytes.
- Firma: sin Authenticode; Windows puede mostrar “editor desconocido”.

Los comandos, rutas y resultados completos están en `VALIDATION.md` y `docs/ZAREK-V1.2-IMPLEMENTATION.md`.
