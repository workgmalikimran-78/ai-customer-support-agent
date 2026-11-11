---
name: full-test
description: Runs every test/build suite across all three services in this repo (pytest for app/, mvn test for backend/, tsc+eslint+vite build for frontend/) in one pass and prints a pass/fail summary. Also supports a --audit mode for dependency vulnerability scanning (pip-audit, npm audit, OWASP dependency-check). Use this whenever asked to "run the tests," "make sure everything still builds," "check the whole stack," "scan for vulnerable dependencies," or before reporting a cross-service change as done — a change that only runs one service's tests can still break another service's consumption of a shared contract.
---

# Full-stack test run

This repo has three independently-tested services with no single built-in command that covers all of them. This skill runs all three in one pass so a cross-service change (e.g. touching the bot-flow graph shape, a REST contract, or a shared data model) gets verified everywhere it could break, not just in the service you were actively editing.

## Run it

```bash
bash .claude/skills/full-test/scripts/run_all.sh
```

It runs, in order, and always runs all of them even if an earlier one fails:
1. `pytest tests/ -q` (uses `.venv` if present, falls back to system `python3`; skips with instructions if dependencies aren't installed)
2. `mvn test` in `backend/`, excluding `ConversationFlowIntegrationTest` (that one needs a live Docker daemon for Testcontainers Postgres — run it separately with `cd backend && ./mvnw test` when Docker is available; its absence here is expected, not a regression)
3. `tsc -b`, `eslint`, and `vite build` in `frontend/` (skips with instructions if `node_modules` isn't installed)

Exit code is `0` only if every suite that actually ran passed; a skipped suite doesn't fail the run, but read the printed instructions and install what's missing if you need full coverage.

## A real environment gotcha this script works around

`backend/` targets Java 21 specifically (see `pom.xml`). On a Mac with multiple JDKs installed via Homebrew (a very common setup), the `java`/`mvn` found on `PATH` can resolve to a different major version than 21 — and both a too-old and a too-new JVM fail here in different, confusing ways: a too-old JVM (e.g. 17) fails to load classes compiled with `--release 21` ("class file version too new"), and a too-new JVM (e.g. 26) can fail to boot the Spring context because Spring Boot 3.3.x doesn't support it yet. Don't trust `/usr/libexec/java_home -v 21` blindly either — on this machine it silently returned a Java 17 install with exit code 0 when no real Java 21 was registered with it, so this script double-checks the actual `java -version` output of whatever it finds before using it, and falls back to `brew --prefix openjdk@21`. If both come up empty, it prints a warning suggesting `brew install openjdk@21` rather than failing silently with a confusing Maven stack trace.

## Interpreting results

- A `pytest` or `tsc`/`eslint`/`vite` failure is almost always a real regression — investigate it.
- An `mvn test` failure should be read carefully: if the only failing test is `ConversationFlowIntegrationTest` and the error mentions Docker/Testcontainers, that's expected in any environment without a Docker daemon, not a code problem. Any other backend test failure is real.
- If you fixed something and want to confirm, just re-run the whole script — it's fast enough (tens of seconds, not minutes) to run after every meaningful cross-service change rather than reasoning about which single suite "should" be affected.

## Dependency vulnerability scanning (`--audit`)

```bash
bash .claude/skills/full-test/scripts/run_all.sh --audit
```

Runs, instead of the normal test suite:
1. `pip-audit -r requirements.txt` (uses `.venv/bin/pip-audit` if present)
2. `npm audit --audit-level=moderate` in `frontend/`
3. OWASP `dependency-check-maven` in `backend/` — **requires an NVD API key** (`NVD_API_KEY` env var; NIST heavily rate-limits anonymous requests). Request one free at https://nvd.nist.gov/developers/request-an-api-key. Without it, this step is skipped with instructions rather than failing.

This is kept separate from the normal pass because the Maven scanner downloads/updates a large vulnerability feed on first run (can take minutes) and needs that API key — not something to run on every edit.

Findings don't always have a clean fix: `chromadb`'s current latest release has open CVEs with no fix version yet, and several frontend dev/runtime dependencies only have breaking (major-version) fixes available. Don't silently upgrade across a major version based on an audit finding alone — that needs a deliberate, tested change. Record what you found and its current mitigation/tracking status in `docs/security-notes.md` rather than leaving it undocumented, and check that file first to see what's already tracked before treating a finding as new.
