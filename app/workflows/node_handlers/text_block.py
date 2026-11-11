"""Handler for the `textBlock` node type."""
from app.workflows.flow_schema import FlowNode
from app.workflows.node_handlers.base import HandlerContext, HandlerResult, empty_output


def handle(node: FlowNode, ctx: HandlerContext) -> HandlerResult:
    config = node.data.config  # TextBlockConfig
    output = empty_output()
    output["text"] = config.text
    return HandlerResult(output=output)
