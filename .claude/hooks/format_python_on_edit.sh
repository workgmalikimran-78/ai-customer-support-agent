#!/usr/bin/env bash
# PostToolUse hook (Write|Edit): auto-format the just-edited Python file with
# ruff, if ruff is available. Never blocks -- a formatting failure here
# should not fail the edit that already succeeded.
set -uo pipefail

input="$(cat)"
file_path="$(printf '%s' "$input" | jq -r '.tool_input.file_path // empty')"

case "$file_path" in
  *.py) ;;
  *) exit 0 ;;
esac

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

if [ -x "$repo_root/.venv/bin/ruff" ]; then
  "$repo_root/.venv/bin/ruff" format "$file_path" >/dev/null 2>&1 || true
elif command -v ruff >/dev/null 2>&1; then
  ruff format "$file_path" >/dev/null 2>&1 || true
fi

exit 0
