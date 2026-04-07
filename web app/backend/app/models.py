from __future__ import annotations

from datetime import datetime
from typing import Any

from sqlalchemy import JSON, DateTime, Float, ForeignKey, Integer, String, Text, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .db import Base


class Faculty(Base):
    __tablename__ = "faculties"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(120))
    email: Mapped[str] = mapped_column(String(180), unique=True, index=True)
    department: Mapped[str] = mapped_column(String(120))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class Student(Base):
    __tablename__ = "students"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(120))
    email: Mapped[str] = mapped_column(String(180), unique=True, index=True)
    academic_year: Mapped[str] = mapped_column(String(8), index=True)
    specialization: Mapped[str] = mapped_column(String(120))
    target_role: Mapped[str] = mapped_column(String(120))
    strengths: Mapped[list[str]] = mapped_column(JSON, default=list)
    stretch_goals: Mapped[list[str]] = mapped_column(JSON, default=list)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    sessions: Mapped[list["InterviewSession"]] = relationship(back_populates="student")


class YearContent(Base):
    __tablename__ = "year_content"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    academic_year: Mapped[str] = mapped_column(String(8), index=True)
    content_type: Mapped[str] = mapped_column(String(24), index=True)
    title: Mapped[str] = mapped_column(String(180))
    summary: Mapped[str] = mapped_column(Text)
    topics: Mapped[list[str]] = mapped_column(JSON, default=list)
    prompts: Mapped[list[str]] = mapped_column(JSON, default=list)


class InterviewSession(Base):
    __tablename__ = "interview_sessions"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    student_id: Mapped[int] = mapped_column(ForeignKey("students.id"), index=True)
    status: Mapped[str] = mapped_column(String(24), default="pending", index=True)
    started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    total_questions: Mapped[int] = mapped_column(Integer, default=5)
    current_question_index: Mapped[int] = mapped_column(Integer, default=0)
    current_question: Mapped[str | None] = mapped_column(Text, nullable=True)
    llm_provider: Mapped[str] = mapped_column(String(40), default="ollama")
    transcription_provider: Mapped[str] = mapped_column(String(40), default="gemini")
    metadata_json: Mapped[dict[str, Any]] = mapped_column("metadata", JSON, default=dict)

    student: Mapped["Student"] = relationship(back_populates="sessions")
    turns: Mapped[list["InterviewTurn"]] = relationship(back_populates="session", cascade="all, delete-orphan")
    evaluation: Mapped["EvaluationReport | None"] = relationship(back_populates="session", uselist=False)


class InterviewTurn(Base):
    __tablename__ = "interview_turns"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    session_id: Mapped[str] = mapped_column(ForeignKey("interview_sessions.id"), index=True)
    question_index: Mapped[int] = mapped_column(Integer)
    question_text: Mapped[str] = mapped_column(Text)
    transcript_text: Mapped[str] = mapped_column(Text)
    duration_seconds: Mapped[float] = mapped_column(Float)
    audio_mime_type: Mapped[str | None] = mapped_column(String(64), nullable=True)
    audio_size_bytes: Mapped[int] = mapped_column(Integer, default=0)
    transcription_provider: Mapped[str] = mapped_column(String(40), default="gemini")
    filler_count: Mapped[int] = mapped_column(Integer, default=0)
    filler_ratio: Mapped[float] = mapped_column(Float, default=0.0)
    speaking_rate_wpm: Mapped[float] = mapped_column(Float, default=0.0)
    technical_signal: Mapped[float] = mapped_column(Float, default=0.0)
    behavioral_signal: Mapped[float] = mapped_column(Float, default=0.0)
    confidence_signal: Mapped[float] = mapped_column(Float, default=0.0)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    session: Mapped["InterviewSession"] = relationship(back_populates="turns")


class EvaluationReport(Base):
    __tablename__ = "evaluation_reports"
    __table_args__ = (UniqueConstraint("session_id"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    session_id: Mapped[str] = mapped_column(ForeignKey("interview_sessions.id"), index=True)
    student_id: Mapped[int] = mapped_column(ForeignKey("students.id"), index=True)
    overall_readiness: Mapped[float] = mapped_column(Float)
    technical_score: Mapped[float] = mapped_column(Float)
    behavioral_score: Mapped[float] = mapped_column(Float)
    communication_score: Mapped[float] = mapped_column(Float)
    confidence_score: Mapped[float] = mapped_column(Float)
    qualitative_json: Mapped[dict[str, Any]] = mapped_column(JSON, default=dict)
    quantitative_json: Mapped[dict[str, Any]] = mapped_column(JSON, default=dict)
    combined_json: Mapped[dict[str, Any]] = mapped_column(JSON, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    session: Mapped["InterviewSession"] = relationship(back_populates="evaluation")
