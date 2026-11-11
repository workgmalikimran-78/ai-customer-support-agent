"""Handler for the `apiCall` node type.

Performs the configured HTTP call via httpx. Failures are caught and
recorded as an error marker in sessionVariables rather than raised, so a
flaky downstream API never breaks flow execution.
"""
from app.config.logging_config import get_logger
from app.workflows.flow_schema import FlowNode
from app.workflows.node_handlers.base import HandlerContext, HandlerResult, empty_output

logger = get_logger(__name__)


def handle(node: FlowNode, ctx: HandlerContext) -> HandlerResult:
    config = node.data.config  # ApiCallConfig
    output = empty_output()
    variable_updates = {}

    try:
        import httpx

        with httpx.Client(timeout=config.timeoutSeconds) as client:
            response = client.request(
                method=config.method.upper(),
                url=config.url,
                headers=config.headers,
                json=config.body,
            )
            response.raise_for_status()
            try:
                body = response.json()
            except ValueError:
                body = {"raw": response.text}

        output["apiResult"] = body
        variable_updates["lastApiCallStatus"] = "success"
        variable_updates.pop("lastError", None)
    except Exception as exc:
        logger.warning("apiCall node '%s' failed: %s", node.id, exc)
        output["apiResult"] = None
        variable_updates["lastApiCallStatus"] = "error"
        variable_updates["lastError"] = str(exc)

    return HandlerResult(output=output, variable_updates=variable_updates)
