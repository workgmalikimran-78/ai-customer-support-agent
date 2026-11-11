# API Contracts

## Spring Boot ⟷ React (`/api`, JWT bearer auth except `/api/auth/**` and `/api/webhooks/**`)

| Method | Path | Notes |
|---|---|---|
| POST | `/api/auth/login` | `{email, password}` → `{accessToken, refreshToken, user}` |
| GET | `/api/conversations?status=&channel=&search=&page=` | → `{items: ConversationSummaryDto[], total, page}` |
| GET | `/api/conversations/{id}/messages?before=&limit=` | → `{items: MessageDto[], hasMore}` |
| POST | `/api/conversations/{id}/messages` | `{content, attachmentUrl?}` → `MessageDto` |
| POST | `/api/conversations/{id}/assign` | `{userId}` → `ConversationSummaryDto` |
| POST | `/api/webhooks/{channel}` | generic normalized inbound payload → `202`. Requires header `X-Webhook-Signature: sha256=<hex HMAC-SHA256 of the raw request body, keyed by WEBHOOK_SHARED_SECRET>` — requests without a valid signature get `401` before reaching the controller. To compute one for manual testing: `echo -n '<body>' \| openssl dgst -sha256 -hmac "$WEBHOOK_SHARED_SECRET"` |
| GET/POST | `/api/bot-flows` | list / create |
| GET/PUT | `/api/bot-flows/{id}` | load / save draft (`graphJson`) |
| POST | `/api/bot-flows/{id}/publish` | bumps version, status → `PUBLISHED` |
| GET | `/api/analytics/metrics?range=24h` | → `{activeSessions, resolutionRate, avgResponseTime, sentiment}` (each a `MetricCardDto`) |
| GET | `/api/alerts?unreadOnly=` | → `AlertDto[]` |
| GET | `/api/team`, POST `/api/team/invite`, PATCH `/api/users/{id}/role` | team management |

`MetricCardDto`: `{ current, target?, series: [{t, v}], peak? }`

## Spring Boot ⟷ React (WebSocket, STOMP over SockJS at `/ws`)

| Topic | Payload | Drives |
|---|---|---|
| `/topic/inbox/{teamId}` | `InboxUpdateEvent { conversationId, type, conversationSummary }` | live inbox reorder/unread badge |
| `/topic/conversations/{conversationId}` | `MessageDto` | live thread updates |
| `/topic/metrics/{teamId}` | `MetricsUpdateEvent { activeSessions, resolutionRate, avgResponseTime, sentiment }` | live dashboard/analytics cards |
| `/topic/alerts/{teamId}` | `AlertDto` | live Recent Alerts feed |

## Spring Boot ⟷ Python (`http://ai-service:8000/v1`, header `X-API-Key`)

### `POST /v1/chat`
```json
// request
{ "conversationId": "...", "contactId": "...", "message": "...",
  "history": [{"sender": "CUSTOMER", "content": "..."}],
  "flowContext": { "flowId": "...", "currentNodeId": "...", "variables": {} } }
// response
{ "reply": "...", "intent": "sales_inquiry", "confidence": 0.92,
  "nextNodeId": null, "toolCalls": [], "shouldEscalate": false }
```

### `POST /v1/flows/execute`
```json
// request
{ "flowId": "...", "graphJson": { "nodes": [...], "edges": [...], "startNodeId": "n1" },
  "currentNodeId": "n1", "sessionVariables": {}, "incomingMessage": "..." }
// response
{ "nextNodeId": "n2", "nodeType": "intentClassification",
  "output": { "text": "...", "quickReplies": null, "apiResult": null },
  "sessionVariables": {}, "isTerminal": false, "escalate": false }
```

### `POST /v1/flows/validate`
`{graphJson}` → `{valid: bool, errors: [{nodeId, message}]}`

### `POST /v1/rag/ingest`
`{botId, documents: [{title, content, sourceUrl?}]}` → `{ingestedCount, collectionName}`

### `POST /v1/rag/query`
`{botId, query, topK}` → `{results: [{content, score, sourceUrl}]}`

### `POST /v1/sentiment`
`{conversationId, text}` → `{score, label, emoji}`

### `GET /healthz`
`{status: "ok"}`
