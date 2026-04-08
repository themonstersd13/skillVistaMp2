from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..db import get_db
from ..models import InterviewSession, Student
from ..schemas import DemoTokenResponse, SeedSummary
from ..security import create_candidate_token
from ..services.seeder import ensure_demo_data

router = APIRouter(prefix="/api/dev", tags=["development"])


@router.post("/seed", response_model=SeedSummary)
def seed_demo_content(db: Session = Depends(get_db)):
    summary = ensure_demo_data(db)
    return SeedSummary(**summary)


@router.get("/tokens", response_model=list[DemoTokenResponse])
def get_demo_tokens(db: Session = Depends(get_db)):
    students = db.query(Student).order_by(Student.id.asc()).all()
    responses: list[DemoTokenResponse] = []
    for student in students:
        token = create_candidate_token(
            {
                "sub": str(student.id),
                "student_id": student.id,
                "name": student.name,
                "email": student.email,
                "role": "candidate",
            }
        )
        responses.append(
            DemoTokenResponse(
                label=f"{student.name} ({student.academic_year})",
                token=token,
                student_id=student.id,
            )
        )
    return responses


@router.get("/sessions")
def get_session_overview(db: Session = Depends(get_db)):
    sessions = db.query(InterviewSession).order_by(InterviewSession.started_at.desc()).all()
    return [
        {
            "session_id": session.id,
            "candidate_name": session.student.name,
            "academic_year": session.student.academic_year,
            "question_count": len(session.turns),
            "completed": session.status == "completed",
            "evaluation_ready": session.evaluation is not None,
            "latest_question": session.current_question,
        }
        for session in sessions
    ]
