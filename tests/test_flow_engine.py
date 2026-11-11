"""Tests driving the flow engine through tests/fixtures/sample_flow_graph.json."""
import json
from pathlib import Path

import pytest

from app.workflows.flow_engine import execute_turn, validate_graph
from app.workflows.flow_schema import FlowGraph

FIXTURE_PATH = Path(__file__).parent / "fixtures" / "sample_flow_graph.json"


@pytest.fixture
def graph() -> FlowGraph:
    raw = json.loads(FIXTURE_PATH.read_text())
    return FlowGraph.model_validate(raw)


def test_graph_is_valid(graph):
    errors = validate_graph(graph)
    assert errors == []


def test_welcome_to_classify_turn(graph):
    result = execute_turn(
        graph=graph,
        current_node_id=None,
        session_variables={},
        incoming_message=None,
    )

    assert result["nodeType"] == "welcomeMessage"
    assert result["nextNodeId"] == "classify"
    assert result["isTerminal"] is False
    assert result["escalate"] is False
    assert "Welcome" in result["output"]["text"] or "welcome" in result["output"]["text"].lower()


def test_classify_routes_to_sales_branch(graph):
    result = execute_turn(
        graph=graph,
        current_node_id="classify",
        session_variables={},
        incoming_message="I want to know about pricing and plans",
    )

    assert result["nodeType"] == "intentClassification"
    assert result["nextNodeId"] == "sales_text"
    assert result["sessionVariables"]["lastIntent"] == "sales_inquiry"


def test_classify_routes_to_technical_branch(graph):
    result = execute_turn(
        graph=graph,
        current_node_id="classify",
        session_variables={},
        incoming_message="I'm getting an error and the app keeps crashing",
    )

    assert result["nodeType"] == "intentClassification"
    assert result["nextNodeId"] == "tech_api"
    assert result["sessionVariables"]["lastIntent"] == "technical_support"


def test_api_call_node_handles_unreachable_url_gracefully(graph):
    result = execute_turn(
        graph=graph,
        current_node_id="tech_api",
        session_variables={},
        incoming_message=None,
    )

    assert result["nodeType"] == "apiCall"
    # The configured URL is intentionally unreachable (.invalid TLD); the
    # engine must not raise and must record an error marker instead.
    assert result["sessionVariables"]["lastApiCallStatus"] == "error"
    assert "lastError" in result["sessionVariables"]
    assert result["nextNodeId"] == "quick_replies"


def test_quick_replies_default_edge_when_no_match(graph):
    result = execute_turn(
        graph=graph,
        current_node_id="quick_replies",
        session_variables={},
        incoming_message="something unrelated",
    )

    assert result["nodeType"] == "quickReplies"
    assert result["nextNodeId"] == "welcome"
    assert result["isTerminal"] is False
    assert result["escalate"] is False


def test_quick_replies_escalation_path_reaches_terminal_direct_to_agent(graph):
    result = execute_turn(
        graph=graph,
        current_node_id="quick_replies",
        session_variables={},
        incoming_message="No, I need a human",
    )

    assert result["nodeType"] == "quickReplies"
    assert result["nextNodeId"] == "agent"

    final = execute_turn(
        graph=graph,
        current_node_id=result["nextNodeId"],
        session_variables=result["sessionVariables"],
        incoming_message=None,
    )

    assert final["nodeType"] == "directToAgent"
    assert final["isTerminal"] is True
    assert final["escalate"] is True
    assert final["nextNodeId"] == "agent"
