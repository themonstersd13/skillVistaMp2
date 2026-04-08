from __future__ import annotations

from datetime import datetime
from uuid import uuid4

from sqlalchemy.orm import Session

from ..models import EvaluationReport, Faculty, InterviewSession, InterviewTurn, Student
from .content_library import sync_year_content
from .feature_extractor import aggregate_session_features

DEMO_STUDENTS = [
    {
        "name": "Aarav Patil",
        "email": "aarav.patil@skillvista.dev",
        "academic_year": "FY",
        "specialization": "Computer Engineering",
        "target_role": "Software Engineering Intern",
        "strengths": ["curiosity", "consistency", "basic Python"],
        "stretch_goals": ["DSA confidence", "public speaking"],
    },
    {
        "name": "Ishita Kulkarni",
        "email": "ishita.kulkarni@skillvista.dev",
        "academic_year": "SY",
        "specialization": "Information Technology",
        "target_role": "Frontend Developer Intern",
        "strengths": ["React basics", "UI polish", "peer mentoring"],
        "stretch_goals": ["backend APIs", "state management depth"],
    },
    {
        "name": "Rohan Shinde",
        "email": "rohan.shinde@skillvista.dev",
        "academic_year": "TY",
        "specialization": "Artificial Intelligence and Data Science",
        "target_role": "AI/ML Engineer Intern",
        "strengths": ["Python", "data pipelines", "ownership"],
        "stretch_goals": ["system design", "interview precision"],
    },
    {
        "name": "Neha Deshmukh",
        "email": "neha.deshmukh@skillvista.dev",
        "academic_year": "LY",
        "specialization": "Computer Science",
        "target_role": "Backend Engineer",
        "strengths": ["API design", "SQL", "communication"],
        "stretch_goals": ["distributed systems", "architecture depth"],
    },
]

DEMO_FACULTY = [
    {"name": "Prof. Saurabh Doiphode", "email": "saurabh.faculty@skillvista.dev", "department": "Computer Engineering"},
    {"name": "Prof. Srushti Garad", "email": "srushti.faculty@skillvista.dev", "department": "Information Technology"},
]


def ensure_demo_data(db: Session) -> dict[str, int]:
    if not db.query(Faculty).count():
        for faculty in DEMO_FACULTY:
            db.add(Faculty(**faculty))

    if not db.query(Student).count():
        for student in DEMO_STUDENTS:
            db.add(Student(**student))

    db.commit()
    year_content = sync_year_content(db)
    _ensure_demo_reports(db)

    return {
        "students": db.query(Student).count(),
        "faculties": db.query(Faculty).count(),
        "year_content": year_content,
    }


def _ensure_demo_reports(db: Session) -> None:
    score_by_year = {
        "FY": {"technical": 58.0, "behavioral": 66.0, "confidence": 61.0, "wpm": 88.0},
        "SY": {"technical": 67.0, "behavioral": 74.0, "confidence": 70.0, "wpm": 95.0},
        "TY": {"technical": 78.0, "behavioral": 82.0, "confidence": 79.0, "wpm": 101.0},
        "LY": {"technical": 84.0, "behavioral": 86.0, "confidence": 83.0, "wpm": 108.0},
    }

    students = db.query(Student).order_by(Student.id.asc()).all()
    for student in students:
        existing = db.query(EvaluationReport).filter(EvaluationReport.student_id == student.id).first()
        if existing:
            continue

        score_seed = score_by_year.get(student.academic_year, score_by_year["SY"])
        session = InterviewSession(
            id=str(uuid4()),
            student_id=student.id,
            status="completed",
            started_at=datetime.utcnow(),
            completed_at=datetime.utcnow(),
            total_questions=3,
            current_question_index=3,
            current_question=f"What would make you a strong {student.target_role} candidate in the next placement round?",
            llm_provider="heuristic",
            transcription_provider="synthetic",
            metadata_json={"seeded": True, "interview_type": "tech", "focus_area": student.target_role},
        )
        db.add(session)
        db.flush()

        turns = [
            InterviewTurn(
                session_id=session.id,
                question_index=1,
                question_text=f"Tell me about a project or learning experience that shows your {student.target_role} potential.",
                transcript_text=(
                    f"I focused on {student.strengths[0]} and applied it in coursework and mini projects related to "
                    f"{student.specialization}. I learned how to explain my decisions clearly and connect them to outcomes."
                ),
                duration_seconds=46,
                audio_mime_type="audio/webm",
                audio_size_bytes=17400,
                transcription_provider="synthetic",
                filler_count=1,
                filler_ratio=0.02,
                speaking_rate_wpm=score_seed["wpm"],
                technical_signal=score_seed["technical"],
                behavioral_signal=score_seed["behavioral"],
                confidence_signal=score_seed["confidence"],
            ),
            InterviewTurn(
                session_id=session.id,
                question_index=2,
                question_text=f"How are you improving on {student.stretch_goals[0]} before placements?",
                transcript_text=(
                    f"I am practicing structured problem solving, collecting feedback, and turning {student.stretch_goals[0]} "
                    "into a weekly improvement plan with mock interviews and project-based revision."
                ),
                duration_seconds=41,
                audio_mime_type="audio/webm",
                audio_size_bytes=15800,
                transcription_provider="synthetic",
                filler_count=0,
                filler_ratio=0.01,
                speaking_rate_wpm=score_seed["wpm"] + 3,
                technical_signal=score_seed["technical"] - 4,
                behavioral_signal=score_seed["behavioral"] + 3,
                confidence_signal=score_seed["confidence"] + 2,
            ),
        ]
        for turn in turns:
            db.add(turn)

        quantitative = aggregate_session_features(
            [
                {
                    "technical_signal": turn.technical_signal,
                    "behavioral_signal": turn.behavioral_signal,
                    "confidence_signal": turn.confidence_signal,
                    "filler_ratio": turn.filler_ratio,
                    "speaking_rate_wpm": turn.speaking_rate_wpm,
                }
                for turn in turns
            ]
        )

        summary = (
            f"{student.name} shows {student.academic_year}-level readiness for {student.target_role} with strengths in "
            f"{student.strengths[0]} and visible intent to improve {student.stretch_goals[0]}."
        )
        report = EvaluationReport(
            session_id=session.id,
            student_id=student.id,
            overall_readiness=quantitative["overall_readiness"],
            technical_score=quantitative["technical_score"],
            behavioral_score=quantitative["behavioral_score"],
            communication_score=quantitative["communication_score"],
            confidence_score=quantitative["confidence_score"],
            qualitative_json={
                "summary": summary,
                "strengths": [
                    f"Communicates {student.strengths[0]} with concrete examples.",
                    f"Shows alignment with {student.target_role} expectations.",
                ],
                "weaknesses": [
                    f"Needs more depth around {student.stretch_goals[0]}.",
                    "Should support answers with sharper metrics and outcomes.",
                ],
                "opportunities": [
                    f"Practice more mock interviews centered on {student.target_role}.",
                    f"Build stronger stories around {student.specialization} projects.",
                ],
                "threats": [
                    "If follow-up depth stays generic, tougher interview rounds may expose gaps.",
                ],
            },
            quantitative_json=quantitative,
            combined_json={
                "seeded": True,
                "student": {"name": student.name, "academic_year": student.academic_year},
                "qualitative": {"summary": summary},
                "quantitative": quantitative,
            },
        )
        db.add(report)

    db.commit()
