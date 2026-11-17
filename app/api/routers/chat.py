"""POST /v1/chat router."""

from fastapi import APIRouter, Depends

from app.agents.support_agent import generate_reply
from app.api.deps import verify_api_key
from app.api.schemas.chat import ChatRequest, ChatResponse
from app.config.logging_config import get_logger

logger = get_logger(__name__)

router = APIRouter(prefix="/v1", tags=["chat"], dependencies=[Depends(verify_api_key)])


@router.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest) -> ChatResponse:
    history = [h.model_dump() for h in request.history]

    bot_id = "default"
    if request.flowContext and request.flowContext.variables:
        bot_id = str(request.flowContext.variables.get("botId") or "default")

    result = generate_reply(
        message=request.message,
        history=history,
        bot_id=bot_id,
        order_context=request.orderContext or "",
    )

    next_node_id = None
    if request.flowContext:
        next_node_id = request.flowContext.currentNodeId

    return ChatResponse(
        reply=result["reply"],
        intent=result.get("intent"),
        confidence=result.get("confidence"),
        nextNodeId=next_node_id,
        toolCalls=result.get("toolCalls"),
        shouldEscalate=bool(result.get("shouldEscalate", False)),
    )
