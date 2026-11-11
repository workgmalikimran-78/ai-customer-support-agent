"""Deterministic, dependency-light scoring functions for the evaluation
harness. No API keys or network access required.

Structured so a real LLM-judge could be swapped in later (see
`resolution_score` docstring) without changing the calling code's
interface.
"""
import re
from typing import Dict, List


def intent_accuracy(predictions: List[Dict], golden: List[Dict]) -> Dict:
    """Score intent-classification accuracy.

    `predictions` and `golden` must be aligned lists of equal length, where
    each `predictions[i]` has a `predicted_intent` key and each
    `golden[i]` has an `expected_intent` key.

    Returns {"accuracy": float, "correct": int, "total": int, "mismatches": [...]}.
    """
    total = len(golden)
    if total == 0:
        return {"accuracy": 0.0, "correct": 0, "total": 0, "mismatches": []}

    correct = 0
    mismatches = []
    for pred, gold in zip(predictions, golden):
        predicted = pred.get("predicted_intent")
        expected = gold.get("expected_intent")
        if predicted == expected:
            correct += 1
        else:
            mismatches.append(
                {
                    "query": gold.get("query"),
                    "expected_intent": expected,
                    "predicted_intent": predicted,
                }
            )

    return {
        "accuracy": round(correct / total, 4),
        "correct": correct,
        "total": total,
        "mismatches": mismatches,
    }


def _tokenize(text: str) -> List[str]:
    return re.findall(r"[a-z0-9']+", (text or "").lower())


def keyword_overlap_score(response_text: str, expected_keywords: List[str]) -> float:
    """Simple keyword-overlap "resolution" heuristic in [0, 1].

    Fraction of `expected_keywords` that appear (as a substring match,
    case-insensitive) somewhere in `response_text`. This is intentionally
    crude but deterministic and dependency-free; a real LLM-judge could
    later replace this function's body while keeping the same signature
    (text in, float in [0,1] out) so callers don't need to change.
    """
    if not expected_keywords:
        return 1.0

    lowered = (response_text or "").lower()
    hits = sum(1 for kw in expected_keywords if kw.lower() in lowered)
    return round(hits / len(expected_keywords), 4)


def resolution_score(responses: List[str], golden: List[Dict]) -> Dict:
    """Score a batch of chat responses against expected keyword lists.

    Returns {"meanScore": float, "perItem": [{"query", "score"}]}.
    """
    per_item = []
    for response_text, gold in zip(responses, golden):
        score = keyword_overlap_score(response_text, gold.get("expected_keywords", []))
        per_item.append({"query": gold.get("query"), "score": score})

    mean_score = (
        round(sum(item["score"] for item in per_item) / len(per_item), 4) if per_item else 0.0
    )

    return {"meanScore": mean_score, "perItem": per_item}
