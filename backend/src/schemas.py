from __future__ import annotations

from datetime import datetime
from typing import Any

from pydantic import BaseModel, EmailStr, Field


class CandidateClaims(BaseModel):
    sub: str
    name: str
    email: EmailStr
    role: str = "candidate"
    student_id: int


class StartInterviewResponse(BaseModel):
    sessionId: str
    startedAt: datetime
    question: dict[str, Any]


class StartInterviewRequest(BaseModel):
    interview_type: str = Field(pattern="^(tech|non_tech)$")
    focus_area: str = Field(min_length=1, max_length=180)


class AnswerAck(BaseModel):
    receivedAt: datetime
    questionIndex: int
    provider: str


class ReportCard(BaseModel):
    overall_readiness: float
    technical_score: float
    behavioral_score: float
    communication_score: float
    confidence_score: float
    qualitative: dict[str, Any]
    quantitative: dict[str, Any]
    combined: dict[str, Any]
    created_at: datetime


class StudentSummary(BaseModel):
    id: int
    name: str
    email: str
    academic_year: str
    specialization: str
    target_role: str


class SessionSummary(BaseModel):
    id: str
    student: StudentSummary
    status: str
    started_at: datetime
    completed_at: datetime | None
    total_questions: int
    current_question_index: int
    current_question: str | None


class DemoTokenResponse(BaseModel):
    label: str
    token: str
    student_id: int


class SeedSummary(BaseModel):
    students: int
    faculties: int
    year_content: int


class DevSessionOverview(BaseModel):
    session_id: str
    candidate_name: str
    academic_year: str
    question_count: int
    completed: bool
    evaluation_ready: bool
    latest_question: str | None


class InterviewOption(BaseModel):
    title: str
    summary: str
    content_type: str


class CandidateDashboardResponse(BaseModel):
    student: StudentSummary
    interview_options: dict[str, list[InterviewOption]]
    recent_sessions: list[dict[str, Any]]
    latest_report_ready: bool


class AuthCandidateOption(BaseModel):
    id: int
    name: str
    email: str
    academic_year: str
    specialization: str
    target_role: str
    latest_report_ready: bool


class AuthLoginRequest(BaseModel):
    student_id: int


class AuthLoginResponse(BaseModel):
    token: str
    student: StudentSummary
