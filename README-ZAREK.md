# ZAREK JARVIS AI

ZAREK JARVIS AI es una adaptación local-first de OpenJarvis para Windows 11. Conserva el backend modular, la memoria, la seguridad, la telemetría y la aplicación Tauri del proyecto original, y añade una identidad propia de ZAREK SYSTEMS, configuración en español y un núcleo audiovisual sincronizado con audio real.

## Funciones disponibles

- Chat local con streaming mediante Ollama.
- Modelo principal `qwen3.5:4b` y modelo rápido opcional `qwen3.5:2b`.
- Personalidad editable en `configs/zarek/ZAREK-SYSTEM.md`.
- Dictado local con Faster-Whisper.
- Voz masculina española local con Kokoro (`em_alex`).
- ElevenLabs disponible como proveedor opcional; no se incluye ninguna clave.
- Núcleo Canvas 2D con estados standby/listening/thinking/speaking/executing.
- Reacción verdadera a audio mediante `AudioContext` y `AnalyserNode` (FFT de graves, medios y agudos).
- Historial, memoria, métricas de GPU y credenciales de inferencia protegidas por Windows Credential Manager, heredadas de OpenJarvis.
- Aplicación de escritorio Tauri con bandeja, atajo global, notificaciones y autostart.

## Inicio rápido

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\zarek\setup.ps1
powershell -ExecutionPolicy Bypass -File .\scripts\zarek\start.ps1
```

Para la interfaz web durante desarrollo:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\zarek\start.ps1 -Web
```

Consulte `INSTALL-WINDOWS.md`, `VOICE-SETUP.md` y `SECURITY.md` antes de habilitar integraciones externas o herramientas de sistema.

## Registro integral de implementación y auditoría

La revisión completa —inventario del equipo, herramientas instaladas, arquitectura, archivos modificados, pruebas reales, métricas, privacidad, limitaciones y procedimiento de publicación— está documentada en [`docs/ZAREK-AUDIT-AND-IMPLEMENTATION.md`](docs/ZAREK-AUDIT-AND-IMPLEMENTATION.md). Los resultados resumidos y reproducibles están en [`VALIDATION.md`](VALIDATION.md).

## Licencias y atribución

Este trabajo deriva de OpenJarvis y conserva su licencia Apache-2.0 y atribuciones. El crate de escritorio conserva las condiciones MIT declaradas por el proyecto base. El emblema ZAREK es un activo original generado para esta adaptación; su prompt se registra en `CHANGELOG-ZAREK.md`.
