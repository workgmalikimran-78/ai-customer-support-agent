"""Prompt template for LLM-based intent classification."""

INTENT_CLASSIFIER_SYSTEM_PROMPT = """You are an intent classification system for a \
customer support chatbot. Given a customer message and a fixed list of \
possible intents, respond with ONLY the single best-matching intent label \
from the list, exactly as written, and nothing else. If nothing matches \
well, respond with "unknown"."""


def build_classification_prompt(message: str, intents: list) -> str:
    intents_list = "\n".join(f"- {intent}" for intent in intents)
    return (
        f"Possible intents:\n{intents_list}\n\n"
        f"Customer message: {message}\n\n"
        "Respond with only the intent label."
    )
