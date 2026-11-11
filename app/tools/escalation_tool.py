"""Escalation tool: lets the agent flag that a conversation needs a human."""
from pydantic import BaseModel, Field

from app.config.logging_config import get_logger

logger = get_logger(__name__)

ESCALATION_KEYWORDS = (
    "speak to a human",
    "speak to a person",
    "talk to a human",
    "talk to a person",
    "real person",
    "human agent",
    "representative",
    "manager",
    "lawsuit",
    "legal action",
    "cancel my account",
    "furious",
    "unacceptable",
)


class EscalationInput(BaseModel):
    reason: str = Field(description="Why this conversation should be escalated to a human agent.")


def make_escalation_tool():
    """Build a LangChain StructuredTool the agent can call to request escalation."""
    try:
        from langchain_core.tools import StructuredTool
    except Exception as exc:  # pragma: no cover - import guard
        logger.warning("langchain_core not available, escalation tool disabled: %s", exc)
        return None

    def _run(reason: str) -> str:
        logger.info("Escalation requested: %s", reason)
        return f"ESCALATE: {reason}"

    return StructuredTool.from_function(
        func=_run,
        name="escalate_to_human",
        description=(
            "Call this when the customer explicitly asks for a human agent, is "
            "extremely frustrated, or the request is outside of what you can "
            "safely resolve (e.g. legal threats, billing disputes requiring "
            "account access). Input is a short reason string."
        ),
        args_schema=EscalationInput,
    )


def should_escalate_by_keywords(text: str) -> bool:
    """Lightweight deterministic fallback used when no LLM is configured."""
    lowered = text.lower()
    return any(keyword in lowered for keyword in ESCALATION_KEYWORDS)
