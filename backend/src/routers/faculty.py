"""Faculty API endpoints for cohort management and analytics."""
from __future__ import annotations

import csv
import io
from datetime import datetime

from fastapi import APIRouter, Depends, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from ..db import get_db
from ..models import EvaluationReport, InterviewSession, Student

router = APIRouter(prefix="/api/faculty", tags=["faculty"])


def _weakest_area(report: EvaluationReport) -> str:
    """Determine the weakest score area from a report."""
    scores = {
        "Technical": report.technical_score,
        "Behavioral": report.behavioral_score,
        "Communication": report.communication_score,
        "Confidence": report.confidence_score,
    }
    return min(scores, key=scores.get)


def _status_color(readiness: float | None) -> str:
    if readiness is None:
        return "gray"
    if readiness >= 75:
        return "green"
    if readiness >= 50:
        return "yellow"
    return "red"


@router.get("/cohort")
def get_cohort_data(
    db: Session = Depends(get_db),
    academic_year: str | None = Query(default=None),
    search: str | None = Query(default=None),
    status_filter: str | None = Query(default=None, alias="status"),
):
    """Full cohort data for the faculty data table."""
    query = db.query(Student)
    if academic_year:
        query = query.filter(Student.academic_year == academic_year)
    if search:
        search_lower = f"%{search.lower()}%"
        query = query.filter(
            Student.name.ilike(search_lower)
            | Student.target_role.ilike(search_lower)
            | Student.specialization.ilike(search_lower)
        )

    students = query.order_by(Student.name.asc()).all()
    result = []

    for student in students:
        latest_report = (
            db.query(EvaluationReport)
            .filter(EvaluationReport.student_id == student.id)
            .order_by(EvaluationReport.created_at.desc())
            .first()
        )

        last_session = (
            db.query(InterviewSession)
            .filter(InterviewSession.student_id == student.id)
            .order_by(InterviewSession.started_at.desc())
            .first()
        )

        readiness = latest_report.overall_readiness if latest_report else None
        status = _status_color(readiness)

        if status_filter:
            if status_filter == "at_risk" and status != "red":
                continue
            if status_filter == "top" and status != "green":
                continue

        row = {
            "student_id": student.id,
            "name": student.name,
            "email": student.email,
            "academic_year": student.academic_year,
            "specialization": student.specialization,
            "target_role": student.target_role,
            "overall_readiness": readiness,
            "technical_score": latest_report.technical_score if latest_report else None,
            "behavioral_score": latest_report.behavioral_score if latest_report else None,
            "communication_score": latest_report.communication_score if latest_report else None,
            "confidence_score": latest_report.confidence_score if latest_report else None,
            "weakest_area": _weakest_area(latest_report) if latest_report else None,
            "last_interview_date": last_session.started_at.isoformat() if last_session else None,
            "total_sessions": db.query(InterviewSession).filter(InterviewSession.student_id == student.id).count(),
            "status": status,
        }
        result.append(row)

    return result


@router.get("/cohort/export")
def export_cohort_csv(
    db: Session = Depends(get_db),
    academic_year: str | None = Query(default=None),
):
    """Export cohort data as CSV."""
    rows = get_cohort_data(db=db, academic_year=academic_year)

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["Name", "Email", "Year", "Target Role", "Readiness", "Weakest Area", "Status", "Sessions", "Last Interview"])

    for row in rows:
        writer.writerow([
            row["name"],
            row["email"],
            row["academic_year"],
            row["target_role"],
            f"{row['overall_readiness']:.0f}%" if row["overall_readiness"] is not None else "N/A",
            row["weakest_area"] or "N/A",
            row["status"],
            row["total_sessions"],
            row["last_interview_date"] or "Never",
        ])

    output.seek(0)
    return StreamingResponse(
        output,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=skillvista_cohort_{datetime.utcnow().strftime('%Y%m%d')}.csv"},
    )


@router.get("/student/{student_id}/growth")
def get_student_growth(student_id: int, db: Session = Depends(get_db)):
    """Get readiness score growth over time for a student."""
    reports = (
        db.query(EvaluationReport)
        .filter(EvaluationReport.student_id == student_id)
        .order_by(EvaluationReport.created_at.asc())
        .all()
    )

    return [
        {
            "session_id": report.session_id,
            "readiness": report.overall_readiness,
            "technical": report.technical_score,
            "behavioral": report.behavioral_score,
            "communication": report.communication_score,
            "confidence": report.confidence_score,
            "date": report.created_at.isoformat(),
        }
        for report in reports
    ]


@router.get("/analytics/summary")
def get_analytics_summary(db: Session = Depends(get_db)):
    """Global analytics summary for the faculty dashboard."""
    total_students = db.query(Student).count()
    total_sessions = db.query(InterviewSession).count()
    total_reports = db.query(EvaluationReport).count()

    reports = db.query(EvaluationReport).all()
    if reports:
        avg_readiness = sum(r.overall_readiness for r in reports) / len(reports)
        at_risk = sum(1 for r in reports if r.overall_readiness < 50)
    else:
        avg_readiness = 0
        at_risk = 0

    return {
        "total_students": total_students,
        "total_sessions": total_sessions,
        "total_evaluations": total_reports,
        "avg_readiness": round(avg_readiness, 1),
        "at_risk_count": at_risk,
    }
