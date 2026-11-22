# Changelog ZAREK

## 2026-11-22 — v1.2.0

- STT español con VAD explícito, confianza, probabilidad de no-voz y conservación de la transcripción original.
- Filtro de silencio, repeticiones, idioma inesperado y la alucinación conocida `Поехали`.
- Intento automático RTX/CUDA y respaldo transparente a CPU `int8` cuando falta el runtime cuBLAS/cuDNN.
- Activación “Jarvis” con tolerancia fonética limitada, armado sin ejecución para la palabra aislada y detección configurable.
- Cola TTS por frases con precarga, cancelación segura e interrupción sin reinicios ni duplicados.
- Métricas visibles de captura/VAD, STT, primer token y TTS.
- Markdown compartido y legible en Chat y Modo Voz, con respuestas largas desplazables.
- Presupuesto de respuesta dinámico hasta 8.192 tokens según complejidad.
- Nueva administración persistente de carpetas autorizadas, con validación de rutas absolutas existentes.
- Aislador de subprocesos compatible con Windows y pruebas POSIX de permisos omitidas explícitamente en NTFS.
- Escenario galáctico, parallax y calidad gráfica Baja/Equilibrada/Ultra.
- Instalador y ejecutable Windows actualizados a 1.2.0.

## 2026-11-21 — v1.1.0

- Rediseño premium con escenario ambiental, auroras, partículas, rayos, cristales oscuros y núcleo holográfico reactivo.
- Nuevo **Modo Voz** inmersivo, separado del chat: sin campo de texto, núcleo grande, transcripción, respuesta automática por Kokoro y control de interrupción.
- Tipografía Segoe UI Variable, escalado real pequeño/normal/grande y contraste reforzado en textos secundarios y controles de audio.
- Nueva matriz de audio tipo Discord: enumeración de entradas físicas/virtuales, dispositivo persistente, medidor, prueba, sensibilidad, ganancia compatible, supresión, eco, AGC y detección de cambios.
- `useSpeech` usa el `deviceId` elegido, VAD y corte por silencio, informa permisos/desconexiones y permite interrumpir TTS.
- Activación local configurable “Jarvis”, tono, modo de dos frases y consentimiento explícito para escucha continua.
- Segmentos WebM independientes para eliminar la latencia creciente de las marcas de tiempo de una grabación continua.
- Atajo global `Ctrl + Shift + Espacio` corregido: muestra/enfoca la ventana y activa el micrófono.
- Arranque instalado sin ventanas de terminal; preparación Python compatible con tags ZAREK y actualización segura del checkout administrado cuando está limpio.
- Versión de escritorio 1.1.0, accesos directos NSIS y carpeta del menú Inicio `ZAREK SYSTEMS`.
- Validación real instalada de la frase “Jarvis, dime cuál es tu nombre” y respuesta con “señor Zarek”.
- La escucha continua ya no captura ni corta la propia salida de JARVIS; micrófono y atajo conservan la interrupción intencional.
- El build Tauri excluye el service worker de la PWA y el instalador elimina su caché heredado para evitar que una actualización muestre una interfaz antigua.

## 2026-11-21 — Base inicial

- Clonado OpenJarvis `5a9b5268` y creada la rama `zarek/development`.
- Instalados `uv`, Rust y Ollama desde paquetes oficiales con hashes verificados.
- Creado entorno Python 3.12 con escritorio, voz, métricas NVIDIA y extensión Rust.
- Instalado frontend bloqueado por `package-lock.json`.
- Añadida identidad ZAREK SYSTEMS y prompt editable en español.
- Añadida configuración local-first con Qwen3.5, Faster-Whisper y Kokoro.
- Añadidas voces Kokoro españolas `ef_dora`, `em_alex` y `em_santa` al catálogo.
- Creado núcleo audiovisual Canvas 2D conectado a FFT real de micrófono y TTS.
- Aplicada identidad Electric Blue a la interfaz y marca Tauri.
- Desactivado el updater upstream en la variante personalizada.
- Añadidos scripts reproducibles de setup, inicio, verificación y build.

## Emblema ZAREK

Generado con la herramienta integrada de ImageGen, fondo transparente. Prompt final resumido: emblema geométrico original con núcleo circular, tres anillos segmentados y una Z angular en espacio negativo; azul eléctrico/cian/azure; silueta legible a 32 px; sin texto, marcas, escudo, rostro ni semejanza a insignias ficticias existentes.
