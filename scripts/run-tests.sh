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

TMP=$(mktemp -t grok-faf-mcp-tests.XXXXXX)
trap 'rm -f "$TMP"' EXIT

# The --isolate epoll flake is LINUX-only and manifests two ways: a fast error
# (epoll_ctl in output) OR a HARNESS HANG (no output, never exits). The old
# wrapper caught only the fast-fail; an unbounded hang ran until the CI run was
# CANCELLED — a red npm badge. So on Linux we now BOUND the run with `timeout`
# (exit 124 on a hang) and treat a hang as the same flake. macOS/Windows don't
# flake and have no portable `timeout`, so they run bare.
if [ "$(uname)" = "Linux" ] && command -v timeout >/dev/null 2>&1; then
  TIMEOUT="timeout 600"
else
  TIMEOUT=""
fi

# Capture exit via a file, not `| tee` + PIPESTATUS — PIPESTATUS is a bashism
# that masks the real exit under `sh`/dash (a hang killed by `timeout` would
# otherwise read as tee's exit 0 → a false green). Echo the file after.
$TIMEOUT bun test --isolate --timeout=120000 --path-ignore-patterns="**/performance.test.ts" "$@" > "$TMP" 2>&1
RC=$?
cat "$TMP"

if [ "$RC" -eq 0 ]; then
  exit 0
fi

# Discriminating retry — the epoll flake, whether it fails fast (epoll_ctl in
# output) or HANGS (timeout kills it, exit 124). Real failures still propagate.
if grep -q "epoll_ctl" "$TMP" || [ "$RC" -eq 124 ]; then
  echo ""
  echo "============================================================"
  echo "Detected Linux bun --isolate epoll flake (fail or hang) — retrying ONCE."
  echo "Task #22 tracks the proper upstream fix."
  echo "============================================================"
  echo ""
  $TIMEOUT bun test --isolate --timeout=120000 --path-ignore-patterns="**/performance.test.ts" "$@"
  exit $?
fi

# Real failure — propagate original exit code, do NOT mask
exit "$RC"
