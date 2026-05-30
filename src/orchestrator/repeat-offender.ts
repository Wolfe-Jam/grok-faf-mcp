/**
 * 🏎️ Repeat-Offender Tracker (1.5 MVP — drift-prone slot index)
 *
 * Tracks which slots drift recurrently across sessions. Input to #13 (take-a-
 * hint escalation) + orchestrator prioritization. The persistent layer that
 * turns one-shot drift signals (#2 / #11) into "this keeps happening" intel.
 *
 * Spec source:
 *   ~/PLANET-FAF/docs/GROK-FAF-MCP-1.5-CODING-SESSION-BREAKDOWN-2026-05-30.md §#12
 *   memory/grok-drift-requirements.md       (drift-management parent spec)
 *   memory/grok-agent-alignment.md          ("tunable/observable policy")
 *   memory/silent-drift-equals-fail-equals-forbidden.md
 *
 * Signal-agnostic design — accepts any string slot identifier. Two bridges
 * make consumption explicit:
 *   - `recordFromDriftSignal()` for #2 (each repeated_anchor = a slot)
 *   - `recordFromContradictionReport()` for #11 (each contradiction.check = a slot)
 *
 * Storage: append-only event log at `.faf-drift-index.json` (default cwd).
 * Decay is timestamp filtering on QUERY — not lossy mutation. Recomputable
 * from the raw event log at any time.
 *
 * Split: pure functions for compute (testable without FS) + thin
 * `RepeatOffenderTracker` class for read/write.
 */

import * as fs from 'fs';
import * as path from 'path';

/** A single drift event — append-only, never mutated. */
export interface DriftEvent {
  /** Slot identifier — caller-defined namespace. */
  slot: string;
  /** ISO 8601 timestamp of the event. */
  timestamp: string;
}

/** A repeat offender — the output shape spec'd in §#12 verbatim. */
export interface RepeatOffender {
  slot: string;
  count: number;
  last_drift: string; // ISO
}

export interface GetRepeatOffendersOptions {
  /** Rolling window in days. Default 30 per spec example. */
  windowDays?: number;
  /** Minimum count threshold — slots with fewer events are filtered out. Default 1 (any recurrence). */
  minCount?: number;
  /** Reference "now" for the window cutoff. Defaults to wall clock — caller passes a fixed value for determinism in tests. */
  now?: string;
}

/** Minimal shape of a #2 drift signal — duplicated to avoid a cross-module type import cycle. */
export interface FafmDriftSignalLike {
  kind: 'repetition-rate';
  repeated_anchors: string[];
  detected_at: string;
}

/** Minimal shape of a #11 contradiction report — same rationale. */
export interface ContradictionReportLike {
  contradictions: Array<{ check: string }>;
}

// ── Defaults (tunables) ────────────────────────────────────────────────────
const DEFAULT_WINDOW_DAYS = 30;
const DEFAULT_MIN_COUNT = 1;
const DEFAULT_INDEX_FILENAME = '.faf-drift-index.json';

// ── Pure-core computation ──────────────────────────────────────────────────

/**
 * Compute the current repeat-offender list from a raw event log.
 *
 * Pure function — same events + options → same output. No FS, no clock unless
 * the caller fails to pass `options.now` (which would only matter in
 * production, not tests).
 *
 * Decay semantics: events older than `windowDays` are filtered out before
 * counting. The original event log is NOT mutated — decay is a query-time
 * concern.
 */
export function computeRepeatOffenders(
  events: DriftEvent[],
  options: GetRepeatOffendersOptions = {},
): RepeatOffender[] {
  const windowDays = options.windowDays ?? DEFAULT_WINDOW_DAYS;
  const minCount = options.minCount ?? DEFAULT_MIN_COUNT;
  const nowIso = options.now ?? new Date().toISOString();

  // Window cutoff = now − windowDays. Events strictly older than this are dropped.
  const nowMs = Date.parse(nowIso);
  const cutoffMs = nowMs - windowDays * 24 * 60 * 60 * 1000;

  // Bucket events per slot — only those still in the window.
  const buckets = new Map<string, DriftEvent[]>();
  for (const e of events) {
    if (typeof e.slot !== 'string' || e.slot.length === 0) continue;
    if (typeof e.timestamp !== 'string') continue;
    const tsMs = Date.parse(e.timestamp);
    if (!Number.isFinite(tsMs)) continue;
    if (tsMs < cutoffMs) continue;
    let arr = buckets.get(e.slot);
    if (arr === undefined) {
      arr = [];
      buckets.set(e.slot, arr);
    }
    arr.push(e);
  }

  // Build offender records, applying minCount filter, ranked by count desc
  // then by recency (newest last_drift first) for stable, useful ordering.
  const offenders: RepeatOffender[] = [];
  for (const [slot, arr] of buckets) {
    if (arr.length < minCount) continue;
    // last_drift = newest timestamp in the bucket
    let last = arr[0].timestamp;
    for (const e of arr) if (e.timestamp > last) last = e.timestamp;
    offenders.push({ slot, count: arr.length, last_drift: last });
  }
  offenders.sort((a, b) => {
    if (b.count !== a.count) return b.count - a.count;
    return b.last_drift.localeCompare(a.last_drift);
  });
  return offenders;
}

// ── FS-touching tracker ────────────────────────────────────────────────────

/**
 * Persistent repeat-offender tracker.
 *
 * Reads/writes an append-only JSON event log. Pure-function logic
 * (`computeRepeatOffenders`) does the actual work — this class is the thin
 * FS shim that keeps callers from having to manage the file format.
 *
 * NOT atomic across processes — last-writer-wins on concurrent writes from
 * different processes. Within a process, writes are serialized by the JS
 * event loop. For MVP this is fine; CI/multi-agent concurrency would need a
 * file lock (future task).
 */
export class RepeatOffenderTracker {
  private readonly indexPath: string;

  /**
   * @param indexPath  Absolute or cwd-relative path to the JSON event log.
   *                   Defaults to `<cwd>/.faf-drift-index.json`.
   */
  constructor(indexPath: string = path.join(process.cwd(), DEFAULT_INDEX_FILENAME)) {
    this.indexPath = path.isAbsolute(indexPath)
      ? indexPath
      : path.resolve(process.cwd(), indexPath);
  }

  /** Where this tracker reads/writes. Useful for tests + debugging. */
  getIndexPath(): string {
    return this.indexPath;
  }

  /**
   * Record a single drift event. Appends to the on-disk event log.
   *
   * @param slot      Caller-defined slot identifier (any non-empty string)
   * @param timestamp ISO 8601 timestamp; defaults to `new Date().toISOString()`
   */
  recordDrift(slot: string, timestamp?: string): void {
    if (typeof slot !== 'string' || slot.length === 0) {
      throw new Error('recordDrift: slot must be a non-empty string');
    }
    const ts = timestamp ?? new Date().toISOString();
    if (!Number.isFinite(Date.parse(ts))) {
      throw new Error(`recordDrift: timestamp must be a valid ISO date, got: ${ts}`);
    }
    const events = this.readEvents();
    events.push({ slot, timestamp: ts });
    this.writeEvents(events);
  }

  /**
   * Bridge from #2 drift signals — each `repeated_anchor` becomes a slot in
   * the `'anchor:'` namespace. The signal's `detected_at` is the event time
   * for all anchors recorded in one call.
   */
  recordFromDriftSignal(signal: FafmDriftSignalLike): void {
    if (!signal || !Array.isArray(signal.repeated_anchors)) return;
    const ts = typeof signal.detected_at === 'string' ? signal.detected_at : new Date().toISOString();
    const events = this.readEvents();
    let appended = 0;
    for (const anchor of signal.repeated_anchors) {
      if (typeof anchor !== 'string' || anchor.length === 0) continue;
      events.push({ slot: `anchor:${anchor}`, timestamp: ts });
      appended++;
    }
    // Silent no-op when nothing actually got appended — don't create an empty
    // file just for being called. Symmetry with how detectFafmDrift returns
    // null on clean state.
    if (appended > 0) this.writeEvents(events);
  }

  /**
   * Bridge from #11 contradiction reports — each contradiction's `check` ID
   * becomes a slot in the `'check:'` namespace. The event time is the caller-
   * supplied `now` (CheckID itself doesn't carry wall-clock per its determinism
   * invariant — caller stamps).
   */
  recordFromContradictionReport(
    report: ContradictionReportLike,
    timestamp?: string,
  ): void {
    if (!report || !Array.isArray(report.contradictions)) return;
    const ts = timestamp ?? new Date().toISOString();
    if (!Number.isFinite(Date.parse(ts))) return;
    const events = this.readEvents();
    let appended = 0;
    for (const c of report.contradictions) {
      if (!c || typeof c.check !== 'string' || c.check.length === 0) continue;
      events.push({ slot: `check:${c.check}`, timestamp: ts });
      appended++;
    }
    if (appended > 0) this.writeEvents(events);
  }

  /**
   * Query the current repeat-offender list — decay applied per options.
   *
   * Empty array when no events qualify. Stable order: count desc, then
   * last_drift desc (newest recurring offenders surface first).
   */
  getRepeatOffenders(options: GetRepeatOffendersOptions = {}): RepeatOffender[] {
    return computeRepeatOffenders(this.readEvents(), options);
  }

  /** Internal: read the event log. Missing file → empty array, never throws. */
  private readEvents(): DriftEvent[] {
    if (!fs.existsSync(this.indexPath)) return [];
    try {
      const raw = fs.readFileSync(this.indexPath, 'utf-8');
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      // Filter to well-formed events only — corrupt entries get dropped, not
      // crash-on-load. The log is append-only telemetry, not load-bearing
      // state; tolerating partial damage is more honest than failing.
      return parsed.filter(
        (e): e is DriftEvent =>
          e !== null &&
          typeof e === 'object' &&
          typeof (e as DriftEvent).slot === 'string' &&
          typeof (e as DriftEvent).timestamp === 'string',
      );
    } catch {
      return [];
    }
  }

  /** Internal: overwrite the event log atomically (write to temp, rename). */
  private writeEvents(events: DriftEvent[]): void {
    const tmp = `${this.indexPath}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify(events, null, 2));
    fs.renameSync(tmp, this.indexPath);
  }
}
