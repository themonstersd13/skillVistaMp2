from __future__ import annotations

import re
from statistics import mean

FILLER_WORDS = ("um", "uh", "like", "actually", "basically", "you know", "ah")
POSITIVE_SIGNALS = ("designed", "implemented", "improved", "optimized", "measured", "learned", "delivered", "built", "shipped", "led", "solved", "achieved", "created")
COLLAB_SIGNALS = ("team", "collaborated", "communicated", "supported", "feedback", "ownership", "responsibility", "mentored", "presented", "coordinated")
NEGATIVE_SIGNALS = ("don't know", "not sure", "i guess", "maybe", "haven't", "couldn't", "never tried", "no idea")

# STAR method indicators (Situation → Task → Action → Result)
STAR_SITUATION = ("situation", "context", "background", "scenario", "project was", "when we")
STAR_TASK = ("task was", "goal was", "objective", "responsible for", "assigned to", "needed to")
STAR_ACTION = ("i decided", "i chose", "i implemented", "i designed", "i built", "i led", "i created", "my approach", "what i did")
STAR_RESULT = ("result was", "outcome was", "impact was", "improved by", "reduced by", "increased by", "delivered", "learned that")


def _tokenize(text: str) -> list[str]:
    return re.findall(r"[a-zA-Z0-9_+#.-]+", text.lower())


def _phrase_count(text: str, phrases: tuple[str, ...]) -> int:
    """Count how many of the given phrases appear in the text."""
    text_lower = text.lower()
    return sum(1 for phrase in phrases if phrase in text_lower)


def _sentiment_score(text: str) -> float:
    """Simple rule-based sentiment score (0-1). Higher = more positive/confident."""
    text_lower = text.lower()
    positive = sum(1 for w in POSITIVE_SIGNALS if w in text_lower)
    negative = sum(1 for w in NEGATIVE_SIGNALS if w in text_lower)
    total = positive + negative
    if total == 0:
        return 0.5
    return round(min(1.0, positive / total), 3)


def _star_completeness(text: str) -> float:
    """Measure how many STAR components the answer contains (0-1)."""
    components = 0
    if _phrase_count(text, STAR_SITUATION) > 0:
        components += 1
    if _phrase_count(text, STAR_TASK) > 0:
        components += 1
    if _phrase_count(text, STAR_ACTION) > 0:
        components += 1
    if _phrase_count(text, STAR_RESULT) > 0:
        components += 1
    return round(components / 4.0, 2)


def _answer_completeness(text: str, question: str = "") -> float:
    """Rough estimate of how completely the answer addresses the question (0-1)."""
    tokens = _tokenize(text)
    word_count = len(tokens)

    # Length-based baseline
    if word_count < 10:
        base = 0.15
    elif word_count < 30:
        base = 0.4
    elif word_count < 60:
        base = 0.65
    elif word_count < 120:
        base = 0.8
    else:
        base = 0.9

    # Bonus for positive signals
    positive_count = _phrase_count(text, POSITIVE_SIGNALS)
    bonus = min(0.1, positive_count * 0.02)

    # Penalty for negative signals
    negative_count = _phrase_count(text, NEGATIVE_SIGNALS)
    penalty = min(0.2, negative_count * 0.05)

    return round(min(1.0, max(0.0, base + bonus - penalty)), 3)


def extract_turn_features(transcript: str, duration_seconds: float, topic_keywords: list[str], question_text: str = "") -> dict[str, float | int]:
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

    # Enhanced signals
    sentiment = _sentiment_score(transcript)
    star_score = _star_completeness(transcript)
    completeness = _answer_completeness(transcript, question_text)

    # Boost scores based on enhanced signals
    behavioral_signal = min(100.0, behavioral_signal + star_score * 12.0)
    confidence_signal = min(100.0, confidence_signal + sentiment * 5.0)

    return {
        "word_count": word_count,
        "filler_count": filler_count,
        "filler_ratio": round(filler_count / max(word_count, 1), 3),
        "speaking_rate_wpm": round(speaking_rate, 2),
        "technical_signal": round(technical_signal, 2),
        "behavioral_signal": round(behavioral_signal, 2),
        "confidence_signal": round(confidence_signal, 2),
        "sentiment_score": sentiment,
        "star_completeness": star_score,
        "answer_completeness": completeness,
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
