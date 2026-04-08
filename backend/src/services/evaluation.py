from __future__ import annotations

from typing import Any

from sqlalchemy.orm import Session

from ..models import EvaluationReport, InterviewSession, InterviewTurn, Student
from .feature_extractor import aggregate_session_features
from .rag import RAGService


class EvaluationService:
    def __init__(self) -> None:
        self.rag = RAGService()

    async def evaluate_and_store(
        self,
        db: Session,
        session: InterviewSession,
        student: Student,
        turns: list[InterviewTurn],
    ) -> EvaluationReport:
        turn_feature_rows = [
            {
                "technical_signal": turn.technical_signal,
                "behavioral_signal": turn.behavioral_signal,
                "confidence_signal": turn.confidence_signal,
                "filler_ratio": turn.filler_ratio,
                "speaking_rate_wpm": turn.speaking_rate_wpm,
            }
            for turn in turns
        ]
        quantitative = aggregate_session_features(turn_feature_rows)

        session_summary: dict[str, Any] = {
            "questions": [turn.question_text for turn in turns],
            "answers": [turn.transcript_text for turn in turns],
            "question_count": len(turns),
        }
        qualitative, provider = await self.rag.generate_swot(student, session_summary, quantitative)

        combined = {
            "student": {
                "id": student.id,
                "name": student.name,
                "academic_year": student.academic_year,
                "specialization": student.specialization,
                "target_role": student.target_role,
            },
            "session": {
                "id": session.id,
                "provider": session.llm_provider,
                "transcription_provider": session.transcription_provider,
                "qualitative_provider": provider,
            },
            "qualitative": qualitative,
            "quantitative": quantitative,
            "insights": {
                "recommended_focus": [
                    "Sharpen year-wise core technical fundamentals",
                    "Improve structured communication with examples and metrics",
                    "Practice answering follow-up questions with tradeoff reasoning",
                ]
            },
        }

        existing = db.query(EvaluationReport).filter(EvaluationReport.session_id == session.id).one_or_none()
        if existing:
            db.delete(existing)
            db.flush()

        report = EvaluationReport(
            session_id=session.id,
            student_id=student.id,
            overall_readiness=quantitative["overall_readiness"],
            technical_score=quantitative["technical_score"],
            behavioral_score=quantitative["behavioral_score"],
            communication_score=quantitative["communication_score"],
            confidence_score=quantitative["confidence_score"],
            qualitative_json=qualitative,
            quantitative_json=quantitative,
            combined_json=combined,
        )
        db.add(report)
        db.commit()
        db.refresh(report)
        return report
