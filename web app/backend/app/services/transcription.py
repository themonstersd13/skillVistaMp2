from __future__ import annotations

import base64

import httpx

from ..config import get_settings

settings = get_settings()


class TranscriptionService:
    async def transcribe(self, audio_bytes: bytes, mime_type: str | None, session_context: str) -> tuple[str, str]:
        gemini = await self._transcribe_with_gemini(audio_bytes, mime_type)
        if gemini:
            return gemini, "gemini"

        groq = await self._transcribe_with_groq(audio_bytes, mime_type)
        if groq:
            return groq, "groq"

        return self._synthetic_transcript(session_context), "synthetic"

    async def _transcribe_with_gemini(self, audio_bytes: bytes, mime_type: str | None) -> str | None:
        if not settings.gemini_api_key or not audio_bytes:
            return None

        try:
            encoded = base64.b64encode(audio_bytes).decode("utf-8")
            async with httpx.AsyncClient(timeout=15.0) as client:
                response = await client.post(
                    f"https://generativelanguage.googleapis.com/v1beta/models/{settings.gemini_transcribe_model}:generateContent",
                    params={"key": settings.gemini_api_key},
                    json={
                        "contents": [
                            {
                                "role": "user",
                                "parts": [
                                    {"text": "Transcribe the candidate's speech clearly as plain text. Do not summarize."},
                                    {
                                        "inline_data": {
                                            "mime_type": mime_type or "audio/webm",
                                            "data": encoded,
                                        }
                                    },
                                ],
                            }
                        ]
                    },
                )
                response.raise_for_status()
                payload = response.json()
                return payload["candidates"][0]["content"]["parts"][0]["text"].strip()
        except Exception:  # noqa: BLE001
            return None

    async def _transcribe_with_groq(self, audio_bytes: bytes, mime_type: str | None) -> str | None:
        if not settings.groq_api_key or not audio_bytes:
            return None

        try:
            files = {
                "file": ("answer.webm", audio_bytes, mime_type or "audio/webm"),
            }
            data = {
                "model": settings.groq_transcribe_model,
                "language": "en",
                "response_format": "json",
            }
            async with httpx.AsyncClient(timeout=15.0) as client:
                response = await client.post(
                    "https://api.groq.com/openai/v1/audio/transcriptions",
                    headers={"Authorization": f"Bearer {settings.groq_api_key}"},
                    data=data,
                    files=files,
                )
                response.raise_for_status()
                payload = response.json()
                return payload.get("text", "").strip() or None
        except Exception:  # noqa: BLE001
            return None

    def _synthetic_transcript(self, session_context: str) -> str:
        return (
            "Development transcript fallback: the candidate gave a concise response related to "
            f"{session_context}. The answer included practical examples, reasoning, and learning reflections."
        )
