"""Query-time retrieval against a bot's Chroma collection."""
from typing import List

from app.config.logging_config import get_logger
from app.rag.vector_store import get_or_create_collection

logger = get_logger(__name__)


def _distance_to_score(distance: float) -> float:
    """Convert a Chroma distance (lower = more similar) into a 0..1 score."""
    try:
        return max(0.0, min(1.0, 1.0 / (1.0 + float(distance))))
    except (TypeError, ValueError):
        return 0.0


def query(bot_id: str, query_text: str, top_k: int = 4) -> List[dict]:
    """Return up to `top_k` relevant chunks for `query_text`.

    Each result dict has `content`, `score`, and `sourceUrl`.
    """
    collection = get_or_create_collection(bot_id)

    count = 0
    try:
        count = collection.count()
    except Exception as exc:  # pragma: no cover - defensive
        logger.warning("Could not get collection count: %s", exc)

    if count == 0:
        return []

    results = collection.query(
        query_texts=[query_text],
        n_results=min(top_k, count),
    )

    documents = (results.get("documents") or [[]])[0]
    distances = (results.get("distances") or [[]])[0]
    metadatas = (results.get("metadatas") or [[]])[0]

    output: List[dict] = []
    for i, doc_text in enumerate(documents):
        distance = distances[i] if i < len(distances) else None
        metadata = metadatas[i] if i < len(metadatas) else {} or {}
        score = _distance_to_score(distance) if distance is not None else 0.0
        output.append(
            {
                "content": doc_text,
                "score": score,
                "sourceUrl": (metadata or {}).get("sourceUrl") or None,
            }
        )
    return output
