"""Handler for the `aiResponse` node type.

Calls the support agent with RAG grounding, using the node's
`promptTemplate` as additional guidance/context injected into the agent
call alongside the latest incoming message.

Uses generate_single_agent_reply() rather than generate_reply() -- the
latter runs its own intent classification and specialist routing, which
would be redundant (and could override the flow author's intent) here,
since the visual flow itself already routed via its own Intent
Classification node before reaching this one.
"""

from app.agents.support_agent import generate_single_agent_reply
from app.rag.retriever import query as rag_query
from app.workflows.flow_schema import FlowNode
from app.workflows.node_handlers.base import HandlerContext, HandlerResult, empty_output


def handle(node: FlowNode, ctx: HandlerContext) -> HandlerResult:
    config = node.data.config  # AiResponseConfig
    message = ctx.incoming_message or ""

    bot_id = str(ctx.session_variables.get("botId") or "default")

    rag_context = ""
    try:
        results = rag_query(bot_id=bot_id, query_text=message, top_k=3)
        if results:
            rag_context = "\n".join(r["content"] for r in results)
    except Exception:
        rag_context = ""

    prompt_prefix = config.promptTemplate
    if _safe_format(config.promptTemplate):
        try:
            prompt_prefix = config.promptTemplate.format(**ctx.session_variables)
        except (KeyError, IndexError):
            prompt_prefix = config.promptTemplate

    full_message = (
        f"{prompt_prefix}\n\nCustomer: {message}" if prompt_prefix else message
    )

    agent_result = generate_single_agent_reply(
        message=full_message,
        history=[],
        bot_id=bot_id,
        rag_context=rag_context,
    )

    output = empty_output()
    output["text"] = agent_result["reply"]

    return HandlerResult(
        output=output, escalate=agent_result.get("shouldEscalate", False)
    )


def _safe_format(template: str) -> bool:
    """Return True if the template contains no `{}` placeholders beyond
    what's safe to attempt formatting with session variables (best effort)."""
    return "{" in template and "}" in template
