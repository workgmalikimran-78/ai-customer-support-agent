"""Shared types for node handlers.

Each handler module exposes a `handle(node, ctx)` function where `ctx` is a
`HandlerContext` and the return value is a `HandlerResult`.
"""
from dataclasses import dataclass, field
from typing import Any, Dict, Optional

from app.workflows.flow_schema import FlowNode


@dataclass
class HandlerContext:
    session_variables: Dict[str, Any]
    incoming_message: Optional[str] = None


@dataclass
class HandlerResult:
    """Result of executing a single node.

    `output` matches the FlowOutput response shape (text/quickReplies/apiResult).
    `variable_updates` are merged into sessionVariables by the engine.
    `classification` optionally carries the latest intent/quick-reply
    selection so the engine can evaluate outgoing edge conditions.
    """

    output: Dict[str, Any] = field(default_factory=dict)
    variable_updates: Dict[str, Any] = field(default_factory=dict)
    classification: Dict[str, Any] = field(default_factory=dict)
    escalate: bool = False


def empty_output() -> Dict[str, Any]:
    return {"text": None, "quickReplies": None, "apiResult": None}
