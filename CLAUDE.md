# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A multi-channel AI customer support platform (unified inbox, visual bot-flow builder, real-time analytics) built as three independently-run services:

- **`backend/`** (Java 21 + Spring Boot) — the gateway and system of record. Owns Postgres, auth (JWT), conversations/messages, channel webhooks, bot-flow CRUD, analytics aggregation, and the REST + WebSocket API the frontend talks to. Calls `app/` internally for anything LLM/RAG/flow-execution/sentiment related.
- **`app/`** (Python + FastAPI + LangChain/LangGraph + Chroma) — the AI brain: chat generation, RAG retrieval, bot-flow graph execution (turn-by-turn interpreter), sentiment scoring. Stateless per request, no database of its own.
- **`frontend/`** (React + Vite + TypeScript) — the dashboard UI (Unified Inbox, Chatbot Builder, Analytics, Team, Settings).

Full request flow and the reasoning behind this split: [docs/architecture.md](docs/architecture.md). Every endpoint/WebSocket topic: [docs/api-contracts.md](docs/api-contracts.md). Schema: [docs/data-model.md](docs/data-model.md). How the visual bot-flow graph is serialized and executed: [docs/bot-flow-spec.md](docs/bot-flow-spec.md).

## Commands

```bash
docker compose up --build                              # full stack (see docs/runbook.md for ports/credentials)
bash .claude/skills/full-test/scripts/run_all.sh        # test + build all three services in one pass
bash .claude/skills/full-test/scripts/run_all.sh --audit  # dependency vulnerability scan (pip-audit, npm audit, OWASP dependency-check)
python3 .claude/skills/verify-flow-contract/scripts/check_contract.py  # validate the bot-flow JSON contract across all three services

pytest tests/ -v                                        # Python only
cd backend && ./mvnw test                                # Java only (excl. ConversationFlowIntegrationTest without Docker)
cd frontend && npx tsc -b && npm run lint && npm run build  # frontend only
python evaluation/run_eval.py                           # agent/RAG quality report
```

Single Python test: `pytest tests/test_flow_engine.py::test_name -v`. Single Java test: `cd backend && ./mvnw test -Dtest=ClassName#methodName`.

## Known gotchas

- **`backend/` requires Java 21 specifically** (see `pom.xml`). On a machine with multiple JDKs (common with Homebrew), the `java`/`mvn` on `PATH` can silently resolve to a different major version and fail in confusing ways — a too-old JVM fails to load classes compiled with `--release 21`, a too-new one (e.g. 26) can fail to boot the Spring context. Don't trust `/usr/libexec/java_home -v 21` blindly — it can return a non-21 JDK with exit code 0. `full-test`'s script already detects and pins `JAVA_HOME` correctly; reuse that logic rather than re-debugging this from scratch.
- **The bot-flow graph JSON shape is shared verbatim across all three services** and has silently drifted out of sync before (field renames like `url`/`endpoint`, `condition` as a string vs. an object, missing `startNodeId`, `source`/`target` vs. `from`/`to`). The authority is `app/workflows/flow_schema.py` (a Pydantic discriminated union); every other construction/consumption of that shape — `frontend/src/features/bot-builder/types/botFlow.ts`, its store and mocks, and the Spring Boot seed migration's `graph_json` — must match it field-for-field. After touching any of those, run the `verify-flow-contract` skill (`.claude/skills/verify-flow-contract/`) rather than eyeballing it; the `contract-guardian` agent (`.claude/agents/`) exists specifically to catch this class of bug.
- **Security defaults are dev-only placeholders**, not production-ready: wildcard-free but permissive CORS, and `JWT_SECRET`/`AI_SERVICE_API_KEY`/`WEBHOOK_SHARED_SECRET` all default to known placeholder strings (a `SecurityHardeningValidator` in `backend/` will refuse to start if `REQUIRE_STRONG_SECRETS=true` and any of them are still weak/placeholder). See [docs/security-notes.md](docs/security-notes.md) for currently-tracked open findings (e.g. unpatched `chromadb` CVEs) and the "Security checklist" in [docs/runbook.md](docs/runbook.md) before deploying beyond localhost.

## Claude Code tooling already set up in this repo

- `.claude/agents/contract-guardian.md` and `.claude/agents/migration-safety-reviewer.md` — invoke proactively after touching shared contracts or Flyway migrations rather than re-deriving the same checks.
- `.claude/skills/verify-flow-contract/` and `.claude/skills/full-test/` — prefer these over ad hoc one-off verification scripts.
- `.claude/hooks/` — auto-formats edited Python (`ruff`) and frontend (`eslint --fix`) files, and blocks edits to generated/build directories (`backend/target`, `frontend/node_modules`, `frontend/dist`, `__pycache__`, `.venv`, etc.) via `.claude/settings.json`.
