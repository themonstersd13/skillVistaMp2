"""MongoDB async client for document storage.

Collections:
  - interview_transcripts: full transcript + audio metadata per turn
  - analytics_snapshots: periodic cohort/student analytics aggregates
  - rag_embeddings: content pack embeddings for semantic retrieval
"""
from __future__ import annotations

import logging
from typing import Any

from .config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()

_client = None
_db = None


async def init_mongo() -> None:
    """Initialize MongoDB connection. Call once during app lifespan startup."""
    global _client, _db

    if not settings.has_mongodb:
        logger.info("MongoDB not configured — document storage disabled.")
        return

    try:
        from motor.motor_asyncio import AsyncIOMotorClient  # noqa: WPS433

        _client = AsyncIOMotorClient(settings.mongodb_url, serverSelectionTimeoutMS=5000)
        _db = _client[settings.mongodb_db_name]
        # Ping to verify connection
        await _client.admin.command("ping")
        logger.info("MongoDB connected: %s", settings.mongodb_db_name)
    except Exception as exc:  # noqa: BLE001
        logger.warning("MongoDB connection failed (continuing without document store): %s", exc)
        _client = None
        _db = None


async def close_mongo() -> None:
    """Close MongoDB connection. Call during app lifespan shutdown."""
    global _client, _db
    if _client:
        _client.close()
        _client = None
        _db = None


def get_mongo_db():
    """Get the MongoDB database instance. Returns None if not configured."""
    return _db


async def store_transcript(session_id: str, question_index: int, data: dict[str, Any]) -> None:
    """Store a full transcript document for an interview turn."""
    db = get_mongo_db()
    if not db:
        return

    doc = {
        "session_id": session_id,
        "question_index": question_index,
        **data,
    }
    await db.interview_transcripts.insert_one(doc)


async def store_analytics_snapshot(snapshot: dict[str, Any]) -> None:
    """Store a periodic analytics snapshot."""
    db = get_mongo_db()
    if not db:
        return

    await db.analytics_snapshots.insert_one(snapshot)


async def get_session_transcripts(session_id: str) -> list[dict[str, Any]]:
    """Retrieve all transcripts for a session."""
    db = get_mongo_db()
    if not db:
        return []

    cursor = db.interview_transcripts.find(
        {"session_id": session_id},
        {"_id": 0},
    ).sort("question_index", 1)
    return await cursor.to_list(length=100)


async def store_rag_embedding(content_id: str, embedding: list[float], metadata: dict[str, Any]) -> None:
    """Store a RAG embedding for content retrieval."""
    db = get_mongo_db()
    if not db:
        return

    await db.rag_embeddings.update_one(
        {"content_id": content_id},
        {"$set": {"embedding": embedding, "metadata": metadata}},
        upsert=True,
    )
