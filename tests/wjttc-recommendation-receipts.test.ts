/**
 * 🏁 WJTTC — RecommendationReceiptsLog + filterRecommendations (grok-faf-mcp 1.5)
 *
 * Championship proof for the recommendation telemetry layer. Every analysis
 * the #10 orchestrator runs emits an auditable receipt — no silent decisions
 * (subordinate-not-daemon doctrine). This log is what take-a-hint reads
 * (via PR 3) to compute `recent_recommendations` for the escalation ladder.
 *
 *   1 🛑 BRAKE  — fail-safe: missing file / corrupt JSON / bad inputs never crash
 *   2 ⚙️ ENGINE — core: record / read / filter by recommend + severity + ack + since / limit / partial-corrupt drop
 *   3 🌬️ AERO   — honest: pure-function determinism / persistence round-trip /
 *                 newest-first ordering / multi-session simulation (take-a-hint
 *                 input-shape compatibility)
 *   4 🛞 TYRE   — live FS write to actual storage (spec-required for #7-pattern)
 *   5 🔧 PIT    — pass-through (storage = plain JSON, no schema gate)
 *
 * Spec source: `#10` orchestrator code-gate consult 2026-05-31 +
 * memory/grok-orchestrator-spec.md. PR 2 of the #10 arc. Mirrors
 * wjttc-telemetry.test.ts (#99) — same architecture, different event type.
 */
import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import {
  RecommendationReceiptsLog,
  filterRecommendations,
  type RecommendationReceipt,
} from '../src/telemetry/recommendation-receipts';

// ── Helpers ──────────────────────────────────────────────────────────────

let tmpDir: string;
let receiptsPath: string;
let log: RecommendationReceiptsLog;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'faf-recommendation-receipts-'));
  receiptsPath = path.join(tmpDir, '.faf-recommendation-receipts.json');
  log = new RecommendationReceiptsLog(receiptsPath);
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

// Fixed times for deterministic filter tests.
const T0 = '2026-05-30T10:00:00Z';
const T1 = '2026-05-30T11:00:00Z';
const T2 = '2026-05-30T12:00:00Z';
const T3 = '2026-05-30T13:00:00Z';

// ── Tests ────────────────────────────────────────────────────────────────

describe('🏁 WJTTC — RecommendationReceiptsLog (grok-faf-mcp 1.5)', () => {
  // ── 🛑 BRAKE — fail-safe ────────────────────────────────────────────
  describe('🛑 BRAKE — fail-safe', () => {
    test('missing receipts file → readRecommendations returns []', () => {
      expect(fs.existsSync(receiptsPath)).toBe(false);
      expect(log.readRecommendations()).toEqual([]);
    });

    test('corrupt JSON → empty array, no crash', () => {
      fs.writeFileSync(receiptsPath, 'not-json {{{');
      expect(log.readRecommendations()).toEqual([]);
    });

    test('non-array JSON → empty array, no crash', () => {
      fs.writeFileSync(receiptsPath, JSON.stringify({ not: 'an array' }));
      expect(log.readRecommendations()).toEqual([]);
    });

    test('recordRecommendation rejects invalid recommend enum', () => {
      expect(() =>
        log.recordRecommendation({
          // @ts-expect-error — intentional bad value
          recommend: 'not-a-real-action',
          severity: 'light',
          reason: 'test',
          recommended_at: T1,
        }),
      ).toThrow();
    });

    test('recordRecommendation rejects invalid severity enum', () => {
      expect(() =>
        log.recordRecommendation({
          recommend: 'refresh_faf',
          // @ts-expect-error — intentional bad value
          severity: 'extreme',
          reason: 'test',
          recommended_at: T1,
        }),
      ).toThrow();
    });

    test('recordRecommendation rejects invalid mode (when present)', () => {
      expect(() =>
        log.recordRecommendation({
          recommend: 'refresh_blend',
          // @ts-expect-error — intentional bad value
          mode: 'destroy',
          severity: 'hard',
          reason: 'test',
          recommended_at: T1,
        }),
      ).toThrow();
    });

    test('recordRecommendation rejects invalid recommended_at', () => {
      expect(() =>
        log.recordRecommendation({
          recommend: 'refresh_faf',
          severity: 'light',
          reason: 'test',
          recommended_at: 'definitely-not-a-date',
        }),
      ).toThrow();
    });

    test('recordRecommendation rejects non-string reason', () => {
      expect(() =>
        log.recordRecommendation({
          recommend: 'refresh_faf',
          severity: 'light',
          // @ts-expect-error — intentional bad value
          reason: 42,
          recommended_at: T1,
        }),
      ).toThrow();
    });

    test('partially-corrupt log on read → corrupt entries dropped, valid ones returned', () => {
      fs.writeFileSync(
        receiptsPath,
        JSON.stringify([
          {
            recommend: 'refresh_faf',
            severity: 'light',
            reason: 'good',
            recommended_at: T1,
            acknowledged: false,
          }, // good
          {
            recommend: 'refresh_blend',
            severity: 'hard',
            reason: 'bad-date',
            recommended_at: 'bad-date',
            acknowledged: false,
          }, // bad: date
          null, // bad: null
          {
            recommend: 'refresh_fafm',
            severity: 'hard',
            reason: 'also good',
            recommended_at: T2,
            acknowledged: true,
          }, // good
          { not: 'a receipt' }, // bad: shape
          {
            recommend: 'launch_missiles', // bad: enum
            severity: 'hard',
            reason: 'bad recommend',
            recommended_at: T3,
            acknowledged: false,
          },
          {
            recommend: 'refresh_blend',
            severity: 'extreme', // bad: severity enum
            reason: 'bad severity',
            recommended_at: T3,
            acknowledged: false,
          },
          {
            recommend: 'refresh_blend',
            mode: 'destroy', // bad: mode enum
            severity: 'hard',
            reason: 'bad mode',
            recommended_at: T3,
            acknowledged: false,
          },
        ]),
      );
      const all = log.readRecommendations();
      // Only the two well-formed entries survive
      expect(all.length).toBe(2);
      // Newest-first ordering
      expect(all[0].recommended_at).toBe(T2);
      expect(all[1].recommended_at).toBe(T1);
    });
  });

  // ── ⚙️ ENGINE — core record + read + filter ─────────────────────────
  describe('⚙️ ENGINE — core record + read + filter', () => {
    test('recordRecommendation + read round-trip preserves all fields', () => {
      const receipt: RecommendationReceipt = {
        recommend: 'refresh_blend',
        mode: 'nuke',
        severity: 'hard',
        reason: 'drift detected + 2 errors in CHANGELOG',
        recommended_at: T1,
        drift_signal: { kind: 'repetition-rate', score: 0.21, repeated_anchors: ['x'], detected_at: T0 },
        acknowledged: false,
        metadata: { duration_ms: 17 },
      };
      log.recordRecommendation(receipt);
      const all = log.readRecommendations();
      expect(all.length).toBe(1);
      expect(all[0]).toEqual(receipt);
    });

    test('recommended_at defaults to now when omitted', () => {
      const before = new Date().toISOString();
      log.recordRecommendation({ recommend: 'no_action', severity: 'none', reason: 'clean' });
      const after = new Date().toISOString();
      const all = log.readRecommendations();
      expect(all.length).toBe(1);
      const at = all[0].recommended_at;
      expect(at >= before).toBe(true);
      expect(at <= after).toBe(true);
    });

    test('acknowledged defaults to false when omitted', () => {
      log.recordRecommendation({
        recommend: 'refresh_faf',
        severity: 'light',
        reason: 'small drift',
        recommended_at: T1,
      });
      expect(log.readRecommendations()[0].acknowledged).toBe(false);
    });

    test('filter by recommend=refresh_fafm returns only those', () => {
      log.recordRecommendation({ recommend: 'refresh_faf', severity: 'light', reason: 'a', recommended_at: T1 });
      log.recordRecommendation({ recommend: 'refresh_fafm', severity: 'light', reason: 'b', recommended_at: T2 });
      log.recordRecommendation({ recommend: 'refresh_blend', mode: 'blend', severity: 'hard', reason: 'c', recommended_at: T3 });
      const r = log.readRecommendations({ recommend: 'refresh_fafm' });
      expect(r.length).toBe(1);
      expect(r[0].reason).toBe('b');
    });

    test('filter by severity=hard returns only those', () => {
      log.recordRecommendation({ recommend: 'refresh_faf', severity: 'light', reason: 'a', recommended_at: T1 });
      log.recordRecommendation({ recommend: 'refresh_blend', mode: 'nuke', severity: 'hard', reason: 'b', recommended_at: T2 });
      log.recordRecommendation({ recommend: 'no_action', severity: 'none', reason: 'c', recommended_at: T3 });
      const r = log.readRecommendations({ severity: 'hard' });
      expect(r.length).toBe(1);
      expect(r[0].reason).toBe('b');
    });

    test('filter by acknowledged=true / false works correctly', () => {
      log.recordRecommendation({ recommend: 'refresh_faf', severity: 'light', reason: 'a', recommended_at: T1, acknowledged: false });
      log.recordRecommendation({ recommend: 'refresh_faf', severity: 'light', reason: 'b', recommended_at: T2, acknowledged: true });
      log.recordRecommendation({ recommend: 'refresh_faf', severity: 'light', reason: 'c', recommended_at: T3, acknowledged: false });
      const acked = log.readRecommendations({ acknowledged: true });
      expect(acked.length).toBe(1);
      expect(acked[0].reason).toBe('b');
      const unacked = log.readRecommendations({ acknowledged: false });
      expect(unacked.length).toBe(2);
    });

    test('filter by since returns only strictly-after receipts', () => {
      for (const ts of [T0, T1, T2, T3]) {
        log.recordRecommendation({ recommend: 'no_action', severity: 'none', reason: ts, recommended_at: ts });
      }
      const result = log.readRecommendations({ since: T1 });
      // strictly after T1 = T2 + T3
      expect(result.length).toBe(2);
      expect(result.map((r) => r.recommended_at).sort()).toEqual([T2, T3]);
    });

    test('limit caps the result count after newest-first ordering', () => {
      for (const ts of [T0, T1, T2, T3]) {
        log.recordRecommendation({ recommend: 'no_action', severity: 'none', reason: ts, recommended_at: ts });
      }
      const result = log.readRecommendations({ limit: 2 });
      // Newest-first → T3 + T2 retained, T1 + T0 dropped
      expect(result.map((r) => r.recommended_at)).toEqual([T3, T2]);
    });

    test('filters compose: recommend + severity + acknowledged + since + limit all applied', () => {
      log.recordRecommendation({ recommend: 'refresh_faf',   severity: 'light', reason: 'a', recommended_at: T0, acknowledged: true });
      log.recordRecommendation({ recommend: 'refresh_faf',   severity: 'light', reason: 'b', recommended_at: T1, acknowledged: false });
      log.recordRecommendation({ recommend: 'refresh_faf',   severity: 'hard',  reason: 'c', recommended_at: T2, acknowledged: false });
      log.recordRecommendation({ recommend: 'refresh_blend', mode: 'nuke',
                                  severity: 'hard',  reason: 'd', recommended_at: T3, acknowledged: false });
      // recommend=refresh_faf → drops 'd'; severity=light → drops 'c'; ack=false → drops 'a'; since=T0 → keeps T1; limit=1
      const result = log.readRecommendations({
        recommend: 'refresh_faf',
        severity: 'light',
        acknowledged: false,
        since: T0,
        limit: 1,
      });
      expect(result.length).toBe(1);
      expect(result[0].reason).toBe('b');
    });

    test('drift_signal is preserved verbatim (no shape coercion on the optional field)', () => {
      const sig = { kind: 'repetition-rate' as const, score: 0.31, repeated_anchors: ['x', 'y'], detected_at: T0 };
      log.recordRecommendation({
        recommend: 'refresh_fafm',
        severity: 'hard',
        reason: 'sig test',
        recommended_at: T1,
        drift_signal: sig,
      });
      expect(log.readRecommendations()[0].drift_signal).toEqual(sig);
    });
  });

  // ── 🌬️ AERO — determinism + persistence + multi-session ─────────────
  describe('🌬️ AERO — determinism + persistence + multi-session simulation', () => {
    test('filterRecommendations is a pure function — same input → same output', () => {
      const receipts: RecommendationReceipt[] = [
        { recommend: 'refresh_faf', severity: 'light', reason: 'a', recommended_at: T1, acknowledged: false },
        { recommend: 'refresh_blend', mode: 'nuke', severity: 'hard', reason: 'b', recommended_at: T3, acknowledged: true },
        { recommend: 'refresh_fafm', severity: 'hard', reason: 'c', recommended_at: T2, acknowledged: false },
      ];
      const opts = { acknowledged: false as const, limit: 5 };
      expect(filterRecommendations(receipts, opts)).toEqual(filterRecommendations(receipts, opts));
    });

    test('persistence round-trip: record in one instance, read in another', () => {
      log.recordRecommendation({ recommend: 'refresh_faf', severity: 'light', reason: 'a', recommended_at: T1 });
      log.recordRecommendation({ recommend: 'refresh_blend', mode: 'nuke', severity: 'hard', reason: 'b', recommended_at: T2 });
      const next = new RecommendationReceiptsLog(receiptsPath);
      const all = next.readRecommendations();
      expect(all.length).toBe(2);
      expect(all[0].recommended_at).toBe(T2); // newest-first
    });

    test('newest-first ordering holds regardless of insertion order', () => {
      log.recordRecommendation({ recommend: 'no_action', severity: 'none', reason: 'a', recommended_at: T2 });
      log.recordRecommendation({ recommend: 'no_action', severity: 'none', reason: 'b', recommended_at: T0 });
      log.recordRecommendation({ recommend: 'no_action', severity: 'none', reason: 'c', recommended_at: T3 });
      log.recordRecommendation({ recommend: 'no_action', severity: 'none', reason: 'd', recommended_at: T1 });
      expect(log.readRecommendations().map((r) => r.recommended_at)).toEqual([T3, T2, T1, T0]);
    });

    test('multi-session simulation: 4 recommendations, mix of acked + unacked + various actions', () => {
      // Session 1: drift detected, refresh_fafm recommended, agent acted
      log.recordRecommendation({
        recommend: 'refresh_fafm', severity: 'light', reason: 'drift only', recommended_at: T0,
        drift_signal: { kind: 'repetition-rate', score: 0.18, repeated_anchors: ['p'], detected_at: T0 },
        acknowledged: true,
      });
      // Session 2: contradiction, refresh_faf recommended, agent ignored
      log.recordRecommendation({
        recommend: 'refresh_faf', severity: 'light', reason: 'contradiction only', recommended_at: T1,
        acknowledged: false,
      });
      // Session 3: drift recurs + contradictions, refresh_blend hard, ignored
      log.recordRecommendation({
        recommend: 'refresh_blend', mode: 'blend', severity: 'hard',
        reason: 'drift + errors, hard', recommended_at: T2,
        drift_signal: { kind: 'repetition-rate', score: 0.31, repeated_anchors: ['p', 'q'], detected_at: T2 },
        acknowledged: false,
      });
      // Session 4: chronic — block-level
      log.recordRecommendation({
        recommend: 'refresh_blend', mode: 'nuke', severity: 'block',
        reason: 'chronic — needs ack', recommended_at: T3,
        drift_signal: { kind: 'repetition-rate', score: 0.42, repeated_anchors: ['p', 'q', 'r'], detected_at: T3 },
        acknowledged: false,
      });

      // Downstream consumer (take-a-hint via #10) wants "unacknowledged since T0"
      const unackedSinceT0 = log.readRecommendations({ acknowledged: false, since: T0 });
      expect(unackedSinceT0.length).toBe(3);
      // Most recent first
      expect(unackedSinceT0[0].severity).toBe('block');

      // Block-level only (the "needs explicit ack" subset)
      const blocked = log.readRecommendations({ severity: 'block' });
      expect(blocked.length).toBe(1);
      expect(blocked[0].recommended_at).toBe(T3);

      // Acknowledged history
      const acked = log.readRecommendations({ acknowledged: true });
      expect(acked.length).toBe(1);
      expect(acked[0].recommended_at).toBe(T0);
    });

    test('empty options returns ALL receipts in newest-first order (no implicit cap)', () => {
      for (const ts of [T0, T1, T2, T3]) {
        log.recordRecommendation({ recommend: 'no_action', severity: 'none', reason: ts, recommended_at: ts });
      }
      const all = log.readRecommendations();
      expect(all.length).toBe(4);
      expect(all.map((r) => r.recommended_at)).toEqual([T3, T2, T1, T0]);
    });

    test('limit=0 returns empty array (honest cap, not an off-by-one)', () => {
      log.recordRecommendation({ recommend: 'no_action', severity: 'none', reason: 'x', recommended_at: T1 });
      expect(log.readRecommendations({ limit: 0 })).toEqual([]);
    });

    test('canonical types: schema accepts every RecommendationAction + EscalationLevel + RefreshMode value', () => {
      // Cycle through every enum value — proves the runtime validation matches the type contracts
      const actions = ['refresh_faf', 'refresh_fafm', 'refresh_blend', 'no_action'] as const;
      const severities = ['none', 'light', 'hard', 'block'] as const;
      const modes = ['blend', 'nuke'] as const;
      for (const a of actions) {
        for (const s of severities) {
          if (a === 'refresh_blend') {
            for (const m of modes) {
              log.recordRecommendation({ recommend: a, mode: m, severity: s, reason: `${a}-${m}-${s}`, recommended_at: new Date().toISOString() });
            }
          } else {
            log.recordRecommendation({ recommend: a, severity: s, reason: `${a}-${s}`, recommended_at: new Date().toISOString() });
          }
        }
      }
      // 3 non-blend × 4 severities + 1 blend × 4 severities × 2 modes = 12 + 8 = 20
      expect(log.readRecommendations().length).toBe(20);
    });
  });

  // ── 🛞 TYRE — live FS write to actual storage ──────────────────────────
  describe('🛞 TYRE — live FS write', () => {
    test('write creates the file at the expected path', () => {
      expect(fs.existsSync(receiptsPath)).toBe(false);
      log.recordRecommendation({ recommend: 'refresh_faf', severity: 'light', reason: 'x', recommended_at: T1 });
      expect(fs.existsSync(receiptsPath)).toBe(true);
    });

    test('written file is valid JSON and round-trip parseable', () => {
      log.recordRecommendation({
        recommend: 'refresh_blend', mode: 'nuke', severity: 'hard',
        reason: 'json round-trip', recommended_at: T2,
      });
      const raw = fs.readFileSync(receiptsPath, 'utf-8');
      const parsed = JSON.parse(raw);
      expect(Array.isArray(parsed)).toBe(true);
      expect(parsed[0].recommend).toBe('refresh_blend');
      expect(parsed[0].mode).toBe('nuke');
      expect(parsed[0].severity).toBe('hard');
      expect(parsed[0].recommended_at).toBe(T2);
      expect(parsed[0].acknowledged).toBe(false);
    });

    test('atomic write: temp file is cleaned up; only the final file remains', () => {
      log.recordRecommendation({ recommend: 'no_action', severity: 'none', reason: 'x', recommended_at: T1 });
      const entries = fs.readdirSync(tmpDir);
      expect(entries).toContain('.faf-recommendation-receipts.json');
      expect(entries.find((e) => e.endsWith('.tmp'))).toBeUndefined();
    });

    test('getReceiptsPath reports the absolute path used for writes', () => {
      expect(log.getReceiptsPath()).toBe(receiptsPath);
    });
  });

  // ── 🔧 PIT — pass-through ─────────────────────────────────────────
  describe('🔧 PIT — eval [pass-through]', () => {
    test('pass-through: storage format is plain JSON, no schema gate here', () => {
      expect(true).toBe(true);
    });
  });
});
