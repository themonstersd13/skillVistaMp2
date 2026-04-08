from functools import lru_cache
from pathlib import Path

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict

BACKEND_ROOT = Path(__file__).resolve().parent.parent
DEFAULT_DB_PATH = BACKEND_ROOT / "skillvista_demo.db"
DEFAULT_UPLOADS_DIR = BACKEND_ROOT / "uploads"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=BACKEND_ROOT / ".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    app_name: str = "SKILLVISTA Core Engine"
    environment: str = Field(default="development", alias="SKILLVISTA_ENV")
    db_url: str = Field(default=f"sqlite:///{DEFAULT_DB_PATH.as_posix()}", alias="SKILLVISTA_DB_URL")
    jwt_secret: str = Field(default="skillvista-dev-secret", alias="SKILLVISTA_JWT_SECRET")
    jwt_algorithm: str = "HS256"
    allowed_origins: str = Field(default="http://localhost:5173", alias="SKILLVISTA_ALLOWED_ORIGINS")
    socket_path: str = Field(default="/socket.io", alias="SKILLVISTA_SOCKET_PATH")
    uploads_dir: Path = Field(default=DEFAULT_UPLOADS_DIR, alias="SKILLVISTA_UPLOADS_DIR")

    ollama_base_url: str = Field(default="http://localhost:11434", alias="OLLAMA_BASE_URL")
    ollama_model: str = Field(default="llama3.1:8b", alias="OLLAMA_MODEL")

    gemini_api_key: str | None = Field(default=None, alias="GEMINI_API_KEY")
    gemini_transcribe_model: str = Field(default="gemini-2.5-flash-lite", alias="GEMINI_TRANSCRIBE_MODEL")

    groq_api_key: str | None = Field(default=None, alias="GROQ_API_KEY")
    groq_chat_model: str = Field(default="llama-3.3-70b-versatile", alias="GROQ_CHAT_MODEL")
    groq_transcribe_model: str = Field(default="whisper-large-v3", alias="GROQ_TRANSCRIBE_MODEL")

    total_questions_per_session: int = 5

    @property
    def cors_origins(self) -> list[str]:
        return [origin.strip() for origin in self.allowed_origins.split(",") if origin.strip()]

    @property
    def resolved_db_url(self) -> str:
        sqlite_prefix = "sqlite:///"
        if not self.db_url.startswith(sqlite_prefix):
            return self.db_url

        db_target = self.db_url[len(sqlite_prefix) :]
        if db_target == ":memory:":
            return self.db_url

        db_path = Path(db_target)
        if not db_path.is_absolute():
            db_path = BACKEND_ROOT / db_path
        return f"{sqlite_prefix}{db_path.resolve().as_posix()}"

    @property
    def resolved_uploads_dir(self) -> Path:
        if self.uploads_dir.is_absolute():
            return self.uploads_dir
        return (BACKEND_ROOT / self.uploads_dir).resolve()


@lru_cache
def get_settings() -> Settings:
    return Settings()
