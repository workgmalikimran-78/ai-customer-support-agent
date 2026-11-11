# Security Notes

Tracked findings that need a human decision or follow-up — not fixed by a code change alone, or blocked on an upstream fix.

## Open: chromadb 1.5.9 has unpatched CVEs (as of 2026-11-11)

`pip-audit -r requirements.txt` reports 4 advisories against `chromadb==1.5.9`, which is the latest version published (no fix version exists yet for any of them):

| ID | Summary | Our exposure |
|---|---|---|
| PYSEC-2026-311 (CVE-2026-45829) | Pre-auth RCE via a malicious model repo when `trust_remote_code=true` is passed to a collection-create call | **Not exploitable here** — grep confirms `trust_remote_code` is never set anywhere in `app/`; Chroma's default is `false`. |
| PYSEC-2026-3814 (CVE-2026-45833) | Same RCE vector, but requires authentication + `UPDATE_COLLECTION` permission | Same as above — not exploitable without `trust_remote_code=true`. |
| PYSEC-2026-3815 (CVE-2026-45831) | `SimpleRBACAuthorizationProvider` doesn't scope permissions to tenant/database/collection, allowing cross-tenant actions | We run Chroma single-tenant, internal-only (see below) — lower relevance, but revisit if this ever becomes multi-tenant. |
| PYSEC-2026-3813 (CVE-2026-45830) | Missing authorization lets any authenticated user read/write any tenant's collection | Same caveat as above. |

**Mitigation in place:** `docker-compose.yml`'s `chroma` service has no published port — only `ai-service` (on the internal `support-net` network) can reach it. It was previously published as `8001:8000` for local debugging convenience; that's been removed as a precaution given these open CVEs. Re-add `ports: ["8001:8000"]` temporarily if you need to query Chroma directly during local debugging, and remove it again afterward.

**Action item:** re-run `pip-audit -r requirements.txt` (or the `full-test --audit` mode) periodically and upgrade `chromadb` the moment a fix version ships. If RAG/vector search becomes a more central, externally-reachable feature, reassess whether Chroma's RBAC model is trustworthy enough to rely on, or whether network isolation alone is sufficient.

## Open: 10 frontend dependency vulnerabilities, all needing a major-version bump (as of 2026-11-11)

`npm audit --audit-level=high` in `frontend/` reports 9 moderate + 1 high severity advisory. None have a non-breaking fix — every fix path is a semver-major upgrade, so none were applied automatically:

- **`react-router`/`react-router-dom` (moderate, ships in the production bundle)**: open redirect via backslash in `<Link>`/`useNavigate`, and an arbitrary constructor injection in SSR hydration deserialization. We don't use SSR, which limits the second one; the open-redirect one matters if the app ever builds links from untrusted user input (it currently doesn't, but revisit if that changes). Fix requires `react-router-dom@7.18.5` (current: 6.x range).
- **`vite`/`esbuild` (high, dev-only)**: a known esbuild dev-server issue — only exploitable if the Vite dev server is reachable from an untrusted network, which it isn't in this setup (localhost only). Fix requires `vite@^8` (current: 5.4.x) — a major bump with likely config changes.
- **`@typescript-eslint/*` (moderate, dev-only)**: lint tooling, not shipped to users. Fix requires `@typescript-eslint/*@6.15.0`+ or newer major lines.

**Action item:** these are all tracked, not urgent given current usage, but plan a deliberate major-version upgrade pass (`react-router-dom` first, since it's the only one in the shipped bundle) rather than letting them sit indefinitely. Re-check with `npm audit` after any dependency changes.

## Known scope simplifications (not bugs — tracked intentionally)

- **No rate-limiting on `/api/auth/login`** — no brute-force protection on password login as shipped.
- **Single-tenant data model** — `Conversation`/`BotFlow`/etc. have no tenant/team ownership FK and no authorization check scoping a user to "their" data. Fine for the current one-seeded-team scaffold; must be addressed before this becomes a real multi-tenant product.
- **Webhook channel adapters are stubbed** — `/api/webhooks/{channel}` normalizes WhatsApp/Facebook/WebChat identically and doesn't call any real provider API. The HMAC signature check (see `docs/api-contracts.md`) guards the endpoint itself, but if you wire up a real provider, you'll need their actual signing scheme (e.g. Meta's `X-Hub-Signature-256` keyed by the app secret) instead of the generic one here.
