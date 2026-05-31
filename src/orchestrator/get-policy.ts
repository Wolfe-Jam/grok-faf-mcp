/**
 * `faf_get_orchestration_policy` — pure-core
 *
 * Surfaces the EffectivePolicy in force WITHOUT running the orchestrator
 * (no drift detection · no CheckID · no repeat-offender lookup · no receipt
 * write). Pure introspection: "what aggressiveness tier am I configured for,
 * and is that the default or an override from .faf:orchestration:?"
 *
 * Per Grok-1's Round 2 follow-up — the introspection capability that completes
 * the v1 policy surface alongside the inline `hints.effective_policy` field
 * that `faf_orchestrate_recommendation` returns. The orchestrator's surface
 * answers "what did this analysis use?"; THIS tool answers "what would the
 * next analysis use, without running one?".
 *
 * Composition: thin wrapper around `resolvePolicyFromFaf()` (the existing
 * canonical resolver in `recommendation.ts`). Single source of truth — the
 * tool can never disagree with the orchestrator about what the policy is.
 *
 * Read-only WRT all state. No file writes. No side effects. The quietest
 * tool in the 1.5 substrate.
 */
import * as fs from 'fs';
import * as path from 'path';
import {
  type EffectivePolicy,
  resolvePolicyFromFaf,
} from './recommendation.js';

export interface GetPolicyOptions {
  /** Working dir to search for `.faf` / `project.faf`. Defaults to process.cwd(). */
  cwd?: string;
  /** Explicit `.faf` file path — overrides cwd-based discovery when present. */
  fafPath?: string;
}

export interface GetPolicyResult {
  /** The effective policy that would be applied to the next orchestrator call. */
  policy: EffectivePolicy;
  /** Whether a `.faf` file was found (false → policy is default-only, since there's no source to override from). */
  faf_found: boolean;
  /** Absolute path of the `.faf` that was read (when faf_found=true). */
  faf_path?: string;
  /** Set when .faf was found but read/parse failed — surfaces honestly instead of silently defaulting. */
  read_error?: string;
}

/**
 * Find the `.faf` file in a directory tree — checks `project.faf` and `.faf`
 * at the cwd. Mirrors the same discovery rule the other handlers use.
 * Kept inline (not imported from utils/) to avoid coupling the pure-core
 * layer to FS utilities; the policy tool's discovery is intentionally simple.
 */
function findFafFileSimple(cwd: string): string | undefined {
  const candidates = ['project.faf', '.faf'];
  for (const name of candidates) {
    const full = path.join(cwd, name);
    if (fs.existsSync(full) && fs.statSync(full).isFile()) {
      return full;
    }
  }
  return undefined;
}

/**
 * Resolve the effective orchestration policy. Pure function — file I/O happens
 * inside but all side effects are read-only.
 *
 * Algorithm:
 *   1. Resolve fafPath: explicit `options.fafPath` → else search `options.cwd`
 *   2. If no .faf found → return default policy, faf_found=false
 *   3. Read the .faf; on read error → default policy + read_error set
 *   4. Call `resolvePolicyFromFaf()` (canonical resolver) → return its output
 *
 * The function NEVER throws — read errors and missing files are surfaced as
 * structured fields, not exceptions. Same fail-safe contract as the other
 * orchestrator tools (subordinate-not-daemon).
 */
export function getOrchestrationPolicy(options: GetPolicyOptions = {}): GetPolicyResult {
  const cwd = options.cwd ?? process.cwd();
  const fafPath = options.fafPath ?? findFafFileSimple(cwd);

  // Case 1: no .faf found → default policy
  if (fafPath === undefined) {
    return {
      policy: resolvePolicyFromFaf(undefined),
      faf_found: false,
    };
  }

  // Case 2: .faf found → try to read
  let fafContent: string;
  try {
    fafContent = fs.readFileSync(fafPath, 'utf-8');
  } catch (err) {
    // Read error → default policy + honest error surface
    return {
      policy: resolvePolicyFromFaf(undefined),
      faf_found: true,
      faf_path: fafPath,
      read_error: err instanceof Error ? err.message : String(err),
    };
  }

  // Case 3: .faf read OK → resolve via canonical
  return {
    policy: resolvePolicyFromFaf(fafContent),
    faf_found: true,
    faf_path: fafPath,
  };
}
