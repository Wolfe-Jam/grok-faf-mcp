/**
 * 🏎️ FAFM Refresh Receipts — symmetric telemetry for `.fafm` memory re-grounds.
 *
 * Sibling to `RefreshReceiptsLog` (`.faf-refresh-receipts.json`). Where the `.faf`
 * log captures SCORED re-grounds (blend/nuke), this captures MEMORY re-grounds —
 * mode `delta|verbatim`, and crucially **NO score**: `.fafm` memories are not
 * scored (format-level doctrine; `refresh_fafm` carries no score field anywhere).
 *
 * Closes the observability asymmetry: `refresh_faf` wrote receipts (PR #132);
 * `refresh_fafm` did not — now BOTH refresh primitives leave a measurable trail.
 * The Closed-Loop Edition's "observability writes, not just reads," extended to
 * the memory layer. ([[faf-telemetry-closed-loop-certainty]])
 *
 * Storage: dedicated `.fafm-refresh-receipts.json` at cwd (configurable). Append-
 * only JSON event log with atomic writes. Visible (not gitignored).
 */

import * as fs from 'fs';
import * as path from 'path';
import type { RefreshTrigger } from './refresh-receipts';
import type { ReceiptMetadata } from '../types/receipts';

/** `.fafm` refresh intensity — delta (default) or verbatim. NOT blend/nuke (those are `.faf`). */
export type FafmRefreshMode = 'delta' | 'verbatim';

/** A single `.fafm` refresh telemetry event. Append-only, never mutated. NO score. */
export interface FafmRefreshReceipt {
  /** What initiated this fire — auto by a detector, or manual by caller. */
  trigger: RefreshTrigger;
  /** Which `.fafm` refresh intensity ran. */
  mode: FafmRefreshMode;
  /** ISO 8601 timestamp of when the refresh fired. */
  fired_at: string;
  /** Whatever the refresh primitive returned (souls, fact_count, status, hash, version…). NO score. */
  refresh_result?: unknown;
  /** Optional metadata — duration, etc. */
  metadata?: ReceiptMetadata;
}

export interface ReadFafmReceiptsOptions {
  since?: string;
  trigger?: RefreshTrigger;
  limit?: number;
}

const DEFAULT_FAFM_RECEIPTS_FILENAME = '.fafm-refresh-receipts.json';

/**
 * Filter + order an array of `.fafm` receipts (newest-first). Pure — no FS, no clock.
 * Defensive against malformed entries; mirrors `recordReceipt`'s write-time validation
 * so a hand-edited / corrupted log can't smuggle out-of-enum (or score-bearing) values past read.
 */
export function filterFafmReceipts(
  receipts: FafmRefreshReceipt[],
  options: ReadFafmReceiptsOptions = {},
): FafmRefreshReceipt[] {
  let result = receipts.filter((r): r is FafmRefreshReceipt => {
    if (r === null || typeof r !== 'object') return false;
    if (r.trigger !== 'auto' && r.trigger !== 'manual') return false;
    if (r.mode !== 'delta' && r.mode !== 'verbatim') return false;
    if (typeof r.fired_at !== 'string') return false;
    if (!Number.isFinite(Date.parse(r.fired_at))) return false;
    return true;
  });

  if (options.trigger !== undefined) {
    result = result.filter((r) => r.trigger === options.trigger);
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
 * Persistent `.fafm` refresh receipts log — the memory-layer mirror of
 * `RefreshReceiptsLog`. Append-only JSON, atomic writes. NOT atomic across
 * processes (same caveat as the `.faf` log).
 */
export class FafmRefreshReceiptsLog {
  private readonly receiptsPath: string;

  constructor(receiptsPath: string = path.join(process.cwd(), DEFAULT_FAFM_RECEIPTS_FILENAME)) {
    this.receiptsPath = path.isAbsolute(receiptsPath)
      ? receiptsPath
      : path.resolve(process.cwd(), receiptsPath);
  }

  /** Where this log reads/writes. Useful for tests + debugging. */
  getReceiptsPath(): string {
    return this.receiptsPath;
  }

  /**
   * Append a single `.fafm` receipt. Validates trigger + mode; `fired_at` defaults
   * to now. Enforces the doctrine guard: `.fafm` receipts carry NO score — a
   * score-bearing `refresh_result` is rejected loudly so a caller bug can't quietly
   * corrupt the "memories are not scored" invariant.
   */
  recordReceipt(receipt: Omit<FafmRefreshReceipt, 'fired_at'> & { fired_at?: string }): void {
    if (!receipt) throw new Error('recordReceipt: receipt is required');
    if (receipt.trigger !== 'auto' && receipt.trigger !== 'manual') {
      throw new Error(`recordReceipt: trigger must be 'auto' or 'manual', got: ${receipt.trigger}`);
    }
    if (receipt.mode !== 'delta' && receipt.mode !== 'verbatim') {
      throw new Error(`recordReceipt: mode must be 'delta' or 'verbatim', got: ${receipt.mode}`);
    }
    if (
      receipt.refresh_result &&
      typeof receipt.refresh_result === 'object' &&
      'score' in (receipt.refresh_result as Record<string, unknown>)
    ) {
      throw new Error('recordReceipt: .fafm receipts carry NO score — memories are not scored');
    }
    const firedAt = receipt.fired_at ?? new Date().toISOString();
    if (!Number.isFinite(Date.parse(firedAt))) {
      throw new Error(`recordReceipt: fired_at must be a valid ISO date, got: ${firedAt}`);
    }
    const full: FafmRefreshReceipt = { ...receipt, fired_at: firedAt };
    const all = this.readAll();
    all.push(full);
    this.writeAll(all);
  }

  /** Query the log. Newest-first, filtered + capped per options. Empty on clean state. */
  readReceipts(options: ReadFafmReceiptsOptions = {}): FafmRefreshReceipt[] {
    return filterFafmReceipts(this.readAll(), options);
  }

  /** Internal: read the entire on-disk log. Missing file → empty, never throws. */
  private readAll(): FafmRefreshReceipt[] {
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
  private writeAll(receipts: FafmRefreshReceipt[]): void {
    const tmp = `${this.receiptsPath}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify(receipts, null, 2));
    fs.renameSync(tmp, this.receiptsPath);
  }
}
