from datetime import datetime, timedelta, timezone
from typing import Any

import jwt
from fastapi import HTTPException, status

from .config import get_settings
from .schemas import CandidateClaims

settings = get_settings()


def create_candidate_token(payload: dict[str, Any], expires_in_hours: int = 12) -> str:
    expires_at = datetime.now(timezone.utc) + timedelta(hours=expires_in_hours)
    claims = {
        **payload,
        "exp": expires_at,
    }
    return jwt.encode(claims, settings.jwt_secret, algorithm=settings.jwt_algorithm)


def decode_candidate_token(token: str) -> CandidateClaims:
    try:
        payload = jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])
        normalized = {
            "sub": str(payload.get("sub") or payload.get("student_id") or payload.get("id")),
            "name": payload.get("name") or "Candidate",
            "email": payload.get("email"),
            "role": payload.get("role", "candidate"),
            "student_id": int(payload.get("student_id") or payload.get("sub") or payload.get("id")),
        }
        return CandidateClaims.model_validate(normalized)
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired JWT.",
        ) from exc
