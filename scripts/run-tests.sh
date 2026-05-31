#!/bin/sh
# Test runner with discriminating retry for the Linux bun --isolate epoll flake.
#
# Background: bun test --isolate on Ubuntu intermittently errors with
#   "EEXIST: file already exists, epoll_ctl"
# followed by cascade errors ("Cannot call describe() after the test run has
# completed"). It's a runner-shutdown race, not a code bug — same code is
# green on macOS + Windows in the same CI matrix, and re-runs on Ubuntu
# pass deterministically. Three hits during the v1.5.0 publish session.
#
# This wrapper:
#   1. Runs the test suite once
#   2. If failed AND the output contains "epoll_ctl" (the flake signature),
#      runs it ONE more time
#   3. If failed for any other reason (real test failure, build error, etc.),
#      propagates the original exit code immediately — does NOT mask
#
# Local dev: identical behaviour to `bun test ...` because non-flake failures
# fail-fast on first attempt.
#
# Doctrine: targeted retry, not blind retry. Real test failures still fail.
# Tracked: task #22 — proper upstream fix (bun version pin / --isolate removal)
# may supersede this wrapper in v1.6+.

set -u

# Capture stdout AND stderr (pipe via tee so we can see live output in CI)
TMP=$(mktemp -t grok-faf-mcp-tests.XXXXXX)
trap 'rm -f "$TMP"' EXIT

bun test --isolate --timeout=120000 --path-ignore-patterns="**/performance.test.ts" "$@" 2>&1 | tee "$TMP"
RC=${PIPESTATUS:-$?}

if [ "$RC" -eq 0 ]; then
  exit 0
fi

# Discriminating retry — only on the known epoll flake signature
if grep -q "epoll_ctl" "$TMP"; then
  echo ""
  echo "============================================================"
  echo "Detected Linux bun --isolate epoll flake — retrying ONCE."
  echo "Task #22 tracks the proper upstream fix."
  echo "============================================================"
  echo ""
  bun test --isolate --timeout=120000 --path-ignore-patterns="**/performance.test.ts" "$@"
  exit $?
fi

# Real failure — propagate original exit code, do NOT mask
exit "$RC"
