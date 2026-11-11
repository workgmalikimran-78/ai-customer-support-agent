"""POST /v1/flows/execute and /v1/flows/validate routers."""
from fastapi import APIRouter, Depends, HTTPException

from app.api.deps import verify_api_key
from app.api.schemas.flow import (
    FlowExecuteRequest,
    FlowExecuteResponse,
    FlowValidateRequest,
    FlowValidateResponse,
)
from app.config.logging_config import get_logger
from app.workflows.flow_engine import FlowEngineError, execute_turn, validate_graph

logger = get_logger(__name__)

router = APIRouter(prefix="/v1/flows", tags=["flows"], dependencies=[Depends(verify_api_key)])


@router.post("/execute", response_model=FlowExecuteResponse)
async def execute_flow(request: FlowExecuteRequest) -> FlowExecuteResponse:
    try:
        result = execute_turn(
            graph=request.graphJson,
            current_node_id=request.currentNodeId,
            session_variables=request.sessionVariables,
            incoming_message=request.incomingMessage,
        )
    except FlowEngineError as exc:
        raise HTTPException(status_code=400, detail=str(exc))

    return FlowExecuteResponse(**result)


@router.post("/validate", response_model=FlowValidateResponse)
async def validate_flow(request: FlowValidateRequest) -> FlowValidateResponse:
    errors = validate_graph(request.graphJson)
    return FlowValidateResponse(valid=len(errors) == 0, errors=errors)
