/**
 * 🏎️ Take-a-Hint Escalation (1.5 MVP — unheeded recurrence)
 *
 * When a recommendation is repeatedly IGNORED AND the underlying drift keeps
 * recurring, escalate. *Temporal* axis (recurrence across time), NOT
 * cross-signal +1 cumulation at a single moment.
 *
 * Both axes must cross their threshold for escalation: ignored_count is the
 * multiplier, drift_recurrence is the temporal gate. Recurring drift that was
 * never recommended-and-ignored stays at 'none'; ignored-once recommendations
 * for non-recurring drift also stay at 'none'.
 *
 * Honors subordinate-not-daemon: even at `'block'` level, the escalation is
 * ADVISORY — the orchestrator surfaces the level, the agent/user decides
 * whether to actually block. This function never forces.
 *
 * Spec source:
 *   ~/PLANET-FAF/docs/GROK-FAF-MCP-1.5-CODING-SESSION-BREAKDOWN-2026-05-30.md §#13
 *   memory/grok-agent-alignment.md     (subordinate-not-daemon, advisory > automatic)
 *   memory/grok-drift-requirements.md  (instrument not autopilot)
 *
 * Pure function. No FS. No MCP. Deterministic.
 */

import type { EscalationLevel } from '../types/escalation';

// Re-export the canonical type so existing importers (`from '../orchestrator/take-a-hint'`)
// keep working unchanged. Single source of truth lives in `src/types/escalation.ts`.
export type { EscalationLevel } from '../types/escalation';

/**
 * A prior recommendation, as recorded by the orchestrator. Order is recent-
 * last (chronological): `recent_recommendations[length-1]` is the latest.
 *
 * Renamed from `Recommendation` in PR 101 to free that name for the `#10`
 * orchestrator's OUTPUT type (`src/orchestrator/recommendation.ts`). Same
 * name was a foreseeable collision — different shape, different semantics.
 * This one is the HISTORICAL RECORD of a past recommendation; PR 3's
 * `Recommendation` is the full output of analyzeAndRecommend().
 */
export interface RecommendationRecord {
  /** ISO 8601 timestamp of when the recommendation was made. */
  timestamp: string;
  /** Whether the user/agent acknowledged this specific recommendation. */
  acknowledged: boolean;
}

/** Per-level thresholds. Both axes must be met (>=) for the level to fire. */
export interface ThresholdPair {
  /** Minimum `ignored_count` for this level. */
  ignored: number;
  /** Minimum `drift_recurrence` for this level. */
  recurrence: number;
}

export interface EscalationThresholds {
  light: ThresholdPair;
  hard: ThresholdPair;
  block: ThresholdPair;
}

/**
 * Default thresholds — chosen so escalation is honest about being a sustained
 * pattern, not a single bad moment. Tunable via the `thresholds` arg.
 *
 *   light → 1 ignored AND 2 recurrences  (it came back, you let it slide once)
 *   hard  → 2 ignored AND 3 recurrences  (pattern is established)
 *   block → 3 ignored AND 4 recurrences  (chronic — needs explicit ack)
 */
export const DEFAULT_THRESHOLDS: EscalationThresholds = Object.freeze({
  light: Object.freeze({ ignored: 1, recurrence: 2 }) as ThresholdPair,
  hard: Object.freeze({ ignored: 2, recurrence: 3 }) as ThresholdPair,
  block: Object.freeze({ ignored: 3, recurrence: 4 }) as ThresholdPair,
}) as EscalationThresholds;

export interface EvaluateTakeAHintInput {
  /**
   * Recommendation history for THIS slot (caller filters before passing).
   * Chronological order — latest at the end. May be empty.
   */
  recent_recommendations: RecommendationRecord[];
  /**
   * Count of recommendations the caller has determined were "ignored".
   * Caller-defined semantics — typically "made but not acted on within a
   * reasonable window". Must be `>= 0`.
   */
  ignored_count: number;
  /**
   * How many times the underlying drift has recurred. Typically sourced from
   * `RepeatOffenderTracker.getRepeatOffenders()[i].count`. Must be `>= 0`.
   */
  drift_recurrence: number;
  /**
   * Optional threshold overrides — partial; missing levels fall back to
   * defaults. Per `[[grok-agent-alignment]]` "tunable/observable policy".
   */
  thresholds?: Partial<EscalationThresholds>;
}

/**
 * Evaluate the escalation level for a recurring, possibly-ignored drift.
 *
 * Ladder (each rung requires BOTH axes met):
 *   - `'block'`  if ignored ≥ block.ignored  AND recurrence ≥ block.recurrence
 *   - `'hard'`   if ignored ≥ hard.ignored   AND recurrence ≥ hard.recurrence
 *   - `'light'`  if ignored ≥ light.ignored  AND recurrence ≥ light.recurrence
 *   - `'none'`   otherwise
 *
 * Acknowledgement reset: if the LATEST recommendation in `recent_recommendations`
 * is `acknowledged: true`, return `'none'` regardless of the counts. The user
 * took action; the orchestrator should let the ladder fully reset before
 * escalating again.
 *
 * Inputs are sanitized — negative counts coerce to 0; non-finite values
 * coerce to 0. The function never throws on input shape; bad inputs degrade
 * to 'none' (silent on uncertainty, never noisy).
 */
export function evaluateTakeAHint(input: EvaluateTakeAHintInput): EscalationLevel {
  // Coerce/sanitize counts — defensive against negative or non-finite caller bugs.
  const ignored = Math.max(0, Number.isFinite(input.ignored_count) ? Math.floor(input.ignored_count) : 0);
  const recurrence = Math.max(0, Number.isFinite(input.drift_recurrence) ? Math.floor(input.drift_recurrence) : 0);

  // Acknowledgement reset — if the user took action on the latest hint, drop
  // back to 'none'. The ladder restarts only when fresh recurrence happens
  // after the acknowledgement (caller controls the recurrence count source).
  const recs = Array.isArray(input.recent_recommendations) ? input.recent_recommendations : [];
  if (recs.length > 0) {
    const latest = recs[recs.length - 1];
    if (latest && latest.acknowledged === true) return 'none';
  }

  // Merge thresholds — partial override per level, fall back to defaults.
  const t = mergeThresholds(input.thresholds);

  // Walk the ladder top-down. Each rung requires BOTH axes.
  if (ignored >= t.block.ignored && recurrence >= t.block.recurrence) return 'block';
  if (ignored >= t.hard.ignored && recurrence >= t.hard.recurrence) return 'hard';
  if (ignored >= t.light.ignored && recurrence >= t.light.recurrence) return 'light';
  return 'none';
}

/** Internal: shallow-merge per-level thresholds, defending against partial inputs. */
function mergeThresholds(overrides?: Partial<EscalationThresholds>): EscalationThresholds {
  if (!overrides) return DEFAULT_THRESHOLDS;
  return {
    light: { ...DEFAULT_THRESHOLDS.light, ...overrides.light },
    hard: { ...DEFAULT_THRESHOLDS.hard, ...overrides.hard },
    block: { ...DEFAULT_THRESHOLDS.block, ...overrides.block },
  };
}
