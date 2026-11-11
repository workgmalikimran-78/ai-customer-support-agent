"""Tests for POST /v1/sentiment using the lexicon fallback (no API key)."""


def test_positive_sentiment(client):
    payload = {
        "conversationId": "conv-pos",
        "text": "This is amazing, thank you so much! Your support team is fantastic and helpful.",
    }

    response = client.post("/v1/sentiment", json=payload)

    assert response.status_code == 200
    data = response.json()
    assert data["label"] == "positive"
    assert data["score"] > 0
    assert isinstance(data["emoji"], str) and data["emoji"]


def test_negative_sentiment(client):
    payload = {
        "conversationId": "conv-neg",
        "text": "This is terrible and broken, I am so frustrated and angry, this is unacceptable.",
    }

    response = client.post("/v1/sentiment", json=payload)

    assert response.status_code == 200
    data = response.json()
    assert data["label"] == "negative"
    assert data["score"] < 0
    assert isinstance(data["emoji"], str) and data["emoji"]


def test_neutral_sentiment(client):
    payload = {
        "conversationId": "conv-neutral",
        "text": "I would like to check the status of my order number 12345.",
    }

    response = client.post("/v1/sentiment", json=payload)

    assert response.status_code == 200
    data = response.json()
    assert data["label"] == "neutral"
