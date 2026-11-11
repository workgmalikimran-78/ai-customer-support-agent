"""Chroma vector store client wrapper.

Connects to a remote Chroma server (CHROMA_URL) when reachable; falls
back to an ephemeral in-memory Chroma client otherwise so local dev and
tests never require a live Chroma server or network access.
"""
from threading import Lock
from typing import Optional
from urllib.parse import urlparse

from app.config.logging_config import get_logger
from app.config.settings import get_settings
from app.rag.embeddings import get_embedding_function

logger = get_logger(__name__)

_client = None
_client_lock = Lock()


def _collection_name(bot_id: str) -> str:
    return f"bot_{bot_id}"


def _build_http_client(chroma_url: str):
    import chromadb

    parsed = urlparse(chroma_url)
    host = parsed.hostname or "localhost"
    port = parsed.port or (443 if parsed.scheme == "https" else 8000)
    ssl = parsed.scheme == "https"

    client = chromadb.HttpClient(host=host, port=port, ssl=ssl)
    # Cheap connectivity check; raises if the server is unreachable.
    client.heartbeat()
    return client


def _build_ephemeral_client():
    import chromadb

    return chromadb.EphemeralClient()


def get_chroma_client():
    """Return a process-wide Chroma client, created lazily on first use."""
    global _client
    if _client is not None:
        return _client

    with _client_lock:
        if _client is not None:
            return _client

        settings = get_settings()
        client = None
        if settings.chroma_url:
            try:
                client = _build_http_client(settings.chroma_url)
                logger.info("Connected to Chroma at %s", settings.chroma_url)
            except Exception as exc:
                logger.warning(
                    "Could not reach Chroma at %s (%s); falling back to in-memory client.",
                    settings.chroma_url,
                    exc,
                )

        if client is None:
            client = _build_ephemeral_client()
            logger.info("Using ephemeral in-memory Chroma client.")

        _client = client
        return _client


def reset_client() -> None:
    """Reset the cached client (primarily for tests)."""
    global _client
    with _client_lock:
        _client = None


def get_or_create_collection(bot_id: str):
    client = get_chroma_client()
    embedding_function = get_embedding_function()
    name = _collection_name(bot_id)
    kwargs = {"name": name}
    if embedding_function is not None:
        kwargs["embedding_function"] = embedding_function
    return client.get_or_create_collection(**kwargs)


def collection_name_for(bot_id: str) -> str:
    return _collection_name(bot_id)
