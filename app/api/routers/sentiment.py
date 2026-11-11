"""POST /v1/sentiment router."""
from fastapi import APIRouter, Depends

from app.agents.sentiment_agent import analyze_sentiment
from app.api.deps import verify_api_key
from app.api.schemas.sentiment import SentimentRequest, SentimentResponse
from app.config.logging_config import get_logger

logger = get_logger(__name__)

router = APIRouter(prefix="/v1", tags=["sentiment"], dependencies=[Depends(verify_api_key)])


@router.post("/sentiment", response_model=SentimentResponse)
async def sentiment(request: SentimentRequest) -> SentimentResponse:
    result = analyze_sentiment(request.text)
    return SentimentResponse(**result)
