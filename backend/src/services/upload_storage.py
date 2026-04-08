from __future__ import annotations

from pathlib import Path
from uuid import uuid4

from ..config import get_settings

settings = get_settings()

FILE_EXTENSION_BY_MIME = {
    "audio/mp4": ".m4a",
    "audio/mpeg": ".mp3",
    "audio/mp3": ".mp3",
    "audio/ogg": ".ogg",
    "audio/wav": ".wav",
    "audio/webm": ".webm",
}


def persist_interview_audio(
    session_id: str,
    question_index: int,
    audio_bytes: bytes,
    mime_type: str | None,
) -> Path | None:
    if not audio_bytes:
        return None

    uploads_dir = settings.resolved_uploads_dir / "interviews" / session_id
    uploads_dir.mkdir(parents=True, exist_ok=True)

    extension = FILE_EXTENSION_BY_MIME.get((mime_type or "").lower(), ".bin")
    filename = f"q{question_index:02d}-{uuid4().hex}{extension}"
    audio_path = uploads_dir / filename
    audio_path.write_bytes(audio_bytes)
    return audio_path
