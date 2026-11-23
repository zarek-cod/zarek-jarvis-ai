# ZAREK JARVIS AI 1.3.0

Esta versión evoluciona directamente la base 1.2.0. Conserva chat, Modo Voz,
memoria, agentes, bandeja, activación «Jarvis», FastAPI, Tauri, Ollama y la
cadena de audio de Windows.

## Seis voces españolas locales

- **Atlas** (`em_alex`): mayordomo masculino, claro y sereno.
- **Vega** (`ef_dora`): voz femenina profesional y sofisticada.
- **Orión** (`em_santa`): narrador masculino profundo.
- **Nova** (`ef_dora,em_alex`): mezcla moderna y equilibrada.
- **Titán** (`em_alex,em_santa`): mezcla grave y cinematográfica.
- **Lyra** (`ef_dora,em_santa`): mezcla suave y envolvente.

Kokoro carga las mezclas como promedios de embeddings de hablante dentro de
su pipeline español. Son timbres diferentes y no nombres alternativos para
velocidad o tono. Las seis opciones son locales, gratuitas y usan el modelo
Kokoro-82M Apache-2.0. ElevenLabs continúa disponible como proveedor opcional.

El nuevo panel **Voz y personalidad** ofrece muestra real, selección inmediata,
estado del motor, licencia, indicación de caché, velocidad, volumen, salida
automática y forma de tratamiento. El proveedor, la voz y los ajustes se
guardan localmente y sobreviven a un reinicio.

## Conversación y visuales

- La voz seleccionada se captura al iniciar cada respuesta progresiva; todos
  sus fragmentos conservan el mismo timbre, velocidad y volumen.
- Las muestras y respuestas se conectan al analizador de audio real para que
  el núcleo reaccione a cualquier perfil.
- El escenario añade luz volumétrica, ondas gravitacionales y una colisión de
  energía, respetando los niveles Baja, Equilibrada y Ultra.
- La preferencia «señor + nombre», «solo nombre» o trato neutral se integra en
  el contexto sin conceder permisos ni ejecutar acciones.
- El prompt evita muletillas, repeticiones y resultados inventados, conserva
  el hilo y mantiene explicaciones completas cuando la tarea lo exige.

## Validación observada

- React/Vitest: 143/143.
- Rust/Tauri: 51/51.
- Backend dirigido de voz/API: 70 aprobadas, 1 omitida.
- Matriz Python de voz, herramientas, seguridad y servidor: 2.509 aprobadas,
  25 omitidas y 1 fallo externo por DNS bloqueado al resolver `example.com`.
- Seis WAV reales de 24 kHz generados con la misma frase; seis SHA-256
  diferentes. En caliente: 0,80–0,90 s por muestra.
- Build TypeScript/Vite y NSIS x64 correctos; instalación actualizada y
  `FileVersion`/`ProductVersion` 1.3.0 verificados.
- Revisión visual a 1.440 px y al ancho mínimo de 900 px sin desbordamientos
  del panel de audio o de personalidad.

## Instalador x64

- Archivo: `ZAREK JARVIS AI_1.3.0_x64-setup.exe`
- Tamaño: 8.210.377 bytes.
- SHA-256: `57B6F17652D6E57C88051D376F39B9D37B8E2AA7CA67287B4A6C6D7AEDEA584E`
- Firma: sin Authenticode; Windows puede mostrar «editor desconocido».

Los detalles técnicos y las limitaciones verificadas están en
`docs/ZAREK-V1.3-IMPLEMENTATION.md` y `VALIDATION.md`.
