---
name: verify-flow-contract
description: Validates that the "bot-flow graph" JSON shape agrees across all three services in this repo (Python app/workflows/flow_schema.py, the Spring Boot seed migration, and the React frontend's bot-builder types/store/mocks). Use this whenever any of those files changes, whenever asked to "check the contract," "verify the services agree," or before/after touching anything related to the Bot Flow Designer, flow execution, node types (welcomeMessage, intentClassification, textBlock, quickReplies, apiCall, aiResponse, directToAgent), or the `/v1/flows/execute` endpoint. This exact class of bug (field-name drift, `from`/`to` instead of `source`/`target`, missing `startNodeId`) has already shipped once in this repo silently — always re-check after editing any of the surfaces below, even for changes that look unrelated.
---

# Verify flow contract

Three services in this repo independently construct or consume the same JSON shape — the bot-flow graph — and nothing enforces that they agree except this check. The authoritative schema is the Pydantic model in `app/workflows/flow_schema.py` (a discriminated union keyed on `data.config.type`). Every other surface must match it field-for-field:

- `tests/fixtures/sample_flow_graph.json`
- `backend/src/main/resources/db/migration/V2__seed_demo_data.sql` (the `bot_flow.graph_json` JSONB literal)
- `frontend/src/features/bot-builder/types/botFlow.ts`
- `frontend/src/features/bot-builder/store/flowBuilderStore.ts` (`defaultConfigFor`)
- `frontend/src/features/bot-builder/api/mockBotFlow.ts`

The canonical shape: `{ nodes: [{id, type, position, data: {config: {...}}}], edges: [{id, source, target, condition?}], startNodeId }`. Per-node-type required `config` fields: `welcomeMessage`/`textBlock` need `text`; `intentClassification` needs `intents`; `quickReplies` needs `text` + `options`; `apiCall` needs `url` + `method`; `aiResponse` needs `promptTemplate`; `directToAgent` needs `reason`. Every config needs a `type` discriminator matching the node's own `type`. `condition` on an edge is always an object/dict (e.g. `{"intent": "sales_inquiry"}`), never a string.

## How to run the check

Run the bundled script from the repo root:

```bash
python3 .claude/skills/verify-flow-contract/scripts/check_contract.py
```

It will:
1. Extract the graph JSON embedded in the Spring Boot seed migration and the Python test fixture (anchored specifically on the `INSERT INTO bot_flow` statement — there are other unrelated `'{}'::jsonb` literals earlier in that SQL file, so don't write a naive first-brace-pair regex if you're doing this by hand instead).
2. Actually validate both against the real `FlowGraph` Pydantic model — not just eyeball them. If pydantic isn't importable in the current interpreter, it transparently creates a small throwaway venv (cached at `.claude/skills/verify-flow-contract/.venv`, already gitignored) with the exact `pydantic`/`typing_extensions` versions pinned in the repo's `requirements.txt`, and validates there instead.
3. Statically grep the frontend TypeScript files for the known drift patterns (`endpoint` where `url` is expected, `prompt` where `promptTemplate` is expected, `condition` typed as a string, edges using `from`/`to` instead of `source`/`target`) — TS can't be fed through the Pydantic validator directly, so this part is pattern-based, not a real parse. Read the flagged line yourself before concluding it's a true positive.

Exit code `0` means everything checked out; `1` means concrete drift was found. The script prints file-level findings either way — read its output rather than just the exit code.

## If it finds drift

`app/workflows/flow_schema.py` is always the tie-breaker — it's what actually executes at runtime via `/v1/flows/execute`, so fix the other surface(s) to match it, not the other way around. Common fixes:
- Rename a field in the TS types/store/mock to match the Pydantic field name exactly.
- Add a missing required field (e.g. a freshly-added node type in `defaultConfigFor` needs every field its `*Config` Pydantic model requires, or flow execution will 422 the first time that node runs).
- Fix an edge's `condition` from a string to an object, and fix `from`/`to` to `source`/`target`.
- Add the `startNodeId` key at the graph root if it's missing — it's not optional in `FlowGraph`.

After fixing, re-run the script to confirm it now reports clean before considering the change done.

## If the script itself can't run

If no Python interpreter is available at all (not even to create the fallback venv), fall back to manual review: open `app/workflows/flow_schema.py` side-by-side with each of the other surfaces listed above and check every field name, type, and required/optional status by hand. Say explicitly that you did a manual review instead of an automated one — don't silently skip the check.
