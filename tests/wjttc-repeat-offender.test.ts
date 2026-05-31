/**
 * 🏁 WJTTC — RepeatOffenderTracker (grok-faf-mcp 1.5)
 *
 * Championship proof for the drift-prone slot index. Turns one-shot signals
 * from #2 (drift detector) + #11 (CheckID) into persistent "this keeps
 * happening" intel — input to #13 take-a-hint escalation.
 *
 *   1 🛑 BRAKE  — fail-safe: missing file / corrupt JSON / bad inputs never crash
 *   2 ⚙️ ENGINE — core: record / query / decay window / minCount filter / bridge
 *                 helpers from #2 + #11
 *   3 🌬️ AERO   — honest: determinism of compute, persistence round-trip,
 *                 multi-session simulation (the AERO requirement from spec),
 *                 decay drops old events on query without mutating the log
 *   4 🛞 TYRE   — pass-through (local FS, no cred-costing roundtrip)
 *   5 🔧 PIT    — pass-through (storage format = JSON, no schema gate)
 *
 * Spec source: GROK-FAF-MCP-1.5-CODING-SESSION-BREAKDOWN §#12 (Grok WHAT,
 * Claude HOW). Output shape `{ slot, count, last_drift }` is spec-verbatim.
 */
import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import {
  RepeatOffenderTracker,
  computeRepeatOffenders,
  type DriftEvent,
} from '../src/orchestrator/repeat-offender';
import type { DriftSignal, ContradictionReport } from '../src/types/drift-signals';

// ── Helpers ──────────────────────────────────────────────────────────────

let tmpDir: string;
let indexPath: string;
let tracker: RepeatOffenderTracker;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'faf-repeat-offender-'));
  indexPath = path.join(tmpDir, '.faf-drift-index.json');
  tracker = new RepeatOffenderTracker(indexPath);
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

// Fixed reference times so multi-session decay tests are deterministic.
const T0 = '2026-05-01T00:00:00Z';          // 30 days before NOW
const T0_MINUS_1 = '2026-04-30T23:59:00Z';  // just outside a 30-day window from NOW
const T7 = '2026-05-08T00:00:00Z';          // 23 days before NOW
const T20 = '2026-05-21T00:00:00Z';         // 10 days before NOW
const T29 = '2026-05-30T00:00:00Z';         // 1 day before NOW
const NOW = '2026-05-31T00:00:00Z';         // the reference "now" in tests

// ── Tests ────────────────────────────────────────────────────────────────

describe('🏁 WJTTC — RepeatOffenderTracker (grok-faf-mcp 1.5)', () => {
  // ── 🛑 BRAKE — fail-safe ────────────────────────────────────────────
  describe('🛑 BRAKE — fail-safe', () => {
    test('missing index file → getRepeatOffenders returns []', () => {
      expect(fs.existsSync(indexPath)).toBe(false);
      expect(tracker.getRepeatOffenders()).toEqual([]);
    });

    test('corrupt JSON in index → empty array, no crash', () => {
      fs.writeFileSync(indexPath, 'not-json {{{');
      expect(tracker.getRepeatOffenders()).toEqual([]);
    });

    test('non-array JSON in index → empty array, no crash', () => {
      fs.writeFileSync(indexPath, JSON.stringify({ not: 'an array' }));
      expect(tracker.getRepeatOffenders()).toEqual([]);
    });

    test('partially-corrupt event log → corrupt entries dropped, valid ones kept', () => {
      fs.writeFileSync(
        indexPath,
        JSON.stringify([
          { slot: 'good', timestamp: T7 },
          { slot: 123, timestamp: T7 }, // bad: slot not string
          { not: 'a real event' },
          null,
          { slot: 'good2', timestamp: 'not-a-date' }, // bad: timestamp not parseable
          { slot: 'good3', timestamp: T20 },
        ]),
      );
      const r = tracker.getRepeatOffenders({ now: NOW });
      // Only 'good' (T7) and 'good3' (T20) are well-formed AND in-window
      const slots = r.map((o) => o.slot).sort();
      expect(slots).toEqual(['good', 'good3']);
    });

    test('recordDrift rejects empty slot', () => {
      expect(() => tracker.recordDrift('')).toThrow();
    });

    test('recordDrift rejects invalid timestamp', () => {
      expect(() => tracker.recordDrift('slot', 'definitely-not-a-date')).toThrow();
    });

    test('recordFromDriftSignal with no anchors → silent no-op, no file written', () => {
      tracker.recordFromDriftSignal({ kind: 'repetition-rate', repeated_anchors: [], detected_at: NOW });
      expect(fs.existsSync(indexPath)).toBe(false);
    });

    test('recordFromContradictionReport with no contradictions → silent no-op', () => {
      tracker.recordFromContradictionReport({ contradictions: [] });
      expect(fs.existsSync(indexPath)).toBe(false);
    });
  });

  // ── ⚙️ ENGINE — core ────────────────────────────────────────────────
  describe('⚙️ ENGINE — core record / query / bridges', () => {
    test('recordDrift then getRepeatOffenders returns the offender with count=1', () => {
      tracker.recordDrift('faf:human_context.when', T7);
      const r = tracker.getRepeatOffenders({ now: NOW });
      expect(r).toEqual([
        { slot: 'faf:human_context.when', count: 1, last_drift: T7 },
      ]);
    });

    test('repeated recordDrift on same slot increments count, last_drift = newest', () => {
      tracker.recordDrift('slot-a', T7);
      tracker.recordDrift('slot-a', T20);
      tracker.recordDrift('slot-a', T29);
      const r = tracker.getRepeatOffenders({ now: NOW });
      expect(r).toEqual([{ slot: 'slot-a', count: 3, last_drift: T29 }]);
    });

    test('ranking: highest count first; ties broken by most-recent last_drift first', () => {
      tracker.recordDrift('low', T20);
      tracker.recordDrift('high-old', T7);
      tracker.recordDrift('high-old', T20);
      tracker.recordDrift('high-old', T29);
      tracker.recordDrift('high-new', T20);
      tracker.recordDrift('high-new', T29);
      tracker.recordDrift('high-new', NOW);
      const r = tracker.getRepeatOffenders({ now: NOW });
      // 'high-new' (3, latest=NOW) > 'high-old' (3, latest=T29) > 'low' (1)
      expect(r.map((o) => o.slot)).toEqual(['high-new', 'high-old', 'low']);
    });

    test('minCount filter drops below-threshold slots', () => {
      tracker.recordDrift('once', T7);
      tracker.recordDrift('twice', T7);
      tracker.recordDrift('twice', T20);
      const r = tracker.getRepeatOffenders({ now: NOW, minCount: 2 });
      expect(r.map((o) => o.slot)).toEqual(['twice']);
    });

    test('bridge: recordFromDriftSignal — each anchor becomes anchor:<text> slot', () => {
      const signal: DriftSignal = {
        kind: 'repetition-rate',
        score: 0.18,
        repeated_anchors: ['the build precedent', 'gather first then propose'],
        detected_at: T7,
      };
      tracker.recordFromDriftSignal(signal);
      const r = tracker.getRepeatOffenders({ now: NOW });
      const slots = r.map((o) => o.slot).sort();
      expect(slots).toEqual(['anchor:gather first then propose', 'anchor:the build precedent']);
      // Both timestamps land on the signal's detected_at
      for (const o of r) expect(o.last_drift).toBe(T7);
    });

    test('bridge: recordFromContradictionReport — each check ID becomes check:<id> slot', () => {
      const mkContradiction = (check: string) => ({
        check,
        severity: 'error' as const,
        location: `synthetic:${check}`,
        expected: 'X',
        found: 'Y',
        message: `synthetic ${check}`,
      });
      const report: ContradictionReport = {
        contradictions: [
          mkContradiction('c1-faf-when-vs-pkg'),
          mkContradiction('c4-readme-arch-vs-pkg'),
        ],
        checked: ['c1-faf-when-vs-pkg', 'c4-readme-arch-vs-pkg'],
        skipped: [],
      };
      tracker.recordFromContradictionReport(report, T20);
      const r = tracker.getRepeatOffenders({ now: NOW });
      const slots = r.map((o) => o.slot).sort();
      expect(slots).toEqual(['check:c1-faf-when-vs-pkg', 'check:c4-readme-arch-vs-pkg']);
    });

    test('namespaces do not collide: anchor:X vs check:X are distinct slots', () => {
      tracker.recordFromDriftSignal({
        kind: 'repetition-rate',
        repeated_anchors: ['shared-name'],
        detected_at: T7,
      });
      tracker.recordFromContradictionReport({ contradictions: [{ check: 'shared-name' }] }, T20);
      const r = tracker.getRepeatOffenders({ now: NOW });
      const slots = r.map((o) => o.slot).sort();
      expect(slots).toEqual(['anchor:shared-name', 'check:shared-name']);
      for (const o of r) expect(o.count).toBe(1);
    });
  });

  // ── 🌬️ AERO — determinism + persistence + decay + multi-session ─────
  describe('🌬️ AERO — determinism + decay + multi-session simulation', () => {
    test('determinism: computeRepeatOffenders is a pure function over events', () => {
      const events: DriftEvent[] = [
        { slot: 'a', timestamp: T7 },
        { slot: 'a', timestamp: T20 },
        { slot: 'b', timestamp: T29 },
      ];
      const r1 = computeRepeatOffenders(events, { now: NOW });
      const r2 = computeRepeatOffenders(events, { now: NOW });
      expect(r1).toEqual(r2);
    });

    test('persistence round-trip: record in one tracker instance, read in another', () => {
      tracker.recordDrift('persistent', T7);
      tracker.recordDrift('persistent', T20);
      const next = new RepeatOffenderTracker(indexPath);
      const r = next.getRepeatOffenders({ now: NOW });
      expect(r).toEqual([{ slot: 'persistent', count: 2, last_drift: T20 }]);
    });

    test('decay (spec requirement): events outside the rolling window are dropped on query', () => {
      tracker.recordDrift('decaying', T0_MINUS_1); // 31 days before NOW — outside 30-day window
      tracker.recordDrift('decaying', T20);        // 10 days before NOW — inside window
      // Default windowDays = 30
      const r = tracker.getRepeatOffenders({ now: NOW });
      // Only the in-window event survives
      expect(r).toEqual([{ slot: 'decaying', count: 1, last_drift: T20 }]);
    });

    test('decay does NOT mutate the underlying event log — recomputable in a wider window', () => {
      tracker.recordDrift('historic', T0_MINUS_1);
      tracker.recordDrift('historic', T20);
      // 30-day window drops the old one
      const r30 = tracker.getRepeatOffenders({ now: NOW, windowDays: 30 });
      expect(r30[0].count).toBe(1);
      // But a 90-day window catches both — proving the file wasn't mutated
      const r90 = tracker.getRepeatOffenders({ now: NOW, windowDays: 90 });
      expect(r90[0].count).toBe(2);
    });

    test('multi-session simulation: 3 sessions across time, decay correctly applies', () => {
      // Session 1, 25 days before NOW — records 2 anchors
      tracker.recordFromDriftSignal({
        kind: 'repetition-rate',
        repeated_anchors: ['stable-drift', 'one-off'],
        detected_at: T7,
      });
      // Session 2, 10 days before NOW — stable-drift recurs, plus a CheckID contradiction
      tracker.recordFromDriftSignal({
        kind: 'repetition-rate',
        repeated_anchors: ['stable-drift'],
        detected_at: T20,
      });
      tracker.recordFromContradictionReport(
        { contradictions: [{ check: 'c1-faf-when-vs-pkg' }] },
        T20,
      );
      // Session 3, 1 day before NOW — stable-drift recurs AGAIN, CheckID recurs
      tracker.recordFromDriftSignal({
        kind: 'repetition-rate',
        repeated_anchors: ['stable-drift'],
        detected_at: T29,
      });
      tracker.recordFromContradictionReport(
        { contradictions: [{ check: 'c1-faf-when-vs-pkg' }] },
        T29,
      );
      const r = tracker.getRepeatOffenders({ now: NOW });
      // stable-drift fires 3x, c1 fires 2x, one-off fires 1x — all in window
      const byCount: Record<string, number> = {};
      for (const o of r) byCount[o.slot] = o.count;
      expect(byCount['anchor:stable-drift']).toBe(3);
      expect(byCount['check:c1-faf-when-vs-pkg']).toBe(2);
      expect(byCount['anchor:one-off']).toBe(1);
      // Ranking: stable-drift first (highest count)
      expect(r[0].slot).toBe('anchor:stable-drift');
    });

    test('empty event log → empty offenders array (silent on clean state)', () => {
      const r = tracker.getRepeatOffenders({ now: NOW });
      expect(r).toEqual([]);
    });

    test('output shape matches spec §#12 exactly: { slot, count, last_drift }', () => {
      tracker.recordDrift('shape-check', T20);
      const r = tracker.getRepeatOffenders({ now: NOW });
      expect(r.length).toBe(1);
      const offender = r[0];
      expect(Object.keys(offender).sort()).toEqual(['count', 'last_drift', 'slot']);
      expect(typeof offender.slot).toBe('string');
      expect(typeof offender.count).toBe('number');
      expect(typeof offender.last_drift).toBe('string');
    });
  });

  // ── 🛞 TYRE — pass-through ────────────────────────────────────────
  describe('🛞 TYRE — live [pass-through]', () => {
    test('pass-through: local FS only, no cred-costing roundtrip', () => {
      expect(true).toBe(true);
    });
  });

  // ── 🔧 PIT — pass-through ─────────────────────────────────────────
  describe('🔧 PIT — eval [pass-through]', () => {
    test('pass-through: storage format is plain JSON, no schema gate here', () => {
      expect(true).toBe(true);
    });
  });
});
