#!/usr/bin/env bash
# PostToolUse hook — Expression Guidelines check on introduced content.
#
# MIRRORED FILE. Identical copies live in the workspace root and in each of
# deree, docs, domico and internal/praktico, because those are four separate
# git remotes and none of them can read a file from a sibling checkout. Change
# one copy and change all five in the same session, along with the entry in
# each .claude/settings.json that registers it. A hook that is right in one
# repository and stale in four teaches four agents the wrong thing.
#
# Runs ekdotico-lint over the single file a Write / Edit / MultiEdit just
# touched, in whichever application owns it. The application is found by
# walking up from the file until a .ekdotico-lint.json appears, so one script
# serves deree, docs, domico and internal/praktico, and each of them keeps its
# own registers, overrides and failOn threshold. A file in a directory with no
# such config (mvp, Assets, docs of the wrong kind) is not this linter's
# business and the hook exits silently.
#
# Blocking behaviour is the repository's, not this hook's: the linter's exit
# status already encodes the configured failOn threshold, and exit 2 from a
# PostToolUse hook feeds stderr back to the model. Findings below the
# threshold are reported the same way but the hook exits 0, so they inform the
# next edit without stopping the turn.
#
# Deliberately not JSON: the report is prose meant for the model, and stderr
# carries it verbatim without an escaping step that has to be right every time.
#
# The linter checks the mechanical subset only — register classification,
# evaluative inference, deficit framing, anthropomorphism and factual currency
# stay with review. See node_modules/@ekdotico/domico/expression/guidelines.md.

set -uo pipefail

input=$(cat)

# Portable extraction, matching the design-system hooks in docs/ and
# internal/praktico/: no jq dependency for something this small.
tool_name=$(printf '%s' "$input" \
  | sed -n 's/.*"tool_name"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p' \
  | head -1)
file_path=$(printf '%s' "$input" \
  | sed -n 's/.*"file_path"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p' \
  | head -1)

case "$tool_name" in
  Edit|Write|MultiEdit) ;;
  *) exit 0 ;;
esac

if [ -z "$file_path" ] || [ ! -f "$file_path" ]; then
  exit 0
fi

# The application root is the nearest ancestor holding a linter config.
root=""
dir=$(cd "$(dirname "$file_path")" && pwd)
while [ "$dir" != "/" ]; do
  if [ -f "$dir/.ekdotico-lint.json" ]; then
    root="$dir"
    break
  fi
  dir=$(dirname "$dir")
done

if [ -z "$root" ]; then
  exit 0
fi

# domico builds the linter it publishes, so it has no .bin entry for it.
if [ -x "$root/node_modules/.bin/ekdotico-lint" ]; then
  set -- "$root/node_modules/.bin/ekdotico-lint"
elif [ -f "$root/dist/src/lint/cli.js" ]; then
  set -- node "$root/dist/src/lint/cli.js"
else
  # Dependencies not installed. A missing linter is not a copy defect.
  exit 0
fi

rel=${file_path#"$root"/}

output=$(cd "$root" && "$@" "$rel" 2>/dev/null)
status=$?

# Exit 2 is the linter's "nothing to check here": the path is outside the
# config's files globs, or listed in ignore as carrying no user-facing copy.
if [ "$status" -eq 2 ]; then
  exit 0
fi

if [ "$status" -eq 0 ] && printf '%s' "$output" | grep -q '0 blocking, 0 substantive, 0 minor'; then
  exit 0
fi

# Non-zero means the findings cross the failOn threshold this repository set.
# Exit 2 hands the report to the model on stderr, which is the only channel a
# PostToolUse hook has into its context. Findings under the threshold go to
# stdout and the transcript: the repository has already said they do not stop
# work, and this hook does not overrule that.
if [ "$status" -ne 0 ]; then
  printf 'Expression Guidelines check — %s\n%s\n' "$rel" "$output" >&2
  exit 2
fi

printf 'Expression Guidelines check — %s (below the failOn threshold)\n%s\n' "$rel" "$output"
exit 0
