from __future__ import annotations

import re
from statistics import mean

FILLER_WORDS = ("um", "uh", "like", "actually", "basically", "you know", "ah")
POSITIVE_SIGNALS = ("designed", "implemented", "improved", "optimized", "measured", "learned", "delivered")
COLLAB_SIGNALS = ("team", "collaborated", "communicated", "supported", "feedback", "ownership", "responsibility")


def _tokenize(text: str) -> list[str]:
    return re.findall(r"[a-zA-Z0-9_+#.-]+", text.lower())


def extract_turn_features(transcript: str, duration_seconds: float, topic_keywords: list[str]) -> dict[str, float | int]:
    tokens = _tokenize(transcript)
    word_count = len(tokens)
    filler_count = sum(tokens.count(filler) for filler in FILLER_WORDS)
    speaking_rate = (word_count / max(duration_seconds, 1.0)) * 60.0

    normalized_keywords = {keyword.lower() for keyword in topic_keywords}
    technical_hits = sum(1 for token in tokens if token in normalized_keywords)
    behavior_hits = sum(1 for token in tokens if token in COLLAB_SIGNALS)
    confidence_hits = sum(1 for token in tokens if token in POSITIVE_SIGNALS)

    technical_signal = min(100.0, 35.0 + technical_hits * 8.0 + max(0.0, min(speaking_rate, 160) - 70) * 0.15)
    behavioral_signal = min(100.0, 40.0 + behavior_hits * 10.0 + min(word_count, 120) * 0.12)
    confidence_signal = max(20.0, min(100.0, 55.0 + confidence_hits * 8.0 - filler_count * 4.0))

    return {
        "word_count": word_count,
        "filler_count": filler_count,
        "filler_ratio": round(filler_count / max(word_count, 1), 3),
        "speaking_rate_wpm": round(speaking_rate, 2),
        "technical_signal": round(technical_signal, 2),
        "behavioral_signal": round(behavioral_signal, 2),
        "confidence_signal": round(confidence_signal, 2),
    }


def aggregate_session_features(turns: list[dict[str, float | int]]) -> dict[str, float]:
    if not turns:
        return {
            "technical_score": 0.0,
            "behavioral_score": 0.0,
            "communication_score": 0.0,
            "confidence_score": 0.0,
            "overall_readiness": 0.0,
        }

    technical_score = mean(float(turn["technical_signal"]) for turn in turns)
    behavioral_score = mean(float(turn["behavioral_signal"]) for turn in turns)
    confidence_score = mean(float(turn["confidence_signal"]) for turn in turns)
    communication_score = mean(
        max(0.0, min(100.0, 75.0 - float(turn["filler_ratio"]) * 1000 + min(float(turn["speaking_rate_wpm"]), 165) * 0.18))
        for turn in turns
    )
    overall_readiness = (
        technical_score * 0.38
        + behavioral_score * 0.24
        + communication_score * 0.2
        + confidence_score * 0.18
    )

    return {
        "technical_score": round(technical_score, 2),
        "behavioral_score": round(behavioral_score, 2),
        "communication_score": round(communication_score, 2),
        "confidence_score": round(confidence_score, 2),
        "overall_readiness": round(overall_readiness, 2),
    }
