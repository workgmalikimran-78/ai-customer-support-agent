"""Shared FastAPI dependencies: settings access and API key auth."""
from fastapi import Header, HTTPException, status

from app.config.settings import Settings, get_settings


def settings_dependency() -> Settings:
    return get_settings()


async def verify_api_key(
    x_api_key: str | None = Header(default=None, alias="X-API-Key"),
) -> None:
    """Validate the shared-secret header used by the Spring Boot backend.

    Validation is skipped entirely if AI_SERVICE_API_KEY is unset, to ease
    local development.
    """
    settings = get_settings()
    expected = settings.ai_service_api_key

    if not expected:
        return

    if x_api_key != expected:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or missing X-API-Key header.",
        )
