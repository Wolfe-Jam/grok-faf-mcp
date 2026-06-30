/**
 * 🏎️ FRC Usage Receipts — telemetry for the Phase III (FRC) layer.
 *
 * The promotion rail for FRC default-ON. ZEPH went opt-in → default-ON (v1.6 →
 * v1.9) on the back of a measurable usage trail (`.faf-refresh-receipts.json`);
 * FRC needs the same evidence before its own flip. Nothing logged FRC usage —
 * the Closed-Loop receipts cover refresh / drift / recommendation, NOT the FRC
 * tools (`faf_gate`/`faf_section`/`faf_memory`) or `rag_query`'s Collections
 * path. This closes that gap so Rail 2's promotion criteria have real data:
 * gate verdicts, section hit-rate, memory selections, and — the load-bearing
 * one — `rag_query` cache-hit-rate + whether the FRC Collections path ran.
 *
 * Sibling architecture to `FafmRefreshReceiptsLog` (append-only JSON, atomic
 * writes, fire-safe). Difference: NO no-score guard — `faf_gate` IS the quality
 * gate and legitimately carries a score. (`faf_memory` outcomes carry counts,
 * never a score — memories are not scored, but that's the caller's job, not a
 * log-level invariant here.)
 *
 * Storage: dedicated `.frc-usage-receipts.json` at cwd (configurable). Visible
 * intent matches the other substrate receipts; gitignored in-repo so dev/test
 * runs don't track per-machine telemetry.
 */

import * as fs from 'fs';
import * as path from 'path';
import type { ReceiptMetadata } from '../types/receipts';

/** Which FRC surface produced the receipt. `rag_query` is core-visible but its
 *  real Collections path is the FRC behavior — captured via `outcome.retrieved`. */
export type FrcTool = 'faf_gate' | 'faf_section' | 'faf_memory' | 'rag_query';

const FRC_TOOLS: readonly FrcTool[] = ['faf_gate', 'faf_section', 'faf_memory', 'rag_query'];

/** A single FRC usage telemetry event. Append-only, never mutated. */
export interface FrcUsageReceipt {
  /** Which FRC surface fired. */
  tool: FrcTool;
  /** ISO 8601 timestamp of when the call fired. */
  fired_at: string;
  /**
   * Per-tool outcome signal — open-ended bag. Conventions Rail 2 reads:
   *   - faf_gate:    { verdict: 'promote'|'hold', score, tokens }
   *   - faf_section: { found: boolean, section?, kind? } | { listed: number }
   *   - faf_memory:  { matched: number } | { summary: number }  (NO score)
   *   - rag_query:   { cached: boolean, retrieved: boolean }    (cache-hit-rate + FRC path)
   */
  outcome?: Record<string, unknown>;
  /** Optional metadata — duration_ms, etc. */
  metadata?: ReceiptMetadata;
}

export interface ReadFrcUsageOptions {
  since?: string;
  tool?: FrcTool;
  limit?: number;
}

const DEFAULT_FRC_USAGE_FILENAME = '.frc-usage-receipts.json';

/**
 * Filter + order an array of FRC usage receipts (newest-first). Pure — no FS,
 * no clock. Defensive against malformed entries; mirrors `recordReceipt`'s
 * write-time validation so a hand-edited / corrupted log can't smuggle
 * out-of-enum values past read.
 */
export function filterFrcUsage(
  receipts: FrcUsageReceipt[],
  options: ReadFrcUsageOptions = {},
): FrcUsageReceipt[] {
  let result = receipts.filter((r): r is FrcUsageReceipt => {
    if (r === null || typeof r !== 'object') return false;
    if (!FRC_TOOLS.includes(r.tool)) return false;
    if (typeof r.fired_at !== 'string') return false;
    if (!Number.isFinite(Date.parse(r.fired_at))) return false;
    return true;
  });

  if (options.tool !== undefined) {
    result = result.filter((r) => r.tool === options.tool);
  }
  if (options.since !== undefined) {
    const sinceMs = Date.parse(options.since);
    if (Number.isFinite(sinceMs)) {
      result = result.filter((r) => Date.parse(r.fired_at) > sinceMs);
    }
  }

  result.sort((a, b) => b.fired_at.localeCompare(a.fired_at));

  if (typeof options.limit === 'number' && options.limit >= 0) {
    result = result.slice(0, Math.floor(options.limit));
  }

  return result;
}

/**
 * Persistent FRC usage receipts log — append-only JSON, atomic writes. NOT
 * atomic across processes (same caveat as the refresh logs). Same shape as
 * `FafmRefreshReceiptsLog` so the substrate stays uniform.
 */
export class FrcUsageReceiptsLog {
  private readonly receiptsPath: string;

  constructor(receiptsPath: string = path.join(process.cwd(), DEFAULT_FRC_USAGE_FILENAME)) {
    this.receiptsPath = path.isAbsolute(receiptsPath)
      ? receiptsPath
      : path.resolve(process.cwd(), receiptsPath);
  }

  /** Where this log reads/writes. Useful for tests + debugging. */
  getReceiptsPath(): string {
    return this.receiptsPath;
  }

  /**
   * Append a single FRC usage receipt. Validates `tool`; `fired_at` defaults to
   * now. `outcome` is open-ended (caller-shaped per tool).
   */
  recordReceipt(receipt: Omit<FrcUsageReceipt, 'fired_at'> & { fired_at?: string }): void {
    if (!receipt) throw new Error('recordReceipt: receipt is required');
    if (!FRC_TOOLS.includes(receipt.tool)) {
      throw new Error(`recordReceipt: tool must be one of ${FRC_TOOLS.join('|')}, got: ${receipt.tool}`);
    }
    const firedAt = receipt.fired_at ?? new Date().toISOString();
    if (!Number.isFinite(Date.parse(firedAt))) {
      throw new Error(`recordReceipt: fired_at must be a valid ISO date, got: ${firedAt}`);
    }
    const full: FrcUsageReceipt = { ...receipt, fired_at: firedAt };
    const all = this.readAll();
    all.push(full);
    this.writeAll(all);
  }

  /** Query the log. Newest-first, filtered + capped per options. Empty on clean state. */
  readReceipts(options: ReadFrcUsageOptions = {}): FrcUsageReceipt[] {
    return filterFrcUsage(this.readAll(), options);
  }

  /** Internal: read the entire on-disk log. Missing file → empty, never throws. */
  private readAll(): FrcUsageReceipt[] {
    if (!fs.existsSync(this.receiptsPath)) return [];
    try {
      const raw = fs.readFileSync(this.receiptsPath, 'utf-8');
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return parsed;
    } catch {
      return [];
    }
  }

  /** Internal: overwrite the log atomically (write temp, rename). */
  private writeAll(receipts: FrcUsageReceipt[]): void {
    const tmp = `${this.receiptsPath}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify(receipts, null, 2));
    fs.renameSync(tmp, this.receiptsPath);
  }
}
