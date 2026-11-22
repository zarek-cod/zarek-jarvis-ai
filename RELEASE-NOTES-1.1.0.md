# ZAREK JARVIS AI 1.1.0

Esta versión continúa y mejora el proyecto existente; no reemplaza su arquitectura.

## Novedades

- Interfaz premium Electric Blue con núcleo holográfico, rayos, partículas, auroras y cristales oscuros.
- Nuevo **Modo Voz** sin campo de texto, con respuesta hablada automática e interrupción.
- Matriz de micrófonos de Windows: selector, medidor en vivo, prueba, sensibilidad, ganancia compatible, VAD, supresión de ruido, eco y AGC.
- Activación local por “Jarvis”, botón de micrófono y atajo global `Ctrl + Shift + Espacio`.
- Voz local Kokoro `em_alex`; ElevenLabs continúa siendo opcional y no se incluye ninguna clave.
- Tipografía, tamaños y contraste mejorados.
- Instalador Windows con accesos directos, bandeja y actualizaciones sin caché visual obsoleto.

## Verificación

- Frontend: 131 pruebas correctas.
- Rust/Tauri: 51 pruebas correctas.
- Backend de voz, configuración y rutas críticas: 280 correctas, 1 omitida.
- Build Vite, MSI y NSIS correctos.
- Activación “Jarvis”, respuesta con “señor Zarek”, Modo Voz, reproducción automática e interrupción comprobados en la aplicación instalada.

## Instalador x64

- Archivo: `ZAREK JARVIS AI_1.1.0_x64-setup.exe`
- SHA-256: `006157F5EFAD4E226DE2CE4777AB22B3C287FF0103CE2525B67DB58D66B669B3`
- Firma: sin Authenticode; Windows puede mostrar “editor desconocido”.

La documentación completa está en `docs/ZAREK-AUDIT-AND-IMPLEMENTATION.md` y los resultados reproducibles en `VALIDATION.md`.
