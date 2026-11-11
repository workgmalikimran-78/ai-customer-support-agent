# AI Customer Support Agent

A multi-channel AI customer support platform: a unified inbox, a visual bot flow builder, and real-time analytics — backed by a Python RAG/agent service and a Java Spring Boot gateway.

## Stack

- **`app/`** — Python (FastAPI, LangChain/LangGraph, Chroma) — the AI brain: chat generation, RAG, bot-flow graph execution, sentiment scoring.
- **`backend/`** — Java 21 + Spring Boot — gateway and system of record: auth, conversations/messages, channel webhooks, bot-flow CRUD, analytics aggregation, REST + WebSocket API.
- **`frontend/`** — React + Vite + TypeScript — the dashboard UI (Unified Inbox, Chatbot Builder, Analytics, Team, Settings).

See [docs/architecture.md](docs/architecture.md) for the full request flow, [docs/api-contracts.md](docs/api-contracts.md) for every endpoint/topic, [docs/data-model.md](docs/data-model.md) for the schema, and [docs/bot-flow-spec.md](docs/bot-flow-spec.md) for how the visual flow builder's graph is executed.

## Quick start

```bash
cp .env.example .env    # add ANTHROPIC_API_KEY for real LLM responses
docker compose up --build
```

Then open:
- Dashboard: http://localhost:3000
- Backend API docs: http://localhost:8080/swagger-ui.html
- AI service docs: http://localhost:8000/docs

Full local-dev and troubleshooting instructions: [docs/runbook.md](docs/runbook.md).

## Repository layout

```
ai-customer-support-agent/
├── app/            # Python AI service (agents, tools, rag, workflows, api, config)
├── tests/          # Python tests
├── evaluation/     # agent/RAG evaluation harness
├── docs/           # architecture, API contracts, data model, bot-flow spec, runbook
├── backend/        # Java Spring Boot gateway
├── frontend/       # React dashboard
├── Dockerfile      # builds app/
├── docker-compose.yml
├── requirements.txt
└── README.md
```

## Tests

```bash
pytest tests/ -v                 # Python
cd backend && ./mvnw test        # Java
cd frontend && npm run build     # frontend type-check/build
python evaluation/run_eval.py    # agent/RAG quality report
```
