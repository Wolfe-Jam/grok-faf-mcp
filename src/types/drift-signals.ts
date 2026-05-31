/**
 * 🏎️ Canonical Drift-Signal Types (1.5 substrate — one source of truth)
 *
 * Single home for the type contracts that flow between the 1.5 substrate
 * components. Eliminates the `Like` interface duplicates that previously
 * lived in `repeat-offender.ts` and `refresh-receipts.ts` to avoid cross-
 * module import cycles.
 *
 * Pure types-only module — zero runtime imports, zero cycle risk. Every
 * substrate component imports + re-exports from here so:
 *   - producers (detectFafmDrift, checkId, RepeatOffenderTracker) expose
 *     these as their own API surface (back-compat for existing callers)
 *   - consumers (RepeatOffenderTracker bridges, RefreshReceiptsLog) take
 *     these as their input shapes directly — no Like duplication, no
 *     silent-drift hazard
 *
 * `[[silent-drift-equals-fail-equals-forbidden]]` applied to the type layer:
 * one canonical shape, mechanical compile-fail if anyone tries to diverge.
 *
 * Spec source: Grok-1 Round 1 + Round 2 orchestrator consult feedback
 * (2026-05-31), wolfejam "foundational > MVP-shortcuts" doctrine push.
 */

// ── DriftSignal — output of detectFafmDrift() ──────────────────────────

/**
 * Structured drift signal. Returned from `detectFafmDrift()` when the
 * repetition-rate threshold is crossed; null when clean.
 *
 * `kind` is currently a single string literal (`'repetition-rate'`); if a
 * future detector adds another kind (e.g. anchor-divergence per task #9),
 * widen this to a discriminated union here — every consumer benefits at
 * once.
 */
export interface DriftSignal {
  kind: 'repetition-rate';
  /** Repetition rate, 0.0–1.0 ratio (NOT a 0–100 quality tier). */
  score: number;
  /** Recurring normalized n-gram phrases, ranked by recurrence count. */
  repeated_anchors: string[];
  /** ISO timestamp when the signal was emitted. */
  detected_at: string;
}

// ── Contradiction + ContradictionReport — output of checkId() ──────────

/**
 * A single mechanical contradiction. Every field required — Falsifiability.
 */
export interface Contradiction {
  /** Stable check ID — used by callers to filter / dedupe. */
  check: string;
  /** `'error'` = stamp-of-record disagrees with reality; `'warn'` = softer. */
  severity: 'error' | 'warn';
  /** Human-readable location, e.g. `"CHANGELOG.md:meta-stamp"`. */
  location: string;
  /** What this check expected to find. */
  expected: string;
  /** What was actually present. */
  found: string;
  /** Short one-line explanation suitable for surfacing in a report. */
  message: string;
}

export interface ContradictionReport {
  /** Contradictions detected. Empty = clean across all checks that ran. */
  contradictions: Contradiction[];
  /** Check IDs that actually ran (required inputs were present). */
  checked: string[];
  /** Check IDs that were skipped (a required input was missing). */
  skipped: string[];
}

/** Optional external content for cross-checks beyond `.faf` + `.fafm`. */
export interface ReferenceClaims {
  /** Raw `package.json` content. */
  packageJson?: string;
  /** Raw `CHANGELOG.md` content. */
  changelog?: string;
  /** Raw `README.md` content. */
  readme?: string;
}

// ── RepeatOffender — output of RepeatOffenderTracker.getRepeatOffenders() ──

/** A repeat offender — output shape spec'd in §#12 verbatim. */
export interface RepeatOffender {
  slot: string;
  count: number;
  /** ISO timestamp of the most recent drift event for this slot. */
  last_drift: string;
}
