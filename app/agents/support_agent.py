"""Core support agent: a LangGraph supervisor that classifies intent and
routes to one of several specialist sub-agents (sales, technical, billing,
general), each with its own prompt and a scoped toolset rather than one
agent carrying every tool.

If no ANTHROPIC_API_KEY is configured, falls back to a deterministic,
canned reply so the service remains fully runnable and testable without
a real key or network access.
"""

from typing import Any, Dict, List, Optional, TypedDict

from app.agents.intent_classifier import classify_intent
from app.agents.prompts.support_agent_prompt import (
    BILLING_ESCALATION_REPLY,
    GENERAL_AGENT_PROMPT,
    SALES_AGENT_PROMPT,
    TECHNICAL_AGENT_PROMPT,
    build_user_prompt,
)
from app.config.logging_config import get_logger
from app.config.settings import get_settings
from app.tools.escalation_tool import make_escalation_tool, should_escalate_by_keywords
from app.tools.rag_lookup_tool import make_rag_lookup_tool

logger = get_logger(__name__)

DEFAULT_BOT_ID = "default"

# Same intents the visual bot-flow's intentClassification node type uses
# (see app/workflows/node_handlers/intent_classification.py) -- reusing them
# here means plain chat and the visual flow route the same way.
INTENTS = ["sales_inquiry", "technical_support", "billing_issue"]

# Below this confidence, classify_intent's keyword fallback is just guessing
# (it defaults to the first configured intent at 0.2 when nothing matches) --
# treat that as "unclassified" and send it to the general specialist instead
# of trusting the guess.
MIN_ROUTING_CONFIDENCE = 0.3

CANNED_FALLBACK_REPLY = (
    "Thanks for reaching out! I'm currently running in offline/demo mode "
    'without a live AI connection, but I\'ve noted your message: "{message}". '
    "A member of our team will follow up, or you can rephrase your question "
    "and I'll do my best to help with the information I have available."
)


class SupportAgentState(TypedDict, total=False):
    message: str
    history: List[Dict[str, str]]
    rag_context: str
    order_context: str
    bot_id: str
    intent: Optional[str]
    confidence: Optional[float]
    reply: Optional[str]
    should_escalate: bool
    tool_calls: Optional[List[Any]]


def _canned_fallback(message: str) -> Dict[str, Any]:
    return {
        "reply": CANNED_FALLBACK_REPLY.format(message=message),
        "shouldEscalate": should_escalate_by_keywords(message),
        "toolCalls": None,
        "intent": None,
        "confidence": None,
    }


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


def _run_specialist(
    llm, tools: List[Any], system_prompt: str, state: SupportAgentState
):
    """Run one specialist's own tool-using agent and extract its reply text
    and tool calls. Shared by the sales/technical/general nodes, which only
    differ in prompt and toolset."""
    from langchain_core.messages import HumanMessage
    from langgraph.prebuilt import create_react_agent

    agent = create_react_agent(llm, tools, prompt=system_prompt)

    lc_history = _history_to_lc_messages(state.get("history") or [])
    user_prompt = build_user_prompt(
        state["message"],
        rag_context=state.get("rag_context", ""),
        order_context=state.get("order_context", ""),
    )
    input_messages = lc_history + [HumanMessage(content=user_prompt)]

    result = agent.invoke({"messages": input_messages})
    output_messages = result.get("messages", [])

    tool_calls: List[Any] = []
    for msg in output_messages:
        msg_tool_calls = getattr(msg, "tool_calls", None)
        if msg_tool_calls:
            tool_calls.extend(msg_tool_calls)

    reply_text = ""
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

    return reply_text, (tool_calls or None)


def _route_by_intent(state: SupportAgentState) -> str:
    intent = state.get("intent")
    confidence = state.get("confidence") or 0.0

    if intent == "billing_issue":
        return "billing"
    if intent == "sales_inquiry" and confidence >= MIN_ROUTING_CONFIDENCE:
        return "sales"
    if intent == "technical_support" and confidence >= MIN_ROUTING_CONFIDENCE:
        return "technical"
    return "general"


def _build_graph(bot_id: str):
    """Build the supervisor graph: classify -> one specialist -> escalation
    check. Rebuilt per call (same as the single-agent version it replaces),
    since the RAG tool is bound to a specific bot_id's knowledge base."""
    settings = get_settings()

    try:
        from langchain_anthropic import ChatAnthropic
        from langgraph.graph import END, StateGraph

        llm = ChatAnthropic(
            model=settings.llm_model_id,
            api_key=settings.anthropic_api_key,
            temperature=settings.llm_temperature,
        )

        rag_tool = make_rag_lookup_tool(bot_id)
        escalation_tool = make_escalation_tool()
        # Sales/technical prompts both instruct the agent to call
        # escalate_to_human when needed, so they need it bound too -- only
        # billing skips tools entirely (fixed reply, no LLM call at all).
        specialist_tools = [t for t in (rag_tool, escalation_tool) if t is not None]
        general_tools = specialist_tools

        def classify_node(state: SupportAgentState) -> Dict[str, Any]:
            result = classify_intent(state["message"], INTENTS)
            return {"intent": result["intent"], "confidence": result["confidence"]}

        def sales_node(state: SupportAgentState) -> Dict[str, Any]:
            reply, tool_calls = _run_specialist(
                llm, specialist_tools, SALES_AGENT_PROMPT, state
            )
            return {"reply": reply, "tool_calls": tool_calls}

        def technical_node(state: SupportAgentState) -> Dict[str, Any]:
            reply, tool_calls = _run_specialist(
                llm, specialist_tools, TECHNICAL_AGENT_PROMPT, state
            )
            return {"reply": reply, "tool_calls": tool_calls}

        def general_node(state: SupportAgentState) -> Dict[str, Any]:
            reply, tool_calls = _run_specialist(
                llm, general_tools, GENERAL_AGENT_PROMPT, state
            )
            return {"reply": reply, "tool_calls": tool_calls}

        def billing_node(state: SupportAgentState) -> Dict[str, Any]:
            return {
                "reply": BILLING_ESCALATION_REPLY,
                "should_escalate": True,
                "tool_calls": None,
            }

        def escalation_check_node(state: SupportAgentState) -> Dict[str, Any]:
            should_escalate = bool(state.get("should_escalate"))
            for tc in state.get("tool_calls") or []:
                if isinstance(tc, dict) and tc.get("name") == "escalate_to_human":
                    should_escalate = True
            if not should_escalate:
                should_escalate = should_escalate_by_keywords(state["message"])
            return {"should_escalate": should_escalate}

        builder = StateGraph(SupportAgentState)
        builder.add_node("classify", classify_node)
        builder.add_node("sales", sales_node)
        builder.add_node("technical", technical_node)
        builder.add_node("billing", billing_node)
        builder.add_node("general", general_node)
        builder.add_node("escalation_check", escalation_check_node)

        builder.set_entry_point("classify")
        builder.add_conditional_edges(
            "classify",
            _route_by_intent,
            {
                "sales": "sales",
                "technical": "technical",
                "billing": "billing",
                "general": "general",
            },
        )
        for specialist in ("sales", "technical", "billing", "general"):
            builder.add_edge(specialist, "escalation_check")
        builder.add_edge("escalation_check", END)

        return builder.compile()
    except Exception as exc:  # pragma: no cover - defensive
        logger.warning(
            "Could not build LangGraph supervisor graph, using fallback: %s", exc
        )
        return None


def generate_reply(
    message: str,
    history: Optional[List[Dict[str, str]]] = None,
    bot_id: str = DEFAULT_BOT_ID,
    rag_context: str = "",
    order_context: str = "",
) -> Dict[str, Any]:
    """Generate a support reply for `message`.

    Returns a dict with keys: reply, shouldEscalate, toolCalls, intent,
    confidence. `intent`/`confidence` come from the supervisor's routing
    classification and are None in the no-API-key canned-fallback case.
    """
    history = history or []
    settings = get_settings()

    if not settings.has_anthropic_key:
        return _canned_fallback(message)

    graph = _build_graph(bot_id)
    if graph is None:
        return _canned_fallback(message)

    try:
        initial_state: SupportAgentState = {
            "message": message,
            "history": history,
            "rag_context": rag_context,
            "order_context": order_context,
            "bot_id": bot_id,
            "should_escalate": False,
        }
        result_state = graph.invoke(initial_state)

        reply_text = result_state.get("reply") or CANNED_FALLBACK_REPLY.format(
            message=message
        )

        return {
            "reply": reply_text,
            "shouldEscalate": bool(result_state.get("should_escalate", False)),
            "toolCalls": result_state.get("tool_calls"),
            "intent": result_state.get("intent"),
            "confidence": result_state.get("confidence"),
        }
    except Exception as exc:  # pragma: no cover - defensive, network/LLM dependent
        logger.warning(
            "Support agent graph invocation failed, using fallback reply: %s", exc
        )
        return _canned_fallback(message)


def generate_single_agent_reply(
    message: str,
    history: Optional[List[Dict[str, str]]] = None,
    bot_id: str = DEFAULT_BOT_ID,
    rag_context: str = "",
    order_context: str = "",
) -> Dict[str, Any]:
    """Generate a reply using one general-purpose tool-using agent, with no
    intent classification or specialist routing.

    This is for the bot-flow engine's `aiResponse` node (see
    app/workflows/node_handlers/ai_response.py), where the *visual flow
    itself* is already the routing layer -- its own Intent Classification
    node already decided which branch led here. Running generate_reply()'s
    classify/route supervisor again at this point would redundantly
    reclassify the message and could silently override whatever branch the
    flow author chose (e.g. landing on the billing specialist's fixed
    escalation reply instead of the RAG-grounded answer the node was meant
    to give). `intent`/`confidence` are always None here since no
    classification runs.
    """
    history = history or []
    settings = get_settings()

    if not settings.has_anthropic_key:
        return _canned_fallback(message)

    try:
        from langchain_anthropic import ChatAnthropic

        llm = ChatAnthropic(
            model=settings.llm_model_id,
            api_key=settings.anthropic_api_key,
            temperature=settings.llm_temperature,
        )
        rag_tool = make_rag_lookup_tool(bot_id)
        escalation_tool = make_escalation_tool()
        tools = [t for t in (rag_tool, escalation_tool) if t is not None]

        state: SupportAgentState = {
            "message": message,
            "history": history,
            "rag_context": rag_context,
            "order_context": order_context,
        }
        reply_text, tool_calls = _run_specialist(
            llm, tools, GENERAL_AGENT_PROMPT, state
        )

        should_escalate = False
        for tc in tool_calls or []:
            if isinstance(tc, dict) and tc.get("name") == "escalate_to_human":
                should_escalate = True
        if not should_escalate:
            should_escalate = should_escalate_by_keywords(message)

        return {
            "reply": reply_text or CANNED_FALLBACK_REPLY.format(message=message),
            "shouldEscalate": should_escalate,
            "toolCalls": tool_calls,
            "intent": None,
            "confidence": None,
        }
    except Exception as exc:  # pragma: no cover - defensive, network/LLM dependent
        logger.warning(
            "Single-agent reply generation failed, using fallback reply: %s", exc
        )
        return _canned_fallback(message)
