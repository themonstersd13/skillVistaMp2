from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..db import get_db
from ..dependencies import get_current_student
from ..models import EvaluationReport, Student
from ..schemas import AuthCandidateOption, AuthLoginRequest, AuthLoginResponse, StudentSummary
from ..security import create_candidate_token

router = APIRouter(prefix="/api/auth", tags=["auth"])


def _serialize_student(student: Student) -> StudentSummary:
    return StudentSummary(
        id=student.id,
        name=student.name,
        email=student.email,
        academic_year=student.academic_year,
        specialization=student.specialization,
        target_role=student.target_role,
    )


@router.get("/candidates", response_model=list[AuthCandidateOption])
def get_demo_candidates(db: Session = Depends(get_db)):
    students = db.query(Student).order_by(Student.id.asc()).all()
    return [
        AuthCandidateOption(
            id=student.id,
            name=student.name,
            email=student.email,
            academic_year=student.academic_year,
            specialization=student.specialization,
            target_role=student.target_role,
            latest_report_ready=(
                db.query(EvaluationReport)
                .filter(EvaluationReport.student_id == student.id)
                .order_by(EvaluationReport.created_at.desc())
                .first()
                is not None
            ),
        )
        for student in students
    ]


@router.post("/login", response_model=AuthLoginResponse)
def login_candidate(payload: AuthLoginRequest, db: Session = Depends(get_db)):
    student = db.get(Student, payload.student_id)
    if not student:
        raise HTTPException(status_code=404, detail="Candidate not found.")

    token = create_candidate_token(
        {
            "sub": str(student.id),
            "student_id": student.id,
            "name": student.name,
            "email": student.email,
            "role": "candidate",
        }
    )

    return AuthLoginResponse(
        token=token,
        student=_serialize_student(student),
    )


@router.get("/me", response_model=StudentSummary)
def get_current_candidate(student: Student = Depends(get_current_student)):
    return _serialize_student(student)
