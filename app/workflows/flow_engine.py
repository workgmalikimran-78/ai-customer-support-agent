"""Core flow interpreter.

Given a graph, the current node (or start node on the first turn), and
session variables, dispatches to the matching node handler, applies any
state updates, then picks the next node by evaluating outgoing edges'
`condition` dicts against session variables / the latest classification.
The first matching condition wins; an edge with no `condition` is the
default fallback.
"""
from typing import Any, Dict, Optional

from app.config.logging_config import get_logger
from app.workflows import session_state
from app.workflows.flow_schema import (
    FlowEdge,
    FlowGraph,
    FlowNode,
    NON_TERMINAL_NODE_TYPES,
)
from app.workflows.node_handlers import (
    ai_response,
    api_call,
    direct_to_agent,
    intent_classification,
    quick_replies,
    text_block,
    welcome_message,
)
from app.workflows.node_handlers.base import HandlerContext

logger = get_logger(__name__)

_HANDLERS = {
    "welcomeMessage": welcome_message.handle,
    "intentClassification": intent_classification.handle,
    "textBlock": text_block.handle,
    "quickReplies": quick_replies.handle,
    "apiCall": api_call.handle,
    "aiResponse": ai_response.handle,
    "directToAgent": direct_to_agent.handle,
}

TERMINAL_NODE_TYPES = {"directToAgent"}


class FlowEngineError(Exception):
    pass


def _edge_condition_matches(
    condition: Optional[Dict[str, Any]],
    classification: Dict[str, Any],
    session_variables: Dict[str, Any],
) -> bool:
    """An edge with no condition is the default fallback (always matches,
    but should only be used if no other edge matches first — callers are
    responsible for checking conditioned edges before the default)."""
    if not condition:
        return True

    for key, expected_value in condition.items():
        if key in classification:
            actual_value = classification.get(key)
        else:
            actual_value = session_variables.get(key)

        if actual_value != expected_value:
            return False

    return True


def _select_next_edge(
    outgoing_edges: list,
    classification: Dict[str, Any],
    session_variables: Dict[str, Any],
) -> Optional[FlowEdge]:
    conditioned = [e for e in outgoing_edges if e.condition]
    default = [e for e in outgoing_edges if not e.condition]

    for edge in conditioned:
        if _edge_condition_matches(edge.condition, classification, session_variables):
            return edge

    if default:
        return default[0]

    return None


def execute_turn(
    graph: FlowGraph,
    current_node_id: Optional[str],
    session_variables: Dict[str, Any],
    incoming_message: Optional[str],
) -> Dict[str, Any]:
    """Execute a single turn of the flow and return the response dict
    matching the /v1/flows/execute response shape."""
    node_id = current_node_id or graph.startNodeId
    node = graph.get_node(node_id)
    if node is None:
        raise FlowEngineError(f"Unknown node id: {node_id}")

    handler = _HANDLERS.get(node.type)
    if handler is None:
        raise FlowEngineError(f"No handler registered for node type: {node.type}")

    ctx = HandlerContext(
        session_variables=dict(session_variables or {}),
        incoming_message=incoming_message,
    )

    result = handler(node, ctx)

    updated_variables = session_state.merge_variables(
        session_variables or {}, result.variable_updates
    )

    is_terminal = node.type in TERMINAL_NODE_TYPES
    escalate = result.escalate or node.type in TERMINAL_NODE_TYPES

    next_node_id = node.id
    if not is_terminal:
        outgoing = graph.outgoing_edges(node.id)
        next_edge = _select_next_edge(outgoing, result.classification, updated_variables)
        if next_edge is not None:
            next_node_id = next_edge.target
        else:
            # No outgoing edge matched (or none exist) - stay put / treat as terminal.
            next_node_id = node.id
            if not outgoing:
                is_terminal = True

    return {
        "nextNodeId": next_node_id,
        "nodeType": node.type,
        "output": result.output,
        "sessionVariables": updated_variables,
        "isTerminal": is_terminal,
        "escalate": escalate,
    }


def validate_graph(graph: FlowGraph) -> list:
    """Validate a flow graph's structural integrity.

    Checks:
    - every edge references existing node ids
    - every non-terminal node type has at least one outgoing edge
    - startNodeId exists in nodes

    Returns a list of {"nodeId": str, "message": str} error dicts (empty
    list means valid).
    """
    errors = []
    node_ids = {node.id for node in graph.nodes}

    if graph.startNodeId not in node_ids:
        errors.append(
            {
                "nodeId": graph.startNodeId,
                "message": f"startNodeId '{graph.startNodeId}' does not reference an existing node.",
            }
        )

    for edge in graph.edges:
        if edge.source not in node_ids:
            errors.append(
                {
                    "nodeId": edge.source,
                    "message": f"Edge '{edge.id}' has source '{edge.source}' which does not exist.",
                }
            )
        if edge.target not in node_ids:
            errors.append(
                {
                    "nodeId": edge.target,
                    "message": f"Edge '{edge.id}' has target '{edge.target}' which does not exist.",
                }
            )

    for node in graph.nodes:
        if node.type in NON_TERMINAL_NODE_TYPES:
            outgoing = graph.outgoing_edges(node.id)
            if not outgoing:
                errors.append(
                    {
                        "nodeId": node.id,
                        "message": f"Node '{node.id}' of type '{node.type}' has no outgoing edges.",
                    }
                )

    return errors
