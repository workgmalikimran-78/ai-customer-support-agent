"""FastAPI application factory for the AI customer support service."""
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routers import chat, flows, health, rag, sentiment
from app.config.logging_config import configure_logging, get_logger
from app.config.settings import get_settings

logger = get_logger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    configure_logging()
    logger.info("Starting %s", get_settings().app_name)

    # Warm up the vector store client (falls back to in-memory if Chroma is
    # unreachable, so this never blocks startup).
    try:
        from app.rag.vector_store import get_chroma_client

        get_chroma_client()
    except Exception as exc:  # pragma: no cover - defensive
        logger.warning("Vector store warmup failed: %s", exc)

    yield

    logger.info("Shutting down %s", get_settings().app_name)


def create_app() -> FastAPI:
    configure_logging()

    app = FastAPI(
        title="AI Customer Support Agent Service",
        version="0.1.0",
        lifespan=lifespan,
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=get_settings().cors_allowed_origins_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(health.router)
    app.include_router(chat.router)
    app.include_router(flows.router)
    app.include_router(rag.router)
    app.include_router(sentiment.router)

    return app


app = create_app()
