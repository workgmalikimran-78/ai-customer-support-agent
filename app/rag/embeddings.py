"""Embedding function configuration for the vector store.

Defaults to Chroma's bundled default embedding function (ONNX MiniLM,
runs locally with no API key). This keeps the service fully testable
without network access or credentials. Swappable via settings in case
a hosted embedding provider is configured later.
"""
from app.config.logging_config import get_logger
from app.config.settings import get_settings

logger = get_logger(__name__)


def get_embedding_function():
    """Return an embedding function compatible with chromadb collections.

    Falls back to Chroma's default embedding function unless a specific
    provider is configured via settings.embedding_provider. Any failure to
    construct a fancier embedding function silently falls back to the
    default so the service keeps working offline.
    """
    settings = get_settings()

    if settings.embedding_provider == "default":
        return _default_embedding_function()

    # Placeholder hook for future providers (e.g. "anthropic", "openai").
    # Currently no additional provider is wired up; fall back safely.
    logger.warning(
        "Unknown or unsupported embedding_provider '%s'; falling back to default.",
        settings.embedding_provider,
    )
    return _default_embedding_function()


def _default_embedding_function():
    try:
        from chromadb.utils import embedding_functions

        return embedding_functions.DefaultEmbeddingFunction()
    except Exception as exc:  # pragma: no cover - defensive
        logger.warning("Could not load chromadb default embedding function: %s", exc)
        return None
