"""Handler for the `quickReplies` node type.

On entry (no matching incoming message yet needed) it presents the prompt
text and options. If an incoming message is provided and matches one of the
configured options, that selection is recorded in the classification so the
engine can route the next turn via an edge `condition` of
`{"quickReply": "<option>"}`.
"""
from app.workflows.flow_schema import FlowNode
from app.workflows.node_handlers.base import HandlerContext, HandlerResult, empty_output


def handle(node: FlowNode, ctx: HandlerContext) -> HandlerResult:
    config = node.data.config  # QuickRepliesConfig
    output = empty_output()
    output["text"] = config.text
    output["quickReplies"] = list(config.options)

    classification = {}
    if ctx.incoming_message:
        message = ctx.incoming_message.strip()
        for option in config.options:
            if option.strip().lower() == message.lower():
                classification["quickReply"] = option
                break

    return HandlerResult(output=output, classification=classification)
