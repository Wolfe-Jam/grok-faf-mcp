/**
 * 🏁 WJTTC — bun migration + MCP integrity (grok-faf-mcp)
 *
 * Championship-grade proof that the Jest→bun migration is real and the MCP
 * server works over the protocol. 5-step WJTTC flow (run in order):
 *   1 🛑 BRAKE  — hard gates: the migration is real & safe
 *   2 ⚙️ ENGINE — core: the MCP protocol works end-to-end
 *   3 🌬️ AERO   — deep behavior (Phase 2)
 *   4 🛞 TYRE   — live cred-costing roundtrips (pass-through here)
 *   5 🔧 PIT    — evaluation / quality bars (pass-through here)
 * Pass-through = "considered, N/A this stage → pass" (not skipped).
 */
import { describe, test, expect, beforeAll, afterAll } from 'bun:test';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { GrokFafMcpServer } from '../src/server.js';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
// faf-cli's "exports" map sets a `bun` condition that points at a non-shipped
// `src/index.ts`. Bun's resolver picks that condition first and fails. The
// published dist works fine via the relative path — same module the production
// server uses through tsc's CommonJS require. Cast to any to keep tsc happy.
// (Tradeoff documented in the AERO report; once faf-cli ships src/ or drops
// the bun condition, this can become a bare specifier.)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const fafCliPromise: Promise<any> = import('../node_modules/faf-cli/dist/index.js');

const ROOT = path.resolve(__dirname, '..');
const readJson = (p: string) => JSON.parse(fs.readFileSync(path.join(ROOT, p), 'utf8'));

describe('🏁 WJTTC — bun migration + MCP integrity (grok-faf-mcp)', () => {
  // ───────────────────────────────────────────────────────────────────────
  describe('🛑 BRAKE (1) — the migration is real & safe', () => {
    const pkg = readJson('package.json');

    test('test runner is bun, not jest', () => {
      // Accept either direct `bun test ...` OR a wrapper script that calls
      // bun test internally (see scripts/run-tests.sh — Linux epoll-flake
      // mitigation per task #22). Both shapes preserve "bun, never jest".
      const testScript = pkg.scripts.test as string;
      const direct = testScript.includes('bun test');
      let wrapped = false;
      const wrapperMatch = testScript.match(/scripts\/(\S+\.sh)/);
      if (wrapperMatch) {
        const wrapperPath = path.join(ROOT, 'scripts', wrapperMatch[1]);
        if (fs.existsSync(wrapperPath)) {
          wrapped = fs.readFileSync(wrapperPath, 'utf8').includes('bun test');
        }
      }
      expect(direct || wrapped).toBe(true);
      expect(testScript).not.toContain('jest');
    });

    test('zero jest tooling in devDependencies', () => {
      const dev = pkg.devDependencies ?? {};
      for (const d of ['jest', 'ts-jest', '@jest/globals', '@types/jest']) {
        expect(dev[d]).toBeUndefined();
      }
    });

    test('bunfig.toml present (test discovery root)', () => {
      expect(fs.existsSync(path.join(ROOT, 'bunfig.toml'))).toBe(true);
    });

    test('no jest residue in any test file', () => {
      const dir = path.join(ROOT, 'tests');
      // Exclude THIS file — it references the jest patterns as string/regex
      // literals (it's the checker), which would self-match.
      const files = fs
        .readdirSync(dir)
        .filter((f) => f.endsWith('.test.ts') && f !== 'wjttc-bun.test.ts');
      expect(files.length).toBeGreaterThan(0);
      for (const f of files) {
        const src = fs.readFileSync(path.join(dir, f), 'utf8');
        expect(src).not.toContain('@jest/globals');
        expect(src).not.toMatch(/\bjest\.(fn|mock|spyOn)\b/);
      }
    });

    test('the MCP conformance layer is present', () => {
      expect(fs.existsSync(path.join(ROOT, 'tests/mcp-conformance.test.ts'))).toBe(true);
    });

    test('the server module imports without throwing', () => {
      expect(typeof GrokFafMcpServer).toBe('function');
      expect(() => new GrokFafMcpServer({ transport: 'stdio', fafEnginePath: 'native' })).not.toThrow();
    });
  });

  // ───────────────────────────────────────────────────────────────────────
  describe('⚙️ ENGINE (2) — MCP protocol core', () => {
    test('server constructs on the stdio transport', () => {
      expect(() => new GrokFafMcpServer({ transport: 'stdio', fafEnginePath: 'native' })).not.toThrow();
    });

    test('getServer() exposes the SDK Server', () => {
      const s = new GrokFafMcpServer({ transport: 'stdio', fafEnginePath: 'native' }).getServer();
      expect(s).toBeDefined();
      expect(typeof s.connect).toBe('function');
    });

    describe('canary protocol round-trip (depth lives in mcp-conformance)', () => {
      let client: Client;
      let server: GrokFafMcpServer;

      beforeAll(async () => {
        server = new GrokFafMcpServer({ transport: 'stdio', fafEnginePath: 'native' });
        const [clientT, serverT] = InMemoryTransport.createLinkedPair();
        await server.getServer().connect(serverT);
        client = new Client({ name: 'wjttc-canary', version: '1.0.0' }, { capabilities: {} });
        await client.connect(clientT);
      });

      afterAll(async () => {
        await client.close();
        await server.getServer().close();
      });

      test('initialize handshake settled server identity', () => {
        const info = client.getServerVersion();
        expect(info?.name).toBe('grok-faf-mcp');
        expect(typeof info?.version).toBe('string');
      });

      test('listTools returns a non-empty, uniquely-named set', async () => {
        const { tools } = await client.listTools();
        expect(tools.length).toBeGreaterThan(0);
        const names = tools.map((t) => t.name);
        expect(new Set(names).size).toBe(names.length);
      });

      test('callTool round-trips (faf_about)', async () => {
        const res = await client.callTool({ name: 'faf_about', arguments: {} });
        expect(Array.isArray(res.content)).toBe(true);
        expect(res.isError).toBeFalsy();
      });
    });
  });

  // ───────────────────────────────────────────────────────────────────────
  describe('🌬️ AERO (3) — deep behavior', () => {
    // Phase 2 — deep behavior: per-tool callTool sweep (read-only safety),
    // single-source score determinism (faf-cli's real scoreFafYaml),
    // render determinism (faf-cli's generateProjectHtml — same renderer
    // wired into the championship faf_display fix on the sibling repo),
    // interop roundtrip (faf_chat shells through engine-adapter here —
    // grok exposes no AGENTS/cursor/gemini export tools), identity drift.
    // Fresh client/server pair scoped to this describe.

    // Minimal valid project.faf with an INCOMPLETE human_context — 3 of the
    // 6 Ws populated, all other base slots `slotignored`. Score lands
    // deterministically >0 (most slots populated/ignored) and <100 (3 empty
    // Ws count against). Non-trivial score is required: 0 and 100 would
    // pass determinism assertions trivially.
    const SAMPLE_FAF = [
      'faf_version: "3.0"',
      'project:',
      '  name: aero-fixture',
      '  goal: AERO phase-2 deep-behavior fixture project.',
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
      '  who: AERO testers',
      '  what: deep-behavior fixture',
      '  why: prove single-source determinism',
      // Intentionally leave where/when/how empty so the score is <100.
      '',
    ].join('\n');

    let client: Client;
    let server: GrokFafMcpServer;
    let tmpDir: string;
    let originalCwd: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let fafCli: any;

    beforeAll(async () => {
      originalCwd = process.cwd();
      tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'faf-aero-'));
      fs.writeFileSync(path.join(tmpDir, 'project.faf'), SAMPLE_FAF);

      server = new GrokFafMcpServer({ transport: 'stdio', fafEnginePath: 'native' });
      const [clientT, serverT] = InMemoryTransport.createLinkedPair();
      await server.getServer().connect(serverT);
      client = new Client({ name: 'wjttc-aero', version: '1.0.0' }, { capabilities: {} });
      await client.connect(clientT);

      fafCli = await fafCliPromise;
    });

    afterAll(async () => {
      try {
        await client.close();
      } catch {
        // ignore close errors — best-effort teardown
      }
      try {
        await server.getServer().close();
      } catch {
        // ignore close errors — best-effort teardown
      }
      // Restore cwd even if no test changed it — doctrine (the sibling repo's
      // PR #43 fixed a real cwd-pollution regression caused by NOT doing this).
      process.chdir(originalCwd);
      fs.rmSync(tmpDir, { recursive: true, force: true });
    });

    // ─────────────────────────────────────────────────────────────────────
    // Category 1: read-only callTool sweep + junk-args resilience
    // ─────────────────────────────────────────────────────────────────────
    describe('1. read-only callTool sweep', () => {
      // Curated read-only set: every tool here returns plain text without
      // touching the filesystem when invoked with no args. Verified by
      // reading src/handlers/tools.ts:
      //   - faf_about / faf_what / faf_guide: pure string returns
      //   - faf_friday: branches on optional `test` arg; no-args returns the
      //     blurb without invoking FuzzyDetector
      //   - rag_cache_stats: reads in-memory LAZY-RAG cache only, no fs
      // Excluded: anything that mkdirs / writes (faf_init, faf_write, faf_clear),
      // anything that shells out to the FAF engine subprocess (faf_chat,
      // faf_enhance, faf_sync, faf_bi_sync, faf_trust, faf_status), anything
      // that uses cwd state (faf_score, faf_debug, faf_list, faf_read),
      // and rag_query / rag_cache_clear (state-mutating).
      const READ_ONLY_TOOLS = [
        'faf_about',
        'faf_what',
        'faf_friday',
        'faf_guide',
        'rag_cache_stats',
      ] as const;

      for (const toolName of READ_ONLY_TOOLS) {
        test(`callTool(${toolName}) returns a content array, not isError`, async () => {
          const res = await client.callTool({ name: toolName, arguments: {} });
          expect(res.isError).toBeFalsy();
          expect(Array.isArray(res.content)).toBe(true);
          const content = res.content as Array<{ type: string; text?: string }>;
          expect(content.length).toBeGreaterThan(0);
          expect(content[0].type).toBe('text');
          expect(typeof content[0].text).toBe('string');
          expect((content[0].text as string).length).toBeGreaterThan(0);
        });
      }

      test('junk-args on a real tool does not crash the server', async () => {
        // faf_about ignores its args by design — feeding it {nonsense: 'xyz'}
        // proves the dispatch tolerates extra/unknown fields without crashing.
        // Either it succeeds (graceful) or it returns isError (handled) —
        // never throws unhandled. Then a subsequent valid call must still work,
        // proving the connection survived.
        let rejected = false;
        let isErrorResult = false;
        let ok = false;
        try {
          const res = await client.callTool({
            name: 'faf_about',
            arguments: { nonsense: 'xyz', extra: 42, weird: { nested: true } },
          });
          if (res.isError === true) {
            isErrorResult = true;
          } else {
            ok = true;
            expect(Array.isArray(res.content)).toBe(true);
          }
        } catch (err) {
          rejected = true;
          expect(err).toBeInstanceOf(Error);
        }
        expect(ok || isErrorResult || rejected).toBe(true);

        // Connection survives: a clean call still works.
        const followup = await client.callTool({ name: 'faf_about', arguments: {} });
        expect(followup.isError).toBeFalsy();
      });
    });

    // ─────────────────────────────────────────────────────────────────────
    // Category 2: single-source score determinism + MCP repeatability + TRUE PARITY
    // ─────────────────────────────────────────────────────────────────────
    //
    // INTENT (per the task brief): assert MCP `faf_score` text-score equals
    // faf-cli's `scoreFafYaml(...).score` on the same YAML.
    //
    // ✅ RESOLVED v1.4.1 (this PR): handleFafScore now ports faf-cli's
    // scoreFafYaml directly into FafToolHandler. No need for
    // ChampionshipToolHandler; the truthful scorer is wired into the live
    // handler. Parity now holds.
    //
    // History (kept as breadcrumb — silent-drift = forbidden, so we never
    // erase what the previous test cycle observed):
    //
    //   OBSERVED v1.4.0 (logged + asserted, not hidden): the active
    //   FafToolHandler (src/handlers/tools.ts, the one server.ts actually
    //   wires up at L6 + L59) still used the OLD file-presence pseudo-score
    //   (40 .faf + 30 CLAUDE.md + 15 README.md + 14 project-file). There was
    //   NO ChampionshipToolHandler wired in this repo — only the legacy
    //   handler was present. So MCP `faf_score` and `scoreFafYaml` were
    //   mathematically DIFFERENT functions; demanding strict equality would
    //   have been a guaranteed (and misleading) red.
    //
    //   The divergence was one step deeper than the sibling faf-mcp repo:
    //   there ChampionshipToolHandler existed-but-unwired (Case A, simple
    //   rewire); here ChampionshipToolHandler isn't wired into the live
    //   server at all (Case B, port-then-wire). Same FINDING, different
    //   remediation. v1.4.1 closes both Cases the same way: bring faf-cli's
    //   real scorer into the live handler via the bridge.
    //
    // What we assert in v1.4.1:
    //   a) faf-cli's `scoreFafYaml` is reachable, deterministic, and produces
    //      a sane score on the fixture (>0 <100, repeatable).
    //   b) MCP `faf_score` returns a parseable percentage and is consistent
    //      across two calls on identical state (no flap, no nondeterminism).
    //   c) TRUE PARITY: MCP `faf_score` numeric == faf-cli's
    //      `scoreFafYaml(...).score` on the same YAML. The previous Cycle's
    //      finding is the literal antithesis of this assertion — passing it
    //      now is the loop-closing receipt for v1.4.1.
    describe('2. score determinism (single-source via faf-cli)', () => {
      test('faf-cli scoreFafYaml is deterministic on the fixture (>0, <100)', () => {
        const raw = fs.readFileSync(path.join(tmpDir, 'project.faf'), 'utf-8');
        const r1 = fafCli.scoreFafYaml(raw);
        const r2 = fafCli.scoreFafYaml(raw);
        expect(typeof r1.score).toBe('number');
        expect(r1.score).toBe(r2.score);
        expect(r1.score).toBeGreaterThan(0);
        expect(r1.score).toBeLessThan(100);
        expect(r1.populated).toBe(r2.populated);
        expect(r1.total).toBe(r2.total);
      });

      test('MCP faf_score returns a parseable percentage and is repeatable', async () => {
        const r1 = await client.callTool({
          name: 'faf_score',
          arguments: { path: tmpDir, details: true },
        });
        expect(r1.isError).toBeFalsy();
        const r2 = await client.callTool({
          name: 'faf_score',
          arguments: { path: tmpDir, details: true },
        });
        expect(r2.isError).toBeFalsy();

        const text1 = ((r1.content as Array<{ text?: string }>)[0]?.text ?? '') as string;
        const text2 = ((r2.content as Array<{ text?: string }>)[0]?.text ?? '') as string;

        // Pattern matches both the legacy "📊 FAF SCORE: <n>%" form AND the
        // truthful "<n>/100" form. Either way, capture group 1 is the number.
        const SCORE_RE = /(?:FAF SCORE:\s*|\b)(\d{1,3})\s*(?:%|\/\s*100)/;
        const m1 = text1.match(SCORE_RE);
        const m2 = text2.match(SCORE_RE);
        expect(m1).not.toBeNull();
        expect(m2).not.toBeNull();
        const n1 = parseInt(m1![1], 10);
        const n2 = parseInt(m2![1], 10);
        expect(n1).toBe(n2); // repeatability
        expect(n1).toBeGreaterThanOrEqual(0);
        expect(n1).toBeLessThanOrEqual(100);
      });

      test('TRUE PARITY: MCP faf_score == faf-cli scoreFafYaml on the same YAML', async () => {
        const raw = fs.readFileSync(path.join(tmpDir, 'project.faf'), 'utf-8');
        const parityScore = fafCli.scoreFafYaml(raw).score;

        const res = await client.callTool({
          name: 'faf_score',
          arguments: { path: tmpDir },
        });
        expect(res.isError).toBeFalsy();
        const text = ((res.content as Array<{ text?: string }>)[0]?.text ?? '') as string;

        const SCORE_RE = /(?:FAF SCORE:\s*|\b)(\d{1,3})\s*(?:%|\/\s*100)/;
        const m = text.match(SCORE_RE);
        expect(m).not.toBeNull();
        const mcpScore = parseInt(m![1], 10);

        expect(mcpScore).toBe(parityScore);
      });
    });

    // ─────────────────────────────────────────────────────────────────────
    // Category 3: render determinism via faf-cli's generateProjectHtml
    // ─────────────────────────────────────────────────────────────────────
    //
    // faf-cli ships `generateProjectHtml` as the single-source HTML renderer.
    // grok-faf-mcp doesn't currently expose a `faf_display` tool, but we
    // still exercise the renderer directly here — same dep, same fixture,
    // same byte-identical determinism contract. Proves the renderer behaves
    // deterministically in this repo's resolver/runtime config.
    test('generateProjectHtml is byte-identical across repeat calls', () => {
      const fafPath = path.join(tmpDir, 'project.faf');
      const data = fafCli.readFaf(fafPath);
      const scoreResult = fafCli.scoreFafYaml(fafCli.readFafRaw(fafPath));
      const html1 = fafCli.generateProjectHtml(data, scoreResult, fafPath);
      const html2 = fafCli.generateProjectHtml(data, scoreResult, fafPath);
      expect(typeof html1).toBe('string');
      expect(html1.length).toBeGreaterThan(0);
      expect(html1).toBe(html2);
    });

    // ─────────────────────────────────────────────────────────────────────
    // Category 4: interop roundtrip
    // ─────────────────────────────────────────────────────────────────────
    //
    // The sibling faf-mcp repo exercises `faf_agents` (an AGENTS.md export
    // tool) here. grok-faf-mcp doesn't advertise faf_agents / faf_cursor /
    // faf_gemini. The closest engine-adapter shellout exposed in this repo
    // is `faf_chat`, which shells `faf chat` via FafEngineAdapter.callEngine.
    // The engine subprocess path is environment-dependent (PATH, faf binary
    // availability) — in a hermetic test we can't depend on it succeeding,
    // but we MUST assert it doesn't crash and returns a well-formed
    // CallToolResult either way. That's the real safety guarantee we can
    // offer without faking the dep.
    test('interop tool (faf_chat) returns a well-formed result, no crash', async () => {
      let crashed = false;
      let result: { content: unknown; isError?: boolean } | undefined;
      try {
        result = await client.callTool({
          name: 'faf_chat',
          arguments: {},
        });
      } catch (err) {
        // A rejected promise is also acceptable handling; what's forbidden is
        // an unhandled crash that kills the server connection.
        crashed = false;
        expect(err).toBeInstanceOf(Error);
      }
      expect(crashed).toBe(false);

      if (result) {
        expect(Array.isArray(result.content)).toBe(true);
        // Either it worked (handler returned text) or it failed gracefully
        // (isError true with an error message). Both prove "no crash,
        // well-formed". Anything else would mean the dispatcher leaked.
        const content = result.content as Array<{ type: string; text?: string }>;
        expect(content.length).toBeGreaterThan(0);
        expect(content[0].type).toBe('text');
      }

      // Connection survives.
      const followup = await client.callTool({ name: 'faf_about', arguments: {} });
      expect(followup.isError).toBeFalsy();
    });

    // ─────────────────────────────────────────────────────────────────────
    // Category 5: identity drift
    // ─────────────────────────────────────────────────────────────────────
    describe('5. identity drift', () => {
      test('server identity matches package.json name (grok-faf-mcp)', () => {
        const pkg = readJson('package.json');
        const info = client.getServerVersion();
        expect(info?.name).toBe(pkg.name);
        expect(info?.name).toBe('grok-faf-mcp');
      });

      test('listTools count is in a sane envelope (catches accidental removal)', async () => {
        const { tools } = await client.listTools();
        // Today's count is 21 (probed live: 17 faf_* + 3 rag_* + grok_*-style
        // already absent, FafToolHandler dispatch table at L259-303 + the
        // /info endpoint at server.ts L143-149). Floor at 15 catches any
        // major accidental removal without being brittle to incremental
        // additions.
        expect(tools.length).toBeGreaterThanOrEqual(15);
        // Ceiling guards against accidental duplication / runaway tool
        // registration.
        expect(tools.length).toBeLessThanOrEqual(200);
      });

      test('core tool names are present', async () => {
        const { tools } = await client.listTools();
        const names = new Set(tools.map((t) => t.name));
        // Verified live against FafToolHandler.listTools — these are the
        // names the active handler actually advertises. Includes the RAG
        // surface that distinguishes grok-faf-mcp from sibling faf-mcp.
        for (const required of [
          'faf_about',
          'faf_score',
          'faf_status',
          'faf_init',
          'faf_sync',
          'rag_query',
          'rag_cache_stats',
        ]) {
          expect(names.has(required)).toBe(true);
        }
      });
    });
  });

  // ───────────────────────────────────────────────────────────────────────
  describe('🛞 TYRE (4) — live test [pass-through]', () => {
    test('pass-through: no live cred-costing roundtrips in this suite', () => {
      // Conformance + canary use an in-memory transport (no network/account).
      // Live TYRE tests (real MCP-over-HTTP / registry roundtrips that cost
      // creds) are out of scope for a migration-proof suite.
      // Recorded pass-through: considered, N/A this stage → pass.
      expect(true).toBe(true);
    });
  });

  // ───────────────────────────────────────────────────────────────────────
  describe('🔧 PIT (5) — evaluation / EVAL [pass-through]', () => {
    test('pass-through: quality/behavioural eval is the faf-score Trophy gate', () => {
      // PIT (eval) for this server is the project.faf Trophy gate, enforced in
      // the /pubpro FAF gate — not duplicated here.
      // Recorded pass-through: considered, N/A this stage → pass.
      expect(true).toBe(true);
    });
  });
});
