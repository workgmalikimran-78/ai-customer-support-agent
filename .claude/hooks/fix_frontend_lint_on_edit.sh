#!/usr/bin/env bash
# PostToolUse hook (Write|Edit): run eslint --fix on the just-edited frontend
# TS/TSX file, if the project's local eslint is installed. Never blocks.
set -uo pipefail

input="$(cat)"
file_path="$(printf '%s' "$input" | jq -r '.tool_input.file_path // empty')"

case "$file_path" in
  */frontend/src/*.ts|*/frontend/src/*.tsx) ;;
  frontend/src/*.ts|frontend/src/*.tsx) ;;
  *) exit 0 ;;
esac

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
eslint_bin="$repo_root/frontend/node_modules/.bin/eslint"

if [ -x "$eslint_bin" ]; then
  "$eslint_bin" --fix "$file_path" >/dev/null 2>&1 || true
fi

exit 0
