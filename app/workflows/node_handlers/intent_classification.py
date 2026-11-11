"""Handler for the `intentClassification` node type."""
from app.agents.intent_classifier import classify_intent
from app.workflows.flow_schema import FlowNode
from app.workflows.node_handlers.base import HandlerContext, HandlerResult, empty_output


def handle(node: FlowNode, ctx: HandlerContext) -> HandlerResult:
    config = node.data.config  # IntentClassificationConfig
    message = ctx.incoming_message or ""

    result = classify_intent(message, config.intents)

    output = empty_output()
    variable_updates = {
        "lastIntent": result["intent"],
        "lastIntentConfidence": result["confidence"],
    }
    classification = {"intent": result["intent"], "confidence": result["confidence"]}

    return HandlerResult(
        output=output,
        variable_updates=variable_updates,
        classification=classification,
    )
