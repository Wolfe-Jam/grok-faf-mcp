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
import { describe, it, expect, beforeAll } from 'bun:test';
import { zephScore } from '../src/zeph/zeph-score';

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
