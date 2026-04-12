from collections.abc import Generator

from sqlalchemy import create_engine, inspect, text
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from .config import get_settings

settings = get_settings()


class Base(DeclarativeBase):
    pass


# ── SQLAlchemy Engine ──
_connect_args = {}
if settings.is_sqlite:
    _connect_args = {"check_same_thread": False}

engine = create_engine(
    settings.resolved_db_url,
    future=True,
    connect_args=_connect_args,
    pool_pre_ping=True,
    pool_size=5 if settings.is_postgres else 0,
    max_overflow=10 if settings.is_postgres else 0,
)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, expire_on_commit=False)


def run_startup_migrations() -> None:
    """Lightweight migrations for SQLite dev mode only."""
    if not settings.is_sqlite:
        return

    with engine.begin() as connection:
        inspector = inspect(connection)
        if "students" not in inspector.get_table_names():
            return

        student_columns = {column["name"] for column in inspector.get_columns("students")}
        if "profile_json" not in student_columns:
            connection.execute(text("ALTER TABLE students ADD COLUMN profile_json JSON"))


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
