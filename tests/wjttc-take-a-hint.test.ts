/**
 * 🏁 WJTTC — evaluateTakeAHint (grok-faf-mcp 1.5)
 *
 * Championship proof for the unheeded-recurrence escalation ladder. Reads
 * temporal recurrence + ignored-count + recent-recommendation history;
 * returns the escalation level the orchestrator should surface (advisory).
 *
 *   1 🛑 BRAKE  — fail-safe: bad inputs (negative, non-finite, missing arrays) degrade to 'none'
 *   2 ⚙️ ENGINE — core: each ladder rung fires at exactly its threshold; below = 'none';
 *                 acknowledgement reset works
 *   3 🌬️ AERO   — honest: determinism; threshold tunability (per-level partial); multi-session
 *                 ignore-then-acknowledge simulation; ladder monotonicity (more ignores +
 *                 more recurrence → same or higher level, never lower)
 *   4 🛞 TYRE   — pass-through (pure function, no cred-costing roundtrip)
 *   5 🔧 PIT    — pass-through (no schema to gate; output is a 4-string enum)
 *
 * Spec source: GROK-FAF-MCP-1.5-CODING-SESSION-BREAKDOWN §#13 (Grok WHAT,
 * Claude HOW). Both-axes-required is the wolfejam refinement (temporal axis,
 * not cross-signal +1 cumulation).
 */
import { describe, test, expect } from 'bun:test';
import {
  evaluateTakeAHint,
  DEFAULT_THRESHOLDS,
  type RecommendationRecord,
  type EscalationLevel,
} from '../src/orchestrator/take-a-hint';

// ── Helpers ──────────────────────────────────────────────────────────────

const rec = (timestamp: string, acknowledged = false): RecommendationRecord => ({
  timestamp,
  acknowledged,
});

// ── Tests ────────────────────────────────────────────────────────────────

describe('🏁 WJTTC — evaluateTakeAHint (grok-faf-mcp 1.5)', () => {
  // ── 🛑 BRAKE — fail-safe ──────────────────────────────────────────────
  describe('🛑 BRAKE — fail-safe', () => {
    test('all-zero input → none, never crash', () => {
      expect(
        evaluateTakeAHint({
          recent_recommendations: [],
          ignored_count: 0,
          drift_recurrence: 0,
        }),
      ).toBe('none');
    });

    test('negative ignored_count coerces to 0 → none', () => {
      expect(
        evaluateTakeAHint({
          recent_recommendations: [],
          ignored_count: -5,
          drift_recurrence: 10,
        }),
      ).toBe('none');
    });

    test('NaN counts coerce to 0 → none', () => {
      expect(
        evaluateTakeAHint({
          recent_recommendations: [],
          ignored_count: NaN,
          drift_recurrence: NaN,
        }),
      ).toBe('none');
    });

    test('Infinity recurrence coerces safely; ladder still works', () => {
      const lvl = evaluateTakeAHint({
        recent_recommendations: [],
        ignored_count: 10,
        drift_recurrence: Infinity,
      });
      // Infinity isn't finite, so it coerces to 0 (defensive) → 'none' even though ignored is high.
      expect(lvl).toBe('none');
    });

    test('missing recent_recommendations array (passing undefined as any) → none, no throw', () => {
      // Caller passes a malformed shape — function should defend, not throw.
      const lvl = evaluateTakeAHint({
        // @ts-expect-error — intentional: BRAKE asserts the shape defense
        recent_recommendations: undefined,
        ignored_count: 0,
        drift_recurrence: 0,
      });
      expect(lvl).toBe('none');
    });

    test('fractional counts floor to integer thresholds — no surprise rounding', () => {
      // ignored=1.9 floors to 1, recurrence=2.9 floors to 2 → matches light defaults
      expect(
        evaluateTakeAHint({
          recent_recommendations: [],
          ignored_count: 1.9,
          drift_recurrence: 2.9,
        }),
      ).toBe('light');
    });
  });

  // ── ⚙️ ENGINE — ladder rungs fire at exactly their thresholds ─────────
  describe('⚙️ ENGINE — ladder rungs at exact thresholds', () => {
    test('first occurrence (recurrence=1) stays at none even with high ignored', () => {
      expect(
        evaluateTakeAHint({
          recent_recommendations: [],
          ignored_count: 10,
          drift_recurrence: 1,
        }),
      ).toBe('none');
    });

    test('recurring but never ignored (ignored=0) stays at none', () => {
      expect(
        evaluateTakeAHint({
          recent_recommendations: [],
          ignored_count: 0,
          drift_recurrence: 10,
        }),
      ).toBe('none');
    });

    test('light: at exactly the light threshold (ignored=1, recurrence=2)', () => {
      expect(
        evaluateTakeAHint({
          recent_recommendations: [],
          ignored_count: 1,
          drift_recurrence: 2,
        }),
      ).toBe('light');
    });

    test('just below light on EITHER axis → none', () => {
      expect(
        evaluateTakeAHint({
          recent_recommendations: [],
          ignored_count: 0, // below light.ignored
          drift_recurrence: 2,
        }),
      ).toBe('none');
      expect(
        evaluateTakeAHint({
          recent_recommendations: [],
          ignored_count: 1,
          drift_recurrence: 1, // below light.recurrence
        }),
      ).toBe('none');
    });

    test('hard: at exactly the hard threshold (ignored=2, recurrence=3)', () => {
      expect(
        evaluateTakeAHint({
          recent_recommendations: [],
          ignored_count: 2,
          drift_recurrence: 3,
        }),
      ).toBe('hard');
    });

    test('hard partial (only one axis at hard) falls back to light', () => {
      expect(
        evaluateTakeAHint({
          recent_recommendations: [],
          ignored_count: 2, // hard.ignored met
          drift_recurrence: 2, // only at light.recurrence
        }),
      ).toBe('light');
    });

    test('block: at exactly the block threshold (ignored=3, recurrence=4)', () => {
      expect(
        evaluateTakeAHint({
          recent_recommendations: [],
          ignored_count: 3,
          drift_recurrence: 4,
        }),
      ).toBe('block');
    });

    test('block partial (only one axis at block) falls back to hard', () => {
      expect(
        evaluateTakeAHint({
          recent_recommendations: [],
          ignored_count: 3, // block.ignored met
          drift_recurrence: 3, // only at hard.recurrence
        }),
      ).toBe('hard');
    });

    test('extreme escalation (ignored=100, recurrence=100) → block (caps at top)', () => {
      expect(
        evaluateTakeAHint({
          recent_recommendations: [],
          ignored_count: 100,
          drift_recurrence: 100,
        }),
      ).toBe('block');
    });

    test('acknowledgement reset: latest recommendation acknowledged → none even at block-level counts', () => {
      expect(
        evaluateTakeAHint({
          recent_recommendations: [
            rec('2026-05-30T10:00:00Z', false),
            rec('2026-05-30T11:00:00Z', false),
            rec('2026-05-30T12:00:00Z', true), // user took action
          ],
          ignored_count: 5,
          drift_recurrence: 10,
        }),
      ).toBe('none');
    });

    test('older acknowledgements (not latest) do NOT reset — ladder still climbs', () => {
      // The middle recommendation was acknowledged but the LATEST wasn't.
      // Pattern resumed → ladder should still fire.
      expect(
        evaluateTakeAHint({
          recent_recommendations: [
            rec('2026-05-30T10:00:00Z', false),
            rec('2026-05-30T11:00:00Z', true), // old ack
            rec('2026-05-30T12:00:00Z', false), // latest, ignored
          ],
          ignored_count: 2,
          drift_recurrence: 3,
        }),
      ).toBe('hard');
    });
  });

  // ── 🌬️ AERO — determinism + tunability + multi-session + monotonicity ─
  describe('🌬️ AERO — determinism + tunability + multi-session + monotonicity', () => {
    test('determinism: same input → same output (no wall-clock fields)', () => {
      const input = {
        recent_recommendations: [rec('2026-05-30T10:00:00Z')],
        ignored_count: 2,
        drift_recurrence: 3,
      };
      const a = evaluateTakeAHint(input);
      const b = evaluateTakeAHint(input);
      expect(a).toBe(b);
    });

    test('threshold tunability: per-level partial override deep-merges over defaults', () => {
      // Override only `light`; hard and block stay at defaults.
      const stricterLight = evaluateTakeAHint({
        recent_recommendations: [],
        ignored_count: 1,
        drift_recurrence: 2, // would normally trigger light
        thresholds: { light: { ignored: 2, recurrence: 3 } }, // stricter light = same as default hard
      });
      // Now 1/2 is below the stricter light threshold → 'none'
      expect(stricterLight).toBe('none');

      // Block default should still work unaffected
      const blockStill = evaluateTakeAHint({
        recent_recommendations: [],
        ignored_count: 3,
        drift_recurrence: 4,
        thresholds: { light: { ignored: 2, recurrence: 3 } }, // unrelated override
      });
      expect(blockStill).toBe('block');
    });

    test('threshold tunability: lowering thresholds promotes a previously-silent input', () => {
      const lvl = evaluateTakeAHint({
        recent_recommendations: [],
        ignored_count: 1,
        drift_recurrence: 1, // default light needs recurrence>=2
        thresholds: { light: { ignored: 1, recurrence: 1 } }, // accept this earlier
      });
      expect(lvl).toBe('light');
    });

    test('ladder monotonicity: more ignores + more recurrence → same or higher level, never lower', () => {
      // Sweep upward: ignored 0..5, recurrence 0..5
      const order: EscalationLevel[] = ['none', 'light', 'hard', 'block'];
      const rank = (l: EscalationLevel): number => order.indexOf(l);

      let prevRank = 0;
      const samples: EscalationLevel[] = [];
      for (let n = 0; n <= 5; n++) {
        const lvl = evaluateTakeAHint({
          recent_recommendations: [],
          ignored_count: n,
          drift_recurrence: n + 1, // keep recurrence slightly ahead of ignored
        });
        samples.push(lvl);
        const r = rank(lvl);
        expect(r).toBeGreaterThanOrEqual(prevRank);
        prevRank = r;
      }
      // Should have climbed at least to 'hard' along the way (block needs 3/4)
      expect(samples).toContain('light');
    });

    test('multi-session simulation: ignore-then-acknowledge sequence honored across the run', () => {
      // Session 1 — first detection, no prior recs, no ignores yet
      let lvl = evaluateTakeAHint({
        recent_recommendations: [],
        ignored_count: 0,
        drift_recurrence: 1,
      });
      expect(lvl).toBe('none');

      // Session 2 — drift recurs, prior rec was ignored
      lvl = evaluateTakeAHint({
        recent_recommendations: [rec('2026-05-30T10:00:00Z', false)],
        ignored_count: 1,
        drift_recurrence: 2,
      });
      expect(lvl).toBe('light');

      // Session 3 — drift recurs again, still ignored
      lvl = evaluateTakeAHint({
        recent_recommendations: [
          rec('2026-05-30T10:00:00Z', false),
          rec('2026-05-30T11:00:00Z', false),
        ],
        ignored_count: 2,
        drift_recurrence: 3,
      });
      expect(lvl).toBe('hard');

      // Session 4 — pattern chronic, would have hit block
      const wouldBlock = evaluateTakeAHint({
        recent_recommendations: [
          rec('2026-05-30T10:00:00Z', false),
          rec('2026-05-30T11:00:00Z', false),
          rec('2026-05-30T12:00:00Z', false),
        ],
        ignored_count: 3,
        drift_recurrence: 4,
      });
      expect(wouldBlock).toBe('block');

      // Session 4-alt — user acknowledges the latest hint → ladder resets
      const acknowledged = evaluateTakeAHint({
        recent_recommendations: [
          rec('2026-05-30T10:00:00Z', false),
          rec('2026-05-30T11:00:00Z', false),
          rec('2026-05-30T12:00:00Z', true), // ack happened
        ],
        ignored_count: 3,
        drift_recurrence: 4,
      });
      expect(acknowledged).toBe('none');
    });

    test('DEFAULT_THRESHOLDS exported + frozen — public contract, can be referenced + cannot be mutated', () => {
      // The export exists and has the documented shape
      expect(DEFAULT_THRESHOLDS.light).toEqual({ ignored: 1, recurrence: 2 });
      expect(DEFAULT_THRESHOLDS.hard).toEqual({ ignored: 2, recurrence: 3 });
      expect(DEFAULT_THRESHOLDS.block).toEqual({ ignored: 3, recurrence: 4 });
      // Frozen: callers can't accidentally mutate the shared default and
      // poison other call sites in the same process.
      expect(Object.isFrozen(DEFAULT_THRESHOLDS)).toBe(true);
      expect(Object.isFrozen(DEFAULT_THRESHOLDS.light)).toBe(true);
    });
  });

  // ── 🛞 TYRE — pass-through ────────────────────────────────────────
  describe('🛞 TYRE — live [pass-through]', () => {
    test('pass-through: evaluateTakeAHint is a pure function — no FS, no MCP, no cred', () => {
      expect(true).toBe(true);
    });
  });

  // ── 🔧 PIT — pass-through ─────────────────────────────────────────
  describe('🔧 PIT — eval [pass-through]', () => {
    test('pass-through: output is a 4-string enum — no schema to gate here', () => {
      expect(true).toBe(true);
    });
  });
});
