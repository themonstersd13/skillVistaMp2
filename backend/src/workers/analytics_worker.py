"""Background analytics aggregation worker.

Periodically aggregates cohort-level analytics, growth trends,
and semester snapshots for the faculty dashboard.
"""
from __future__ import annotations

import logging
from datetime import datetime
from statistics import mean

from ..db import SessionLocal
from ..models import EvaluationReport, Student
from ..mongo import store_analytics_snapshot

logger = logging.getLogger(__name__)


async def run_cohort_analytics(academic_year: str | None = None) -> None:
    """Aggregate analytics for a cohort (or all students if no year given)."""
    db = SessionLocal()
    try:
        query = db.query(Student)
        if academic_year:
            query = query.filter(Student.academic_year == academic_year)
        students = query.all()

        if not students:
            return

        cohort_data = []
        for student in students:
            reports = (
                db.query(EvaluationReport)
                .filter(EvaluationReport.student_id == student.id)
                .order_by(EvaluationReport.created_at.desc())
                .all()
            )
            if not reports:
                continue

            latest = reports[0]
            cohort_data.append({
                "student_id": student.id,
                "student_name": student.name,
                "academic_year": student.academic_year,
                "target_role": student.target_role,
                "overall_readiness": latest.overall_readiness,
                "technical_score": latest.technical_score,
                "behavioral_score": latest.behavioral_score,
                "communication_score": latest.communication_score,
                "confidence_score": latest.confidence_score,
                "total_sessions": len(reports),
            })

        if not cohort_data:
            return

        snapshot = {
            "type": "cohort_analytics",
            "academic_year": academic_year or "all",
            "timestamp": datetime.utcnow().isoformat(),
            "total_students": len(students),
            "evaluated_students": len(cohort_data),
            "avg_readiness": round(mean(d["overall_readiness"] for d in cohort_data), 2),
            "avg_technical": round(mean(d["technical_score"] for d in cohort_data), 2),
            "avg_behavioral": round(mean(d["behavioral_score"] for d in cohort_data), 2),
            "at_risk_count": sum(1 for d in cohort_data if d["overall_readiness"] < 50),
            "top_performer_count": sum(1 for d in cohort_data if d["overall_readiness"] >= 75),
            "students": cohort_data,
        }

        await store_analytics_snapshot(snapshot)
        logger.info(
            "Cohort analytics generated: year=%s, students=%d, avg_readiness=%.1f",
            academic_year or "all",
            len(cohort_data),
            snapshot["avg_readiness"],
        )

    except Exception:
        logger.exception("Cohort analytics failed for year=%s", academic_year)
    finally:
        db.close()
