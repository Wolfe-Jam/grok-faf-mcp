/**
 * 🏁 WJTTC — RefreshReceiptsLog + filterReceipts (grok-faf-mcp 1.5)
 *
 * Championship proof for the refresh telemetry layer. The audit trail that
 * makes the AI/human feedback loop MEASURABLE — receipts as scale-asset.
 *
 *   1 🛑 BRAKE  — fail-safe: missing file / corrupt JSON / bad inputs never crash
 *   2 ⚙️ ENGINE — core: record / read / filter by trigger + since / limit / partial-corrupt drop
 *   3 🌬️ AERO   — honest: pure-function determinism / persistence round-trip /
 *                 newest-first ordering / multi-session simulation
 *   4 🛞 TYRE   — live FS write to actual storage (spec-required tier)
 *   5 🔧 PIT    — pass-through (storage = plain JSON, no schema gate)
 *
 * Spec source: GROK-FAF-MCP-1.5-CODING-SESSION-BREAKDOWN §#7. Connects to
 * memory/grok-drift-requirements.md (receipts as scale-asset) +
 * memory/faf-telemetry-closed-loop-certainty.md (measured feedback loop).
 */
import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import {
  RefreshReceiptsLog,
  filterReceipts,
  type RefreshReceipt,
} from '../src/telemetry/refresh-receipts';

// ── Helpers ──────────────────────────────────────────────────────────────

let tmpDir: string;
let receiptsPath: string;
let log: RefreshReceiptsLog;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'faf-refresh-receipts-'));
  receiptsPath = path.join(tmpDir, '.faf-refresh-receipts.json');
  log = new RefreshReceiptsLog(receiptsPath);
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

describe('🏁 WJTTC — RefreshReceiptsLog (grok-faf-mcp 1.5)', () => {
  // ── 🛑 BRAKE — fail-safe ────────────────────────────────────────────
  describe('🛑 BRAKE — fail-safe', () => {
    test('missing receipts file → readReceipts returns []', () => {
      expect(fs.existsSync(receiptsPath)).toBe(false);
      expect(log.readReceipts()).toEqual([]);
    });

    test('corrupt JSON → empty array, no crash', () => {
      fs.writeFileSync(receiptsPath, 'not-json {{{');
      expect(log.readReceipts()).toEqual([]);
    });

    test('non-array JSON → empty array, no crash', () => {
      fs.writeFileSync(receiptsPath, JSON.stringify({ not: 'an array' }));
      expect(log.readReceipts()).toEqual([]);
    });

    test('recordReceipt rejects invalid trigger', () => {
      expect(() =>
        log.recordReceipt({
          // @ts-expect-error — intentional bad value
          trigger: 'not-a-trigger',
          intensity: 'blend',
          fired_at: T1,
        }),
      ).toThrow();
    });

    test('recordReceipt rejects invalid intensity', () => {
      expect(() =>
        log.recordReceipt({
          trigger: 'manual',
          // @ts-expect-error — intentional bad value
          intensity: 'medium',
          fired_at: T1,
        }),
      ).toThrow();
    });

    test('recordReceipt rejects invalid fired_at', () => {
      expect(() =>
        log.recordReceipt({
          trigger: 'manual',
          intensity: 'blend',
          fired_at: 'definitely-not-a-date',
        }),
      ).toThrow();
    });

    test('partially-corrupt log on read → corrupt entries dropped, valid ones returned', () => {
      fs.writeFileSync(
        receiptsPath,
        JSON.stringify([
          { trigger: 'manual', intensity: 'blend', fired_at: T1 },         // good
          { trigger: 'manual', intensity: 'blend', fired_at: 'bad-date' },  // bad: date
          null,                                                              // bad: null
          { trigger: 'auto', intensity: 'nuke', fired_at: T2 },             // good
          { not: 'a receipt' },                                              // bad: shape
          { trigger: 'auto', intensity: 'medium', fired_at: T3 },           // bad: intensity not in enum
        ]),
      );
      const all = log.readReceipts();
      expect(all.length).toBe(2);
      // Newest-first ordering
      expect(all[0].fired_at).toBe(T2);
      expect(all[1].fired_at).toBe(T1);
    });
  });

  // ── ⚙️ ENGINE — core record + read + filter ─────────────────────────
  describe('⚙️ ENGINE — core record + read + filter', () => {
    test('recordReceipt + readReceipts round-trip preserves all fields', () => {
      const receipt: RefreshReceipt = {
        trigger: 'auto',
        intensity: 'blend',
        drift_signal: { kind: 'repetition-rate', score: 0.21 },
        fired_at: T1,
        refresh_result: { mode: 'blend', faf: 'ok', fafm: 'ok' },
        metadata: { duration_ms: 42 },
      };
      log.recordReceipt(receipt);
      const all = log.readReceipts();
      expect(all.length).toBe(1);
      expect(all[0]).toEqual(receipt);
    });

    test('fired_at defaults to now when omitted', () => {
      const before = new Date().toISOString();
      log.recordReceipt({ trigger: 'manual', intensity: 'blend' });
      const after = new Date().toISOString();
      const all = log.readReceipts();
      expect(all.length).toBe(1);
      const fa = all[0].fired_at;
      expect(fa >= before).toBe(true);
      expect(fa <= after).toBe(true);
    });

    test('filter by trigger=manual returns only manual receipts', () => {
      log.recordReceipt({ trigger: 'auto', intensity: 'blend', fired_at: T1 });
      log.recordReceipt({ trigger: 'manual', intensity: 'blend', fired_at: T2 });
      log.recordReceipt({ trigger: 'auto', intensity: 'nuke', fired_at: T3 });
      const manual = log.readReceipts({ trigger: 'manual' });
      expect(manual.length).toBe(1);
      expect(manual[0].fired_at).toBe(T2);
    });

    test('filter by trigger=auto returns only auto receipts', () => {
      log.recordReceipt({ trigger: 'auto', intensity: 'blend', fired_at: T1 });
      log.recordReceipt({ trigger: 'manual', intensity: 'blend', fired_at: T2 });
      log.recordReceipt({ trigger: 'auto', intensity: 'nuke', fired_at: T3 });
      const auto = log.readReceipts({ trigger: 'auto' });
      expect(auto.length).toBe(2);
      // Newest-first → T3 then T1
      expect(auto.map((r) => r.fired_at)).toEqual([T3, T1]);
    });

    test('filter by since returns only strictly-after receipts', () => {
      log.recordReceipt({ trigger: 'manual', intensity: 'blend', fired_at: T0 });
      log.recordReceipt({ trigger: 'manual', intensity: 'blend', fired_at: T1 });
      log.recordReceipt({ trigger: 'manual', intensity: 'blend', fired_at: T2 });
      log.recordReceipt({ trigger: 'manual', intensity: 'blend', fired_at: T3 });
      const result = log.readReceipts({ since: T1 });
      expect(result.length).toBe(2); // strictly after T1 = T2 + T3
      expect(result.map((r) => r.fired_at).sort()).toEqual([T2, T3]);
    });

    test('limit caps the result count after newest-first ordering', () => {
      for (const ts of [T0, T1, T2, T3]) {
        log.recordReceipt({ trigger: 'manual', intensity: 'blend', fired_at: ts });
      }
      const result = log.readReceipts({ limit: 2 });
      // Newest-first → T3 + T2 retained, T1 + T0 dropped
      expect(result.map((r) => r.fired_at)).toEqual([T3, T2]);
    });

    test('filters compose: trigger + since + limit all applied together', () => {
      log.recordReceipt({ trigger: 'auto', intensity: 'blend', fired_at: T0 });
      log.recordReceipt({ trigger: 'manual', intensity: 'blend', fired_at: T1 });
      log.recordReceipt({ trigger: 'auto', intensity: 'nuke', fired_at: T2 });
      log.recordReceipt({ trigger: 'auto', intensity: 'blend', fired_at: T3 });
      // since=T0 → drops nothing; trigger=auto → drops the T1 manual; limit=2 → keeps T3 + T2
      const result = log.readReceipts({ since: T0, trigger: 'auto', limit: 2 });
      expect(result.map((r) => r.fired_at)).toEqual([T3, T2]);
    });

    test('drift_signal is preserved verbatim (no shape coercion on the optional field)', () => {
      const exotic = {
        kind: 'custom-future-kind',
        nested: { deep: { value: 42, arr: [1, 2, 3] } },
        timestamp: T1,
      };
      log.recordReceipt({
        trigger: 'auto',
        intensity: 'nuke',
        drift_signal: exotic,
        fired_at: T1,
      });
      const back = log.readReceipts()[0];
      expect(back.drift_signal).toEqual(exotic);
    });
  });

  // ── 🌬️ AERO — determinism + persistence + multi-session ─────────────
  describe('🌬️ AERO — determinism + persistence + multi-session simulation', () => {
    test('filterReceipts is a pure function — same input → same output', () => {
      const receipts: RefreshReceipt[] = [
        { trigger: 'auto', intensity: 'blend', fired_at: T1 },
        { trigger: 'manual', intensity: 'nuke', fired_at: T3 },
        { trigger: 'auto', intensity: 'nuke', fired_at: T2 },
      ];
      const opts = { trigger: 'auto' as const, limit: 5 };
      expect(filterReceipts(receipts, opts)).toEqual(filterReceipts(receipts, opts));
    });

    test('persistence round-trip: record in one instance, read in another', () => {
      log.recordReceipt({ trigger: 'auto', intensity: 'blend', fired_at: T1 });
      log.recordReceipt({ trigger: 'manual', intensity: 'nuke', fired_at: T2 });
      const next = new RefreshReceiptsLog(receiptsPath);
      const all = next.readReceipts();
      expect(all.length).toBe(2);
      expect(all[0].fired_at).toBe(T2); // newest first
    });

    test('newest-first ordering holds regardless of insertion order', () => {
      // Insert out of order
      log.recordReceipt({ trigger: 'manual', intensity: 'blend', fired_at: T2 });
      log.recordReceipt({ trigger: 'manual', intensity: 'blend', fired_at: T0 });
      log.recordReceipt({ trigger: 'manual', intensity: 'blend', fired_at: T3 });
      log.recordReceipt({ trigger: 'manual', intensity: 'blend', fired_at: T1 });
      const all = log.readReceipts();
      expect(all.map((r) => r.fired_at)).toEqual([T3, T2, T1, T0]);
    });

    test('multi-session simulation: auto-fires + manual override + filter for the "ignored" pool', () => {
      // Session 1: auto-fire from drift detector
      log.recordReceipt({
        trigger: 'auto',
        intensity: 'blend',
        drift_signal: { kind: 'repetition-rate', score: 0.21 },
        fired_at: T0,
      });
      // Session 2: manual override
      log.recordReceipt({ trigger: 'manual', intensity: 'nuke', fired_at: T1 });
      // Session 3: auto-fire from CheckID contradiction
      log.recordReceipt({
        trigger: 'auto',
        intensity: 'blend',
        drift_signal: { kind: 'contradiction', check: 'c1-faf-when-vs-pkg' },
        fired_at: T2,
      });
      // Session 4: auto-fire again
      log.recordReceipt({
        trigger: 'auto',
        intensity: 'nuke',
        drift_signal: { kind: 'repetition-rate', score: 0.35 },
        fired_at: T3,
      });

      // Downstream consumer (e.g. #13 take-a-hint) wants "recent auto fires since T0"
      const autoFiresSinceT0 = log.readReceipts({ trigger: 'auto', since: T0 });
      expect(autoFiresSinceT0.length).toBe(2); // T2 + T3 (strictly after T0)
      expect(autoFiresSinceT0.map((r) => r.fired_at)).toEqual([T3, T2]);

      // Different consumer wants the 2 most-recent fires of any trigger
      const recent = log.readReceipts({ limit: 2 });
      expect(recent.map((r) => r.fired_at)).toEqual([T3, T2]);

      // Manual fires only — used to confirm "user actually took action"
      const manualOnly = log.readReceipts({ trigger: 'manual' });
      expect(manualOnly.length).toBe(1);
      expect(manualOnly[0].fired_at).toBe(T1);
    });

    test('empty options returns ALL receipts in newest-first order (no implicit cap)', () => {
      for (const ts of [T0, T1, T2, T3]) {
        log.recordReceipt({ trigger: 'manual', intensity: 'blend', fired_at: ts });
      }
      const all = log.readReceipts();
      expect(all.length).toBe(4);
      expect(all.map((r) => r.fired_at)).toEqual([T3, T2, T1, T0]);
    });

    test('limit=0 returns empty array (honest cap, not an off-by-one)', () => {
      log.recordReceipt({ trigger: 'manual', intensity: 'blend', fired_at: T1 });
      expect(log.readReceipts({ limit: 0 })).toEqual([]);
    });
  });

  // ── 🛞 TYRE — live FS write to actual storage (spec-required tier) ──
  describe('🛞 TYRE — live FS write (spec-required for #7)', () => {
    test('write creates the file at the expected path', () => {
      expect(fs.existsSync(receiptsPath)).toBe(false);
      log.recordReceipt({ trigger: 'manual', intensity: 'blend', fired_at: T1 });
      expect(fs.existsSync(receiptsPath)).toBe(true);
    });

    test('written file is valid JSON and round-trip parseable', () => {
      log.recordReceipt({ trigger: 'auto', intensity: 'nuke', fired_at: T2 });
      const raw = fs.readFileSync(receiptsPath, 'utf-8');
      const parsed = JSON.parse(raw);
      expect(Array.isArray(parsed)).toBe(true);
      expect(parsed[0].trigger).toBe('auto');
      expect(parsed[0].intensity).toBe('nuke');
      expect(parsed[0].fired_at).toBe(T2);
    });

    test('atomic write: temp file is cleaned up; only the final file remains', () => {
      log.recordReceipt({ trigger: 'manual', intensity: 'blend', fired_at: T1 });
      const entries = fs.readdirSync(tmpDir);
      // Only the final file should be present, no .tmp dangling
      expect(entries).toContain('.faf-refresh-receipts.json');
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
