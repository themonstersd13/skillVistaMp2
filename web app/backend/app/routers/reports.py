from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..db import get_db
from ..dependencies import get_current_student
from ..models import EvaluationReport, Student

router = APIRouter(prefix="/api/analytics", tags=["analytics"])


@router.get("/student/{student_id}")
def get_latest_student_report(student_id: int, db: Session = Depends(get_db)):
    student = db.get(Student, student_id)
    if not student:
        raise HTTPException(status_code=404, detail="Student not found.")

    report = (
        db.query(EvaluationReport)
        .filter(EvaluationReport.student_id == student_id)
        .order_by(EvaluationReport.created_at.desc())
        .first()
    )
    if not report:
        raise HTTPException(status_code=404, detail="No evaluation report found.")

    return {
        "student": {
            "id": student.id,
            "name": student.name,
            "academic_year": student.academic_year,
            "specialization": student.specialization,
            "target_role": student.target_role,
        },
        "qualitative": report.qualitative_json,
        "quantitative": report.quantitative_json,
        "combined": report.combined_json,
        "createdAt": report.created_at,
    }


@router.get("/me/latest")
def get_my_latest_report(
    student: Student = Depends(get_current_student),
    db: Session = Depends(get_db),
):
    return get_latest_student_report(student.id, db)


@router.get("/cohort/{academic_year}")
def get_cohort_reports(academic_year: str, db: Session = Depends(get_db)):
    students = db.query(Student).filter(Student.academic_year == academic_year).all()
    return [
        {
            "studentId": student.id,
            "name": student.name,
            "targetRole": student.target_role,
            "latestReportReady": (
                db.query(EvaluationReport)
                .filter(EvaluationReport.student_id == student.id)
                .order_by(EvaluationReport.created_at.desc())
                .first()
                is not None
            ),
        }
        for student in students
    ]
