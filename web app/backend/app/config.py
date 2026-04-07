from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    app_name: str = "SKILLVISTA Core Engine"
    environment: str = Field(default="development", alias="SKILLVISTA_ENV")
    db_url: str = Field(default="sqlite:///./skillvista_demo.db", alias="SKILLVISTA_DB_URL")
    jwt_secret: str = Field(default="skillvista-dev-secret", alias="SKILLVISTA_JWT_SECRET")
    jwt_algorithm: str = "HS256"
    allowed_origins: str = Field(default="http://localhost:5173", alias="SKILLVISTA_ALLOWED_ORIGINS")
    socket_path: str = Field(default="/socket.io", alias="SKILLVISTA_SOCKET_PATH")

    ollama_base_url: str = Field(default="http://localhost:11434", alias="OLLAMA_BASE_URL")
    ollama_model: str = Field(default="llama3.1:8b", alias="OLLAMA_MODEL")

    gemini_api_key: str | None = Field(default=None, alias="GEMINI_API_KEY")
    gemini_transcribe_model: str = Field(default="gemini-2.0-flash", alias="GEMINI_TRANSCRIBE_MODEL")

    groq_api_key: str | None = Field(default=None, alias="GROQ_API_KEY")
    groq_chat_model: str = Field(default="llama-3.3-70b-versatile", alias="GROQ_CHAT_MODEL")
    groq_transcribe_model: str = Field(default="whisper-large-v3", alias="GROQ_TRANSCRIBE_MODEL")

    total_questions_per_session: int = 5

    @property
    def cors_origins(self) -> list[str]:
        return [origin.strip() for origin in self.allowed_origins.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
