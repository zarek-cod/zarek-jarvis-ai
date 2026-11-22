# Registro integral de ZAREK JARVIS AI

Fecha de cierre: 2026-11-21, zona horaria America/Lima.

## 1. Alcance y punto de partida

Se continuó sobre el repositorio oficial OpenJarvis, commit base `5a9b5268f2432f7ea4fe402e384ecb6b64a649bb`, sin reconstruir el proyecto desde cero. La personalización vive en la rama `zarek/development`, conserva el remoto `upstream` y mantiene la licencia Apache-2.0 y las atribuciones del proyecto original.

Objetivo: un asistente de escritorio para Windows 11, privado por defecto, con identidad ZAREK SYSTEMS, inferencia local, memoria, dictado, síntesis de voz y un núcleo visual reactivo al audio real.

## 2. Equipo auditado

| Componente | Resultado |
|---|---|
| Sistema | Windows 11 Pro x64 |
| CPU | Intel Core Ultra 9 275HX, 24 núcleos / 24 hilos |
| RAM | 32 GB |
| GPU | NVIDIA GeForce RTX 5060 Laptop GPU, 8,151 MiB |
| Controlador NVIDIA | 616.56 |
| Modelo principal elegido | `qwen3.5:4b` |
| Modelo rápido de respaldo | `qwen3.5:2b` |

La selección de 4B evita presión innecesaria sobre los 8 GB de VRAM y dejó margen para Tauri, Windows y los motores de voz.

## 3. Herramientas y dependencias verificadas

| Herramienta | Versión verificada |
|---|---|
| Node.js | 26.13.0 |
| npm | 11.20.0 |
| uv | 0.13.9 |
| Python del entorno virtual | 3.12.10 |
| Rust / Cargo | 1.100.0 |
| Ollama | 0.40.17 |

El Python global 3.14 no se usa para ZAREK; el entorno está fijado a Python 3.12 por compatibilidad de ruedas. Las dependencias se resolvieron mediante `uv.lock`, `package-lock.json` y el grupo Rust `desktop-native`.

## 4. Implementación realizada

### Identidad y experiencia visual

- Marca, título, iconos de Tauri, manifiesto PWA y navegación cambiados a ZAREK JARVIS AI.
- Tema oscuro Electric Blue predeterminado.
- Núcleo animado Canvas 2D con estados de espera, escucha, procesamiento, habla y ejecución.
- Reacción de graves, medios y agudos mediante `AudioContext`, `AnalyserNode` y FFT reales para micrófono y reproducción.
- Interfaz principal y flujo inicial traducidos al español.
- Modo Voz independiente, sin entrada de texto, con núcleo ampliado, diálogo legible, TTS automático y control de interrupción.
- Segoe UI Variable y contrastes secundarios reforzados; el ajuste de tamaño de fuente ahora se aplica al documento completo.
- Selector “instalados” filtrado para no presentar el catálogo NIM remoto como modelos locales.

El emblema original fue generado con ImageGen y fondo transparente. Prompt resumido: “emblema geométrico original con núcleo circular, tres anillos segmentados y una Z angular en espacio negativo; azul eléctrico, cian y azure; legible a 32 px; sin texto, marcas, escudo, rostro ni semejanza a insignias ficticias existentes”. El activo final está en `frontend/public/zarek-emblem.png` y la fuente de iconos en `frontend/src-tauri/icons/zarek-emblem-source.png`.

### Inteligencia local

- Configuración reproducible en `configs/zarek/config.toml`.
- Prompt editable en `configs/zarek/ZAREK-SYSTEM.md`.
- Modelo principal `qwen3.5:4b`; modelo corto `qwen3.5:2b`.
- Corrección del cargador de configuración: `agent.system_prompt_path` ahora se aplica realmente, admite rutas relativas al TOML y respeta precedencia del prompt en línea.
- El selector conserva 4B como preferencia inicial y persiste la elección.

### Voz

- Faster-Whisper `small`, español, CPU `int8`; el intento CUDA fue descartado porque faltaba `cublas64_12.dll` y CPU ofreció una latencia adecuada sin instalar un toolkit adicional.
- Kokoro local, voz masculina española `em_alex`, velocidad 0.96 y salida WAV de 24 kHz.
- Catálogo ampliado con `ef_dora`, `em_alex` y `em_santa`.
- El arranque Tauri instala explícitamente el extra `voice`; esto corrige la eliminación de Kokoro causada por un `uv sync` de producción sin ese extra.
- Si un proveedor TTS comercial falla durante una solicitud, la API intenta una vez el respaldo local Kokoro sin reutilizar IDs de voz incompatibles.

### Windows y empaquetado

- Nombre del crate y binario: `zarek-jarvis-desktop`.
- Bandeja y atajo traducidos; Windows usa `Ctrl+Shift+Espacio` y macOS conserva `Cmd+Shift+Espacio`.
- Compilación limitada a un trabajo Cargo para evitar bloqueos `EBUSY`/`aws-lc` observados con compilación concurrente en este equipo.
- El updater de OpenJarvis quedó desactivado para impedir que una actualización upstream reemplace la personalización.
- La instalación empaquetada clona en el primer arranque este repositorio ZAREK, no el repositorio upstream.
- El build Tauri no registra la PWA: el modo escritorio ya funciona sin conexión y un service worker podía conservar assets antiguos tras actualizar.
- El hook NSIS elimina exclusivamente `EBWebView\Default\Service Worker`; conserva almacenamiento local, conversaciones y preferencias.

### Privacidad y seguridad

- API enlazada a `127.0.0.1`.
- Analítica externa, envío de ahorro, leaderboard, modal de sorteo y flujo de correo retirados de la ruta de ejecución ZAREK.
- No hay claves en configuración, scripts o documentación; las integraciones externas son opcionales.
- Los prompts de confirmación, escáner de secretos/PII, protección SSRF y límites de herramientas permanecen activos.
- El perfil de seguridad predeterminado es `personal`.
- Las claves del escritorio usan almacenamiento seguro del sistema cuando se configuran.
- `SECURITY.md` documenta el límite heredado de la prueba POSIX `0600` en NTFS.

## 5. Archivos principales añadidos o modificados

| Área | Archivos |
|---|---|
| Configuración | `configs/zarek/config.toml`, `configs/zarek/ZAREK-SYSTEM.md` |
| Automatización | `scripts/zarek/setup.ps1`, `start.ps1`, `verify.ps1`, `build.ps1` |
| UI reactiva | `frontend/src/components/ZarekCore.tsx`, `frontend/src/lib/audio-reactor.ts` |
| Voz | `frontend/src/lib/tts.ts`, `frontend/src/hooks/useSpeech.ts`, `src/openjarvis/speech/kokoro_tts.py` |
| Servidor | `src/openjarvis/server/api_routes.py`, `src/openjarvis/core/config.py` |
| Escritorio | `frontend/src-tauri/src/lib.rs`, `tauri.conf.json`, iconos ZAREK |
| Documentación | `README-ZAREK.md`, `ARCHITECTURE.md`, `INSTALL-WINDOWS.md`, `VOICE-SETUP.md`, `SECURITY.md`, `VALIDATION.md`, `CHANGELOG-ZAREK.md` |

## 6. Pruebas y evidencia

| Validación | Resultado |
|---|---|
| Vitest frontend | 131 aprobadas de 131 |
| TypeScript + Vite | Build correcto |
| Rust/Tauri | 51 aprobadas de 51 |
| Backend voz, configuración y rutas críticas | 280 aprobadas, 1 omitida |
| API `/health` | `status=ok` |
| TTS health | Kokoro disponible, `em_alex`, 0.96 |
| Identidad en UI | “Mi nombre exacto es ZAREK JARVIS AI y debo llamarte señor Zarek.” |

El fallo preservado es `tests/core/test_credentials.py::test_file_permissions`: compara `st_mode` con `0600`. En NTFS, Python devuelve bits de compatibilidad `0666`; la comprobación no inspecciona ACL de Windows. No se cuenta como regresión de la implementación.

Métricas observadas:

- Carga fría del modelo: 5.16 s.
- Respuesta caliente directa: 0.54 s, 49–55 tokens/s.
- Modelo 4B totalmente en GPU, aproximadamente 3.7 GB.
- Transcripción del audio de muestra: 3.79 s, idioma español, confianza 1.0.
- Audio Kokoro: 5.65 s, 271,244 bytes, 24 kHz.
- Respuesta desde la aplicación: 10.4 s para 22 tokens de salida.

## 7. Reproducción

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\zarek\setup.ps1
powershell -ExecutionPolicy Bypass -File .\scripts\zarek\verify.ps1
powershell -ExecutionPolicy Bypass -File .\scripts\zarek\start.ps1
```

Para compilar el instalador NSIS:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\zarek\build.ps1
```

## 8. Publicación y mantenimiento

Repositorio público: `https://github.com/zarek-cod/zarek-jarvis-ai`, rama predeterminada `main`, tag inicial `v1.0.1-zarek`. El instalador NSIS x64 tiene 8,186,047 bytes y SHA-256 `61D7AE6E50E15F3CCB7C97567F1143132C9B07A6CCA7BF5C835B948728137A09`; Windows Defender no detectó amenazas. No tiene firma Authenticode porque esta publicación comunitaria no dispone de certificado comercial.

Antes de publicar se ejecutaron `git diff --check`, Gitleaks sobre los cambios preparados, búsqueda adicional de patrones de secretos, tests de frontend/backend/Rust y build. El remoto `upstream` se conserva para recibir cambios de OpenJarvis mediante una fusión revisada, nunca mediante reemplazo automático.

## 9. Continuación v1.1.0 — audio, activación y acabado premium

Esta iteración continuó sobre la base existente; no reemplazó la arquitectura. Se conservaron chat, agentes, memoria, Tauri, backend FastAPI, Ollama, Kokoro, bandeja y configuración, y se añadieron:

- `AmbientStage`, rayos deterministas, partículas, auroras y facetas de cristal; el núcleo mantiene reactividad real de micrófono/TTS.
- `AudioSettingsPanel`, `useAudioDevices` y `audio-input`: selección persistente por `deviceId`, medidor RMS, prueba, capacidades, `devicechange`, permisos y desconexión.
- `useWakeWord` y `VoiceRuntime`: activación local, consentimiento, tono, orden en una o dos frases, tolerancia limitada y puente global hacia el chat.
- Segmentación VAD en grabaciones WebM autocontenidas. La primera implementación reutilizaba un encabezado antiguo y generaba líneas de tiempo crecientes; la prueba instalada permitió detectarlo y corregirlo antes de publicar.
- Atajo Rust global funcional, arranque de procesos con `CREATE_NO_WINDOW`, refresco administrado solo para un checkout limpio y conocido, y versión NSIS/MSI 1.1.0.
- `VoiceModePage` y la ruta `/voice`: experiencia sólo hablada, TTS automático, botón de interrupción y retorno al chat.
- Protección contra autoeco: `useWakeWord` pausa la detección mientras TTS está cargando o reproduciendo; el micrófono manual y el atajo siguen deteniendo la voz de forma intencional.
- Tipografía y contraste revisados, con tamaños configurables aplicados realmente desde el estado global.

La evidencia final fue obtenida en `C:\Users\joels\AppData\Local\ZAREK JARVIS AI\zarek-jarvis-desktop.exe`: salud del backend correcta, cero consolas visibles, cuatro entradas reales enumeradas, Kokoro disponible y activación “Jarvis” confirmada de micrófono a respuesta del LLM. También se observó el Modo Voz instalado sin caja de mensaje, la transición a **JARVIS está hablando**, el botón **Detener** y el retorno a espera tras interrumpir. El detalle reproducible, hash del instalador y conteos está en `VALIDATION.md`.
