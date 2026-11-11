# Bot Flow Designer Spec

## Graph JSON shape (shared verbatim across frontend, backend, and the Python engine)

```json
{
  "nodes": [
    { "id": "n1", "type": "welcomeMessage", "position": {"x": 0, "y": 0},
      "data": { "config": { "text": "Hi! How can I help you today?" } } },
    { "id": "n2", "type": "intentClassification", "position": {"x": 250, "y": 0},
      "data": { "config": { "intents": ["sales_inquiry", "technical_support"] } } }
  ],
  "edges": [
    { "id": "e1", "source": "n1", "target": "n2" },
    { "id": "e2", "source": "n2", "target": "n3", "condition": { "intent": "sales_inquiry" } }
  ],
  "startNodeId": "n1"
}
```

## Node types

| `type` | Role | Config fields |
|---|---|---|
| `welcomeMessage` | Entry point, static greeting | `text` |
| `intentClassification` | Classifies incoming message, branches by edge `condition.intent` | `intents: string[]` |
| `textBlock` | Static/templated text | `text` |
| `quickReplies` | Presents options; next edge matches `condition.quickReply` against the user's selection | `text`, `options: string[]` |
| `apiCall` | Calls an external HTTP endpoint, result stored in `sessionVariables` | `url`, `method` |
| `aiResponse` | Free-form grounded reply via the RAG-backed support agent | `promptTemplate` |
| `directToAgent` | Terminal node — escalates to a human | `reason` |

## Execution (per customer turn)

1. `backend`'s `FlowExecutionOrchestrator` holds `Conversation.currentNodeId`, `botFlowId`, `sessionVariables`.
2. It calls Python `POST /v1/flows/execute` with the full graph + current cursor + accumulated variables + the new message.
3. `app/workflows/flow_engine.py` loads the current node, dispatches to the matching handler in `app/workflows/node_handlers/`, and evaluates outgoing edges in order: first edge whose `condition` matches the latest classification/quick-reply/api-result wins; an edge with no `condition` is the default fallback.
4. The response carries the new `nextNodeId`, rendered `output` (text/quickReplies/apiResult), updated `sessionVariables`, and `escalate`/`isTerminal` flags.
5. `backend` persists the resulting `Message`(s), updates `Conversation.currentNodeId`/`status` (setting `ESCALATED` on `escalate: true`), and pushes the result over the relevant WebSocket topics.

## Editing

The frontend's Bot Flow Designer (`frontend/src/features/bot-builder/`) uses React Flow; its native `{nodes, edges}` state (via `useNodesState`/`useEdgesState`) is the same shape as above — `PUT /api/bot-flows/{id}` sends it verbatim as `graphJson`. `backend` persists this JSONB blob opaquely and never needs to understand node semantics itself.
