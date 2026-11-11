"""Evaluation harness runner.

Drives the golden QA set through /v1/chat (and, where relevant,
/v1/flows/execute via the intent-classification node) and scores results
with evaluation/metrics.py. Writes a JSON report to evaluation/reports/
and prints a summary to stdout.

Usage:
    python -m evaluation.run_eval
    python -m evaluation.run_eval --base-url http://localhost:8000

If --base-url is omitted, the FastAPI app is driven in-process via
TestClient (no running server required).
"""
import argparse
import json
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, List

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from evaluation.metrics import intent_accuracy, resolution_score  # noqa: E402

GOLDEN_SET_PATH = Path(__file__).parent / "golden_qa_set.jsonl"
REPORTS_DIR = Path(__file__).parent / "reports"


def load_golden_set() -> List[Dict]:
    items = []
    with GOLDEN_SET_PATH.open() as f:
        for line in f:
            line = line.strip()
            if line:
                items.append(json.loads(line))
    return items


class ApiDriver:
    """Thin wrapper so run_eval can either hit a live base_url via httpx or
    drive the app in-process via TestClient with the same call signature."""

    def __init__(self, base_url: str = None):
        self.base_url = base_url
        if base_url:
            import httpx

            self._client = httpx.Client(base_url=base_url, timeout=30.0)
        else:
            from fastapi.testclient import TestClient

            from app.api.main import create_app

            self._client = TestClient(create_app())

    def post(self, path: str, json_body: dict) -> dict:
        response = self._client.post(path, json=json_body)
        response.raise_for_status()
        return response.json()

    def close(self):
        self._client.close()


def run_chat_eval(driver: ApiDriver, golden: List[Dict]) -> Dict:
    predictions = []
    responses = []

    for item in golden:
        payload = {
            "conversationId": "eval-conv",
            "contactId": "eval-contact",
            "message": item["query"],
            "history": [],
            "flowContext": None,
        }
        result = driver.post("/v1/chat", payload)
        predictions.append({"predicted_intent": result.get("intent")})
        responses.append(result.get("reply", ""))

    return {
        "intent_accuracy": intent_accuracy(predictions, golden),
        "resolution": resolution_score(responses, golden),
        "raw_responses": responses,
    }


def run_flow_intent_classification_eval(driver: ApiDriver, golden: List[Dict]) -> Dict:
    """Drive each golden query through a minimal single-node
    intentClassification flow via /v1/flows/execute to evaluate the
    node-handler path independently of /v1/chat."""
    intents = sorted({item["expected_intent"] for item in golden})

    graph_json = {
        "startNodeId": "classify",
        "nodes": [
            {
                "id": "classify",
                "type": "intentClassification",
                "position": {"x": 0, "y": 0},
                "data": {"config": {"type": "intentClassification", "intents": intents}},
            }
        ],
        "edges": [],
    }

    predictions = []
    for item in golden:
        payload = {
            "flowId": "eval-flow",
            "graphJson": graph_json,
            "currentNodeId": "classify",
            "sessionVariables": {},
            "incomingMessage": item["query"],
        }
        result = driver.post("/v1/flows/execute", payload)
        predicted_intent = result.get("sessionVariables", {}).get("lastIntent")
        predictions.append({"predicted_intent": predicted_intent})

    return {"intent_accuracy": intent_accuracy(predictions, golden)}


def main():
    parser = argparse.ArgumentParser(description="Run the AI service evaluation harness.")
    parser.add_argument(
        "--base-url",
        default=None,
        help="Base URL of a running instance of the service. If omitted, the "
        "app is driven in-process via TestClient.",
    )
    args = parser.parse_args()

    golden = load_golden_set()
    driver = ApiDriver(base_url=args.base_url)

    try:
        chat_results = run_chat_eval(driver, golden)
        flow_results = run_flow_intent_classification_eval(driver, golden)
    finally:
        driver.close()

    report = {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "goldenSetSize": len(golden),
        "mode": "live" if args.base_url else "in-process",
        "chat": chat_results,
        "flowIntentClassification": flow_results,
    }

    REPORTS_DIR.mkdir(parents=True, exist_ok=True)
    report_path = REPORTS_DIR / f"eval_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
    report_path.write_text(json.dumps(report, indent=2))

    print("=" * 60)
    print("AI Service Evaluation Summary")
    print("=" * 60)
    print(f"Golden set size: {len(golden)}")
    print(f"Mode: {report['mode']}")
    print()
    print("-- /v1/chat intent accuracy (intent field, likely None w/o LLM) --")
    print(json.dumps(chat_results["intent_accuracy"], indent=2))
    print()
    print("-- /v1/chat resolution (keyword overlap) --")
    print(f"meanScore: {chat_results['resolution']['meanScore']}")
    print()
    print("-- /v1/flows/execute intentClassification node accuracy --")
    print(json.dumps(flow_results["intent_accuracy"], indent=2))
    print()
    print(f"Full report written to: {report_path}")


if __name__ == "__main__":
    main()
