"""Ingest a couple of tiny documents into an ephemeral in-memory Chroma
collection and query them back. No network access or API keys required."""
import uuid

import pytest

from app.rag import vector_store
from app.rag.ingest import ingest_documents
from app.rag.retriever import query as rag_query


@pytest.fixture(autouse=True)
def _reset_chroma_client():
    vector_store.reset_client()
    yield
    vector_store.reset_client()


def test_ingest_and_query_returns_relevant_content():
    bot_id = f"test-bot-{uuid.uuid4().hex[:8]}"

    documents = [
        {
            "title": "Refund Policy",
            "content": (
                "Customers can request a full refund within 30 days of "
                "purchase. Refunds are processed within 5 business days "
                "to the original payment method."
            ),
            "sourceUrl": "https://example.com/refunds",
        },
        {
            "title": "Password Reset",
            "content": (
                "To reset your password, go to the login page and click "
                "'Forgot password'. You will receive an email with a reset link."
            ),
            "sourceUrl": "https://example.com/password-reset",
        },
    ]

    ingest_result = ingest_documents(bot_id=bot_id, documents=documents)

    assert ingest_result["ingestedCount"] >= 2
    assert ingest_result["collectionName"] == f"bot_{bot_id}"

    results = rag_query(bot_id=bot_id, query_text="How do I get my money back?", top_k=2)

    assert len(results) > 0
    top_contents = " ".join(r["content"].lower() for r in results)
    assert "refund" in top_contents

    for result in results:
        assert "content" in result
        assert "score" in result
        assert "sourceUrl" in result


def test_query_against_empty_collection_returns_no_results():
    bot_id = f"empty-bot-{uuid.uuid4().hex[:8]}"
    results = rag_query(bot_id=bot_id, query_text="anything", top_k=3)
    assert results == []
