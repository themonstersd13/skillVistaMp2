from __future__ import annotations

import json
import time
from typing import Any

import httpx

from ..config import get_settings

settings = get_settings()


class LLMOrchestrator:
    _ollama_retry_after = 0.0
    _groq_retry_after = 0.0

    async def chat_json(self, prompt: str, fallback_payload: dict[str, Any]) -> tuple[dict[str, Any], str]:
        providers = [
            self._ollama_chat_json,
            self._groq_chat_json,
        ]
        for provider in providers:
            result = await provider(prompt)
            if result:
                return result
        return fallback_payload, "heuristic"

    async def _ollama_chat_json(self, prompt: str) -> tuple[dict[str, Any], str] | None:
        if time.time() < self._ollama_retry_after:
            return None

        try:
            async with httpx.AsyncClient(timeout=8.0) as client:
                response = await client.post(
                    f"{settings.ollama_base_url}/api/generate",
                    json={
                        "model": settings.ollama_model,
                        "prompt": prompt,
                        "stream": False,
                        "format": "json",
                    },
                )
                response.raise_for_status()
                payload = response.json()
                raw = payload.get("response", "{}")
                return json.loads(raw), "ollama"
        except Exception:  # noqa: BLE001
            self._ollama_retry_after = time.time() + 90
            return None

    async def _groq_chat_json(self, prompt: str) -> tuple[dict[str, Any], str] | None:
        if not settings.groq_api_key:
            return None
        if time.time() < self._groq_retry_after:
            return None

        try:
            async with httpx.AsyncClient(timeout=12.0) as client:
                response = await client.post(
                    "https://api.groq.com/openai/v1/chat/completions",
                    headers={"Authorization": f"Bearer {settings.groq_api_key}"},
                    json={
                        "model": settings.groq_chat_model,
                        "messages": [
                            {"role": "system", "content": "Return only valid JSON."},
                            {"role": "user", "content": prompt},
                        ],
                        "response_format": {"type": "json_object"},
                    },
                )
                response.raise_for_status()
                data = response.json()
                content = data["choices"][0]["message"]["content"]
                return json.loads(content), "groq"
        except Exception:  # noqa: BLE001
            self._groq_retry_after = time.time() + 90
            return None
