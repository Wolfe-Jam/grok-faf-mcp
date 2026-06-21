/**
 * FRC quality gate (Phase III) — the gate is deterministic, or it isn't a gate.
 *
 * promote IFF faf_score >= min_score AND tokens <= max_tokens. Same input → same
 * verdict. Reasons are actionable on hold. (Built from shipped pieces; no engine,
 * no Collections call.)
 */
import { describe, it, expect } from 'bun:test';
import { evaluateGate, frcEnabled, estimateTokens, GATE_DEFAULTS } from '../src/frc/gate';

describe('FRC gate — evaluateGate (deterministic promote/hold)', () => {
  it('PROMOTES quality context (high score, small)', () => {
    const r = evaluateGate({ score: 100, tokens: 500, emptySlots: [] });
    expect(r.verdict).toBe('promote');
    expect(r.reasons).toEqual([]);
  });

  it('HOLDS low score + names the empty slots to fill', () => {
    const r = evaluateGate({ score: 50, tokens: 500, emptySlots: ['stack.backend', 'human_context.why'] });
    expect(r.verdict).toBe('hold');
    expect(r.reasons.length).toBe(1);
    expect(r.reasons[0]).toContain('50 < 85');
    expect(r.reasons[0]).toContain('stack.backend');
  });

  it('HOLDS oversize context + names the token overage', () => {
    const r = evaluateGate({ score: 100, tokens: 9000, emptySlots: [] });
    expect(r.verdict).toBe('hold');
    expect(r.reasons.length).toBe(1);
    expect(r.reasons[0]).toContain('9000');
    expect(r.reasons[0]).toContain('8000');
  });

  it('HOLDS on both failures with two reasons', () => {
    const r = evaluateGate({ score: 40, tokens: 12000, emptySlots: ['stack.runtime'] });
    expect(r.verdict).toBe('hold');
    expect(r.reasons.length).toBe(2);
  });

  it('boundary: score == min and tokens == max → PROMOTE (>= / <=)', () => {
    const r = evaluateGate({ score: GATE_DEFAULTS.minScore, tokens: GATE_DEFAULTS.maxTokens, emptySlots: [] });
    expect(r.verdict).toBe('promote');
  });

  it('respects a custom policy (xAI owns the threshold)', () => {
    const r = evaluateGate({ score: 60, tokens: 500, emptySlots: [], policy: { minScore: 50 } });
    expect(r.verdict).toBe('promote');
    expect(r.policy.minScore).toBe(50);
    expect(r.policy.maxTokens).toBe(GATE_DEFAULTS.maxTokens); // unspecified → default
  });

  it('is deterministic — same input, same result', () => {
    const input = { score: 70, tokens: 9001, emptySlots: ['a', 'b'] };
    expect(evaluateGate(input)).toEqual(evaluateGate(input));
  });

  it('caps the empty-slot list in reasons (… overflow)', () => {
    const many = Array.from({ length: 12 }, (_, i) => `slot_${i}`);
    const r = evaluateGate({ score: 10, tokens: 100, emptySlots: many });
    expect(r.reasons[0]).toContain('…');
  });
});

describe('FRC gate — helpers', () => {
  it('estimateTokens ~ chars / 4 (ceil)', () => {
    expect(estimateTokens('')).toBe(0);
    expect(estimateTokens('abcd')).toBe(1);
    expect(estimateTokens('abcde')).toBe(2);
  });

  it('frcEnabled is OFF by default, ON with USE_FRC=1', () => {
    const saved = { u: process.env.USE_FRC, f: process.env.FAF_FRC, p: process.env.PHASE3 };
    delete process.env.USE_FRC; delete process.env.FAF_FRC; delete process.env.PHASE3;
    expect(frcEnabled()).toBe(false);
    process.env.USE_FRC = '1';
    expect(frcEnabled()).toBe(true);
    // restore
    if (saved.u === undefined) delete process.env.USE_FRC; else process.env.USE_FRC = saved.u;
    if (saved.f === undefined) delete process.env.FAF_FRC; else process.env.FAF_FRC = saved.f;
    if (saved.p === undefined) delete process.env.PHASE3; else process.env.PHASE3 = saved.p;
  });
});
