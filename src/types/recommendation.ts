/**
 * 🏎️ Canonical Recommendation Types (1.5 substrate)
 *
 * Single source of truth for the orchestrator's recommendation action enum.
 * Lives in `src/types/` alongside the rest of the canonical types.
 *
 * Used by:
 *   - PR 2's `RecommendationReceipt.recommend` (the persisted log entry)
 *   - PR 3's `Recommendation.recommend` (the #10 orchestrator's live output)
 *
 * Both surfaces MUST use the same enum — otherwise a refactor on one side
 * silently desyncs from the persisted log on the other. Foundational
 * hygiene per wolfejam's "type sewn up" doctrine (PR 101 audit, 2026-05-31).
 *
 * `'no_action'` is the explicit clean-state value — the orchestrator must
 * STILL write a receipt with this value (per the subordinate-not-daemon
 * doctrine, no silent decisions; every analysis emits an auditable record).
 */

/**
 * The orchestrator's recommendation action — what the agent is being
 * advised to do. NEVER auto-fires (advisory-only per `[[grok-agent-alignment]]`).
 */
export type RecommendationAction =
  | 'refresh_faf'
  | 'refresh_fafm'
  | 'refresh_blend'
  | 'no_action';
