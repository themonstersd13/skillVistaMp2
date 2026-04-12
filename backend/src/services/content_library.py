from sqlalchemy.orm import Session

from ..data.year_tracks import YEAR_WISE_TRACKS
from ..models import YearContent


def sync_year_content(db: Session) -> int:
    existing_records = db.query(YearContent).all()
    existing_by_key = {
        (record.academic_year, record.content_type, record.title): record
        for record in existing_records
    }
    desired_keys: set[tuple[str, str, str]] = set()

    count = 0
    for academic_year, group in YEAR_WISE_TRACKS.items():
        for content_type, entries in group.items():
            for entry in entries:
                key = (academic_year, content_type, entry["title"])
                desired_keys.add(key)
                record = existing_by_key.get(key)
                if record:
                    record.summary = entry["summary"]
                    record.topics = entry["topics"]
                    record.prompts = entry["prompts"]
                else:
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

    for key, record in existing_by_key.items():
        if key not in desired_keys:
            db.delete(record)

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
