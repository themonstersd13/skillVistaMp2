from fastapi import Depends, Header, HTTPException, status
from sqlalchemy.orm import Session

from .db import get_db
from .models import Student
from .schemas import CandidateClaims
from .security import decode_candidate_token


def get_candidate_claims(authorization: str = Header(default="")) -> CandidateClaims:
    prefix = "Bearer "
    if not authorization.startswith(prefix):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing Bearer token.",
        )
    return decode_candidate_token(authorization[len(prefix) :])


def get_current_student(
    claims: CandidateClaims = Depends(get_candidate_claims),
    db: Session = Depends(get_db),
) -> Student:
    student = db.get(Student, claims.student_id)
    if not student:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student not found.")
    return student
