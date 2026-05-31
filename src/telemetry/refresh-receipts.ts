/**
 * 🏎️ Refresh Receipts — telemetry log for refresh fires (1.5 MVP)
 *
 * Append-only event log of every refresh invocation: when fired, what triggered
 * it (auto signal vs manual), what intensity, what drift signal motivated it
 * (if any), what came back. The receipt trail IS the audit per
 * [[grok-drift-requirements]] "receipts as scale-asset" + the closed-loop
 * certainty doctrine ([[faf-telemetry-closed-loop-certainty]]): telemetry
 * makes the AI/human feedback loop MEASURABLE — did this refresh actually
 * help? The receipts let you prove it.
 *
 * Spec source:
 *   ~/PLANET-FAF/docs/GROK-FAF-MCP-1.5-CODING-SESSION-BREAKDOWN-2026-05-30.md §#7
 *   memory/grok-drift-requirements.md
 *   memory/faf-telemetry-closed-loop-certainty.md
 *   memory/quiet-receipt-doctrine.md (receipts citable, never broadcast)
 *
 * Auto-fire is GATED at the caller (orchestrator decides WHEN; this library
 * decides only HOW the event is recorded). Library never daemons by virtue
 * of being passive — call it, it writes; don't call it, it sleeps.
 *
 * Storage: dedicated `.faf-refresh-receipts.json` at cwd (configurable). Same
 * architecture as `.faf-drift-index.json` for repeat-offender (#12). Append-
 * only JSON event log with atomic writes. Visible (not gitignored).
 *
 * Split: pure functions for filtering/querying (testable without FS) + thin
 * `RefreshReceiptsLog` class for read/write.
 */

import * as fs from 'fs';
import * as path from 'path';
import type { DriftSignal } from '../types/drift-signals';

/** What initiated this refresh fire — auto by a detector, or manual by caller. */
export type RefreshTrigger = 'auto' | 'manual';

/** Refresh intensity used — matches refresh_blend's modes. */
export type RefreshIntensity = 'blend' | 'nuke';

/** A single refresh telemetry event. Append-only, never mutated. */
export interface RefreshReceipt {
  /** What initiated this fire. */
  trigger: RefreshTrigger;
  /** Which refresh intensity ran. */
  intensity: RefreshIntensity;
  /** The drift signal that motivated an auto-fire (undefined for manual). */
  drift_signal?: DriftSignal;
  /** ISO 8601 timestamp of when the refresh fired. */
  fired_at: string;
  /** Whatever the refresh primitive returned. Caller decides what to capture. */
  refresh_result?: unknown;
  /** Optional metadata — duration, etc. */
  metadata?: {
    duration_ms?: number;
    [key: string]: unknown;
  };
}

export interface ReadReceiptsOptions {
  /** Only return receipts with `fired_at` strictly after this ISO timestamp. */
  since?: string;
  /** Filter to a specific trigger source. */
  trigger?: RefreshTrigger;
  /** Cap the returned array length (most-recent-first ordering applied first). */
  limit?: number;
}

// ── Defaults ───────────────────────────────────────────────────────────────
const DEFAULT_RECEIPTS_FILENAME = '.faf-refresh-receipts.json';

// ── Pure-core filtering ────────────────────────────────────────────────────

/**
 * Filter + order an array of receipts per the supplied options.
 *
 * Pure function — same input + options → same output. No FS, no clock.
 *
 * Ordering: newest-first by `fired_at`. Applied BEFORE `limit` so the cap
 * keeps the freshest events (which is what consumers usually want for
 * "recent recommendations" inputs to #13's take-a-hint ladder).
 */
export function filterReceipts(
  receipts: RefreshReceipt[],
  options: ReadReceiptsOptions = {},
): RefreshReceipt[] {
  // Filter pass — defensive against malformed entries (drop, don't crash).
  // Mirrors recordReceipt's write-time validation so a hand-edited / corrupted
  // log file can't smuggle out-of-enum values past the read path.
  let result = receipts.filter((r): r is RefreshReceipt => {
    if (r === null || typeof r !== 'object') return false;
    if (r.trigger !== 'auto' && r.trigger !== 'manual') return false;
    if (r.intensity !== 'blend' && r.intensity !== 'nuke') return false;
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

  // Newest-first by fired_at (lexicographic ISO compare works for valid ISO).
  result.sort((a, b) => b.fired_at.localeCompare(a.fired_at));

  if (typeof options.limit === 'number' && options.limit >= 0) {
    result = result.slice(0, Math.floor(options.limit));
  }

  return result;
}

// ── FS-touching log ────────────────────────────────────────────────────────

/**
 * Persistent receipts log.
 *
 * Reads/writes an append-only JSON event log. Pure-function `filterReceipts`
 * does the querying — this class is the thin FS shim that keeps callers from
 * having to manage the file format.
 *
 * NOT atomic across processes. Within a process, writes are serialized by the
 * JS event loop. Future task: file-lock for multi-agent concurrency.
 */
export class RefreshReceiptsLog {
  private readonly receiptsPath: string;

  /**
   * @param receiptsPath  Absolute or cwd-relative path to the JSON event log.
   *                      Defaults to `<cwd>/.faf-refresh-receipts.json`.
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
   * Append a single receipt. Validates the minimum shape; throws on missing
   * required fields so caller bugs surface loudly. Optional fields default
   * sensibly (`fired_at` → `new Date().toISOString()`).
   */
  recordReceipt(receipt: Omit<RefreshReceipt, 'fired_at'> & { fired_at?: string }): void {
    if (!receipt) throw new Error('recordReceipt: receipt is required');
    if (receipt.trigger !== 'auto' && receipt.trigger !== 'manual') {
      throw new Error(`recordReceipt: trigger must be 'auto' or 'manual', got: ${receipt.trigger}`);
    }
    if (receipt.intensity !== 'blend' && receipt.intensity !== 'nuke') {
      throw new Error(`recordReceipt: intensity must be 'blend' or 'nuke', got: ${receipt.intensity}`);
    }
    const firedAt = receipt.fired_at ?? new Date().toISOString();
    if (!Number.isFinite(Date.parse(firedAt))) {
      throw new Error(`recordReceipt: fired_at must be a valid ISO date, got: ${firedAt}`);
    }
    const full: RefreshReceipt = { ...receipt, fired_at: firedAt };
    const all = this.readAll();
    all.push(full);
    this.writeAll(all);
  }

  /**
   * Query the receipt log. Returns newest-first, filtered + capped per options.
   * Empty array when no receipts match (silent on clean state — the log is
   * not REQUIRED to have content).
   */
  readReceipts(options: ReadReceiptsOptions = {}): RefreshReceipt[] {
    return filterReceipts(this.readAll(), options);
  }

  /** Internal: read the entire on-disk log. Missing file → empty, never throws. */
  private readAll(): RefreshReceipt[] {
    if (!fs.existsSync(this.receiptsPath)) return [];
    try {
      const raw = fs.readFileSync(this.receiptsPath, 'utf-8');
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      // Corrupt entries dropped by filterReceipts on query — but we accept all
      // here so a corrupt mid-array entry doesn't gate later valid ones.
      return parsed;
    } catch {
      return [];
    }
  }

  /** Internal: overwrite the log atomically (write temp, rename). */
  private writeAll(receipts: RefreshReceipt[]): void {
    const tmp = `${this.receiptsPath}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify(receipts, null, 2));
    fs.renameSync(tmp, this.receiptsPath);
  }
}
