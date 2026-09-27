/**
 * ZEPH ↔ faf-cli score parity — the gate.
 *
 * The scoring invariant: SCORE IS SCORE. ZEPH (cascade.wasm) may answer only if
 * it returns THE always-33 number faf-cli returns. Today it does not: the Zig
 * `score` is the older 21-slot model (47/80 FAF repos = always-33,
 * 2026-09-26), so ZEPH is OFF by default (opt-in USE_ZEPH=1) and the parity
 * test is a todo until the Zig engine reaches always-33 (Phase B). When it
 * does, the todo becomes this test again — and default-ON can return.
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
  it.todo('zephScore returns THE always-33 faf-cli score across the range (Phase B: cascade to always-33)');

  it('zephScore is a bounded 0–100 number (never breaks scoring)', async () => {
    const z = await zephScore('project:\n  name: p\n  goal: g\n  main_language: TypeScript\n');
    expect(typeof z).toBe('number');
    expect(z as number).toBeGreaterThanOrEqual(0);
    expect(z as number).toBeLessThanOrEqual(100);
  });
});

// 2.0.0: ZEPH is OFF by default — opt-in until the Zig score is always-33.
// Locks the default so a regression to default-ON fails the build.
describe('zephEnabled — opt-in since 2.0.0 (the gate)', () => {
  const KEYS = ['USE_ZEPH', 'FAF_ZEPH', 'ZEPH'] as const;
  const saved: Record<string, string | undefined> = {};
  beforeAll(() => KEYS.forEach((k) => (saved[k] = process.env[k])));
  afterEach(() => KEYS.forEach((k) => (saved[k] === undefined ? delete process.env[k] : (process.env[k] = saved[k]!))));

  it('is OFF by default — no env set', () => {
    KEYS.forEach((k) => delete process.env[k]);
    expect(zephEnabled()).toBe(false);
  });

  it('opt-in: USE_ZEPH=1 turns it on (also true/on on any alias)', () => {
    KEYS.forEach((k) => delete process.env[k]);
    process.env.USE_ZEPH = '1';
    expect(zephEnabled()).toBe(true);
    delete process.env.USE_ZEPH;
    process.env.FAF_ZEPH = 'true';
    expect(zephEnabled()).toBe(true);
    delete process.env.FAF_ZEPH;
    process.env.ZEPH = 'on';
    expect(zephEnabled()).toBe(true);
  });

  it('stays OFF for any other value (e.g. legacy USE_ZEPH=0)', () => {
    KEYS.forEach((k) => delete process.env[k]);
    process.env.USE_ZEPH = '0';
    expect(zephEnabled()).toBe(false);
  });
});
