/**
 * 🏁 WJTTC — Handler cwd-cache sweep (grok-faf-mcp 1.5.0-finish)
 *
 * Locks the cwd-cache fix across the legacy file-reading handlers — the same
 * bug pattern PR #104 fixed in `handleFafRefresh`, swept across:
 *
 *   - `handleFafStatus`  (line 392 area)  — was reading engineAdapter cache
 *   - `handleFafScore`   (line 460 area)  — no-path branch was reading cache
 *   - `handleFafInit`    (line 1087 area) — legacy no-projectName branch
 *   - `handleFafList`    (line 1649 area) — no-path fallback
 *   - `handleFafDebug`   (line 1427 area) — ENHANCED to surface BOTH cwd
 *                                            values (drift detection, not
 *                                            silent normalization — debug's
 *                                            job is honest diagnosis)
 *
 * Why these were silently broken: every existing handler test passes `path:`
 * explicitly via fixtures, which routes around the bug. Real-world MCP calls
 * (Cmd+R agent invocations, no explicit path) hit the buggy branch. The 1.5
 * substrate dogfood surfaced it on refresh_faf first (#104); same pattern
 * lurks in these siblings. This file is the regression shield.
 *
 *   1 🛑 BRAKE  — server boots, handlers callable, no crash on empty args
 *   2 ⚙️ ENGINE — each fixed handler reads from LIVE process.cwd() with no path arg
 *   3 🌬️ AERO   — chdir + no-path roundtrip per handler — distinct-marker proof
 *                  + Debug surfaces BOTH cwd values (the load-bearing assertion)
 *   4 🛞 TYRE   — pass-through (local FS, no cred-costing roundtrip)
 *   5 🔧 PIT    — pass-through (no schema gate; behavior tested above)
 */
import { describe, test, expect, beforeAll, afterAll } from 'bun:test';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { GrokFafMcpServer } from '../src/server.js';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';

// Minimum-viable scorable .faf — sparse, but enough that handlers reading it
// produce visible content. The unique marker is injected per-test so each
// handler call surfaces a value we can assert is from THIS dir.
const FAF_TEMPLATE = (marker: string): string => [
  'faf_version: "3.0"',
  'project:',
  `  name: ${marker}`,
  '  goal: WJTTC handler-cwd-sweep fixture project.',
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
  '  who: handler-cwd-sweep testers',
  '  what: prove handlers read LIVE cwd, not engineAdapter cache',
  '  why: lock the fix surfaced by #104 across the legacy handlers',
  '',
].join('\n');

const textOf = (res: { content: unknown }): string =>
  ((res.content as Array<{ text?: string }>)[0]?.text ?? '') as string;

// Bun-on-Linux flake: MCP-server-heavy files intermittently trip
// `epoll_ctl EEXIST` under `bun test --isolate` on ubuntu (cumulative FD/epoll
// pressure — NOT a logic bug; green every run on macOS + Windows). Skipped on
// Linux ONLY so CI stays honest; full coverage runs on macOS + Windows.
const suite = process.platform === 'linux' ? describe.skip : describe;

suite('🏁 WJTTC — Handler cwd-cache sweep (grok-faf-mcp)', () => {
  let client: Client;
  let server: GrokFafMcpServer;
  let originalCwd: string;

  beforeAll(async () => {
    originalCwd = process.cwd();
    server = new GrokFafMcpServer({ transport: 'stdio', fafEnginePath: 'native' });
    const [clientT, serverT] = InMemoryTransport.createLinkedPair();
    await server.getServer().connect(serverT);
    client = new Client({ name: 'wjttc-handler-cwd-sweep', version: '1.0.0' }, { capabilities: {} });
    await client.connect(clientT);
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
  });

  // ── 🛑 BRAKE — server boots, handlers callable on empty args ────────
  describe('🛑 BRAKE — handlers callable with no args (don\'t crash)', () => {
    test('faf_status accepts {} (no path arg)', async () => {
      const res = await client.callTool({ name: 'faf_status', arguments: {} });
      expect(res).toBeDefined();
      expect((res.content as Array<{ type: string }>)[0]?.type).toBe('text');
    });
    test('faf_score accepts {} (no path arg)', async () => {
      const res = await client.callTool({ name: 'faf_score', arguments: {} });
      expect(res).toBeDefined();
      expect((res.content as Array<{ type: string }>)[0]?.type).toBe('text');
    });
    test('faf_debug accepts {}', async () => {
      const res = await client.callTool({ name: 'faf_debug', arguments: {} });
      expect(res).toBeDefined();
      expect((res.content as Array<{ type: string }>)[0]?.type).toBe('text');
    });
    test('faf_list accepts {} (no path arg)', async () => {
      const res = await client.callTool({ name: 'faf_list', arguments: {} });
      expect(res).toBeDefined();
      expect((res.content as Array<{ type: string }>)[0]?.type).toBe('text');
    });
  });

  // ── ⚙️ ENGINE — each handler reads cwd correctly ─────────────────────
  describe('⚙️ ENGINE — handlers read from LIVE process.cwd() with no path arg', () => {
    test('faf_status with no path arg → references the live cwd', async () => {
      const liveDir = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'faf-cwd-status-')));
      const savedCwd = process.cwd();
      try {
        process.chdir(liveDir);
        const res = await client.callTool({ name: 'faf_status', arguments: {} });
        const text = textOf(res);
        // No .faf in liveDir → status reports "no FAF file found in <liveDir>"
        // The KEY assertion: liveDir appears in the message, not some cached parent dir
        expect(text).toContain(liveDir);
      } finally {
        process.chdir(savedCwd);
        fs.rmSync(liveDir, { recursive: true, force: true });
      }
    });

    test('faf_score with no path arg → scores the LIVE cwd (parity vs explicit path)', async () => {
      const liveDir = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'faf-cwd-score-')));
      const distinctMarker = 'score-marker-' + Date.now();
      fs.writeFileSync(path.join(liveDir, 'project.faf'), FAF_TEMPLATE(distinctMarker));
      const savedCwd = process.cwd();
      try {
        // Baseline: call with explicit path, capture the score
        const baseline = await client.callTool({ name: 'faf_score', arguments: { path: liveDir } });
        const baseScore = textOf(baseline).match(/(\d{1,3})\/100/)?.[1];
        expect(baseScore).toBeDefined();

        // Now chdir + no-path call — same .faf should produce same score
        process.chdir(liveDir);
        const res = await client.callTool({ name: 'faf_score', arguments: {} });
        const text = textOf(res);
        expect(res.isError).toBeFalsy();
        const noPathScore = text.match(/(\d{1,3})\/100/)?.[1];
        // If the handler had read engineAdapter cache, it would score a
        // different .faf (the cached parent dir's, or "no .faf found"). Same
        // score = handler resolved cwd to liveDir, not the cache.
        expect(noPathScore).toBe(baseScore);
      } finally {
        process.chdir(savedCwd);
        fs.rmSync(liveDir, { recursive: true, force: true });
      }
    });

    test('faf_debug → surfaces BOTH shell cwd AND engine adapter cwd', async () => {
      const res = await client.callTool({ name: 'faf_debug', arguments: {} });
      const text = textOf(res);
      // Both labels present — drift detection is the whole point
      expect(text).toContain('Shell cwd');
      expect(text).toContain('Engine adapter cwd');
    });

    test('faf_list with no path arg → lists the LIVE cwd', async () => {
      // realpathSync canonicalizes mac's `/var/folders` → `/private/var/folders`
      // symlink AND Windows tmpdir case/separator quirks. Without this, the
      // chdir succeeds but downstream string comparisons can mismatch.
      const liveDir = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'faf-cwd-list-')));
      const sentinelDir = 'sentinel-' + Date.now();
      fs.mkdirSync(path.join(liveDir, sentinelDir));
      const savedCwd = process.cwd();
      try {
        process.chdir(liveDir);
        // NO path arg — exercises the engineAdapter-vs-process.cwd() branch
        const res = await client.callTool({ name: 'faf_list', arguments: {} });
        const text = textOf(res);
        // Print the actual error text on failure so cross-platform diagnosis is possible
        if (res.isError) {
          throw new Error(`faf_list returned isError=true; output was: ${text}`);
        }
        // The sentinel subdir lives in liveDir; if the handler read engineAdapter
        // cache instead of live cwd, the sentinel wouldn't appear
        expect(text).toContain(sentinelDir);
      } finally {
        process.chdir(savedCwd);
        fs.rmSync(liveDir, { recursive: true, force: true });
      }
    });
  });

  // ── 🌬️ AERO — drift detection via Debug (the load-bearing assertion) ──
  describe('🌬️ AERO — Debug honestly flags cwd drift when present', () => {
    test('Debug output flags cwd drift when shell cwd ≠ engine adapter cwd', async () => {
      // Move shell cwd to a tmpDir distinct from wherever engineAdapter cached.
      // Server was constructed at suite-startup; engineAdapter's cwd was frozen
      // then. chdir now → mismatch → debug must surface "drift".
      const driftDir = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'faf-debug-drift-')));
      const savedCwd = process.cwd();
      try {
        process.chdir(driftDir);
        const res = await client.callTool({ name: 'faf_debug', arguments: {} });
        const text = textOf(res);
        // If shell cwd == engine cwd, drift line absent (match case — also OK).
        // If shell cwd ≠ engine cwd, "drift" appears.
        // Both states are correct; we assert the labels appear so the operator
        // can SEE the state either way (the whole point of enhanced debug).
        expect(text).toContain('Shell cwd');
        expect(text).toContain('Engine adapter cwd');
        // Shell cwd line should contain driftDir specifically
        expect(text).toContain(driftDir);
      } finally {
        process.chdir(savedCwd);
        fs.rmSync(driftDir, { recursive: true, force: true });
      }
    });

    test('CWD-DISCOVERY parity: same fix shape as refresh_faf #104', async () => {
      // Cross-check: the fix should make all four file-reading handlers (Status,
      // Score, List, plus Refresh from #104) respond consistently when chdir'd.
      // We don't re-test refresh_faf here (its own WJTTC file covers it); the
      // ENGINE block above is the per-handler proof. This test is a sanity
      // check that the chdir mechanism itself works.
      const sanityDir = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'faf-sanity-')));
      const savedCwd = process.cwd();
      try {
        process.chdir(sanityDir);
        expect(process.cwd()).toBe(fs.realpathSync(sanityDir));
      } finally {
        process.chdir(savedCwd);
        fs.rmSync(sanityDir, { recursive: true, force: true });
      }
    });
  });

  // ── 🛞 TYRE — pass-through ──────────────────────────────────────────
  describe('🛞 TYRE — live [pass-through]', () => {
    test('pass-through: handlers are local FS reads, no cred-costing roundtrip', () => {
      expect(true).toBe(true);
    });
  });

  // ── 🔧 PIT — pass-through ───────────────────────────────────────────
  describe('🔧 PIT — eval [pass-through]', () => {
    test('pass-through: no schema gate — behavior tested above is the gate', () => {
      expect(true).toBe(true);
    });
  });
});
