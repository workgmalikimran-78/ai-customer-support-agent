"""LangChain tool wrapping the RAG retriever for agent use."""
from typing import Optional, Type

from pydantic import BaseModel, Field

from app.config.logging_config import get_logger
from app.rag import retriever

logger = get_logger(__name__)


class RagLookupInput(BaseModel):
    query: str = Field(description="The search query to look up in the knowledge base.")


def make_rag_lookup_tool(bot_id: str):
    """Build a LangChain StructuredTool bound to a specific bot's knowledge base."""
    try:
        from langchain_core.tools import StructuredTool
    except Exception as exc:  # pragma: no cover - import guard
        logger.warning("langchain_core not available, RAG tool disabled: %s", exc)
        return None

    def _run(query: str) -> str:
        try:
            results = retriever.query(bot_id=bot_id, query_text=query, top_k=3)
        except Exception as exc:  # pragma: no cover - defensive
            logger.warning("RAG lookup failed for bot '%s': %s", bot_id, exc)
            return "No knowledge base results available."

        if not results:
            return "No relevant knowledge base articles were found."

        formatted = "\n\n".join(
            f"- {r['content']}" + (f" (source: {r['sourceUrl']})" if r.get("sourceUrl") else "")
            for r in results
        )
        return formatted

    return StructuredTool.from_function(
        func=_run,
        name="rag_lookup",
        description=(
            "Look up relevant knowledge base articles for a given bot to help "
            "answer a customer support question. Input is a natural language query."
        ),
        args_schema=RagLookupInput,
    )


def rag_lookup(bot_id: str, query_text: str, top_k: int = 3) -> list:
    """Plain-function fallback for use outside of a LangChain agent context."""
    try:
        return retriever.query(bot_id=bot_id, query_text=query_text, top_k=top_k)
    except Exception as exc:  # pragma: no cover - defensive
        logger.warning("RAG lookup failed for bot '%s': %s", bot_id, exc)
        return []
