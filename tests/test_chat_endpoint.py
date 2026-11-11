"""Tests for POST /v1/chat without an ANTHROPIC_API_KEY configured."""


def test_chat_returns_canned_fallback_shape(client):
    payload = {
        "conversationId": "conv-1",
        "contactId": "contact-1",
        "message": "Hi, I need help with my order",
        "history": [],
        "flowContext": None,
    }

    response = client.post("/v1/chat", json=payload)

    assert response.status_code == 200
    data = response.json()

    assert isinstance(data["reply"], str) and data["reply"]
    assert "intent" in data
    assert "confidence" in data
    assert "nextNodeId" in data
    assert "toolCalls" in data
    assert isinstance(data["shouldEscalate"], bool)
    assert data["shouldEscalate"] is False


def test_chat_escalates_on_keyword_trigger(client):
    payload = {
        "conversationId": "conv-2",
        "contactId": "contact-2",
        "message": "I want to speak to a human agent right now, this is unacceptable",
        "history": [],
    }

    response = client.post("/v1/chat", json=payload)

    assert response.status_code == 200
    data = response.json()
    assert data["shouldEscalate"] is True


def test_chat_with_flow_context_echoes_next_node_id(client):
    payload = {
        "conversationId": "conv-3",
        "contactId": "contact-3",
        "message": "hello",
        "history": [{"sender": "customer", "content": "hi"}],
        "flowContext": {
            "flowId": "flow-1",
            "currentNodeId": "node-1",
            "variables": {},
        },
    }

    response = client.post("/v1/chat", json=payload)

    assert response.status_code == 200
    data = response.json()
    assert data["nextNodeId"] == "node-1"
