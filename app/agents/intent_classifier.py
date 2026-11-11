"""Simple intent classification: LLM-based when an API key is present,
with a keyword-matching fallback otherwise."""
from typing import List, Tuple

from app.agents.prompts.intent_classifier_prompt import (
    INTENT_CLASSIFIER_SYSTEM_PROMPT,
    build_classification_prompt,
)
from app.config.logging_config import get_logger
from app.config.settings import get_settings

logger = get_logger(__name__)


def _keyword_fallback(message: str, intents: List[str]) -> Tuple[str, float]:
    """Pick the intent whose name/keywords best overlap the message."""
    lowered = message.lower()

    # A small built-in synonym map for common support intents; falls back to
    # matching the intent label tokens directly against the message.
    synonym_map = {
        "sales_inquiry": ["buy", "purchase", "price", "pricing", "quote", "plan", "upgrade", "sales"],
        "technical_support": ["error", "bug", "broken", "not working", "crash", "issue", "install", "technical"],
        "refund_request": ["refund", "money back", "cancel", "charge", "billing dispute"],
        "billing": ["invoice", "bill", "charge", "payment", "subscription"],
        "account_issue": ["login", "password", "account", "locked", "access"],
        "general_question": ["how do i", "what is", "question", "help"],
    }

    best_intent = None
    best_score = 0

    for intent in intents:
        score = 0
        intent_tokens = intent.lower().replace("_", " ").split()
        for token in intent_tokens:
            if token in lowered:
                score += 1

        for keyword in synonym_map.get(intent, []):
            if keyword in lowered:
                score += 2

        if score > best_score:
            best_score = score
            best_intent = intent

    if best_intent is None:
        return intents[0] if intents else "unknown", 0.2

    confidence = min(0.95, 0.4 + 0.15 * best_score)
    return best_intent, round(confidence, 2)


def _llm_classify(message: str, intents: List[str]):
    settings = get_settings()
    if not settings.has_anthropic_key:
        return None

    try:
        from langchain_anthropic import ChatAnthropic
        from langchain_core.messages import HumanMessage, SystemMessage

        llm = ChatAnthropic(
            model=settings.llm_model_id,
            api_key=settings.anthropic_api_key,
            temperature=0,
            max_tokens=20,
        )
        prompt = build_classification_prompt(message, intents)
        response = llm.invoke(
            [
                SystemMessage(content=INTENT_CLASSIFIER_SYSTEM_PROMPT),
                HumanMessage(content=prompt),
            ]
        )
        content = response.content if isinstance(response.content, str) else str(response.content)
        label = content.strip().strip('"').strip()

        if label in intents:
            return label, 0.9

        # Loose match in case the model added punctuation/casing noise.
        for intent in intents:
            if intent.lower() in label.lower():
                return intent, 0.75

        return None
    except Exception as exc:  # pragma: no cover - defensive, network/LLM dependent
        logger.warning("LLM intent classification failed, falling back to keywords: %s", exc)
        return None


def classify_intent(message: str, intents: List[str]) -> dict:
    """Return {"intent": str, "confidence": float} for the message."""
    if not intents:
        return {"intent": "unknown", "confidence": 0.0}

    llm_result = _llm_classify(message, intents)
    if llm_result is not None:
        intent, confidence = llm_result
    else:
        intent, confidence = _keyword_fallback(message, intents)

    return {"intent": intent, "confidence": confidence}
