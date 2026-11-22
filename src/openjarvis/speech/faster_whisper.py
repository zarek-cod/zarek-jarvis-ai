"""Faster-Whisper speech-to-text backend (local, CTranslate2-based)."""

from __future__ import annotations

import logging
import math
import os
import tempfile
from typing import List, Optional

from openjarvis.core.registry import SpeechRegistry
from openjarvis.speech._stubs import Segment, SpeechBackend, TranscriptionResult

try:
    from faster_whisper import WhisperModel
except ImportError:
    WhisperModel = None  # type: ignore[assignment, misc]

try:
    import ctranslate2
except ImportError:
    ctranslate2 = None  # type: ignore[assignment]

logger = logging.getLogger(__name__)


@SpeechRegistry.register("faster-whisper")
class FasterWhisperBackend(SpeechBackend):
    """Local speech-to-text using Faster-Whisper (CTranslate2)."""

    backend_id = "faster-whisper"

    def __init__(
        self,
        model_size: str = "base",
        device: str = "auto",
        compute_type: str = "float16",
    ) -> None:
        self._model_size = model_size
        self._device = device
        self._compute_type = compute_type
        self._model: Optional[WhisperModel] = None
        self._resolved_device: Optional[str] = None
        self._last_error: Optional[str] = None

    def _resolve_device(self) -> str:
        if self._device != "auto":
            return self._device
        if ctranslate2 is not None:
            try:
                if ctranslate2.get_cuda_device_count() > 0:
                    return "cuda"
            except Exception as exc:
                logger.debug("Could not inspect CUDA devices: %s", exc)
        return "cpu"

    def _resolve_compute_type(self, device: Optional[str] = None) -> str:
        """Pick a CTranslate2 compute type supported by the configured device."""
        if ctranslate2 is None:
            return self._compute_type

        try:
            selected_device = device or self._resolve_device()
            supported = set(ctranslate2.get_supported_compute_types(selected_device))
        except Exception as exc:
            logger.debug(
                "Could not inspect CTranslate2 compute types for %s: %s",
                device or self._device,
                exc,
            )
            return self._compute_type

        if self._compute_type in supported:
            return self._compute_type

        preferences = (
            ("int8", "float32", "int8_float32", "int16")
            if self._compute_type == "float16"
            else ("float32", "int8", "int8_float32", "int16")
        )
        fallback = next((value for value in preferences if value in supported), None)
        if fallback is None:
            return self._compute_type

        logger.warning(
            "CTranslate2 compute_type=%r is not supported on device=%r; "
            "using %r instead",
            self._compute_type,
            device or self._device,
            fallback,
        )
        return fallback

    def _ensure_model(self) -> WhisperModel:
        """Lazy-load the Whisper model on first use."""
        if self._model is None:
            if WhisperModel is None:
                self._last_error = (
                    "faster-whisper is not installed. "
                    "Install with: uv sync --extra desktop"
                )
                raise ImportError(self._last_error)
            device = self._resolve_device()
            compute_type = self._resolve_compute_type(device)
            self._model = WhisperModel(
                self._model_size,
                device=device,
                compute_type=compute_type,
            )
            self._resolved_device = device
        self._last_error = None
        return self._model

    @staticmethod
    def _is_missing_cuda_runtime(exc: Exception) -> bool:
        message = str(exc).lower()
        missing_runtime_markers = ("cublas", "cudnn", "cuda runtime", "cuda driver")
        return any(marker in message for marker in missing_runtime_markers)

    def _fallback_to_cpu(self) -> WhisperModel:
        """Recover when CUDA was detected but its runtime DLLs are incomplete."""
        if WhisperModel is None:
            raise ImportError("faster-whisper is not installed")
        compute_type = self._resolve_compute_type("cpu")
        logger.warning(
            "CUDA speech runtime is unavailable; "
            "falling back to CPU/%s for this session",
            compute_type,
        )
        self._model = WhisperModel(
            self._model_size,
            device="cpu",
            compute_type=compute_type,
        )
        self._resolved_device = "cpu"
        return self._model

    def transcribe(
        self,
        audio: bytes,
        *,
        format: str = "wav",
        language: Optional[str] = None,
    ) -> TranscriptionResult:
        """Transcribe audio bytes using Faster-Whisper."""
        try:
            model = self._ensure_model()

            # Write audio to a temp file (faster-whisper needs a file path).
            # delete=False + manual unlink: on Windows an open
            # NamedTemporaryFile holds an exclusive handle, so PyAV's reopen
            # of tmp.name inside model.transcribe() fails with EACCES.
            suffix = f".{format}" if not format.startswith(".") else format
            tmp = tempfile.NamedTemporaryFile(suffix=suffix, delete=False)
            try:
                with tmp:
                    tmp.write(audio)

                kwargs = {
                    # Segment silence locally before decoding.  Disabling
                    # cross-window conditioning prevents a bad fragment from
                    # being repeated into the next command.
                    "vad_filter": True,
                    "vad_parameters": {
                        "min_speech_duration_ms": 240,
                        "min_silence_duration_ms": 520,
                        "speech_pad_ms": 180,
                    },
                    "condition_on_previous_text": False,
                    "beam_size": 5,
                }
                if language:
                    kwargs["language"] = language

                try:
                    segments_iter, info = model.transcribe(tmp.name, **kwargs)
                    segments_list = list(segments_iter)
                except Exception as decode_exc:
                    if (
                        self._device == "auto"
                        and self._resolved_device == "cuda"
                        and self._is_missing_cuda_runtime(decode_exc)
                    ):
                        model = self._fallback_to_cpu()
                        segments_iter, info = model.transcribe(tmp.name, **kwargs)
                        segments_list = list(segments_iter)
                    else:
                        raise
            finally:
                try:
                    os.unlink(tmp.name)
                except OSError as unlink_exc:
                    logger.debug(
                        "Could not remove temp audio file %s: %s",
                        tmp.name,
                        unlink_exc,
                    )
        except Exception as exc:
            self._last_error = str(exc)
            raise

        # Build result
        text = "".join(seg.text for seg in segments_list).strip()
        segment_log_probs = [
            float(getattr(seg, "avg_logprob", -10.0)) for seg in segments_list
        ]
        segment_no_speech = [
            float(getattr(seg, "no_speech_prob", 1.0)) for seg in segments_list
        ]
        average_log_probability = (
            sum(segment_log_probs) / len(segment_log_probs)
            if segment_log_probs
            else None
        )
        no_speech_probability = (
            sum(segment_no_speech) / len(segment_no_speech)
            if segment_no_speech
            else 1.0
        )
        acoustic_confidence = (
            max(0.0, min(1.0, math.exp(average_log_probability)))
            if average_log_probability is not None
            else 0.0
        )
        language_confidence = float(getattr(info, "language_probability", 1.0))
        confidence = min(
            language_confidence,
            acoustic_confidence * (1.0 - no_speech_probability),
        )
        segments = [
            Segment(
                text=seg.text.strip(),
                start=seg.start,
                end=seg.end,
                confidence=max(
                    0.0,
                    min(1.0, math.exp(float(getattr(seg, "avg_logprob", -10.0)))),
                ),
            )
            for seg in segments_list
        ]

        self._last_error = None
        return TranscriptionResult(
            text=text,
            language=getattr(info, "language", None),
            confidence=confidence,
            no_speech_probability=no_speech_probability,
            average_log_probability=average_log_probability,
            duration_seconds=getattr(info, "duration", 0.0),
            segments=segments,
        )

    def health(self) -> bool:
        """Check if model is loaded or loadable."""
        try:
            self._ensure_model()
            return True
        except Exception as exc:
            self._last_error = str(exc)
            logger.debug("Faster-Whisper health check failed: %s", exc)
            return False

    def last_error(self) -> Optional[str]:
        """Return the last model load or transcription error, if any."""
        return self._last_error

    def supported_formats(self) -> List[str]:
        """Supported audio formats (same as ffmpeg/Whisper)."""
        return ["wav", "mp3", "m4a", "ogg", "flac", "webm"]
