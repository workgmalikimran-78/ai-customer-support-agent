# Architecture

## Services

| Service | Stack | Responsibility |
|---|---|---|
| `frontend/` | React + Vite + TypeScript | Dashboard UI: Unified Inbox, Chatbot Builder (flow designer), Analytics, Team, Settings. Talks only to `backend`. |
| `backend/` | Java 21 + Spring Boot | Gateway + business logic. Owns Postgres (system of record). Auth, conversations/messages, channel webhooks, bot-flow CRUD, analytics aggregation, REST + WebSocket API. Calls `ai-service` internally. |
| `app/` (service name `ai-service` in compose) | Python + FastAPI | AI brain: chat generation, RAG, bot-flow graph execution, sentiment scoring. Stateless per request; no DB of record. |
| `postgres` | Postgres 16 | Relational data: conversations, messages, bot flows, analytics snapshots, users/teams. |
| `chroma` | Chroma | Vector store for RAG document retrieval, one collection per bot. |
| `redis` | Redis 7 | Optional cache / flow session state. |

## Request flow (customer sends a message)

```
Browser/WhatsApp/FB  --webhook/API-->  backend (Spring Boot)
                                          |
                                          |  persists Message, looks up Conversation
                                          v
                                FlowExecutionOrchestrator
                                          |
                     has active botFlowId?  --- yes --> POST ai-service /v1/flows/execute
                                          |                      |
                                          no                     v
                                          |             flow_engine dispatches to node_handlers
                                          v                      |
                              POST ai-service /v1/chat  <--------
                                          |
                                          v
                              persists AI reply Message,
                              updates Conversation state,
                              pushes WebSocket events
                                          |
                                          v
                                  frontend (live update)
```

## Why this split

Spring Boot stays the single source of truth and the only system other services (and the browser) need to trust for auth/state, which keeps the Python service easy to scale/replace independently — it has no database of its own, only receives the graph/history/session it needs per request and returns a result. See [api-contracts.md](api-contracts.md) for exact request/response shapes and [bot-flow-spec.md](bot-flow-spec.md) for how the visual flow graph is interpreted turn-by-turn.
