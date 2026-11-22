# Implementación ZAREK JARVIS AI 1.2.0

Fecha de cierre: 2026-11-22, America/Lima.

## Alcance

V1.2 se implementó sobre V1.1. Se conservaron la aplicación Tauri, React, el chat, las conversaciones, FastAPI, Ollama, agentes, memoria, bandeja, instalador y Kokoro. El trabajo se concentró en la cadena de voz, la legibilidad, la respuesta progresiva y permisos de archivos.

## Cadena de voz final

1. `getUserMedia` abre el `deviceId` guardado; si Windows retiró ese dispositivo, se persiste y usa el predeterminado.
2. El medidor calcula ruido de fondo y ajusta el umbral de voz. La grabación se corta después del silencio configurado y exige una duración mínima de voz.
3. `/v1/speech/transcribe` fuerza el idioma configurado (`es`) y Faster-Whisper aplica VAD. Se devuelven texto original, idioma, confianza, probabilidad de no-voz y log-probabilidad media.
4. El cliente rechaza silencio, confianza insuficiente, idioma incompatible, repeticiones y la alucinación conocida `Поехали`.
5. La activación busca “Jarvis” con tolerancia de una edición. “Jarvis” aislado solo arma la escucha; una frase posterior aporta la orden.
6. El modelo transmite la respuesta. Cada oración completa se limpia de Markdown y se entrega a Kokoro sin esperar el final del texto.
7. La cola TTS precarga la frase siguiente, evita duplicados y se cancela al pulsar el micrófono, el atajo o **Detener**.

La escucha continua sigue desactivada hasta que el usuario la acepta en Configuración. Durante la voz de JARVIS, la detección continua se pausa para evitar autoeco.

## Aceleración y recuperación

El equipo expone la RTX 5060 Laptop a CTranslate2, por lo que se intenta `cuda/float16`. En esta instalación falta `cublas64_12.dll`; el primer intento real detectó esa condición. V1.2 cambia entonces a `cpu/int8` y reintenta la misma transcripción. El audio ya no queda inutilizado por una instalación incompleta del runtime CUDA.

## Respuestas, Markdown y personalidad

- Chat y Modo Voz usan `AssistantMarkdown`, con listas, títulos, enlaces y bloques de código legibles.
- La limpieza para TTS elimina sintaxis, no el contenido útil.
- El presupuesto máximo se adapta: 768 tokens para órdenes simples, 2.048 para conversación normal, 4.096 para contenido técnico y 8.192 cuando se solicita detalle.
- El prompt distingue intención, duda y mera mención. Ante ambigüedad pide confirmación y nunca presenta una acción no verificada como completada.

## Interfaz

- `AmbientStage` añade galaxias, estrellas, destellos, capas con parallax y densidad adaptable.
- `ZarekCore` conserva estados de espera, escucha, procesamiento y habla, con frecuencia y partículas según la calidad gráfica.
- El Modo Voz es una ruta propia, sin cuadro de escritura y con desplazamiento para respuestas largas.
- La sección Audio expone idioma y confianza mínima, además del dispositivo, medidor, sensibilidad, VAD, ganancia cuando existe y prueba.
- La sección Permisos administra hasta 16 carpetas existentes y absolutas. El backend continúa aplicando `allowed_dirs` en sus herramientas.

## Archivos principales

| Área | Archivos |
|---|---|
| STT | `src/openjarvis/speech/faster_whisper.py`, `_stubs.py`, `server/api_routes.py` |
| Captura/activación | `frontend/src/lib/audio-input.ts`, `hooks/useSpeech.ts`, `hooks/useWakeWord.ts`, `hooks/useAudioDevices.ts` |
| TTS progresivo | `frontend/src/lib/tts.ts`, `lib/message-text.ts`, `pages/VoiceModePage.tsx` |
| Conversación | `lib/response-budget.ts`, `components/Chat/InputArea.tsx`, `MessageBubble.tsx` |
| UI | `components/AmbientStage.tsx`, `ZarekCore.tsx`, `index.css` |
| Permisos | `components/settings/PermissionsSettingsPanel.tsx`, `src-tauri/src/lib.rs` |
| Configuración | `configs/zarek/config.toml`, `configs/zarek/ZAREK-SYSTEM.md` |

## Rendimiento observado

| Etapa | Resultado V1.2 |
|---|---|
| STT de muestra española de 2,325 s | 4,316 s en CPU `int8`, confianza 0,644 |
| Primer contenido del modelo en caliente | 4,540 s |
| Kokoro primera síntesis medida | 3,470 s |
| Kokoro síntesis caliente | 1,004 s |

Antes, el frontend esperaba la respuesta completa y luego sintetizaba todo el bloque. Ahora inicia TTS cuando llega la primera oración completa y precarga la siguiente. En respuestas largas se solapan generación y síntesis; no se inventa una cifra única de mejora porque depende de la longitud y del momento en que el modelo cierra su primera oración.

## Límites comprobados

- La aceleración STT por GPU requiere que Windows pueda cargar las DLL CUDA/cuBLAS compatibles. Sin ellas, funciona el respaldo CPU.
- El instalador comunitario no tiene firma Authenticode.
- ElevenLabs no se prueba sin una clave aportada por el usuario; Kokoro local sí fue probado.
- Los bits de modo POSIX `0600/0700` no son una prueba válida de ACL en NTFS. Esa comprobación se omite explícitamente en Windows; no se contabiliza como aprobada.

## Compatibilidad Windows adicional

La batería ampliada encontró que el aislador heredado usaba `os.setsid` y `os.killpg`, inexistentes en Windows. V1.2 usa `CREATE_NEW_PROCESS_GROUP` y `taskkill /T /F` en Windows, mantiene grupos POSIX en otros sistemas y preserva el entorno mínimo requerido (`SystemRoot`, `ComSpec`, temporales y `PATHEXT`). También se emula el `echo` benigno de plantillas sin abrir `cmd.exe`, de modo que los valores con `;`, `&`, sustituciones o espacios siguen siendo argumentos inertes.

## Reproducción

```powershell
npm --prefix .\frontend test -- --run
npm --prefix .\frontend run build
uv run pytest tests/speech/test_faster_whisper.py tests/speech/test_stubs.py tests/server/test_speech_routes.py -q
uv run pytest tests/speech tests/tools tests/security tests/server/test_speech_routes.py -q
cargo test --manifest-path .\frontend\src-tauri\Cargo.toml
powershell -ExecutionPolicy Bypass -File .\scripts\zarek\build.ps1
```
