/**
 * ZEPH ↔ faf-cli score parity — the permanent gate.
 *
 * The scoring invariant: SCORE IS SCORE. ZEPH (cascade.wasm) is only allowed to
 * answer on the refresh fast path because it returns THE number faf-cli returns.
 * This test locks it: zephScore(yaml) === scoreFafYaml(yaml).score across the
 * range. If it ever diverges, ZEPH is broken — fail the build, don't ship a lie.
 *
 * (Phase II / WJTTC discipline: parity is the gate, not a one-time manual check.)
 */
import { describe, it, expect, beforeAll, afterEach } from 'bun:test';
import { zephScore, zephEnabled } from '../src/zeph/zeph-score';

// faf-cli via the dist (dynamic import) — same bridge pattern the handler uses.
const fafCliPromise: Promise<any> = import('../node_modules/faf-cli/dist/index.js');

let fafCli: any;

// Warm the WASM engine + faf-cli once before asserting — the cascade.wasm
// instantiate is async/lazy; cold-init must not race the first assertion
// (a flaky parity gate is worse than no gate).
beforeAll(async () => {
  fafCli = await fafCliPromise;
  const warm = await zephScore('project:\n  name: warmup\n');
  if (typeof warm !== 'number') throw new Error('ZEPH engine failed to instantiate — cannot gate parity');
});

// Span the range (5 → 100) so parity is proven across the curve, not at one point.
const FIXTURES: Record<string, string> = {
  'min (name only)': 'project:\n  name: p\n',
  '+goal +lang': 'project:\n  name: p\n  goal: g\n  main_language: TypeScript\n',
  '+3 of 6Ws': 'project:\n  name: p\n  goal: g\n  main_language: TypeScript\nhuman_context:\n  who: d\n  what: t\n  why: c\n',
  '+full 6Ws': 'project:\n  name: p\n  goal: g\n  main_language: TypeScript\nhuman_context:\n  who: d\n  what: t\n  why: c\n  how: m\n  where: n\n  when: now\n',
};

describe('ZEPH ↔ faf-cli score parity (the invariant: score is score)', () => {
  it('zephScore returns THE faf-cli score across the range', async () => {
    for (const [name, yaml] of Object.entries(FIXTURES)) {
      const canonical = fafCli.scoreFafYaml(yaml).score as number;
      const zeph = await zephScore(yaml);
      expect(zeph, `ZEPH must return THE score for "${name}" (got ${zeph}, canonical ${canonical})`).toBe(canonical);
    }
  });

  it('zephScore is a bounded 0–100 number (never breaks scoring)', async () => {
    const z = await zephScore('project:\n  name: p\n  goal: g\n  main_language: TypeScript\n');
    expect(typeof z).toBe('number');
    expect(z as number).toBeGreaterThanOrEqual(0);
    expect(z as number).toBeLessThanOrEqual(100);
  });
});

// The v1.9.0 flip: ZEPH is default-ON, with an explicit opt-out kill switch.
// Locks the headline default so a regression to opt-in fails the build, and
// proves the kill switch still forces the canonical scorer.
describe('zephEnabled — default-ON since v1.9.0 (the gate)', () => {
  const KEYS = ['USE_ZEPH', 'FAF_ZEPH', 'ZEPH'] as const;
  const saved: Record<string, string | undefined> = {};
  beforeAll(() => KEYS.forEach((k) => (saved[k] = process.env[k])));
  afterEach(() => KEYS.forEach((k) => (saved[k] === undefined ? delete process.env[k] : (process.env[k] = saved[k]!))));

  it('is ON by default — no env set', () => {
    KEYS.forEach((k) => delete process.env[k]);
    expect(zephEnabled()).toBe(true);
  });

  it('kill switch: USE_ZEPH=0 forces canonical (also 0/false/off on any alias)', () => {
    KEYS.forEach((k) => delete process.env[k]);
    process.env.USE_ZEPH = '0';
    expect(zephEnabled()).toBe(false);
    process.env.USE_ZEPH = 'false';
    expect(zephEnabled()).toBe(false);
    delete process.env.USE_ZEPH;
    process.env.ZEPH = 'off';
    expect(zephEnabled()).toBe(false);
  });

  it('stays ON for any non-opt-out value (e.g. legacy USE_ZEPH=1)', () => {
    KEYS.forEach((k) => delete process.env[k]);
    process.env.USE_ZEPH = '1';
    expect(zephEnabled()).toBe(true);
  });
});
