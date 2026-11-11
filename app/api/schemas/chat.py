"""Request/response schemas for /v1/chat."""
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field


class ChatHistoryMessage(BaseModel):
    sender: str
    content: str


class FlowContext(BaseModel):
    flowId: str
    currentNodeId: str
    variables: Dict[str, Any] = Field(default_factory=dict)


class ChatRequest(BaseModel):
    conversationId: str
    contactId: str
    message: str
    history: List[ChatHistoryMessage] = Field(default_factory=list)
    flowContext: Optional[FlowContext] = None


class ChatResponse(BaseModel):
    reply: str
    intent: Optional[str] = None
    confidence: Optional[float] = None
    nextNodeId: Optional[str] = None
    toolCalls: Optional[List[Any]] = None
    shouldEscalate: bool = False
