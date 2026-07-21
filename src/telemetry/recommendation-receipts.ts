/**
 * 🏎️ Recommendation Receipts — telemetry log for orchestrator recommendations (1.5 MVP)
 *
 * Append-only event log of every recommendation the `#10` orchestrator makes:
 * when it was made, what action was recommended, what severity, what motivated
 * it (drift signal, if any), whether it was acknowledged. Sister to
 * `RefreshReceiptsLog` (PR #99) — same pure-core + FS-shim architecture,
 * different event type.
 *
 * Spec source:
 *   `#10` orchestrator code-gate consult (`~/export/grok-1-consult-
 *    orchestrator-code-gate-2026-05-31.md`)
 *   `[[grok-orchestrator-spec]]`
 *   `[[faf-telemetry-closed-loop-certainty]]` — measured, falsifiable
 *
 * Why this exists:
 *   PR 3's `faf_orchestrate_recommendation` tool needs to WRITE to this log
 *   (every analysis emits an auditable receipt — no silent decisions).
 *   take-a-hint reads from it (via the orchestrator's input-building) to
 *   compute `recent_recommendations` for the escalation ladder.
 *
 * Subordinate-not-daemon honored at the architecture level: this library is
 * passive. Call it → it writes; don't call it → it sleeps. The orchestrator
 * decides WHEN to write, not the library.
 *
 * Storage: dedicated `.faf-recommendation-receipts.json` at cwd
 * (configurable). Same architecture as `.faf-refresh-receipts.json`
 * (#99) and `.faf-drift-index.json` (#96). Append-only JSON event log
 * with atomic writes. Visible (not gitignored). Pull-discoverable by
 * external tools (e.g. TAF) via the stable cwd path + schema.
 */

import * as fs from 'fs';
import * as path from 'path';
import type { DriftSignal } from '../types/drift-signals';
import type { RefreshMode } from '../types/refresh';
import type { EscalationLevel } from '../types/escalation';
import type { RecommendationAction } from '../types/recommendation';
import type { ReceiptMetadata } from '../types/receipts';

/**
 * A single recommendation event recorded by the orchestrator. Append-only,
 * never mutated EXCEPT for `acknowledged` (which a future ack tool may flip
 * from false → true; the value-change is intentional, the field is the
 * only mutable surface in the otherwise-immutable record).
 */
export interface RecommendationReceipt {
  /** ISO 8601 timestamp of when the recommendation was made. */
  recommended_at: string;
  /** What the orchestrator recommended the agent do. */
  recommend: RecommendationAction;
  /** Refresh mode — only present when `recommend === 'refresh_blend'`. */
  mode?: RefreshMode;
  /** Escalation severity, from take-a-hint. */
  severity: EscalationLevel;
  /** Human-readable explanation surfaced to the caller. */
  reason: string;
  /** The drift signal that motivated this recommendation (if any). */
  drift_signal?: DriftSignal;
  /**
   * Whether the user/agent acknowledged this recommendation. Default false;
   * a separate ack mechanism (future task) flips it to true. take-a-hint
   * reads this when computing whether the escalation ladder should reset.
   */
  acknowledged: boolean;
  /** Optional metadata bag (e.g. `duration_ms`). */
  metadata?: ReceiptMetadata;
}

export interface ReadRecommendationsOptions {
  /** Only return receipts with `recommended_at` strictly after this ISO timestamp. */
  since?: string;
  /** Filter to a specific recommendation action. */
  recommend?: RecommendationAction;
  /** Filter to a specific severity level. */
  severity?: EscalationLevel;
  /** Filter by acknowledgement status. */
  acknowledged?: boolean;
  /** Cap the returned array (most-recent-first applied first). */
  limit?: number;
}

// ── Defaults ───────────────────────────────────────────────────────────────
const DEFAULT_RECEIPTS_FILENAME = '.faf-recommendation-receipts.json';

// ── Pure-core filtering ────────────────────────────────────────────────────

/**
 * Filter + order an array of receipts per the supplied options.
 *
 * Pure function — same input + options → same output. No FS, no clock.
 *
 * Defensive: drops malformed entries (shape + enum validation mirrors
 * `recordRecommendation`'s write-time checks; a hand-edited or corrupted
 * log can't smuggle out-of-enum values past the read path — same shield
 * pattern as `RefreshReceiptsLog.filterReceipts` per #99 audit fix).
 *
 * Ordering: newest-first by `recommended_at`. Applied BEFORE `limit` so the
 * cap keeps the freshest events (what consumers want for take-a-hint's
 * `recent_recommendations` input).
 */
export function filterRecommendations(
  receipts: RecommendationReceipt[],
  options: ReadRecommendationsOptions = {},
): RecommendationReceipt[] {
  // Filter pass — defensive against malformed entries (drop, don't crash).
  // Enum validation on read mirrors recordRecommendation's write-time
  // validation — corrupt log entries can't sneak through.
  let result = receipts.filter((r): r is RecommendationReceipt => {
    if (r === null || typeof r !== 'object') return false;
    if (
      r.recommend !== 'refresh_faf' &&
      r.recommend !== 'refresh_fafm' &&
      r.recommend !== 'refresh_blend' &&
      r.recommend !== 'no_action'
    ) {
      return false;
    }
    if (
      r.severity !== 'none' &&
      r.severity !== 'light' &&
      r.severity !== 'hard' &&
      r.severity !== 'block'
    ) {
      return false;
    }
    if (typeof r.recommended_at !== 'string') return false;
    if (!Number.isFinite(Date.parse(r.recommended_at))) return false;
    if (typeof r.reason !== 'string') return false;
    if (typeof r.acknowledged !== 'boolean') return false;
    // mode is optional; if present must be valid enum
    if (r.mode !== undefined && r.mode !== 'blend' && r.mode !== 'nuke') return false;
    return true;
  });

  if (options.recommend !== undefined) {
    result = result.filter((r) => r.recommend === options.recommend);
  }
  if (options.severity !== undefined) {
    result = result.filter((r) => r.severity === options.severity);
  }
  if (options.acknowledged !== undefined) {
    result = result.filter((r) => r.acknowledged === options.acknowledged);
  }
  if (options.since !== undefined) {
    const sinceMs = Date.parse(options.since);
    if (Number.isFinite(sinceMs)) {
      result = result.filter((r) => Date.parse(r.recommended_at) > sinceMs);
    }
  }

  // Newest-first by recommended_at (lexicographic ISO compare works for valid ISO).
  result.sort((a, b) => b.recommended_at.localeCompare(a.recommended_at));

  if (typeof options.limit === 'number' && options.limit >= 0) {
    result = result.slice(0, Math.floor(options.limit));
  }

  return result;
}

// ── FS-touching log ────────────────────────────────────────────────────────

/**
 * Persistent recommendation receipts log.
 *
 * Reads/writes an append-only JSON event log. Pure-function
 * `filterRecommendations` does the querying — this class is the thin FS
 * shim that keeps callers from having to manage the file format.
 *
 * Architecture matches `RefreshReceiptsLog` (PR #99) exactly — both are
 * substrate telemetry logs; only the event shape differs.
 *
 * NOT atomic across processes. Within a process, writes are serialized by
 * the JS event loop. Future task: file-lock for multi-agent concurrency.
 */
export class RecommendationReceiptsLog {
  private readonly receiptsPath: string;

  /**
   * @param receiptsPath  Absolute or cwd-relative path to the JSON event log.
   *                      Defaults to `<cwd>/.faf-recommendation-receipts.json`.
   */
  constructor(receiptsPath: string = path.join(process.cwd(), DEFAULT_RECEIPTS_FILENAME)) {
    this.receiptsPath = path.isAbsolute(receiptsPath)
      ? receiptsPath
      : path.resolve(process.cwd(), receiptsPath);
  }

  /** Where this log reads/writes. Useful for tests + debugging. */
  getReceiptsPath(): string {
    return this.receiptsPath;
  }

  /**
   * Append a single recommendation receipt. Validates the minimum shape;
   * throws on missing required fields so caller bugs surface loudly.
   * Optional fields default sensibly:
   *   - `recommended_at` → `new Date().toISOString()` if omitted
   *   - `acknowledged`   → `false` if omitted
   */
  recordRecommendation(
    receipt: Omit<RecommendationReceipt, 'recommended_at' | 'acknowledged'> & {
      recommended_at?: string;
      acknowledged?: boolean;
    },
  ): void {
    if (!receipt) throw new Error('recordRecommendation: receipt is required');
    if (
      receipt.recommend !== 'refresh_faf' &&
      receipt.recommend !== 'refresh_fafm' &&
      receipt.recommend !== 'refresh_blend' &&
      receipt.recommend !== 'no_action'
    ) {
      throw new Error(
        `recordRecommendation: recommend must be one of refresh_faf | refresh_fafm | refresh_blend | no_action, got: ${String(receipt.recommend)}`,
      );
    }
    if (
      receipt.severity !== 'none' &&
      receipt.severity !== 'light' &&
      receipt.severity !== 'hard' &&
      receipt.severity !== 'block'
    ) {
      throw new Error(
        `recordRecommendation: severity must be one of none | light | hard | block, got: ${String(receipt.severity)}`,
      );
    }
    if (typeof receipt.reason !== 'string') {
      throw new Error('recordRecommendation: reason must be a string');
    }
    if (receipt.mode !== undefined && receipt.mode !== 'blend' && receipt.mode !== 'nuke') {
      throw new Error(`recordRecommendation: mode (if present) must be 'blend' or 'nuke', got: ${String(receipt.mode)}`);
    }
    const recommendedAt = receipt.recommended_at ?? new Date().toISOString();
    if (!Number.isFinite(Date.parse(recommendedAt))) {
      throw new Error(`recordRecommendation: recommended_at must be a valid ISO date, got: ${recommendedAt}`);
    }
    const full: RecommendationReceipt = {
      ...receipt,
      recommended_at: recommendedAt,
      acknowledged: receipt.acknowledged ?? false,
    };
    const all = this.readAll();
    all.push(full);
    this.writeAll(all);
  }

  /**
   * Query the receipt log. Returns newest-first, filtered + capped per
   * options. Empty array when no receipts match (silent on clean state —
   * the log is not REQUIRED to have content).
   */
  readRecommendations(options: ReadRecommendationsOptions = {}): RecommendationReceipt[] {
    return filterRecommendations(this.readAll(), options);
  }

  /** Internal: read the entire on-disk log. Missing file → empty, never throws. */
  private readAll(): RecommendationReceipt[] {
    if (!fs.existsSync(this.receiptsPath)) return [];
    try {
      const raw = fs.readFileSync(this.receiptsPath, 'utf-8');
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      // Corrupt entries dropped by filterRecommendations on query — we
      // accept all here so a corrupt mid-array entry doesn't gate later
      // valid ones.
      return parsed;
    } catch {
      return [];
    }
  }

  /** Internal: overwrite the log atomically (write temp, rename). */
  private writeAll(receipts: RecommendationReceipt[]): void {
    const tmp = `${this.receiptsPath}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify(receipts, null, 2));
    fs.renameSync(tmp, this.receiptsPath);
  }
}
