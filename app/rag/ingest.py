"""Chunking + ingestion of documents into the per-bot Chroma collection."""
import hashlib
import re
from typing import List, Optional

from app.config.logging_config import get_logger
from app.rag.vector_store import collection_name_for, get_or_create_collection

logger = get_logger(__name__)


def simple_recursive_chunk(
    text: str, chunk_size: int = 800, chunk_overlap: int = 100
) -> List[str]:
    """A lightweight recursive-ish character splitter.

    Splits on paragraph boundaries first, then falls back to sentence
    boundaries, then hard character windows, trying to keep chunks near
    `chunk_size` characters with `chunk_overlap` characters of overlap
    between consecutive chunks.
    """
    text = text.strip()
    if not text:
        return []

    if len(text) <= chunk_size:
        return [text]

    separators = ["\n\n", "\n", ". ", " "]

    def split(piece: str, seps: List[str]) -> List[str]:
        if len(piece) <= chunk_size:
            return [piece] if piece.strip() else []
        if not seps:
            # Hard split by character window.
            chunks = []
            start = 0
            while start < len(piece):
                end = start + chunk_size
                chunks.append(piece[start:end])
                start = end - chunk_overlap if chunk_overlap else end
                if start <= 0:
                    start = end
            return [c for c in chunks if c.strip()]

        sep, rest_seps = seps[0], seps[1:]
        parts = [p for p in piece.split(sep) if p != ""]
        if len(parts) <= 1:
            return split(piece, rest_seps)

        chunks: List[str] = []
        current = ""
        for part in parts:
            candidate = current + (sep if current else "") + part
            if len(candidate) <= chunk_size:
                current = candidate
            else:
                if current:
                    chunks.extend(split(current, rest_seps))
                current = part
        if current:
            chunks.extend(split(current, rest_seps))
        return chunks

    raw_chunks = split(text, separators)

    # Apply overlap between consecutive chunks for better retrieval context.
    if chunk_overlap <= 0 or len(raw_chunks) <= 1:
        return raw_chunks

    overlapped: List[str] = []
    for i, chunk in enumerate(raw_chunks):
        if i == 0:
            overlapped.append(chunk)
            continue
        prev = raw_chunks[i - 1]
        overlap_text = prev[-chunk_overlap:] if len(prev) > chunk_overlap else prev
        overlapped.append((overlap_text + " " + chunk).strip())
    return overlapped


def _chunk_id(bot_id: str, title: str, index: int, content: str) -> str:
    digest = hashlib.sha256(f"{bot_id}:{title}:{index}:{content}".encode("utf-8")).hexdigest()
    return f"{digest[:24]}"


def ingest_documents(bot_id: str, documents: list) -> dict:
    """Chunk and upsert documents into the bot's Chroma collection.

    `documents` is a list of objects/dicts with `title`, `content`, and
    optional `sourceUrl`. Returns a dict with `ingestedCount` (number of
    chunks stored) and `collectionName`.
    """
    collection = get_or_create_collection(bot_id)

    ids: List[str] = []
    texts: List[str] = []
    metadatas: List[dict] = []

    for doc in documents:
        title = getattr(doc, "title", None) if not isinstance(doc, dict) else doc.get("title")
        content = (
            getattr(doc, "content", None) if not isinstance(doc, dict) else doc.get("content")
        )
        source_url: Optional[str] = (
            getattr(doc, "sourceUrl", None)
            if not isinstance(doc, dict)
            else doc.get("sourceUrl")
        )

        chunks = simple_recursive_chunk(content or "")
        for idx, chunk in enumerate(chunks):
            ids.append(_chunk_id(bot_id, title or "untitled", idx, chunk))
            texts.append(chunk)
            metadatas.append(
                {
                    "title": title or "",
                    "sourceUrl": source_url or "",
                    "chunkIndex": idx,
                }
            )

    if texts:
        collection.upsert(ids=ids, documents=texts, metadatas=metadatas)

    logger.info("Ingested %d chunks for bot '%s'", len(texts), bot_id)

    return {
        "ingestedCount": len(texts),
        "collectionName": collection_name_for(bot_id),
    }
