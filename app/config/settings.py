"""Application settings, loaded from environment variables / .env file."""
from functools import lru_cache
from typing import Optional

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Centralized runtime configuration for the AI service."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=False,
    )

    # LLM provider configuration
    anthropic_api_key: Optional[str] = Field(default=None, alias="ANTHROPIC_API_KEY")
    llm_model_id: str = Field(default="claude-sonnet-4-6", alias="LLM_MODEL_ID")
    llm_temperature: float = Field(default=0.2, alias="LLM_TEMPERATURE")

    # Vector store
    chroma_url: Optional[str] = Field(default=None, alias="CHROMA_URL")

    # Session / flow state cache (optional, falls back to in-memory)
    redis_url: Optional[str] = Field(default=None, alias="REDIS_URL")

    # Internal auth between Spring Boot backend and this service
    ai_service_api_key: Optional[str] = Field(default=None, alias="AI_SERVICE_API_KEY")

    # CORS: comma-separated allowlist, not a wildcard -- this service is normally only
    # called server-to-server by backend/, but /docs is browser-facing in dev.
    cors_allowed_origins: str = Field(
        default="http://localhost:3000,http://localhost:5173,http://localhost:8080",
        alias="CORS_ALLOWED_ORIGINS",
    )

    @property
    def cors_allowed_origins_list(self) -> list[str]:
        return [o.strip() for o in self.cors_allowed_origins.split(",") if o.strip()]

    # Embeddings
    embedding_provider: str = Field(default="default", alias="EMBEDDING_PROVIDER")

    # Misc
    log_level: str = Field(default="INFO", alias="LOG_LEVEL")
    app_name: str = Field(default="ai-customer-support-agent", alias="APP_NAME")

    @property
    def has_anthropic_key(self) -> bool:
        return bool(self.anthropic_api_key)


@lru_cache
def get_settings() -> Settings:
    """Return a cached Settings singleton."""
    return Settings()
