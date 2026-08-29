#!/usr/bin/env bash
# PostToolUse hook — Expression Guidelines check on introduced content.
#
# The source of this hook is scripts/agent-hooks/expression-check.sh in
# @ekdotico/domico. From there scripts/install-agent-hooks.mjs installs it into
# each consuming repository at .claude/hooks/, from their postinstall. The
# installed copy is a build output: it is not committed, it is rewritten on every
# install, and a hand edit to it survives only until the next one. Change the
# hook in the package, release, and let the pin bump carry it — the same path a
# token or a guard takes.
#
# It ships with the guidelines it enforces, which is the point of putting it in
# this package rather than copying it into four repositories. A hook distributed
# on its own can enforce 0.19 rules against a 0.17 install, and a rule that is
# not the rule the package states is Rule 15 wearing a shell script.
#
# After a Write / Edit / MultiEdit, this runs ekdotico-lint in whichever
# application owns the file — the nearest ancestor holding a .ekdotico-lint.json
# — and reports the findings for that file alone.
#
# It runs the linter with NO path argument, which is the whole point. A path on
# the command line REPLACES the "files" globs in the config, so linting the
# edited file directly would check files the repository deliberately left out of
# scope: an earlier revision did exactly that and reported fifteen blocking
# findings in a CLAUDE.md, a document whose subject matter is the prohibited
# terms it names. The configured scan is the scoped one; findings for the edited
# file are then filtered out of its report.
#
# Findings in OTHER files are not reported. They are not what this edit did, and
# a hook that repeats the repository's whole backlog after every keystroke is a
# hook people turn off. `pnpm lint:copy` and CI own the repository-wide verdict.
#
# Blocking is the consuming repository's decision, not this hook's: the severity
# is compared against "failOn" in its own .ekdotico-lint.json. At or above it,
# the report goes to stderr and the hook exits 2, which is the only channel a
# PostToolUse hook has back into the model's context. Below it, the report goes
# to stdout and the transcript, and work continues.
#
# The linter checks the mechanical subset only — register classification,
# evaluative inference, deficit framing, anthropomorphism and factual currency
# stay with review. See expression/guidelines.md in this package.

set -uo pipefail

input=$(cat)

# Portable extraction, matching the design-system hooks the applications carry:
# no jq dependency for something this small.
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

# This package builds the linter it publishes, so its own checkout has no .bin
# entry for it; consumers do.
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
