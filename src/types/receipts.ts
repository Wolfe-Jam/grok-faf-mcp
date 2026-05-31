/**
 * 🏎️ Canonical Receipt Types (1.5 substrate)
 *
 * Shared structural shapes for substrate receipts (refresh fires +
 * recommendation events). Lives in `src/types/` alongside the rest of
 * the canonical types.
 *
 * Closes audit finding H (2026-05-31 PR 101 deeper audit): `RefreshReceipt`
 * had its `metadata` field defined inline as an anonymous shape; PR 2's
 * `RecommendationReceipt` would have duplicated the same shape. Canonical
 * `ReceiptMetadata` here unifies them — both receipt types reference it.
 *
 * `BaseReceipt` is intentionally NOT defined. Per audit finding I:
 * `RefreshReceipt` and `RecommendationReceipt` are different enough
 * conceptually (different event types, different field names like
 * `fired_at` vs `recommended_at`) that forcing a common base creates
 * fake commonality. Each receipt type defines its own top-level fields;
 * only the metadata bag is shared.
 */

/**
 * Optional metadata bag attached to substrate receipts. Open-ended —
 * `duration_ms` is the only field convention; callers can add others.
 *
 * Used by:
 *   - `RefreshReceipt.metadata` (refresh-receipts.ts)
 *   - `RecommendationReceipt.metadata` (recommendation-receipts.ts)
 */
export interface ReceiptMetadata {
  /** Time the receipted operation took, in milliseconds. */
  duration_ms?: number;
  /** Open-ended — additional caller-defined fields permitted. */
  [key: string]: unknown;
}
