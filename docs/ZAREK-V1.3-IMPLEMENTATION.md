# Implementación ZAREK JARVIS AI 1.3.0

Fecha de cierre: 2026-11-23, America/Lima.

## Alcance y arquitectura

V1.3 se implementó sobre el commit público de V1.2. No se recreó el proyecto.
Se ampliaron el contrato TTS, la API FastAPI, el estado persistente de React,
la cola progresiva, Configuración y el escenario visual. La captura de
micrófono, el Modo Voz, la activación, los permisos y el arranque Tauri se
conservaron.

El flujo final es:

1. `GET /v1/speech/voices` expone perfiles, capacidades y licencias.
2. Configuración selecciona proveedor y `voice_id` sin editar TOML.
3. Zustand persiste proveedor, voz, velocidad, volumen, nombre y tratamiento.
4. La cola TTS toma una instantánea de esos valores al comenzar la respuesta.
5. Cada fragmento progresivo envía el proveedor explícito al backend; no se
   cambia silenciosamente a otro motor si el solicitado no está disponible.
6. El elemento de audio usa el volumen elegido y alimenta el reactor FFT del
   núcleo. Interrumpir cancela solicitudes, audio y precarga.

## Catálogo y licencias

Kokoro publica tres embeddings españoles nativos. Su `KPipeline.load_voice`
acepta identificadores separados por comas y promedia los embeddings, por lo
que Nova, Titán y Lyra tienen timbre propio dentro del mismo pipeline español.
No se presenta velocidad o tono como voz.

| Perfil | Identificador real | Tipo | Estilo |
|---|---|---|---|
| Atlas | `em_alex` | Masculina | Mayordomo elegante |
| Vega | `ef_dora` | Femenina | Profesional natural |
| Orión | `em_santa` | Masculina | Narrador profundo |
| Nova | `ef_dora,em_alex` | Mixta | Asistente moderno |
| Titán | `em_alex,em_santa` | Masculina | Cinematográfica |
| Lyra | `ef_dora,em_santa` | Mixta | Suave y expresiva |

- Modelo: <https://huggingface.co/hexgrad/Kokoro-82M>
- Licencia del modelo: Apache-2.0.
- Entrega: descarga bajo demanda del repositorio oficial y caché local de
  Hugging Face; el panel indica cuándo una muestra ya fue preparada.
- Piper se evaluó. El motor actual es GPL-3.0-or-later y cada voz puede tener
  restricciones propias que deben acompañarse con su model card. No se añadió
  a este instalador porque Kokoro ya cubre seis timbres españoles reales sin
  introducir un segundo runtime o mezclar licencias en el paquete.
  Referencias: <https://github.com/OHF-Voice/piper1-gpl> y
  <https://github.com/OHF-Voice/piper1-gpl/blob/main/docs/VOICES.md>.

## Interfaz y personalidad

`VoicePersonalityPanel` concentra proveedor, disponibilidad, tarjetas,
previsualización, salida hablada, reproducción automática y preferencias. El
tono aparece deshabilitado con una explicación porque Kokoro no lo admite de
forma nativa; velocidad y volumen sí se aplican.

La interfaz conserva la Z y añade un haz volumétrico, ondas gravitacionales y
una colisión de energía. En calidad Baja se desactivan los efectos más caros.
Las capturas renderizadas a 1.440 px y 900 px confirmaron que los paneles se
reorganizan sin solapamientos.

La forma de tratamiento se agrega como un mensaje de sistema corto y
sanitizado. Esa preferencia declara expresamente que no autoriza acciones. El
prompt ZAREK también exige no inventar resultados, evitar muletillas y mantener
el contexto.

## Comparación del modelo local

Se compararon `qwen3.5:2b` y `qwen3.5:4b` con dos instrucciones españolas a
temperatura 0. En el diagnóstico de micrófono, 2B tardó 2,31 s de evaluación y
4B 3,50 s; 2B introdujo pasos imprecisos sobre controladores, mientras 4B
mantuvo un diagnóstico más prudente. En el caso largo ambos alcanzaron el tope
de 220 tokens y omitieron el cierre solicitado. Se conserva `qwen3.5:4b` por
calidad, sin afirmar que resuelve por sí solo todas las instrucciones largas.

## Audio real medido

Se sintetizó exactamente la misma frase con los seis perfiles. Todos los
resultados comenzaron con cabecera RIFF, usaron WAV a 24 kHz y produjeron una
huella distinta.

| Perfil | Bytes | Duración | Tiempo de síntesis | SHA-256 (12) |
|---|---:|---:|---:|---|
| Atlas | 199.244 | 4,15 s | 7,46 s (carga fría) | `56aa52c492a1` |
| Vega | 196.844 | 4,10 s | 0,90 s | `06ee0d53841d` |
| Orión | 198.044 | 4,12 s | 0,90 s | `16058bfb799f` |
| Nova | 198.044 | 4,12 s | 0,80 s | `581b1624fc63` |
| Titán | 198.044 | 4,12 s | 0,83 s | `49b904a46d13` |
| Lyra | 198.044 | 4,12 s | 0,81 s | `f8da38e066c7` |

## Pruebas y límites

- Vitest: 143/143.
- Rust/Tauri: 51/51.
- Voz/API dirigida: 70 aprobadas y 1 omitida.
- Voz, herramientas, seguridad y servidor: 2.509 aprobadas, 25 omitidas y una
  prueba dependiente de DNS fallida porque `example.com` no resolvió. La API
  rechazó correctamente el host; no se relajó la validación SSRF.
- La suite total se ejecutó hasta 50 fallos: 3.354 aprobadas y 13 omitidas antes
  del corte. Los fallos restantes corresponden a supuestos POSIX/macOS,
  conectores live sin credenciales, scripts Unix y DNS, no a la cadena de voz.
- La prueba completa descubrió y corrigió tres problemas Windows adicionales:
  orden de checkpoints con marcas de tiempo iguales, reloj de baja resolución
  en benchmarks y resolución de `npm.cmd` para el puente Baileys.
- ElevenLabs no se validó sin una clave del usuario. No se incluyó ninguna
  clave, token ni archivo `.env` en el repositorio o instalador.
- El instalador comunitario no está firmado con Authenticode.

## Reproducción

```powershell
npm --prefix .\frontend test -- --run
npm --prefix .\frontend run build
cargo test --manifest-path .\frontend\src-tauri\Cargo.toml
uv run --extra dev --inexact pytest -q tests\speech tests\tools tests\security tests\server
npm --prefix .\frontend run tauri -- build --bundles nsis
```
