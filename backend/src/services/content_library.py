from sqlalchemy.orm import Session

from ..data.year_tracks import YEAR_WISE_TRACKS
from ..models import YearContent


def sync_year_content(db: Session) -> int:
    existing = db.query(YearContent).count()
    if existing:
        return existing

    count = 0
    for academic_year, group in YEAR_WISE_TRACKS.items():
        for content_type, entries in group.items():
            for entry in entries:
                db.add(
                    YearContent(
                        academic_year=academic_year,
                        content_type=content_type,
                        title=entry["title"],
                        summary=entry["summary"],
                        topics=entry["topics"],
                        prompts=entry["prompts"],
                    )
                )
                count += 1

    db.commit()
    return count


def get_year_pack(db: Session, academic_year: str) -> dict[str, list[YearContent]]:
    records = db.query(YearContent).filter(YearContent.academic_year == academic_year).all()
    result: dict[str, list[YearContent]] = {"tech": [], "non_tech": []}
    for record in records:
        result.setdefault(record.content_type, []).append(record)
    return result


def get_interview_options(db: Session, academic_year: str) -> dict[str, list[dict[str, str]]]:
    year_pack = get_year_pack(db, academic_year)
    return {
        content_type: [
            {
                "title": entry.title,
                "summary": entry.summary,
                "content_type": entry.content_type,
            }
            for entry in entries
        ]
        for content_type, entries in year_pack.items()
    }
