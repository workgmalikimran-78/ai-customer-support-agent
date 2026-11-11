"""Request/response schemas for /v1/flows/* endpoints.

The actual graph structure (nodes/edges/node-config discriminated union)
lives in app.workflows.flow_schema. These schemas wrap that graph for the
HTTP contract.
"""
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field

from app.workflows.flow_schema import FlowGraph


class FlowExecuteRequest(BaseModel):
    flowId: str
    graphJson: FlowGraph
    currentNodeId: Optional[str] = None
    sessionVariables: Dict[str, Any] = Field(default_factory=dict)
    incomingMessage: Optional[str] = None


class FlowOutput(BaseModel):
    text: Optional[str] = None
    quickReplies: Optional[List[str]] = None
    apiResult: Optional[Dict[str, Any]] = None


class FlowExecuteResponse(BaseModel):
    nextNodeId: str
    nodeType: str
    output: FlowOutput
    sessionVariables: Dict[str, Any] = Field(default_factory=dict)
    isTerminal: bool = False
    escalate: bool = False


class FlowValidateRequest(BaseModel):
    graphJson: FlowGraph


class FlowValidationError(BaseModel):
    nodeId: str
    message: str


class FlowValidateResponse(BaseModel):
    valid: bool
    errors: List[FlowValidationError] = Field(default_factory=list)
