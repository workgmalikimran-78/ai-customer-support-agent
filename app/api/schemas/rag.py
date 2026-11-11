"""Request/response schemas for /v1/rag/* endpoints."""
from typing import List, Optional

from pydantic import BaseModel, Field


class RagDocument(BaseModel):
    title: str
    content: str
    sourceUrl: Optional[str] = None


class RagIngestRequest(BaseModel):
    botId: str
    documents: List[RagDocument]


class RagIngestResponse(BaseModel):
    ingestedCount: int
    collectionName: str


class RagQueryRequest(BaseModel):
    botId: str
    query: str
    topK: int = Field(default=4, ge=1, le=50)


class RagResult(BaseModel):
    content: str
    score: float
    sourceUrl: Optional[str] = None


class RagQueryResponse(BaseModel):
    results: List[RagResult]
