"""Handler for the `directToAgent` node type — terminal, always escalates."""
from app.workflows.flow_schema import FlowNode
from app.workflows.node_handlers.base import HandlerContext, HandlerResult, empty_output


def handle(node: FlowNode, ctx: HandlerContext) -> HandlerResult:
    config = node.data.config  # DirectToAgentConfig
    output = empty_output()
    output["text"] = f"Connecting you with a human agent. Reason: {config.reason}"
    return HandlerResult(output=output, escalate=True)
