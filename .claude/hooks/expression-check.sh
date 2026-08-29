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
# After a Write / Edit / MultiEdit, this runs ekdotico-lint in whichever
# application owns the file — the nearest ancestor holding a .ekdotico-lint.json
# — and reports the findings for that file alone.
#
# It runs the linter with NO path argument, which is the whole point. A path on
# the command line REPLACES the "files" globs in the config, so linting the
# edited file directly would check files the repository deliberately left out of
# scope: this hook did exactly that on its first run and reported fifteen
# blocking findings in a CLAUDE.md, a document whose subject matter is the
# prohibited terms it names. The configured scan is the scoped one; findings for
# the edited file are then filtered out of its report.
#
# Findings in OTHER files are not reported. They are not what this edit did, and
# a hook that repeats the repository's whole backlog after every keystroke is a
# hook people turn off. `pnpm lint:copy` and CI own the repository-wide verdict.
#
# Blocking is the repository's decision, not this hook's: the severity is
# compared against "failOn" in its own .ekdotico-lint.json. At or above it, the
# report goes to stderr and the hook exits 2, which is the only channel a
# PostToolUse hook has back into the model's context. Below it, the report goes
# to stdout and the transcript, and work continues.
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

report=$(cd "$root" && "$@" 2>/dev/null)

# A finding is a head line, "  path:line:column  severity  [rule]", followed by
# indented detail lines. Keep the ones whose head names the edited file.
mine=$(printf '%s\n' "$report" | awk -v prefix="  $rel:" '
  substr($0, 1, length(prefix)) == prefix { keep = 1; print; next }
  keep == 1 && substr($0, 1, 4) == "    " { print; next }
  { keep = 0 }
')

if [ -z "$mine" ]; then
  exit 0
fi

# The threshold this repository set for itself. The linter defaults to
# substantive when the key is absent, and so does this.
fail_on=$(sed -n 's/.*"failOn"[[:space:]]*:[[:space:]]*"\([a-z]*\)".*/\1/p' \
  "$root/.ekdotico-lint.json" | head -1)
fail_on=${fail_on:-substantive}

rank() {
  case "$1" in
    blocking) echo 3 ;;
    substantive) echo 2 ;;
    minor) echo 1 ;;
    *) echo 0 ;;
  esac
}

threshold=$(rank "$fail_on")
worst=0
while read -r severity; do
  value=$(rank "$severity")
  if [ "$value" -gt "$worst" ]; then
    worst=$value
  fi
done <<EOF
$(printf '%s\n' "$mine" | awk -v prefix="  $rel:" \
  'substr($0, 1, length(prefix)) == prefix { print $2 }')
EOF

if [ "$worst" -ge "$threshold" ] && [ "$threshold" -gt 0 ]; then
  printf 'Expression Guidelines — %s\n\n%s\n\nAt or above this repository'\''s failOn (%s). Fix before moving on, or record an override in .ekdotico-lint.json with a reason.\n' \
    "$rel" "$mine" "$fail_on" >&2
  exit 2
fi

printf 'Expression Guidelines — %s (below failOn: %s)\n\n%s\n' "$rel" "$fail_on" "$mine"
exit 0
