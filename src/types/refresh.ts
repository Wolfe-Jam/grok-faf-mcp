/**
 * 🏎️ Canonical Refresh Types (1.5 substrate)
 *
 * Single source of truth for refresh-related type contracts. Lives in
 * `src/types/` alongside `drift-signals.ts` — same foundational hygiene,
 * different domain.
 *
 * Spec source: PR 101 audit (2026-05-31) — finding A. `RefreshMode` (used
 * by `refresh-blend.ts`) and `RefreshIntensity` (used by `refresh-receipts.ts`)
 * were two names for the literal-identical `'blend' | 'nuke'` union. Both
 * flow through `#10` orchestrator's recommendation output. Drift hazard if
 * a future intensity ever lands and only one side gets updated.
 *
 * Canonical chose: `RefreshMode` (vocabulary matches the `refresh_blend`
 * tool's `mode` arg + the doctrine framing — Cmd+R as the blend MODE).
 * `RefreshIntensity` was the alias on the receipt side; gone now.
 */

/** Refresh intensity / mode — matches `refresh_blend` tool's `mode` arg. */
export type RefreshMode = 'blend' | 'nuke';
