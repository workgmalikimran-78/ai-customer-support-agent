"""Sentiment scoring agent: LLM-based when an API key is present, with a
deterministic lexicon-based fallback that always returns a sane result."""
import re
from typing import Tuple

from app.config.logging_config import get_logger
from app.config.settings import get_settings

logger = get_logger(__name__)

POSITIVE_WORDS = {
    "great", "good", "excellent", "amazing", "awesome", "love", "happy",
    "fantastic", "wonderful", "thanks", "thank", "perfect", "helpful",
    "pleased", "satisfied", "appreciate", "nice", "best", "resolved",
    "works", "working", "glad", "superb", "brilliant", "delighted",
}

NEGATIVE_WORDS = {
    "bad", "terrible", "awful", "horrible", "hate", "angry", "frustrated",
    "frustrating", "annoyed", "annoying", "disappointed", "disappointing",
    "broken", "worst", "useless", "unacceptable", "furious", "slow",
    "never", "refund", "cancel", "complaint", "issue", "problem", "fail",
    "failed", "failing", "bug", "error", "wrong", "poor", "ridiculous",
}

NEGATIONS = {"not", "no", "never", "n't", "without"}


def _lexicon_sentiment(text: str) -> Tuple[float, str]:
    """Deterministic keyword-based sentiment score in [-1, 1]."""
    tokens = re.findall(r"[a-z']+", text.lower())
    if not tokens:
        return 0.0, "neutral"

    score = 0
    for i, token in enumerate(tokens):
        polarity = 0
        if token in POSITIVE_WORDS:
            polarity = 1
        elif token in NEGATIVE_WORDS:
            polarity = -1
        else:
            continue

        # Flip polarity if a negation word appears shortly before this token.
        window = tokens[max(0, i - 3): i]
        if any(neg in window for neg in NEGATIONS):
            polarity *= -1

        score += polarity

    # Normalize roughly by message length to keep in [-1, 1].
    normalized = score / max(3.0, len(tokens) / 4.0)
    normalized = max(-1.0, min(1.0, normalized))

    if normalized > 0.15:
        label = "positive"
    elif normalized < -0.15:
        label = "negative"
    else:
        label = "neutral"

    return round(normalized, 3), label


def _emoji_for_label(label: str) -> str:
    return {"positive": "\U0001F642", "neutral": "\U0001F610", "negative": "\U0001F61E"}[label]


def _llm_sentiment(text: str):
    """Attempt LLM-based sentiment scoring. Returns None on any failure."""
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
        system = (
            "You are a sentiment classifier. Given customer support message text, "
            "respond with ONLY a JSON object like "
            '{"score": <float -1 to 1>, "label": "positive|neutral|negative"}. '
            "No extra text."
        )
        response = llm.invoke(
            [SystemMessage(content=system), HumanMessage(content=text)]
        )
        content = response.content if isinstance(response.content, str) else str(response.content)

        import json

        match = re.search(r"\{.*\}", content, re.DOTALL)
        if not match:
            return None
        parsed = json.loads(match.group(0))
        score = float(parsed.get("score", 0.0))
        label = parsed.get("label", "neutral")
        if label not in ("positive", "neutral", "negative"):
            return None
        return round(max(-1.0, min(1.0, score)), 3), label
    except Exception as exc:  # pragma: no cover - defensive, network/LLM dependent
        logger.warning("LLM sentiment scoring failed, falling back to lexicon: %s", exc)
        return None


def analyze_sentiment(text: str) -> dict:
    """Return {score, label, emoji} for the given text."""
    llm_result = _llm_sentiment(text)
    if llm_result is not None:
        score, label = llm_result
    else:
        score, label = _lexicon_sentiment(text)

    return {"score": score, "label": label, "emoji": _emoji_for_label(label)}
