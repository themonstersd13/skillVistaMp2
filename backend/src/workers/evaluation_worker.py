"""Background evaluation worker.

Offloads the expensive evaluation generation (LLM calls, SWOT analysis)
from the request handler to a background task.
"""
from __future__ import annotations

import logging

from ..db import SessionLocal
from ..models import InterviewSession, InterviewTurn, Student
from ..services.evaluation import EvaluationService
from ..mongo import store_analytics_snapshot

logger = logging.getLogger(__name__)
evaluation_service = EvaluationService()


async def run_evaluation_task(session_id: str) -> None:
    """Run deferred evaluation for a completed interview session."""
    db = SessionLocal()
    try:
        session = db.get(InterviewSession, session_id)
        if not session:
            logger.warning("Evaluation task: session %s not found", session_id)
            return

        if session.evaluation:
            logger.info("Evaluation task: session %s already evaluated", session_id)
            return

        student = db.get(Student, session.student_id)
        if not student:
            logger.warning("Evaluation task: student not found for session %s", session_id)
            return

        turns = (
            db.query(InterviewTurn)
            .filter(InterviewTurn.session_id == session_id)
            .order_by(InterviewTurn.question_index.asc())
            .all()
        )

        report = await evaluation_service.evaluate_and_store(db, session, student, turns)
        logger.info(
            "Evaluation completed for session %s: readiness=%.1f",
            session_id,
            report.overall_readiness,
        )

        # Store analytics snapshot in MongoDB
        await store_analytics_snapshot({
            "type": "evaluation_completed",
            "session_id": session_id,
            "student_id": student.id,
            "student_name": student.name,
            "academic_year": student.academic_year,
            "overall_readiness": report.overall_readiness,
            "technical_score": report.technical_score,
            "behavioral_score": report.behavioral_score,
            "communication_score": report.communication_score,
            "confidence_score": report.confidence_score,
        })

    except Exception:
        logger.exception("Evaluation task failed for session %s", session_id)
    finally:
        db.close()
