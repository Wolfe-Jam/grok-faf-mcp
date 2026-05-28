/**
 * 🏁 WJTTC — refresh_faf (grok-faf-mcp)
 *
 * Championship proof for the explicit re-grounding primitive:
 *   drift → refresh → re-grounded
 *
 * v1 scope — tests what refresh_faf does TODAY: a score-delta re-ground via the
 * SINGLE-SOURCE faf-cli scorer (never reimplemented here). Banked for v2 (one
 * honest skipped marker in AERO, not a matrix): content-drift / slot-diff
 * detection, DNA trend patterns, .fafb re-compile, tier-proximity, fleet fan-out.
 *
 *   1 🛑 BRAKE  — fail-safe: missing / malformed / junk input never crashes or fakes
 *   2 ⚙️ ENGINE — core: re-ground + drift delta (+ / − / 0) + fresh DNA returned
 *   3 🌬️ AERO   — honest: determinism + single-source parity (== faf_score scorer)
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
      const score = parseInt(textOf(probe).match(REFRESH_SCORE_RE)![1], 10);
      const res = await client.callTool({ name: 'refresh_faf', arguments: { path: tmpDir, baseline: score } });
      expect(textOf(res)).toContain('drift: none');
    });
  });

  // ── 🌬️ AERO — honest: determinism + single-source parity ───────────────
  describe('🌬️ AERO — determinism + single-source parity', () => {
    test('determinism: two refreshes on identical state report the same score', async () => {
      const r1 = await client.callTool({ name: 'refresh_faf', arguments: { path: tmpDir } });
      const r2 = await client.callTool({ name: 'refresh_faf', arguments: { path: tmpDir } });
      const s1 = parseInt(textOf(r1).match(REFRESH_SCORE_RE)![1], 10);
      const s2 = parseInt(textOf(r2).match(REFRESH_SCORE_RE)![1], 10);
      expect(s1).toBe(s2);
    });

    test('TRUE PARITY: refresh_faf score == faf-cli scoreFafYaml (single-source)', async () => {
      const raw = fs.readFileSync(path.join(tmpDir, 'project.faf'), 'utf-8');
      const parity = fafCli.scoreFafYaml(raw).score;
      const res = await client.callTool({ name: 'refresh_faf', arguments: { path: tmpDir } });
      const refreshScore = parseInt(textOf(res).match(REFRESH_SCORE_RE)![1], 10);
      expect(refreshScore).toBe(parity);
    });

    // 🅿️ BANKED FOR v2 — honest boundary, not faked.
    // Score-delta is BLIND to content drift: a slot whose VALUE changes but
    // stays populated keeps the score, so refresh reports no score-drift while
    // the DNA genuinely moved. v1 does not detect this. The slot-diff layer
    // (mcpaas-cf spike → faf-cli consolidation) is the spec that closes it.
    // Marked skipped so the gap is on the record, not papered over.
    test.skip('v2: content drift (slot value changed, score stable) is detected', () => {
      // Needs slot-diff: diff baseline .faf content vs current, report which
      // slot keys changed. Tracked for the next version.
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
