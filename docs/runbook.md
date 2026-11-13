# Runbook

## Local dev (full stack via Docker)

```bash
cp .env.example .env   # fill in ANTHROPIC_API_KEY if you want real LLM responses
docker compose up --build
```

- Frontend: http://localhost:3000
- Backend API: http://localhost:8080 (Actuator health: `/actuator/health`)
- AI service: http://localhost:8000 (health: `/healthz`, docs: `/docs`)
- Postgres: localhost:5432 (`support_platform` / `postgres` / `postgres` by default)
- Chroma: not published to the host (internal `support-net` only, see `docs/security-notes.md`) — add `ports: ["8001:8000"]` to `chroma` in `docker-compose.yml` temporarily if you need to query it directly
- Redis: localhost:6379

Demo login seeded by `backend/src/main/resources/db/migration/V2__seed_demo_data.sql` — see that file (or the backend build report) for credentials.

A ready-to-import Postman collection covering every REST endpoint (including a working webhook
signature pre-request script) lives in [`postman/`](../postman/README.md).

## Running services independently (no Docker)

**Python AI service**
```bash
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.api.main:app --reload --port 8000
```

**Spring Boot backend** (requires a running Postgres — point `SPRING_DATASOURCE_URL` at it)
```bash
cd backend
./mvnw spring-boot:run
```

**React frontend**
```bash
cd frontend
npm install
npm run dev
```

## Tests

```bash
pytest tests/ -v                 # Python
cd backend && ./mvnw test        # Java (Testcontainers test needs Docker)
cd frontend && npm run build     # TypeScript/build check
python evaluation/run_eval.py    # agent/RAG quality report
```

Or run everything in one pass: `bash .claude/skills/full-test/scripts/run_all.sh` (see [`.claude/skills/full-test/SKILL.md`](../.claude/skills/full-test/SKILL.md)).

## Security checklist before deploying anywhere beyond localhost

This scaffold's defaults are deliberately convenient for local dev and are **not** safe to deploy as-is:

1. **Set real secrets.** `JWT_SECRET`, `AI_SERVICE_API_KEY`, and `WEBHOOK_SHARED_SECRET` all default to known placeholder strings. Generate real ones (e.g. `openssl rand -hex 32`) and set `REQUIRE_STRONG_SECRETS=true` — the backend will then refuse to start if any of the three are missing, too short (<32 chars), or still match a known placeholder (see `SecurityHardeningValidator`).
2. **Set `CORS_ALLOWED_ORIGINS`** to your real frontend origin(s) — comma-separated, no wildcard. Applies to both `backend` and `ai-service`.
3. **Webhook signature**: `/api/webhooks/{channel}` requires `X-Webhook-Signature: sha256=<HMAC-SHA256 of the raw body, keyed by WEBHOOK_SHARED_SECRET>` (see `WebhookSignatureFilter` and `docs/api-contracts.md`). If you wire up a real WhatsApp/Facebook Messenger webhook, you'll need to adapt this to each provider's actual signing scheme instead (Meta uses `X-Hub-Signature-256` with the app secret, for example).
4. **Rate-limit `/api/auth/login`** — implemented. `LoginRateLimiter` tracks failed attempts per client-IP+email key (in-memory, single-instance only) and returns `429` with a `Retry-After` header once `LOGIN_RATE_LIMIT_MAX_ATTEMPTS` (default 5) failures land inside `LOGIN_RATE_LIMIT_WINDOW_MINUTES` (default 15), locking that key out for `LOGIN_RATE_LIMIT_LOCKOUT_MINUTES` (default 15). A successful login clears the counter. If you run multiple backend replicas, this needs to move to a shared store (e.g. Redis, already used by `ai-service`) since each instance currently tracks its own in-memory state.
5. **Dependency scanning** — run `bash .claude/skills/full-test/scripts/run_all.sh --audit` (or `npm audit`, `pip-audit`, `mvn org.owasp:dependency-check-maven:check` individually) before any release; see the `full-test` skill for details.
6. This is still a single-tenant demo data model (one seeded team) — there's no cross-tenant authorization boundary to review yet. Don't assume isolation between "teams" if you add multi-tenancy later without revisiting `Conversation`/`BotFlow` ownership checks.

## Troubleshooting

- **`ai-service` unhealthy**: check `ANTHROPIC_API_KEY` is set if you expect real LLM replies — the service falls back to canned/deterministic responses without it, which is fine for local smoke testing but not for real conversations.
- **`backend` can't reach `ai-service`**: confirm `AI_SERVICE_API_KEY` matches between the two services' env vars (compose sets both from the same `.env` value).
- **Chroma connection refused**: `chroma` takes a few seconds to become healthy; `ai-service` depends on it being healthy before starting, but if running services outside Docker individually, start Chroma first or let the RAG fallback (in-memory ephemeral client) kick in for local testing.
- **`chroma` container stuck `unhealthy`, blocking `backend`/`ai-service`/`frontend` from starting**: the official `chromadb/chroma` image is a minimal Debian image with no `curl`, `wget`, `python3`, or `nc` — confirmed via `docker exec <container> sh -c "which wget curl python3 nc"` returning nothing. A healthcheck written against any of those will fail with "not found" even though Chroma itself is running fine (check `docker compose logs chroma` — if you see "Saving data to: /data" and "Connect to Chroma at: ...", the server booted correctly and it's just the probe that's broken). The current healthcheck uses bash's built-in `/dev/tcp` pseudo-device instead (`bash -c '</dev/tcp/localhost/8000'`), since `bash` is present and this needs no external binary.
- **`mvn test`/`mvn spring-boot:run` fails outside Docker with a Java version error** (either "class file version ... too new" or the Spring context failing to boot): `backend/` targets Java 21 specifically via `pom.xml`. On a Mac with multiple JDKs (common with Homebrew), `java`/`mvn` on `PATH` can resolve to a different major version. Don't trust `/usr/libexec/java_home -v 21` blindly — it can return a non-21 JDK with exit code 0 if no exact match is registered. Check with `java -version`; if it's not 21, install one (`brew install openjdk@21`) and run Maven with `JAVA_HOME=$(brew --prefix openjdk@21) ./mvnw test`.
- **Bot-flow graph JSON looks wrong across services**: this has broken silently before (frontend/backend/Python disagreeing on field names). Run the `verify-flow-contract` skill (`.claude/skills/verify-flow-contract/`) rather than eyeballing it.
