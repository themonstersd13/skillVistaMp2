from __future__ import annotations

from datetime import datetime
from uuid import uuid4

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from ..config import get_settings
from ..models import InterviewSession, InterviewTurn, Student
from .content_library import get_year_pack
from .evaluation import EvaluationService
from .feature_extractor import extract_turn_features
from .rag import RAGService
from .transcription import TranscriptionService

settings = get_settings()


class InterviewRuntime:
    def __init__(self) -> None:
        self.rag = RAGService()
        self.transcription = TranscriptionService()
        self.evaluation = EvaluationService()

    async def start_session(
        self,
        db: Session,
        student: Student,
        interview_type: str,
        focus_area: str,
    ) -> InterviewSession:
        session = InterviewSession(
            id=str(uuid4()),
            student_id=student.id,
            status="live",
            started_at=datetime.utcnow(),
            total_questions=settings.total_questions_per_session,
            current_question_index=1,
            metadata_json={
                "seeded": False,
                "interview_type": interview_type,
                "focus_area": focus_area,
            },
        )
        db.add(session)
        db.flush()

        question_payload, provider = await self.rag.generate_question(
            db,
            student,
            [],
            0,
            interview_type,
            focus_area,
        )
        session.current_question = question_payload["question"]
        session.llm_provider = provider
        db.commit()
        db.refresh(session)
        return session

    async def process_audio(
        self,
        db: Session,
        session: InterviewSession,
        student: Student,
        audio_bytes: bytes,
        mime_type: str | None,
        duration_seconds: float,
    ) -> dict[str, object]:
        if session.status != "live":
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Session is not live.")

        transcript, transcription_provider = await self.transcription.transcribe(
            audio_bytes=audio_bytes,
            mime_type=mime_type,
            session_context=f"{student.academic_year} {student.target_role} interview answer",
        )

        year_pack = get_year_pack(db, student.academic_year)
        keywords = []
        for content_type in ("tech", "non_tech"):
            for entry in year_pack.get(content_type, []):
                keywords.extend(entry.topics)

        features = extract_turn_features(transcript, duration_seconds, keywords)
        turn = InterviewTurn(
            session_id=session.id,
            question_index=session.current_question_index,
            question_text=session.current_question or "Adaptive interview question",
            transcript_text=transcript,
            duration_seconds=duration_seconds,
            audio_mime_type=mime_type,
            audio_size_bytes=len(audio_bytes),
            transcription_provider=transcription_provider,
            filler_count=int(features["filler_count"]),
            filler_ratio=float(features["filler_ratio"]),
            speaking_rate_wpm=float(features["speaking_rate_wpm"]),
            technical_signal=float(features["technical_signal"]),
            behavioral_signal=float(features["behavioral_signal"]),
            confidence_signal=float(features["confidence_signal"]),
        )
        db.add(turn)
        db.flush()

        ack = {
            "receivedAt": datetime.utcnow().isoformat(),
            "questionIndex": session.current_question_index,
            "provider": transcription_provider,
        }

        turns = (
            db.query(InterviewTurn)
            .filter(InterviewTurn.session_id == session.id)
            .order_by(InterviewTurn.question_index.asc())
            .all()
        )
        if session.current_question_index >= session.total_questions:
            report = await self.complete_session(db, session, student, turns)
            return {
                "ack": ack,
                "finished": True,
                "report_id": report.id,
            }

        question_payload, provider = await self.rag.generate_question(
            db,
            student,
            turns,
            session.current_question_index,
            str(session.metadata_json.get("interview_type", "tech")),
            str(session.metadata_json.get("focus_area", student.target_role)),
        )
        session.current_question_index += 1
        session.current_question = question_payload["question"]
        session.llm_provider = provider
        session.transcription_provider = transcription_provider
        db.commit()
        db.refresh(session)

        return {
            "ack": ack,
            "finished": False,
            "next_question": question_payload,
        }

    async def complete_session(
        self,
        db: Session,
        session: InterviewSession,
        student: Student,
        turns: list[InterviewTurn] | None = None,
    ):
        if session.status == "completed" and session.evaluation:
            return session.evaluation

        turns = turns or (
            db.query(InterviewTurn)
            .filter(InterviewTurn.session_id == session.id)
            .order_by(InterviewTurn.question_index.asc())
            .all()
        )
        session.status = "completed"
        session.completed_at = datetime.utcnow()
        db.commit()
        db.refresh(session)
        return await self.evaluation.evaluate_and_store(db, session, student, turns)

    def get_session_for_student(self, db: Session, session_id: str, student_id: int) -> InterviewSession:
        session = db.get(InterviewSession, session_id)
        if not session or session.student_id != student_id:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found.")
        return session
