"""Core support agent: a LangChain/LangGraph tool-using agent backed by
Claude, with RAG retrieval and escalation as tools.

If no ANTHROPIC_API_KEY is configured, falls back to a deterministic,
canned reply so the service remains fully runnable and testable without
a real key or network access.
"""
from typing import Any, Dict, List, Optional

from app.agents.prompts.support_agent_prompt import (
    SUPPORT_AGENT_SYSTEM_PROMPT,
    build_user_prompt,
)
from app.config.logging_config import get_logger
from app.config.settings import get_settings
from app.tools.escalation_tool import make_escalation_tool, should_escalate_by_keywords
from app.tools.rag_lookup_tool import make_rag_lookup_tool

logger = get_logger(__name__)

DEFAULT_BOT_ID = "default"

CANNED_FALLBACK_REPLY = (
    "Thanks for reaching out! I'm currently running in offline/demo mode "
    "without a live AI connection, but I've noted your message: \"{message}\". "
    "A member of our team will follow up, or you can rephrase your question "
    "and I'll do my best to help with the information I have available."
)


def _build_agent(bot_id: str):
    """Build a LangChain tool-calling agent. Returns None on any failure
    (missing dependency, missing key, etc.) so callers can fall back."""
    settings = get_settings()
    if not settings.has_anthropic_key:
        return None

    try:
        from langchain_anthropic import ChatAnthropic
        from langgraph.prebuilt import create_react_agent

        llm = ChatAnthropic(
            model=settings.llm_model_id,
            api_key=settings.anthropic_api_key,
            temperature=settings.llm_temperature,
        )

        tools = []
        rag_tool = make_rag_lookup_tool(bot_id)
        if rag_tool is not None:
            tools.append(rag_tool)
        escalation_tool = make_escalation_tool()
        if escalation_tool is not None:
            tools.append(escalation_tool)

        agent = create_react_agent(llm, tools, prompt=SUPPORT_AGENT_SYSTEM_PROMPT)
        return agent
    except Exception as exc:  # pragma: no cover - defensive
        logger.warning("Could not build LangGraph support agent, using fallback: %s", exc)
        return None


def _history_to_lc_messages(history: List[Dict[str, str]]):
    from langchain_core.messages import AIMessage, HumanMessage

    messages = []
    for item in history or []:
        sender = (item.get("sender") or "").lower()
        content = item.get("content") or ""
        if sender in ("agent", "bot", "assistant", "ai"):
            messages.append(AIMessage(content=content))
        else:
            messages.append(HumanMessage(content=content))
    return messages


def generate_reply(
    message: str,
    history: Optional[List[Dict[str, str]]] = None,
    bot_id: str = DEFAULT_BOT_ID,
    rag_context: str = "",
) -> Dict[str, Any]:
    """Generate a support reply for `message`.

    Returns a dict with keys: reply, shouldEscalate, toolCalls.
    """
    history = history or []
    settings = get_settings()

    if not settings.has_anthropic_key:
        return {
            "reply": CANNED_FALLBACK_REPLY.format(message=message),
            "shouldEscalate": should_escalate_by_keywords(message),
            "toolCalls": None,
        }

    agent = _build_agent(bot_id)
    if agent is None:
        return {
            "reply": CANNED_FALLBACK_REPLY.format(message=message),
            "shouldEscalate": should_escalate_by_keywords(message),
            "toolCalls": None,
        }

    try:
        from langchain_core.messages import HumanMessage

        lc_history = _history_to_lc_messages(history)
        user_prompt = build_user_prompt(message, rag_context=rag_context)
        input_messages = lc_history + [HumanMessage(content=user_prompt)]

        result = agent.invoke({"messages": input_messages})
        output_messages = result.get("messages", [])

        reply_text = ""
        should_escalate = False
        tool_calls: List[Any] = []

        for msg in output_messages:
            msg_tool_calls = getattr(msg, "tool_calls", None)
            if msg_tool_calls:
                for tc in msg_tool_calls:
                    tool_calls.append(tc)
                    if isinstance(tc, dict) and tc.get("name") == "escalate_to_human":
                        should_escalate = True

        # The final AI message content is the reply.
        if output_messages:
            last = output_messages[-1]
            content = getattr(last, "content", "")
            if isinstance(content, list):
                # Some providers return content blocks; join text blocks.
                reply_text = " ".join(
                    block.get("text", "") for block in content if isinstance(block, dict)
                ).strip()
            else:
                reply_text = str(content)

        if not reply_text:
            reply_text = CANNED_FALLBACK_REPLY.format(message=message)

        if not should_escalate:
            should_escalate = should_escalate_by_keywords(message)

        return {
            "reply": reply_text,
            "shouldEscalate": should_escalate,
            "toolCalls": tool_calls or None,
        }
    except Exception as exc:  # pragma: no cover - defensive, network/LLM dependent
        logger.warning("Support agent invocation failed, using fallback reply: %s", exc)
        return {
            "reply": CANNED_FALLBACK_REPLY.format(message=message),
            "shouldEscalate": should_escalate_by_keywords(message),
            "toolCalls": None,
        }
