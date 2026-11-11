#!/usr/bin/env python3
"""Validate the bot-flow graph JSON contract across app/, backend/, and frontend/.

Run with: python3 check_contract.py [--repo-root PATH]

Exit code 0 means everything checked out (or could only be statically
reviewed); exit code 1 means a concrete mismatch was found.
"""
from __future__ import annotations

import argparse
import json
import re
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path


def find_repo_root(start: Path) -> Path:
    """Walk upward looking for the repo marker (app/workflows/flow_schema.py)."""
    cur = start.resolve()
    for _ in range(6):
        if (cur / "app" / "workflows" / "flow_schema.py").exists():
            return cur
        cur = cur.parent
    raise SystemExit(
        "Could not locate the repo root (looked for app/workflows/flow_schema.py "
        "walking up from the script location). Pass --repo-root explicitly."
    )


def extract_seed_graph_json(repo_root: Path) -> dict | None:
    """Pull the bot_flow.graph_json literal out of V2__seed_demo_data.sql.

    Anchored specifically on the `INSERT INTO bot_flow` statement, not just
    the first `{...}` in the file -- earlier statements in the same file
    contain unrelated `'{}'::jsonb` literals for other columns.
    """
    sql_path = (
        repo_root
        / "backend/src/main/resources/db/migration/V2__seed_demo_data.sql"
    )
    if not sql_path.exists():
        print(f"  (no seed migration found at {sql_path}, skipping)")
        return None
    content = sql_path.read_text()
    marker = "INSERT INTO bot_flow"
    if marker not in content:
        print(f"  (no 'INSERT INTO bot_flow' statement in {sql_path.name}, skipping)")
        return None
    sub = content[content.index(marker):]
    try:
        json_start = sub.index("'{") + 1
        json_end = sub.index("}'::jsonb") + 1
    except ValueError:
        print("  could not locate a '{...}'::jsonb literal after INSERT INTO bot_flow")
        return None
    raw = sub[json_start:json_end]
    return json.loads(raw)


def load_fixture_graph(repo_root: Path) -> dict | None:
    fixture_path = repo_root / "tests/fixtures/sample_flow_graph.json"
    if not fixture_path.exists():
        print(f"  (no fixture at {fixture_path}, skipping)")
        return None
    return json.loads(fixture_path.read_text())


def pinned_version(repo_root: Path, package: str) -> str | None:
    req = repo_root / "requirements.txt"
    if not req.exists():
        return None
    for line in req.read_text().splitlines():
        line = line.strip()
        if line.lower().startswith(package.lower() + "=="):
            return line.split("==", 1)[1]
    return None


def try_in_process_validation(repo_root: Path, graphs: dict[str, dict]) -> bool | None:
    """Try importing FlowGraph directly. Returns True/False on success, None if unavailable."""
    sys.path.insert(0, str(repo_root))
    try:
        from app.workflows.flow_schema import FlowGraph  # type: ignore
    except ImportError:
        return None

    ok = True
    for label, graph in graphs.items():
        try:
            fg = FlowGraph(**graph)
            print(f"  [OK] {label}: parses; start={fg.startNodeId}, "
                  f"nodes={[n.type for n in fg.nodes]}")
        except Exception as e:  # pydantic.ValidationError etc.
            ok = False
            print(f"  [FAIL] {label}: {e}")
    return ok


def try_venv_validation(repo_root: Path, graphs: dict[str, dict]) -> bool | None:
    """Fall back to a cached throwaway venv with pydantic installed."""
    python312 = shutil.which("python3.12") or shutil.which("python3")
    if not python312:
        return None

    venv_dir = repo_root / ".claude/skills/verify-flow-contract/.venv"
    marker = venv_dir / ".installed"
    venv_python = venv_dir / "bin" / "python"

    if not marker.exists():
        print("  (creating a one-time throwaway venv with pydantic installed; "
              "this is gitignored and cached for next time)")
        subprocess.run([python312, "-m", "venv", str(venv_dir)], check=True)
        pydantic_v = pinned_version(repo_root, "pydantic") or "2.14.3"
        typing_ext_v = pinned_version(repo_root, "typing_extensions") or "4.16.0"
        subprocess.run(
            [str(venv_python), "-m", "pip", "install", "-q",
             f"pydantic=={pydantic_v}", f"typing_extensions=={typing_ext_v}"],
            check=True,
        )
        marker.touch()

    with tempfile.NamedTemporaryFile("w", suffix=".json", delete=False) as f:
        json.dump(graphs, f)
        graphs_path = f.name

    runner = f"""
import json, sys
sys.path.insert(0, {str(repo_root)!r})
from app.workflows.flow_schema import FlowGraph
with open({graphs_path!r}) as fh:
    graphs = json.load(fh)
ok = True
for label, graph in graphs.items():
    try:
        fg = FlowGraph(**graph)
        print(f"  [OK] {{label}}: parses; start={{fg.startNodeId}}, "
              f"nodes={{[n.type for n in fg.nodes]}}")
    except Exception as e:
        ok = False
        print(f"  [FAIL] {{label}}: {{e}}")
sys.exit(0 if ok else 1)
"""
    result = subprocess.run(
        [str(venv_python), "-c", runner], capture_output=True, text=True
    )
    print(result.stdout, end="")
    if result.stderr:
        print(result.stderr, file=sys.stderr, end="")
    return result.returncode == 0


FIELD_DRIFT_PATTERNS = [
    # (pattern, what it means if found)
    (re.compile(r"\bendpoint\s*[?:]"), "uses `endpoint` -- flow_schema.py's ApiCallConfig expects `url`"),
    (re.compile(r"\bprompt\s*[?:]\s*(?:string|')"), "uses `prompt` -- flow_schema.py's AiResponseConfig expects `promptTemplate`"),
    (re.compile(r"condition\??\s*:\s*string"), "types `condition` as a string -- flow_schema.py's FlowEdge expects a dict/object"),
    (re.compile(r"\bfrom\s*:\s*['\"]?\w"), "edge uses `from` -- flow_schema.py's FlowEdge expects `source`"),
    (re.compile(r"\bto\s*:\s*['\"]?\w"), "edge uses `to` -- flow_schema.py's FlowEdge expects `target`"),
]


def static_check_frontend(repo_root: Path) -> list[str]:
    """Regex-based drift check for files that can't be fed through Pydantic directly."""
    findings = []
    targets = [
        "frontend/src/features/bot-builder/types/botFlow.ts",
        "frontend/src/features/bot-builder/store/flowBuilderStore.ts",
        "frontend/src/features/bot-builder/api/mockBotFlow.ts",
    ]
    for rel in targets:
        path = repo_root / rel
        if not path.exists():
            continue
        text = path.read_text()
        for pattern, meaning in FIELD_DRIFT_PATTERNS:
            if pattern.search(text):
                findings.append(f"{rel}: {meaning}")
    return findings


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--repo-root", type=Path, default=None)
    args = parser.parse_args()

    repo_root = args.repo_root or find_repo_root(Path(__file__).parent)
    print(f"Repo root: {repo_root}\n")

    print("1. Extracting graph JSON from known contract surfaces...")
    graphs: dict[str, dict] = {}
    seed_graph = extract_seed_graph_json(repo_root)
    if seed_graph:
        graphs["backend seed (V2__seed_demo_data.sql)"] = seed_graph
    fixture_graph = load_fixture_graph(repo_root)
    if fixture_graph:
        graphs["python fixture (sample_flow_graph.json)"] = fixture_graph

    print("\n2. Validating against app/workflows/flow_schema.py's FlowGraph model...")
    validation_ok: bool | None
    if not graphs:
        print("  (no graphs found to validate)")
        validation_ok = None
    else:
        validation_ok = try_in_process_validation(repo_root, graphs)
        if validation_ok is None:
            print("  (pydantic not importable in the current interpreter, trying a throwaway venv)")
            validation_ok = try_venv_validation(repo_root, graphs)
        if validation_ok is None:
            print("  COULD NOT VALIDATE -- no Python/pydantic available. "
                  "Fall back to manual field-by-field comparison against flow_schema.py.")

    print("\n3. Static field-name/type check on frontend TypeScript...")
    findings = static_check_frontend(repo_root)
    if findings:
        for f in findings:
            print(f"  [DRIFT] {f}")
    else:
        print("  no known drift patterns found in frontend bot-flow files")

    print()
    hard_fail = validation_ok is False or bool(findings)
    if hard_fail:
        print("RESULT: contract drift detected -- see findings above.")
        return 1
    print("RESULT: all checked surfaces agree with app/workflows/flow_schema.py.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
