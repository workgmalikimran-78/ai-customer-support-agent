# Postman collection

Import `Smartify.postman_collection.json` into Postman. It targets the Spring Boot backend
(`baseUrl`, default `http://localhost:8080`) and has one AI-service health check
(`aiServiceBaseUrl`, default `http://localhost:8000`).

## Usage

1. Run **Auth → Login** first. Its test script stores the returned JWT (plus `teamId`/`userId`)
   into collection variables, and every other request inherits `Authorization: Bearer {{token}}`
   automatically from the collection-level auth — no per-request setup needed.
2. Run **Conversations → List Conversations** to auto-populate `{{conversationId}}` and
   `{{contactId}}` for the requests that depend on them.
3. **Webhooks → Simulate Inbound Message** computes its own `X-Webhook-Signature` header via a
   pre-request script (HMAC-SHA256 over the raw body, keyed by the `webhookSecret` variable) —
   edit the body's `text`/`externalId` freely, the signature recalculates automatically.
4. `botFlowId` defaults to the demo "Sales & Support Triage" flow seeded by
   `backend/src/main/resources/db/migration/V2__seed_demo_data.sql`.

If you changed `WEBHOOK_SHARED_SECRET`, `JWT_SECRET` defaults, or demo login credentials from
what's in `.env.example`, update the matching collection variables (Collection → Variables tab)
before running requests.

See [docs/api-contracts.md](../docs/api-contracts.md) for the authoritative shape reference this
collection was built against.
