"""POST /v1/rag/ingest and /v1/rag/query routers."""
from fastapi import APIRouter, Depends

from app.api.deps import verify_api_key
from app.api.schemas.rag import (
    RagIngestRequest,
    RagIngestResponse,
    RagQueryRequest,
    RagQueryResponse,
    RagResult,
)
from app.config.logging_config import get_logger
from app.rag.ingest import ingest_documents
from app.rag.retriever import query as rag_query

logger = get_logger(__name__)

router = APIRouter(prefix="/v1/rag", tags=["rag"], dependencies=[Depends(verify_api_key)])


@router.post("/ingest", response_model=RagIngestResponse)
async def ingest(request: RagIngestRequest) -> RagIngestResponse:
    result = ingest_documents(bot_id=request.botId, documents=request.documents)
    return RagIngestResponse(**result)


@router.post("/query", response_model=RagQueryResponse)
async def query(request: RagQueryRequest) -> RagQueryResponse:
    results = rag_query(bot_id=request.botId, query_text=request.query, top_k=request.topK)
    return RagQueryResponse(results=[RagResult(**r) for r in results])
