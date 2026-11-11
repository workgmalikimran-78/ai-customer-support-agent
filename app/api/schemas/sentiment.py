"""Request/response schemas for /v1/sentiment."""
from typing import Literal

from pydantic import BaseModel


class SentimentRequest(BaseModel):
    conversationId: str
    text: str


class SentimentResponse(BaseModel):
    score: float
    label: Literal["positive", "neutral", "negative"]
    emoji: str
