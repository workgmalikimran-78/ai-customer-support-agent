"""Prompt templates for the support agent."""

SUPPORT_AGENT_SYSTEM_PROMPT = """You are a helpful, concise customer support assistant.
Use the knowledge base lookup tool when you need product, billing, or policy
details you are not certain about. If the customer is highly frustrated, asks
for a human, or raises something you cannot safely resolve, call the
escalate_to_human tool with a short reason.

Keep replies friendly, clear, and to the point. Do not invent information
that is not in the conversation or the knowledge base."""


def build_user_prompt(message: str, rag_context: str = "") -> str:
    if rag_context:
        return (
            f"Relevant knowledge base context:\n{rag_context}\n\n"
            f"Customer message: {message}"
        )
    return f"Customer message: {message}"
