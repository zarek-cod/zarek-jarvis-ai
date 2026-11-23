"""Curated voice profiles for the ZAREK desktop experience.

Kokoro exposes three native Spanish speaker embeddings.  Its public pipeline
also supports comma-separated embedding blends, which produce a genuinely new
timbre while preserving the Spanish grapheme-to-phoneme pipeline.  The blended
profiles below are therefore not speed or pitch presets.
"""

from __future__ import annotations

from typing import Any, Dict, List

KOKORO_LICENSE_URL = "https://huggingface.co/hexgrad/Kokoro-82M"

SPANISH_VOICE_PROFILES: List[Dict[str, Any]] = [
    {
        "id": "atlas",
        "name": "Atlas",
        "voice_id": "em_alex",
        "backend": "kokoro",
        "kind": "original",
        "source_voices": ["em_alex"],
        "gender": "Masculina",
        "language": "Español",
        "accent": "Internacional",
        "style": "Mayordomo elegante, claro y sereno",
        "preview_text": (
            "A su servicio, señor Zarek. Todos los sistemas están preparados."
        ),
    },
    {
        "id": "vega",
        "name": "Vega",
        "voice_id": "ef_dora",
        "backend": "kokoro",
        "kind": "original",
        "source_voices": ["ef_dora"],
        "gender": "Femenina",
        "language": "Español",
        "accent": "Internacional",
        "style": "Profesional natural, precisa y sofisticada",
        "preview_text": "Buenas tardes, señor Zarek. ¿En qué puedo asistirle hoy?",
    },
    {
        "id": "orion",
        "name": "Orión",
        "voice_id": "em_santa",
        "backend": "kokoro",
        "kind": "original",
        "source_voices": ["em_santa"],
        "gender": "Masculina",
        "language": "Español",
        "accent": "Internacional",
        "style": "Narrador profundo, cálido y pausado",
        "preview_text": (
            "Iniciando análisis. Le presentaré los resultados con claridad y detalle."
        ),
    },
    {
        "id": "nova",
        "name": "Nova",
        "voice_id": "ef_dora,em_alex",
        "backend": "kokoro",
        "kind": "blend",
        "source_voices": ["ef_dora", "em_alex"],
        "gender": "Mixta",
        "language": "Español",
        "accent": "Internacional",
        "style": "Asistente moderno, equilibrado y cercano",
        "preview_text": (
            "Conexión establecida. Estoy lista para continuar con su solicitud."
        ),
    },
    {
        "id": "titan",
        "name": "Titán",
        "voice_id": "em_alex,em_santa",
        "backend": "kokoro",
        "kind": "blend",
        "source_voices": ["em_alex", "em_santa"],
        "gender": "Masculina",
        "language": "Español",
        "accent": "Internacional",
        "style": "Grave, firme y cinematográfica",
        "preview_text": (
            "Núcleo operativo. Procederé cuando usted lo indique, señor Zarek."
        ),
    },
    {
        "id": "lyra",
        "name": "Lyra",
        "voice_id": "ef_dora,em_santa",
        "backend": "kokoro",
        "kind": "blend",
        "source_voices": ["ef_dora", "em_santa"],
        "gender": "Mixta",
        "language": "Español",
        "accent": "Internacional",
        "style": "Suave, expresiva y envolvente",
        "preview_text": "He organizado la información y puedo explicarla paso a paso.",
    },
]


def spanish_voice_catalog(*, available: bool = True) -> List[Dict[str, Any]]:
    """Return JSON-ready profiles without leaking shared mutable state."""
    return [
        {
            **profile,
            "available": available,
            "delivery": "Incluida; descarga automática y caché local",
            "license": "Apache-2.0",
            "license_url": KOKORO_LICENSE_URL,
            "pitch_supported": False,
            "speed_supported": True,
            "volume_supported": True,
        }
        for profile in SPANISH_VOICE_PROFILES
    ]


__all__ = ["KOKORO_LICENSE_URL", "SPANISH_VOICE_PROFILES", "spanish_voice_catalog"]
