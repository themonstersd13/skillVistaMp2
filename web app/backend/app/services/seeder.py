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
    _ensure_demo_report(db)

    return {
        "students": db.query(Student).count(),
        "faculties": db.query(Faculty).count(),
        "year_content": year_content,
    }


def _ensure_demo_report(db: Session) -> None:
    student = db.query(Student).filter(Student.academic_year == "TY").first()
    if not student:
        return

    existing = db.query(EvaluationReport).filter(EvaluationReport.student_id == student.id).first()
    if existing:
        return

    session = InterviewSession(
        id=str(uuid4()),
        student_id=student.id,
        status="completed",
        started_at=datetime.utcnow(),
        completed_at=datetime.utcnow(),
        total_questions=3,
        current_question_index=3,
        current_question="Discuss how you would evaluate an interview AI pipeline.",
        llm_provider="ollama",
        transcription_provider="gemini",
        metadata_json={"seeded": True},
    )
    db.add(session)
    db.flush()

    turns = [
        InterviewTurn(
            session_id=session.id,
            question_index=1,
            question_text="How would you design a simple feedback loop for a candidate assessment tool?",
            transcript_text="I would track quality signals, collect structured feedback, and compare model results with reviewer notes.",
            duration_seconds=49,
            audio_mime_type="audio/webm",
            audio_size_bytes=18204,
            transcription_provider="synthetic",
            filler_count=1,
            filler_ratio=0.02,
            speaking_rate_wpm=96,
            technical_signal=78,
            behavioral_signal=72,
            confidence_signal=79,
        ),
        InterviewTurn(
            session_id=session.id,
            question_index=2,
            question_text="How do you explain a technical tradeoff to a non-technical stakeholder?",
            transcript_text="I explain the impact in terms of time, risk, and reliability, then I keep the language simple and outcome focused.",
            duration_seconds=42,
            audio_mime_type="audio/webm",
            audio_size_bytes=16482,
            transcription_provider="synthetic",
            filler_count=0,
            filler_ratio=0.0,
            speaking_rate_wpm=103,
            technical_signal=70,
            behavioral_signal=82,
            confidence_signal=84,
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

    report = EvaluationReport(
        session_id=session.id,
        student_id=student.id,
        overall_readiness=quantitative["overall_readiness"],
        technical_score=quantitative["technical_score"],
        behavioral_score=quantitative["behavioral_score"],
        communication_score=quantitative["communication_score"],
        confidence_score=quantitative["confidence_score"],
        qualitative_json={
            "summary": "Strong TY-level promise with solid communication and improving technical articulation.",
            "strengths": ["Explains tradeoffs clearly", "Thinks in systems and feedback loops"],
            "weaknesses": ["Needs more hard metrics in project stories", "Can deepen evaluation methodology"],
            "opportunities": ["Practice AI system design rounds", "Sharpen evidence-based storytelling"],
            "threats": ["Could lose marks in deep follow-up rounds if examples stay generic"],
        },
        quantitative_json=quantitative,
        combined_json={
            "seeded": True,
            "student": {"name": student.name, "academic_year": student.academic_year},
            "qualitative": {"summary": "Strong TY-level promise with solid communication and improving technical articulation."},
            "quantitative": quantitative,
        },
    )
    db.add(report)
    db.commit()
