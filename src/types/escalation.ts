/**
 * 🏎️ Canonical Escalation Types (1.5 substrate)
 *
 * Single source of truth for the take-a-hint escalation ladder values.
 *
 * Spec source: PR 101 audit (2026-05-31) — finding C. `EscalationLevel`
 * previously lived in `src/orchestrator/take-a-hint.ts`. PR 3 (`#10`
 * orchestrator) will reference this type as its `Recommendation.severity`
 * field. Moving to canonical so the orchestrator imports the same type
 * directly — no re-import chain that could break if take-a-hint reorganizes.
 *
 * `'block'` is advisory per `[[grok-agent-alignment]]` subordinate-not-
 * daemon — the orchestrator surfaces the level, the agent/user decides
 * whether to actually block. This function never forces.
 */

/** Escalation level — spec-verbatim. `'block'` is advisory, not enforced. */
export type EscalationLevel = 'none' | 'light' | 'hard' | 'block';
