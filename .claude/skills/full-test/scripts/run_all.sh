#!/usr/bin/env bash
# Runs the test/build suite for all three services in this repo and prints
# a one-line-per-suite summary at the end. Non-fatal: always runs every
# suite even if an earlier one fails, so you get the full picture in one pass.
#
# Pass --audit to instead run dependency vulnerability scanning (pip-audit,
# npm audit, OWASP dependency-check) rather than the normal test/build suite --
# kept separate because the Maven scanner needs an NVD API key and can be slow.
set -uo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../../.." && pwd)"
cd "$REPO_ROOT"

declare -a RESULTS=()

run_step() {
  local label="$1"
  shift
  echo ""
  echo "=== $label ==="
  if "$@"; then
    RESULTS+=("PASS  $label")
  else
    RESULTS+=("FAIL  $label")
  fi
}

if [ "${1:-}" = "--audit" ]; then
  echo "=== pip-audit (app/) ==="
  if [ -x ".venv/bin/pip-audit" ]; then
    .venv/bin/pip-audit -r requirements.txt || true
  elif command -v pip-audit >/dev/null 2>&1; then
    pip-audit -r requirements.txt || true
  else
    echo "SKIPPED: pip-audit not installed. Run: .venv/bin/pip install -r requirements-dev.txt"
  fi

  echo ""
  echo "=== npm audit (frontend/) ==="
  if [ -d "frontend/node_modules" ]; then
    (cd frontend && npm audit --audit-level=moderate) || true
  else
    echo "SKIPPED: run 'cd frontend && npm install' first."
  fi

  echo ""
  echo "=== OWASP dependency-check (backend/) ==="
  if [ -z "${NVD_API_KEY:-}" ]; then
    echo "SKIPPED: requires an NVD API key (NIST rate-limits anonymous requests heavily)."
    echo "Request one at https://nvd.nist.gov/developers/request-an-api-key, then re-run as:"
    echo "  NVD_API_KEY=<your-key> bash .claude/skills/full-test/scripts/run_all.sh --audit"
  else
    echo "This downloads/updates the NVD vulnerability feed on first run and can take a few minutes."
    (cd backend && mvn -q org.owasp:dependency-check-maven:check \
      -DnvdApiKey="$NVD_API_KEY" -DautoUpdate=true -DfailBuildOnCVSS=11) || true
    echo "Report: backend/target/dependency-check-report.html"
  fi

  exit 0
fi

# --- Python (app/) ---
PYTHON_BIN="python3"
if [ -x ".venv/bin/python" ]; then
  PYTHON_BIN=".venv/bin/python"
fi
if "$PYTHON_BIN" -c "import fastapi" >/dev/null 2>&1; then
  run_step "pytest (app/)" "$PYTHON_BIN" -m pytest tests/ -q
else
  echo ""
  echo "=== pytest (app/) ==="
  echo "SKIPPED: dependencies not installed. Run: python3 -m venv .venv && .venv/bin/pip install -r requirements.txt"
  RESULTS+=("SKIP  pytest (app/)")
fi

# --- Java (backend/) ---
if [ -d "backend" ]; then
  # pom.xml targets Java 21. On a machine with multiple JDKs on PATH (common
  # with Homebrew), `java`/`mvn` can silently resolve to a different major
  # version and fail in confusing ways (either "class file version too new"
  # or a Spring context that won't boot on a JDK newer than Boot supports).
  # Pin JAVA_HOME to a real Java 21 if we can find one.
  is_java_21() {
    [ -x "$1/bin/java" ] && "$1/bin/java" -version 2>&1 | head -1 | grep -q '"21\.'
  }
  if [ -z "${JAVA_HOME:-}" ] || ! is_java_21 "$JAVA_HOME"; then
    # NOTE: `/usr/libexec/java_home -v 21` does fuzzy matching and can return
    # a non-21 JDK with exit code 0 if no exact match is registered -- always
    # verify the actual `java -version` output, don't trust that command alone.
    for candidate in "$(/usr/libexec/java_home -v 21 2>/dev/null)" "$(brew --prefix openjdk@21 2>/dev/null)"; do
      if [ -n "$candidate" ] && is_java_21 "$candidate"; then
        export JAVA_HOME="$candidate"
        break
      fi
    done
  fi
  if [ -n "${JAVA_HOME:-}" ]; then
    echo "Using JAVA_HOME=$JAVA_HOME for backend build/test"
  else
    echo "WARNING: no Java 21 found (checked /usr/libexec/java_home -v 21 and brew --prefix openjdk@21)." \
         "backend/ targets Java 21 specifically -- install one with 'brew install openjdk@21' if the build fails below."
  fi

  MVN_CMD="./mvnw"
  [ -x "backend/mvnw" ] || MVN_CMD="mvn"
  run_step "mvn test (backend/)" bash -c "cd backend && $MVN_CMD -q -Dtest='!ConversationFlowIntegrationTest' test"
  echo "note: ConversationFlowIntegrationTest is excluded above -- it needs a running Docker daemon for Testcontainers Postgres. Run it separately with 'cd backend && ./mvnw test' when Docker is available."
else
  RESULTS+=("SKIP  mvn test (backend/)")
fi

# --- Frontend (frontend/) ---
if [ -d "frontend/node_modules" ]; then
  run_step "tsc -b (frontend/)" bash -c "cd frontend && npx tsc -b"
  run_step "eslint (frontend/)" bash -c "cd frontend && npm run lint --silent"
  run_step "vite build (frontend/)" bash -c "cd frontend && npm run build --silent && rm -rf dist"
else
  echo ""
  echo "=== frontend/ ==="
  echo "SKIPPED: run 'cd frontend && npm install' first."
  RESULTS+=("SKIP  frontend build")
fi

echo ""
echo "================ SUMMARY ================"
printf '%s\n' "${RESULTS[@]}"
echo "==========================================="

for r in "${RESULTS[@]}"; do
  if [[ "$r" == FAIL* ]]; then
    exit 1
  fi
done
exit 0
