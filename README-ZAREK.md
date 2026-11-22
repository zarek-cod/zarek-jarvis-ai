# ZAREK JARVIS AI

ZAREK JARVIS AI es una adaptación local-first de OpenJarvis para Windows 11. Conserva el backend modular, la memoria, la seguridad, la telemetría y la aplicación Tauri del proyecto original, y añade una identidad propia de ZAREK SYSTEMS, configuración en español y un núcleo audiovisual sincronizado con audio real.

## Funciones disponibles

- Chat local con streaming mediante Ollama.
- Modo Voz inmersivo independiente: núcleo grande, sin caja de texto y respuesta hablada automática.
- Modelo principal `qwen3.5:4b` y modelo rápido opcional `qwen3.5:2b`.
- Personalidad editable en `configs/zarek/ZAREK-SYSTEM.md`.
- Dictado local con Faster-Whisper.
- Transcripción española con VAD, confianza, filtro de silencio/alucinaciones y respaldo automático de CUDA a CPU.
- Selector completo de micrófonos de Windows con nivel en vivo, prueba y procesamiento configurable.
- Activación local “Jarvis” opcional, palabra configurable y escucha continua solo con consentimiento.
- Atajo global `Ctrl + Shift + Espacio`, botón de micrófono e interrupción de voz.
- Voz masculina española local con Kokoro (`em_alex`).
- TTS progresivo por frases, precarga de audio e interrupción sin duplicados.
- ElevenLabs disponible como proveedor opcional; no se incluye ninguna clave.
- Núcleo Canvas 2D con estados standby/listening/thinking/speaking/executing.
- Reacción verdadera a audio mediante `AudioContext` y `AnalyserNode` (FFT de graves, medios y agudos).
- Historial, memoria, métricas de GPU y credenciales de inferencia protegidas por Windows Credential Manager, heredadas de OpenJarvis.
- Aplicación de escritorio Tauri con bandeja, atajo global, notificaciones y autostart.
- Carpetas autorizadas configurables y persistentes para las herramientas de archivos.
- Calidad gráfica Baja, Equilibrada o Ultra para adaptar galaxias, partículas y núcleo al equipo.
- Actualizaciones de escritorio sin frontend obsoleto: el instalador limpia solamente el caché de service worker heredado y conserva conversaciones y preferencias.

## Inicio rápido

El instalador de Windows se publica en [GitHub Releases](https://github.com/zarek-cod/zarek-jarvis-ai/releases/latest). Como esta versión comunitaria no posee un certificado comercial de firma de código, Windows puede mostrar una advertencia de editor desconocido; verifique el SHA-256 publicado antes de ejecutarla.

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\zarek\setup.ps1
powershell -ExecutionPolicy Bypass -File .\scripts\zarek\start.ps1
```

Para la interfaz web durante desarrollo:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\zarek\start.ps1 -Web
```

La instalación normal se abre sin VS Code con:

```powershell
Start-Process "$env:LOCALAPPDATA\ZAREK JARVIS AI\zarek-jarvis-desktop.exe"
```

Para usarla sin escribir, abra **Modo Voz** en la barra lateral. Diga “Jarvis”, pulse el núcleo o use `Ctrl + Shift + Espacio`; JARVIS escuchará la orden y leerá la respuesta. Pulse de nuevo el micrófono o el botón **Detener** para interrumpir la reproducción.

Consulte `INSTALL-WINDOWS.md`, `VOICE-SETUP.md` y `SECURITY.md` antes de habilitar integraciones externas o herramientas de sistema.

## Registro integral de implementación y auditoría

La auditoría original está en [`docs/ZAREK-AUDIT-AND-IMPLEMENTATION.md`](docs/ZAREK-AUDIT-AND-IMPLEMENTATION.md), la implementación de V1.2 en [`docs/ZAREK-V1.2-IMPLEMENTATION.md`](docs/ZAREK-V1.2-IMPLEMENTATION.md) y los resultados reproducibles en [`VALIDATION.md`](VALIDATION.md).

## Licencias y atribución

Este trabajo deriva de OpenJarvis y conserva su licencia Apache-2.0 y atribuciones. El crate de escritorio conserva las condiciones MIT declaradas por el proyecto base. El emblema ZAREK es un activo original generado para esta adaptación; su prompt se registra en `CHANGELOG-ZAREK.md`.
