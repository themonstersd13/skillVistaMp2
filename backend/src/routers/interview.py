from __future__ import annotations

from fastapi import APIRouter, Depends, File, Form, UploadFile
from sqlalchemy.orm import Session

from ..db import get_db
from ..dependencies import get_current_student
from ..models import Student
from ..schemas import (
    CandidateDashboardResponse,
    InterviewOption,
    ReportCard,
    StartInterviewRequest,
    StartInterviewResponse,
    StudentSummary,
)
from ..services.content_library import get_interview_options
from ..services.interview_runtime import InterviewRuntime

router = APIRouter(prefix="/api/interview", tags=["interview"])
runtime = InterviewRuntime()


def _serialize_student(student: Student) -> StudentSummary:
    return StudentSummary(
        id=student.id,
        name=student.name,
        email=student.email,
        academic_year=student.academic_year,
        specialization=student.specialization,
        target_role=student.target_role,
        strengths=student.strengths,
        stretch_goals=student.stretch_goals,
        profile=student.profile_json or {},
    )


@router.get("/dashboard", response_model=CandidateDashboardResponse)
async def get_dashboard(
    student: Student = Depends(get_current_student),
    db: Session = Depends(get_db),
):
    recent_sessions = [
        {
            "id": session.id,
            "status": session.status,
            "started_at": session.started_at,
            "completed_at": session.completed_at,
            "interview_type": session.metadata_json.get("interview_type", "tech"),
            "focus_area": session.metadata_json.get("focus_area", student.target_role),
            "overall_readiness": session.evaluation.overall_readiness if session.evaluation else None,
            "llm_provider": session.llm_provider,
            "transcription_provider": session.transcription_provider,
        }
        for session in sorted(student.sessions, key=lambda item: item.started_at, reverse=True)[:5]
    ]
    return CandidateDashboardResponse(
        student=_serialize_student(student),
        interview_options={
            key: [InterviewOption(**item) for item in value]
            for key, value in get_interview_options(db, student.academic_year).items()
        },
        recent_sessions=recent_sessions,
        latest_report_ready=any(session.evaluation is not None for session in student.sessions),
    )


@router.get("/history")
async def get_interview_history(
    student: Student = Depends(get_current_student),
    db: Session = Depends(get_db),
):
    del db
    return [
        {
            "id": session.id,
            "status": session.status,
            "started_at": session.started_at,
            "completed_at": session.completed_at,
            "interview_type": session.metadata_json.get("interview_type", "tech"),
            "focus_area": session.metadata_json.get("focus_area", student.target_role),
            "question_count": len(session.turns),
            "report_ready": session.evaluation is not None,
            "overall_readiness": session.evaluation.overall_readiness if session.evaluation else None,
            "llm_provider": session.llm_provider,
            "transcription_provider": session.transcription_provider,
            "latest_question": session.current_question,
        }
        for session in sorted(student.sessions, key=lambda item: item.started_at, reverse=True)[:8]
    ]


@router.post("/start", response_model=StartInterviewResponse)
async def start_interview(
    payload: StartInterviewRequest,
    student: Student = Depends(get_current_student),
    db: Session = Depends(get_db),
):
    session = await runtime.start_session(db, student, payload.interview_type, payload.focus_area)
    return StartInterviewResponse(
        sessionId=session.id,
        startedAt=session.started_at,
        question={
            "id": f"{session.id}:1",
            "question": session.current_question,
        },
    )


@router.post("/{session_id}/audio")
async def upload_audio_answer(
    session_id: str,
    audio: UploadFile = File(...),
    durationMs: str = Form(default="0"),
    student: Student = Depends(get_current_student),
    db: Session = Depends(get_db),
):
    session = runtime.get_session_for_student(db, session_id, student.id)
    payload = await runtime.process_audio(
        db=db,
        session=session,
        student=student,
        audio_bytes=await audio.read(),
        mime_type=audio.content_type,
        duration_seconds=max(1.0, float(durationMs) / 1000.0),
    )
    return payload


@router.post("/{session_id}/complete", response_model=ReportCard)
async def complete_interview(
    session_id: str,
    student: Student = Depends(get_current_student),
    db: Session = Depends(get_db),
):
    session = runtime.get_session_for_student(db, session_id, student.id)
    report = await runtime.complete_session(db, session, student)
    return ReportCard(
        overall_readiness=report.overall_readiness,
        technical_score=report.technical_score,
        behavioral_score=report.behavioral_score,
        communication_score=report.communication_score,
        confidence_score=report.confidence_score,
        qualitative=report.qualitative_json,
        quantitative=report.quantitative_json,
        combined=report.combined_json,
        created_at=report.created_at,
    )
