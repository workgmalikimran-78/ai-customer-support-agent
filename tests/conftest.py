"""Shared pytest fixtures.

Ensures no real Anthropic/Chroma network calls are required: tests rely on
the no-API-key fallback paths baked into the agents, and on Chroma's
ephemeral in-memory client (the default when CHROMA_URL is unset or
unreachable).
"""
import os

import pytest

# Make sure no API keys leak in from the developer's shell during test runs,
# so the fallback code paths are exercised deterministically.
os.environ.pop("ANTHROPIC_API_KEY", None)
os.environ.pop("AI_SERVICE_API_KEY", None)
os.environ.pop("CHROMA_URL", None)

from app.config.settings import get_settings  # noqa: E402


@pytest.fixture(autouse=True)
def _clear_settings_cache():
    """Settings are cached via lru_cache; clear between tests so env
    manipulation in individual tests doesn't leak across test cases."""
    get_settings.cache_clear()
    yield
    get_settings.cache_clear()


@pytest.fixture
def client():
    from fastapi.testclient import TestClient

    from app.api.main import create_app

    app = create_app()
    with TestClient(app) as test_client:
        yield test_client
