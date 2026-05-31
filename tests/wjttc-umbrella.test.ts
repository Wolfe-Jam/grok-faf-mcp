/**
 * 🏁 WJTTC UMBRELLA — substrate composition shield (1.5 pre-#10 gate)
 *
 * The cross-component integration test. Unit tests prove each brick is solid
 * (BRAKE/ENGINE/AERO/TYRE/PIT per-component). This umbrella proves the bricks
 * FIT TOGETHER — that the data flowing from one component's output is
 * actually accepted (shape + semantics) by the next component's input.
 *
 * Specifically catches:
 *   - `Like` duplicate interface drift (each FS-touching module duplicates the
 *     source-side types to avoid import cycles; if the originals change and
 *     the `Like` copies don't, the duplicates ARE silent-drift candidates)
 *   - Slot namespace collision under combined-source load (`anchor:` from
 *     detectFafmDrift vs `check:` from checkId — both feed the same tracker)
 *   - End-to-end flow contract: detect → record → query → escalate → log
 *
 * Pre-#10 GATE — this shield runs against the 7 shipped substrate components
 * BEFORE #10 (orchestrator) wires them into an MCP tool surface. Misfits
 * caught here cost a typo to fix; misfits caught from inside #10's wiring
 * code cost a refactor.
 *
 * Same role as Doc Gate 101 — mechanical, falsifiable, refuses to skim.
 *
 * Source components (all in main as of 2026-05-30 1.5 substrate):
 *   src/detection/fafm-drift.ts             — detectFafmDrift() → DriftSignal
 *   src/integrity/check-id.ts               — checkId() → ContradictionReport
 *   src/orchestrator/repeat-offender.ts     — RepeatOffenderTracker
 *   src/orchestrator/take-a-hint.ts         — evaluateTakeAHint()
 *   src/orchestrator/refresh-blend.ts       — runRefreshBlend()
 *   src/telemetry/refresh-receipts.ts       — RefreshReceiptsLog
 *
 * The MCP-tool surface (refresh_fafm, refresh_blend) is NOT exercised here —
 * those have their own SDK roundtrip suites. The umbrella is library-layer.
 */
import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

import { detectFafmDrift, type DriftSignal } from '../src/detection/fafm-drift';
import { checkId, type ContradictionReport } from '../src/integrity/check-id';
import { RepeatOffenderTracker } from '../src/orchestrator/repeat-offender';
import { evaluateTakeAHint } from '../src/orchestrator/take-a-hint';
import { runRefreshBlend } from '../src/orchestrator/refresh-blend';
import { RefreshReceiptsLog } from '../src/telemetry/refresh-receipts';

// ── Fixtures ──────────────────────────────────────────────────────────────

/** A `.fafm` content fixture that the drift detector WILL flag (above default 10%). */
const DRIFTY_FAFM = [
  'version: "1.0"',
  'memory:',
  '  facts:',
  '    - text: "the build precedent is that we gather first then propose then code carefully."',
  '      id: "drift-1"',
  '    - text: "Per the build precedent we gather first then propose then code on every task."',
  '      id: "drift-2"',
  '    - text: "Reminding myself: the build precedent says gather first then propose then act."',
  '      id: "drift-3"',
  '    - text: "Apply the build precedent — gather first then propose then ship the code."',
  '      id: "drift-4"',
  '    - text: "Per build precedent doctrine we gather first then propose changes to code."',
  '      id: "drift-5"',
  '    - text: "Operating model: build precedent applies, we gather first then propose code."',
  '      id: "drift-6"',
  '',
].join('\n');

/** A `.faf` + package.json pair where checkId WILL find contradictions. */
const STALE_FAF = [
  'faf_version: "3.0"',
  'human_context:',
  '  when: current v1.3.1',
  '',
].join('\n');
const FRESH_PKG = JSON.stringify({ name: 'umbrella-fixture', version: '1.4.9' });

let tmpDir: string;
let trackerPath: string;
let receiptsPath: string;
let tracker: RepeatOffenderTracker;
let receipts: RefreshReceiptsLog;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'faf-umbrella-'));
  trackerPath = path.join(tmpDir, '.faf-drift-index.json');
  receiptsPath = path.join(tmpDir, '.faf-refresh-receipts.json');
  tracker = new RepeatOffenderTracker(trackerPath);
  receipts = new RefreshReceiptsLog(receiptsPath);
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

const T_NOW = '2026-05-30T23:50:00Z';
const T_OLDER = '2026-05-30T22:00:00Z';

describe('🏁 WJTTC UMBRELLA — substrate composition (pre-#10 gate)', () => {
  // ── Bridge 1: detectFafmDrift → RepeatOffenderTracker ───────────────────
  describe('Bridge: detectFafmDrift → RepeatOffenderTracker.recordFromDriftSignal', () => {
    test('DriftSignal from detector is accepted by tracker bridge (no shape drift)', () => {
      const signal = detectFafmDrift(DRIFTY_FAFM);
      expect(signal).not.toBeNull();
      // The shape contract: tracker.recordFromDriftSignal accepts the canonical
      // DriftSignal directly (the Like duplicates were eliminated in PR 1 — types
      // now live in `src/types/drift-signals.ts` as one source of truth).
      tracker.recordFromDriftSignal(signal as DriftSignal);
      const offenders = tracker.getRepeatOffenders({ now: T_NOW });
      expect(offenders.length).toBeGreaterThan(0);
    });

    test('every anchor from the signal becomes a tracker slot in the `anchor:` namespace', () => {
      const signal = detectFafmDrift(DRIFTY_FAFM)!;
      tracker.recordFromDriftSignal(signal);
      const offenders = tracker.getRepeatOffenders({ now: T_NOW });
      const recordedSlots = offenders.map((o) => o.slot);
      for (const anchor of signal.repeated_anchors) {
        expect(recordedSlots).toContain(`anchor:${anchor}`);
      }
    });

    test("detected_at from the signal becomes the event timestamp (caller's clock honored)", () => {
      const signal = detectFafmDrift(DRIFTY_FAFM)!;
      tracker.recordFromDriftSignal(signal);
      const offenders = tracker.getRepeatOffenders({ now: T_NOW });
      for (const o of offenders) {
        // last_drift on each anchor slot should equal the signal's detected_at
        expect(o.last_drift).toBe(signal.detected_at);
      }
    });
  });

  // ── Bridge 2: checkId → RepeatOffenderTracker ──────────────────────────
  describe('Bridge: checkId → RepeatOffenderTracker.recordFromContradictionReport', () => {
    test('ContradictionReport from checkId is accepted by tracker bridge (no shape drift)', () => {
      const report = checkId(STALE_FAF, undefined, { packageJson: FRESH_PKG });
      expect(report.contradictions.length).toBeGreaterThan(0);
      tracker.recordFromContradictionReport(report, T_NOW);
      const offenders = tracker.getRepeatOffenders({ now: T_NOW });
      expect(offenders.length).toBeGreaterThan(0);
    });

    test('every contradiction check ID becomes a tracker slot in the `check:` namespace', () => {
      const report = checkId(STALE_FAF, undefined, { packageJson: FRESH_PKG });
      tracker.recordFromContradictionReport(report, T_NOW);
      const offenders = tracker.getRepeatOffenders({ now: T_NOW });
      const recordedSlots = offenders.map((o) => o.slot);
      for (const c of report.contradictions) {
        expect(recordedSlots).toContain(`check:${c.check}`);
      }
    });
  });

  // ── Cross-source namespace separation under combined load ──────────────
  describe('Namespace separation: both bridges into one tracker, no collision', () => {
    test('anchor: and check: slots stay disjoint when both bridges fire on the same tracker', () => {
      // Fire BOTH source types into the same tracker instance.
      const driftSignal = detectFafmDrift(DRIFTY_FAFM)!;
      const contradictionReport = checkId(STALE_FAF, undefined, { packageJson: FRESH_PKG });
      tracker.recordFromDriftSignal(driftSignal);
      tracker.recordFromContradictionReport(contradictionReport, T_NOW);

      const offenders = tracker.getRepeatOffenders({ now: T_NOW });
      const anchorSlots = offenders.filter((o) => o.slot.startsWith('anchor:'));
      const checkSlots = offenders.filter((o) => o.slot.startsWith('check:'));

      // Both populated; neither swallowed by the other.
      expect(anchorSlots.length).toBeGreaterThan(0);
      expect(checkSlots.length).toBeGreaterThan(0);

      // No slot has BOTH prefixes (would mean a namespace bug).
      for (const o of offenders) {
        const hasAnchor = o.slot.startsWith('anchor:');
        const hasCheck = o.slot.startsWith('check:');
        expect(hasAnchor && hasCheck).toBe(false);
      }

      // Total = sum of both namespaces (no merging / no losses).
      expect(offenders.length).toBe(anchorSlots.length + checkSlots.length);
    });

    test("a shared underlying name doesn't collide across namespaces (anchor:X vs check:X are distinct)", () => {
      // Synthesize signals with a deliberately shared bare name to prove the
      // prefix is load-bearing.
      tracker.recordFromDriftSignal({
        kind: 'repetition-rate',
        repeated_anchors: ['shared-name'],
        detected_at: T_OLDER,
      });
      tracker.recordFromContradictionReport(
        { contradictions: [{ check: 'shared-name' }] },
        T_NOW,
      );
      const offenders = tracker.getRepeatOffenders({ now: T_NOW });
      const slots = offenders.map((o) => o.slot).sort();
      expect(slots).toEqual(['anchor:shared-name', 'check:shared-name']);
      // Each is count=1 — proves they didn't merge into a single slot.
      for (const o of offenders) expect(o.count).toBe(1);
    });
  });

  // ── Bridge 3: tracker count → take-a-hint escalation ───────────────────
  describe('Bridge: RepeatOffenderTracker.count → evaluateTakeAHint(drift_recurrence)', () => {
    test('tracker count is consumed by escalation ladder as drift_recurrence; ladder fires', () => {
      // Manually drive the tracker count up so the ladder has something to escalate on.
      for (let i = 0; i < 3; i++) {
        tracker.recordDrift('anchor:build precedent', `2026-05-30T${10 + i}:00:00Z`);
      }
      const offenders = tracker.getRepeatOffenders({ now: T_NOW });
      expect(offenders.length).toBe(1);
      const recurrence = offenders[0].count;
      expect(recurrence).toBe(3);

      const level = evaluateTakeAHint({
        recent_recommendations: [
          { timestamp: '2026-05-30T11:00:00Z', acknowledged: false },
          { timestamp: '2026-05-30T12:00:00Z', acknowledged: false },
        ],
        ignored_count: 2,
        drift_recurrence: recurrence, // ← bridge: tracker count IS the recurrence axis
      });
      // 2 ignored + 3 recurrence = hard rung (default thresholds: ignored>=2, recurrence>=3)
      expect(level).toBe('hard');
    });
  });

  // ── Bridge 4: DriftSignal → receipts.drift_signal ──────────────────────
  describe('Bridge: detectFafmDrift output → RefreshReceiptsLog.drift_signal', () => {
    test('DriftSignal embeds into a receipt; round-trip preserves the full signal shape', () => {
      const signal = detectFafmDrift(DRIFTY_FAFM)!;
      receipts.recordReceipt({
        trigger: 'auto',
        mode: 'blend',
        drift_signal: signal, // ← bridge: receipt accepts the detector's output verbatim
        fired_at: T_NOW,
      });
      const read = receipts.readReceipts();
      expect(read.length).toBe(1);
      expect(read[0].drift_signal).toEqual(signal);
      // Sanity — the embedded signal still has the fields the detector emitted.
      expect((read[0].drift_signal as DriftSignal).kind).toBe('repetition-rate');
      expect((read[0].drift_signal as DriftSignal).repeated_anchors).toEqual(signal.repeated_anchors);
    });
  });

  // ── End-to-end: detect → record → query → escalate → fire → log ────────
  describe('End-to-end flow: detect → record → query → escalate → fire (mocked) → log', () => {
    test('full substrate composition across 3 simulated sessions', async () => {
      // ── Session 1: detection fires, tracker records, ladder reads, no fire yet
      const signal1 = detectFafmDrift(DRIFTY_FAFM)!;
      tracker.recordFromDriftSignal(signal1);
      const s1Offenders = tracker.getRepeatOffenders({ now: T_NOW });
      const s1Top = s1Offenders[0];
      const s1Level = evaluateTakeAHint({
        recent_recommendations: [],
        ignored_count: 0,
        drift_recurrence: s1Top.count,
      });
      // First session: nothing ignored yet → ladder silent
      expect(s1Level).toBe('none');

      // ── Session 2: detection fires AGAIN, signal2 has same anchors → tracker counts climb
      const signal2 = detectFafmDrift(DRIFTY_FAFM)!;
      tracker.recordFromDriftSignal(signal2);
      const s2Offenders = tracker.getRepeatOffenders({ now: T_NOW });
      const s2Top = s2Offenders[0];
      // Top anchor now seen across 2 distinct signal emissions
      expect(s2Top.count).toBe(2);

      // ── Session 3: third detection + a CheckID contradiction recorded too
      const signal3 = detectFafmDrift(DRIFTY_FAFM)!;
      tracker.recordFromDriftSignal(signal3);
      const report = checkId(STALE_FAF, undefined, { packageJson: FRESH_PKG });
      tracker.recordFromContradictionReport(report, T_NOW);
      const s3Offenders = tracker.getRepeatOffenders({ now: T_NOW });
      const s3Top = s3Offenders[0];
      expect(s3Top.count).toBe(3); // top anchor across 3 sessions

      // Ladder now fires (3 recurrence + 2 ignored = hard rung)
      const s3Level = evaluateTakeAHint({
        recent_recommendations: [
          { timestamp: '2026-05-30T20:00:00Z', acknowledged: false },
          { timestamp: '2026-05-30T21:00:00Z', acknowledged: false },
        ],
        ignored_count: 2,
        drift_recurrence: s3Top.count,
      });
      expect(s3Level).toBe('hard');

      // ── Fire a refresh via runRefreshBlend with mock callables; log a receipt
      let fafCalled = 0;
      let fafmCalled = 0;
      const blendResult = await runRefreshBlend(
        { mode: 'blend' },
        {
          refreshFaf: async () => {
            fafCalled++;
            return { tool: 'faf', ok: true };
          },
          refreshFafm: async () => {
            fafmCalled++;
            return { tool: 'fafm', ok: true };
          },
        },
      );
      // Blend fired BOTH layers (per locked doctrine)
      expect(fafCalled).toBe(1);
      expect(fafmCalled).toBe(1);
      expect(blendResult.mode).toBe('blend');

      // Log the auto-fire receipt with the signal that triggered it + the result
      receipts.recordReceipt({
        trigger: 'auto',
        mode: 'blend',
        drift_signal: signal3, // the signal that motivated this fire
        fired_at: T_NOW,
        refresh_result: blendResult,
      });

      // ── Verify the full audit trail
      const receiptLog = receipts.readReceipts();
      expect(receiptLog.length).toBe(1);
      expect(receiptLog[0].trigger).toBe('auto');
      expect(receiptLog[0].mode).toBe('blend');
      expect((receiptLog[0].drift_signal as DriftSignal).kind).toBe('repetition-rate');
      expect((receiptLog[0].refresh_result as { mode: string }).mode).toBe('blend');
    });

    test('acknowledgement reset: ladder drops to none after user acks the latest hint', () => {
      // Build up a state that would otherwise be at 'hard'
      for (let i = 0; i < 3; i++) {
        tracker.recordDrift('anchor:repeating-issue', `2026-05-30T${10 + i}:00:00Z`);
      }
      const recurrence = tracker.getRepeatOffenders({ now: T_NOW })[0].count;

      // Without ack — would be hard
      const beforeAck = evaluateTakeAHint({
        recent_recommendations: [
          { timestamp: '2026-05-30T11:00:00Z', acknowledged: false },
          { timestamp: '2026-05-30T12:00:00Z', acknowledged: false },
        ],
        ignored_count: 2,
        drift_recurrence: recurrence,
      });
      expect(beforeAck).toBe('hard');

      // User acks the latest recommendation
      const afterAck = evaluateTakeAHint({
        recent_recommendations: [
          { timestamp: '2026-05-30T11:00:00Z', acknowledged: false },
          { timestamp: '2026-05-30T12:00:00Z', acknowledged: true }, // ack!
        ],
        ignored_count: 2,
        drift_recurrence: recurrence,
      });
      expect(afterAck).toBe('none');
    });
  });

  // ── Persistence: state survives across "process restarts" (new instances) ──
  describe('Persistence: state composes across simulated process restarts', () => {
    test('tracker + receipts both survive: write in instance A, read in instance B', () => {
      // Instance A — writes
      tracker.recordFromDriftSignal(detectFafmDrift(DRIFTY_FAFM)!);
      receipts.recordReceipt({
        trigger: 'manual',
        mode: 'nuke',
        fired_at: T_NOW,
        refresh_result: { mode: 'nuke', ok: true },
      });

      // Instance B — fresh constructors pointing at the same files
      const trackerB = new RepeatOffenderTracker(trackerPath);
      const receiptsB = new RefreshReceiptsLog(receiptsPath);
      expect(trackerB.getRepeatOffenders({ now: T_NOW }).length).toBeGreaterThan(0);
      expect(receiptsB.readReceipts().length).toBe(1);
      expect(receiptsB.readReceipts()[0].mode).toBe('nuke');
    });
  });

  // ── Empty-state composition (silent on clean state) ────────────────────
  describe('Silent-on-clean composition: empty state propagates honestly', () => {
    test('null detection → no tracker writes → empty ladder input → none', () => {
      const cleanFafm = [
        'version: "1.0"',
        'memory:',
        '  facts:',
        '    - text: "wholly distinct content about Rust and Foundry"',
        '      id: "c1"',
        '      timestamp: "2026-05-30T10:00:00Z"',
        '    - text: "totally separate idea about ZEPH and edge delivery"',
        '      id: "c2"',
        '      timestamp: "2026-05-30T11:00:00Z"',
        '',
      ].join('\n');
      const signal = detectFafmDrift(cleanFafm);
      expect(signal).toBeNull(); // detector silent on clean

      // No bridge write — tracker stays empty
      const offenders = tracker.getRepeatOffenders({ now: T_NOW });
      expect(offenders).toEqual([]);

      // Ladder with no recurrence + no ignores → none
      const level = evaluateTakeAHint({
        recent_recommendations: [],
        ignored_count: 0,
        drift_recurrence: 0,
      });
      expect(level).toBe('none');
    });

    test('clean checkId report (no contradictions) → empty bridge write → no slot pollution', () => {
      const coherentFaf = [
        'faf_version: "3.0"',
        'human_context:',
        '  when: current v1.4.9',
        '',
      ].join('\n');
      const coherentPkg = JSON.stringify({ name: 'umbrella', version: '1.4.9' });
      const report = checkId(coherentFaf, undefined, { packageJson: coherentPkg });
      expect(report.contradictions).toEqual([]);

      // Bridge with empty contradictions should be a silent no-op (proven in #12)
      tracker.recordFromContradictionReport(report, T_NOW);
      // No file should exist if no events appended
      expect(fs.existsSync(trackerPath)).toBe(false);
    });
  });
});
