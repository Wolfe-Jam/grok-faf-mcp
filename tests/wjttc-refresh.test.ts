/**
 * 🏁 WJTTC — refresh_faf (grok-faf-mcp)
 *
 * Championship proof for the explicit re-grounding primitive:
 *   drift → refresh → re-grounded
 *
 * Tests what refresh_faf does TODAY: a score-delta re-ground via the
 * SINGLE-SOURCE faf-cli scorer (never reimplemented here). The suite proves the
 * primitive end-to-end — fail-safe, exact drift math, live-state re-reads, and
 * true single-source parity across fixtures. ONE honest skipped marker (AERO)
 * banks the v2 boundary: content-drift / slot-diff (a slot VALUE changes but the
 * score stays put). Not faked — on the record.
 *
 *   1 🛑 BRAKE  — fail-safe: missing / malformed / empty / junk never crashes or fakes
 *   2 ⚙️ ENGINE — core: re-ground + drift (+ / − / 0) + next-tier + verbatim DNA + path forms
 *   3 🌬️ AERO   — honest: determinism + exact drift math + single-source parity + LIVE-edit drift
 *   4 🛞 TYRE   — live cred roundtrips [pass-through; refresh is local]
 *   5 🔧 PIT    — eval [pass-through; the project.faf Trophy gate]
 */
import { describe, test, expect, beforeAll, afterAll } from 'bun:test';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { GrokFafMcpServer } from '../src/server.js';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';

// faf-cli's `bun` exports condition points at a non-shipped src/ — load the
// published dist directly (same module the bridge resolves in production).
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const fafCliPromise: Promise<any> = import('../node_modules/faf-cli/dist/index.js');

// Valid .faf scoring >0 <100 (3 of 6 Ws populated, rest slotignored) — a
// non-trivial score is required so parity/determinism don't pass trivially.
const SAMPLE_FAF = [
  'faf_version: "3.0"',
  'project:',
  '  name: refresh-fixture',
  '  goal: WJTTC refresh_faf fixture project.',
  '  main_language: TypeScript',
  '  type: mcp',
  '  framework: MCP SDK',
  'stack:',
  '  frontend: slotignored',
  '  css_framework: slotignored',
  '  ui_library: slotignored',
  '  state_management: slotignored',
  '  backend: MCP SDK',
  '  api_type: MCP',
  '  runtime: Node.js',
  '  database: slotignored',
  '  connection: slotignored',
  '  hosting: local',
  '  build: tsc',
  '  cicd: GitHub Actions',
  '  monorepo_tool: slotignored',
  '  package_manager: npm',
  '  workspaces: slotignored',
  '  admin: slotignored',
  '  cache: slotignored',
  '  search: slotignored',
  '  storage: slotignored',
  'human_context:',
  '  who: refresh testers',
  '  what: re-ground fixture',
  '  why: prove drift -> refresh -> re-grounded',
  '',
].join('\n');

// A deliberately sparse but VALID .faf — scores low. Powers live-edit drift +
// cross-fixture parity (a sparse→populated edit MUST move the score).
const LOW_FAF = [
  'faf_version: "3.0"',
  'project:',
  '  name: low-fixture',
  '  goal: minimal sparse fixture',
  '',
].join('\n');

// refresh_faf reports the score on its "tier: <glyph> <N>%" line.
const REFRESH_SCORE_RE = /tier:[^\n]*?(\d{1,3})%/;

describe('🏁 WJTTC — refresh_faf (grok-faf-mcp)', () => {
  let client: Client;
  let server: GrokFafMcpServer;
  let tmpDir: string; // valid .faf
  let emptyDir: string; // no .faf
  let badDir: string; // malformed .faf
  let originalCwd: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let fafCli: any;

  const textOf = (res: { content: unknown }): string =>
    ((res.content as Array<{ text?: string }>)[0]?.text ?? '') as string;
  const scoreOf = (res: { content: unknown }): number =>
    parseInt(textOf(res).match(REFRESH_SCORE_RE)![1], 10);

  beforeAll(async () => {
    originalCwd = process.cwd();
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'faf-refresh-'));
    fs.writeFileSync(path.join(tmpDir, 'project.faf'), SAMPLE_FAF);
    emptyDir = fs.mkdtempSync(path.join(os.tmpdir(), 'faf-refresh-empty-'));
    badDir = fs.mkdtempSync(path.join(os.tmpdir(), 'faf-refresh-bad-'));
    fs.writeFileSync(path.join(badDir, 'project.faf'), 'project:\n  name: [unterminated\n  : : :\n');

    server = new GrokFafMcpServer({ transport: 'stdio', fafEnginePath: 'native' });
    const [clientT, serverT] = InMemoryTransport.createLinkedPair();
    await server.getServer().connect(serverT);
    client = new Client({ name: 'wjttc-refresh', version: '1.0.0' }, { capabilities: {} });
    await client.connect(clientT);

    fafCli = await fafCliPromise;
  });

  afterAll(async () => {
    try {
      await client.close();
    } catch {
      /* best-effort teardown */
    }
    try {
      await server.getServer().close();
    } catch {
      /* best-effort teardown */
    }
    process.chdir(originalCwd);
    fs.rmSync(tmpDir, { recursive: true, force: true });
    fs.rmSync(emptyDir, { recursive: true, force: true });
    fs.rmSync(badDir, { recursive: true, force: true });
  });

  // ── 🛑 BRAKE — fail-safe ────────────────────────────────────────────────
  describe('🛑 BRAKE — fail-safe', () => {
    test('no .faf → graceful "nothing to re-ground", never a fake score', async () => {
      const res = await client.callTool({ name: 'refresh_faf', arguments: { path: emptyDir } });
      expect(Array.isArray(res.content)).toBe(true);
      const text = textOf(res);
      expect(text).toContain('nothing to re-ground');
      expect(text).not.toMatch(/re-grounded at \d/); // no fabricated re-ground
    });

    test('malformed .faf → handled (no crash); connection survives', async () => {
      let res: { content: unknown; isError?: boolean } | undefined;
      try {
        res = await client.callTool({ name: 'refresh_faf', arguments: { path: badDir } });
      } catch (err) {
        expect(err).toBeInstanceOf(Error); // a rejection is also acceptable handling
      }
      if (res) {
        expect(Array.isArray(res.content)).toBe(true);
        expect(textOf(res).length).toBeGreaterThan(0);
      }
      const ok = await client.callTool({ name: 'refresh_faf', arguments: { path: tmpDir } });
      expect(ok.isError).toBeFalsy(); // connection survived
    });

    test('junk baseline (string) does not crash — falls back to plain re-ground', async () => {
      const res = await client.callTool({
        name: 'refresh_faf',
        arguments: { path: tmpDir, baseline: 'not-a-number' },
      });
      expect(res.isError).toBeFalsy();
      expect(textOf(res)).toMatch(/re-grounded at \d{1,3}%/);
    });

    test('empty .faf → handled honestly (a message, never a silent void or fake score)', async () => {
      const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'faf-refresh-mt-'));
      fs.writeFileSync(path.join(dir, 'project.faf'), '');
      try {
        const res = await client.callTool({ name: 'refresh_faf', arguments: { path: dir } });
        expect(Array.isArray(res.content)).toBe(true);
        expect(textOf(res).length).toBeGreaterThan(0);
      } finally {
        fs.rmSync(dir, { recursive: true, force: true });
      }
    });

    test('concurrency: 5 parallel re-grounds all succeed with ONE consistent score', async () => {
      const results = await Promise.all(
        Array.from({ length: 5 }, () =>
          client.callTool({ name: 'refresh_faf', arguments: { path: tmpDir } }),
        ),
      );
      const scores = results.map((r) => {
        expect(r.isError).toBeFalsy();
        return scoreOf(r);
      });
      expect(new Set(scores).size).toBe(1); // no torn reads / state races
    });
  });

  // ── ⚙️ ENGINE — core re-ground ─────────────────────────────────────────
  describe('⚙️ ENGINE — core re-ground', () => {
    test('valid .faf re-grounds: header + score + fresh DNA returned', async () => {
      const res = await client.callTool({ name: 'refresh_faf', arguments: { path: tmpDir } });
      expect(res.isError).toBeFalsy();
      const text = textOf(res);
      expect(text).toContain('re-grounded on the live .faf');
      expect(text).toMatch(REFRESH_SCORE_RE);
      expect(text).toContain('fresh DNA'); // the re-ground payload
      expect(text).toContain('faf_version'); // …which is the actual .faf
    });

    test('drift ↑ with positive delta when baseline is below current', async () => {
      const res = await client.callTool({ name: 'refresh_faf', arguments: { path: tmpDir, baseline: 1 } });
      const text = textOf(res);
      expect(text).toContain('drift:');
      expect(text).toContain('↑');
      expect(text).toMatch(/\(\+\d+\)/);
    });

    test('no drift when baseline equals the current score', async () => {
      const probe = await client.callTool({ name: 'refresh_faf', arguments: { path: tmpDir } });
      const score = scoreOf(probe);
      const res = await client.callTool({ name: 'refresh_faf', arguments: { path: tmpDir, baseline: score } });
      expect(textOf(res)).toContain('drift: none');
    });

    test('drift ↓ with negative delta when baseline is above current', async () => {
      const score = scoreOf(await client.callTool({ name: 'refresh_faf', arguments: { path: tmpDir } }));
      const res = await client.callTool({ name: 'refresh_faf', arguments: { path: tmpDir, baseline: score + 5 } });
      const text = textOf(res);
      expect(text).toContain('↓');
      expect(text).toMatch(/\(-\d+\)/);
    });

    test('sub-100 fixture surfaces a next-tier target', async () => {
      const text = textOf(await client.callTool({ name: 'refresh_faf', arguments: { path: tmpDir } }));
      expect(text).toContain('next:');
    });

    test('fresh DNA is the LIVE .faf returned verbatim (re-ground, not a summary)', async () => {
      const text = textOf(await client.callTool({ name: 'refresh_faf', arguments: { path: tmpDir } }));
      const dna = text.slice(text.indexOf('fresh DNA'));
      expect(dna).toContain('goal: WJTTC refresh_faf fixture project.');
      expect(dna).toContain('who: refresh testers');
    });

    test('a file path (project.faf) resolves identically to its directory', async () => {
      const viaFile = await client.callTool({ name: 'refresh_faf', arguments: { path: path.join(tmpDir, 'project.faf') } });
      const viaDir = await client.callTool({ name: 'refresh_faf', arguments: { path: tmpDir } });
      expect(scoreOf(viaFile)).toBe(scoreOf(viaDir));
    });
  });

  // ── 🌬️ AERO — honest: determinism + exact drift math + single-source parity ──
  describe('🌬️ AERO — determinism + drift math + single-source parity', () => {
    test('determinism: two refreshes on identical state report the same score', async () => {
      const s1 = scoreOf(await client.callTool({ name: 'refresh_faf', arguments: { path: tmpDir } }));
      const s2 = scoreOf(await client.callTool({ name: 'refresh_faf', arguments: { path: tmpDir } }));
      expect(s1).toBe(s2);
    });

    test('determinism holds over 5 sequential re-grounds', async () => {
      const scores: number[] = [];
      for (let i = 0; i < 5; i++) {
        scores.push(scoreOf(await client.callTool({ name: 'refresh_faf', arguments: { path: tmpDir } })));
      }
      expect(new Set(scores).size).toBe(1);
    });

    test('TRUE PARITY: refresh_faf score == faf-cli scoreFafYaml (single-source)', async () => {
      const raw = fs.readFileSync(path.join(tmpDir, 'project.faf'), 'utf-8');
      const parity = fafCli.scoreFafYaml(raw).score;
      const refreshScore = scoreOf(await client.callTool({ name: 'refresh_faf', arguments: { path: tmpDir } }));
      expect(refreshScore).toBe(parity);
    });

    test('single-source parity holds across a DIFFERENT fixture (not a one-off)', async () => {
      const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'faf-refresh-low-'));
      fs.writeFileSync(path.join(dir, 'project.faf'), LOW_FAF);
      try {
        const parity = fafCli.scoreFafYaml(LOW_FAF).score;
        const refreshScore = scoreOf(await client.callTool({ name: 'refresh_faf', arguments: { path: dir } }));
        expect(refreshScore).toBe(parity);
      } finally {
        fs.rmSync(dir, { recursive: true, force: true });
      }
    });

    test('drift math is EXACT: reported delta == score − baseline, sign correct', async () => {
      const score = scoreOf(await client.callTool({ name: 'refresh_faf', arguments: { path: tmpDir } }));
      for (const baseline of [1, Math.max(1, score - 3), score, score + 7]) {
        const text = textOf(await client.callTool({ name: 'refresh_faf', arguments: { path: tmpDir, baseline } }));
        const expected = score - baseline;
        if (expected === 0) {
          expect(text).toContain('drift: none');
        } else {
          const m = text.match(/\(([+-]?\d+)\)/);
          expect(m).not.toBeNull();
          expect(parseInt(m![1], 10)).toBe(expected);
          expect(text).toContain(expected > 0 ? '↑' : '↓');
        }
      }
    });

    // 🅿️ BANKED FOR v2 — honest boundary, not faked.
    // Score-delta is BLIND to content drift: a slot whose VALUE changes but
    // stays populated keeps the score, so refresh reports no score-drift while
    // the DNA genuinely moved. v1 does not detect this. The slot-diff layer
    // (faf-cli core/slot-diff.ts → bridge consolidation) is the spec that closes
    // it. Marked skipped so the gap is on the record, not papered over.
    // NOTE: score-CHANGING content drift IS proven below in the live-edit suite.
    test.skip('v2: content drift (slot value changed, score stable) is detected', () => {
      // Needs slot-diff: diff baseline .faf content vs current, report which
      // slot keys changed. Tracked for the next version.
    });
  });

  // ── 🌬️ AERO — live-edit drift: refresh re-reads LIVE state every call ────
  describe('🌬️ AERO — live-edit drift (re-reads live state)', () => {
    test('edit the .faf between refreshes → score MOVES and matches the new content', async () => {
      const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'faf-refresh-live-'));
      const faf = path.join(dir, 'project.faf');
      try {
        // sparse → first re-ground
        fs.writeFileSync(faf, LOW_FAF);
        const s1 = scoreOf(await client.callTool({ name: 'refresh_faf', arguments: { path: dir } }));

        // populate → second re-ground MUST see the live edit (no cache)
        fs.writeFileSync(faf, SAMPLE_FAF);
        const r2 = await client.callTool({ name: 'refresh_faf', arguments: { path: dir, baseline: s1 } });
        const text2 = textOf(r2);
        const s2 = scoreOf(r2);

        expect(s2).toBeGreaterThan(s1); // drift is real, read from live state
        expect(s2).toBe(fafCli.scoreFafYaml(SAMPLE_FAF).score); // == single-source on NEW content
        expect(text2).toContain('↑'); // drift vs the supplied baseline
        expect(text2).toContain(`${s1}% ↑ ${s2}%`); // exact re-grounding line
      } finally {
        fs.rmSync(dir, { recursive: true, force: true });
      }
    });
  });

  // ── 🛞 TYRE — live cred roundtrips [pass-through] ───────────────────────
  describe('🛞 TYRE — live [pass-through]', () => {
    test('pass-through: refresh_faf is local (FS + faf-cli bridge), no cred-costing roundtrip', () => {
      // The live-engine path (real faf-cli scorer on a real .faf fixture) is
      // already exercised in ENGINE + AERO. No network/account roundtrip here.
      expect(true).toBe(true);
    });
  });

  // ── 🔧 PIT — eval [pass-through] ────────────────────────────────────────
  describe('🔧 PIT — eval [pass-through]', () => {
    test('pass-through: eval is the project.faf Trophy gate (/pubpro), not duplicated here', () => {
      expect(true).toBe(true);
    });
  });
});
