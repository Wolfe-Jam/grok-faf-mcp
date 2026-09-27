/**
 * 🏁 WJTTC — grok-faf-mcp 2.0.0, The Always33 Edition
 *
 * Locks what 2.0.0 claims, so a later change can't quietly undo it:
 *
 *   1 🛑 BRAKE  — the always-33 numbers: 21 filled with no markers = 64%,
 *                 the same 21 + the 12 enterprise markers = 100%
 *   2 ⚙️ ENGINE — one number: faf_score · scoreFafFile · faf_trust · the
 *                 resources === faf-cli 8's own `faf score --json`
 *   3 🌬️ AERO   — faf_init writes a real project.faf (faf_version, the 12
 *                 markers), reports faf-cli's score, refuses without force
 *   4 🛞 TYRE   — no PATH scoring: faf_score, faf_trust and the resources
 *                 never call the engine adapter (which shells out to `faf`)
 *   5 🔧 PIT    — the package: one kernel (faf-cli ^8, no direct
 *                 faf-scoring-kernel), build cleans dist, only the always-33
 *                 scorer ships
 *   6 🌐 LIVE   — opt-in (WJTTC_LIVE=1): hosted mcpaas.live/grok faf_score
 *                 === this package's faf_score on real public project.faf files
 */
import { describe, test, expect, beforeAll, afterAll } from 'bun:test';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { spawnSync } from 'child_process';
import { GrokFafMcpServer } from '../src/server.js';
import { scoreFafFile } from '../src/faf-core/commands/score.js';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';

const ROOT = path.resolve(__dirname, '..');
const FAF_CLI = path.join(ROOT, 'node_modules', 'faf-cli', 'dist', 'cli.js');

// 21 slots filled: project 3 · human_context 6 · stack frontend 4 · backend 5 · universal 3.
const FULL21 = [
  'faf_version: "3.0"',
  'project:',
  '  name: wjttc-200',
  '  goal: Lock the always-33 contract of grok-faf-mcp 2.0.0.',
  '  main_language: TypeScript',
  'human_context:',
  '  who: grok-faf-mcp maintainers',
  '  what: a fixture with the 21 base slots filled',
  '  why: every FAF app must give the same always-33 number',
  '  where: tests/wjttc-200-always33.test.ts',
  '  when: 2.0.0',
  '  how: bun test',
  'stack:',
  '  frontend: React',
  '  css_framework: Tailwind',
  '  ui_library: shadcn',
  '  state_management: Zustand',
  '  backend: Node.js',
  '  api_type: MCP',
  '  runtime: Node.js',
  '  database: SQLite',
  '  connection: local file',
  '  hosting: npm',
  '  build: tsc',
  '  cicd: GitHub Actions',
  '',
].join('\n');

// The 12 enterprise slots, marked slotignored — what faf_init / `faf auto` write.
const MARKERS12 = [
  '  monorepo_tool: slotignored',
  '  package_manager: slotignored',
  '  workspaces: slotignored',
  '  admin: slotignored',
  '  cache: slotignored',
  '  search: slotignored',
  '  storage: slotignored',
  'monorepo:',
  '  packages_count: slotignored',
  '  build_orchestrator: slotignored',
  '  versioning_strategy: slotignored',
  '  shared_configs: slotignored',
  '  remote_cache: slotignored',
  '',
].join('\n');

const MARKED = FULL21 + MARKERS12;

// Partly filled + marked: a score strictly between 0 and 100.
const PARTIAL = MARKED.replace(/^ {2}(where|when|how): .*\n/gm, '').replace(/^ {2}(database|connection): .*\n/gm, '');

const ENTERPRISE_KEYS = [
  'monorepo_tool', 'package_manager', 'workspaces', 'admin', 'cache', 'search', 'storage',
  'packages_count', 'build_orchestrator', 'versioning_strategy', 'shared_configs', 'remote_cache',
];

interface CliScore { score: number; populated: number; active: number; total: number; ignored: number }

/** faf-cli 8's own answer: `faf score --json` run in that folder. */
function cliScore(dir: string): CliScore {
  const r = spawnSync('node', [FAF_CLI, 'score', '--json'], {
    cwd: dir,
    encoding: 'utf8',
  });
  if (r.status !== 0 && !r.stdout) throw new Error(`faf score failed: ${r.stderr}`);
  return JSON.parse(r.stdout) as CliScore;
}

function fixtureDir(yaml: string): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'wjttc-200-'));
  fs.writeFileSync(path.join(dir, 'project.faf'), yaml);
  return dir;
}

const textOf = (res: { content: unknown }): string =>
  ((res.content as Array<{ text?: string }>)[0]?.text ?? '') as string;

const headline = (text: string): number => {
  const m = text.match(/FAF SCORE: (\d+)\/100/);
  if (!m) throw new Error(`no FAF SCORE headline in: ${text.slice(0, 120)}`);
  return Number(m[1]);
};

const dirs: string[] = [];
const mk = (yaml: string): string => {
  const d = fixtureDir(yaml);
  dirs.push(d);
  return d;
};

afterAll(() => {
  for (const d of dirs) fs.rmSync(d, { recursive: true, force: true });
});

// ── 🛑 BRAKE + ⚙️ ENGINE (pure, every platform) ─────────────────────────
describe('🏁 WJTTC-200 — always-33 numbers (scoreFafFile)', () => {
  test('🛑 21 filled, no enterprise markers = 64% (21 / 33)', async () => {
    const r = await scoreFafFile(path.join(mk(FULL21), 'project.faf'));
    expect(r.score).toBe(64);
    expect(r.filled).toBe(21);
    expect(r.active).toBe(33);
    expect(r.total).toBe(33);
  });

  test('🛑 the same 21 + the 12 markers = 100% (21 / 21)', async () => {
    const r = await scoreFafFile(path.join(mk(MARKED), 'project.faf'));
    expect(r.score).toBe(100);
    expect(r.filled).toBe(21);
    expect(r.active).toBe(21);
    expect(r.ignored).toBe(12);
    expect(r.total).toBe(33);
  });

  test('⚙️ scoreFafFile === faf-cli 8 `faf score --json` on every fixture', async () => {
    for (const yaml of [FULL21, MARKED, PARTIAL]) {
      const dir = mk(yaml);
      const ours = await scoreFafFile(path.join(dir, 'project.faf'));
      const cli = cliScore(dir);
      expect(ours.score).toBe(cli.score);
      expect(ours.filled).toBe(cli.populated);
      expect(ours.active).toBe(cli.active);
    }
  });
});

// ── 🔧 PIT — the package (pure, every platform) ─────────────────────────
describe('🏁 WJTTC-200 — one kernel, clean package', () => {
  const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));

  test('faf-cli ^8 is the scorer; no direct faf-scoring-kernel dependency', () => {
    expect(pkg.dependencies['faf-cli']).toMatch(/^\^8\./);
    expect(pkg.dependencies['faf-scoring-kernel']).toBeUndefined();
    expect(pkg.devDependencies?.['faf-scoring-kernel']).toBeUndefined();
  });

  test('build cleans dist before tsc, so files from an older build cannot ship', () => {
    expect(pkg.scripts.build).toMatch(/rmSync\('dist'/);
    expect(pkg.scripts.build).toMatch(/&& tsc$/);
  });

  test('only the always-33 scorer ships: no Mk3.1 compiler in src or dist', () => {
    expect(fs.existsSync(path.join(ROOT, 'src', 'faf-core', 'compiler'))).toBe(false);
    const distCompiler = path.join(ROOT, 'dist', 'src', 'faf-core', 'compiler');
    expect(fs.existsSync(distCompiler)).toBe(false);
  });
});

// ── Server-driven tiers ──────────────────────────────────────────────────
// Bun-on-Linux flake: MCP-server-heavy files intermittently trip
// `epoll_ctl EEXIST` under `bun test --isolate` on ubuntu (runner FD/epoll
// pressure, not a logic bug). Same guard as the other server suites; full
// coverage runs on macOS + Windows.
const serverSuite = process.platform === 'linux' ? describe.skip : describe;

serverSuite('🏁 WJTTC-200 — the tools give faf-cli\'s number', () => {
  let client: Client;
  let server: GrokFafMcpServer;
  let originalCwd: string;
  const engineCalls: string[] = [];

  beforeAll(async () => {
    originalCwd = process.cwd();
    server = new GrokFafMcpServer({ transport: 'stdio', fafEnginePath: 'native' });

    // 🛞 TYRE spy: the engine adapter is the one path that shells out to a `faf`
    // binary (callEngine → PATH / known install locations). Record every call.
    const adapter = (server as any).toolHandler.engineAdapter;
    expect(adapter).toBe((server as any).resourceHandler.engineAdapter);
    // Stubbed, not passed through: the test never runs a real `faf` binary.
    adapter.callEngine = async (command: string, args: string[] = []) => {
      engineCalls.push([command, ...args].join(' '));
      return { success: true, data: 'wjttc-200 spy' };
    };
    const [clientT, serverT] = InMemoryTransport.createLinkedPair();
    await server.getServer().connect(serverT);
    client = new Client({ name: 'wjttc-200', version: '1.0.0' }, { capabilities: {} });
    await client.connect(clientT);
  });

  afterAll(async () => {
    try { await client.close(); } catch { /* best-effort */ }
    try { await server.getServer().close(); } catch { /* best-effort */ }
    process.chdir(originalCwd);
  });

  test('⚙️ faf_score === faf-cli on 64 / 100 / partial, and shows populated/active', async () => {
    for (const yaml of [FULL21, MARKED, PARTIAL]) {
      const dir = mk(yaml);
      const cli = cliScore(dir);
      const text = textOf(await client.callTool({ name: 'faf_score', arguments: { path: dir } }));
      expect(headline(text)).toBe(cli.score);
      expect(text).toContain(`${cli.populated}/${cli.active} slots populated`);
    }
  });

  test('⚙️ faf_trust reports faf-cli\'s always-33 score', async () => {
    const dir = mk(MARKED);
    const cli = cliScore(dir);
    const res = await client.callTool({ name: 'faf_trust', arguments: { path: dir } });
    const text = textOf(res);
    expect(res.isError).toBeFalsy();
    expect(text).toContain('always-33');
    expect(text).toContain(`${cli.score}%`);
  });

  test('⚙️ claude-faf://status and ://context carry faf-cli\'s score', async () => {
    const dir = mk(PARTIAL);
    const cli = cliScore(dir);
    // faf_score with a path points the server's working directory at it.
    await client.callTool({ name: 'faf_score', arguments: { path: dir } });

    const status = await client.readResource({ uri: 'claude-faf://status' });
    const statusText = (status.contents[0] as { text: string }).text;
    expect(statusText).toContain('always-33');
    expect(statusText).toContain(`${cli.populated}/${cli.active} slots`);

    const context = await client.readResource({ uri: 'claude-faf://context' });
    const body = JSON.parse((context.contents[0] as { text: string }).text);
    expect(body.score).toBe(cli.score);
    expect(body.populated).toBe(cli.populated);
    expect(body.active).toBe(cli.active);
    expect(body.total).toBe(33);
  });

  test('🌬️ faf_init writes faf_version + the 12 markers and reports faf-cli\'s score', async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'wjttc-200-init-'));
    dirs.push(dir);
    fs.writeFileSync(
      path.join(dir, 'package.json'),
      JSON.stringify({ name: 'wjttc-200-init', description: 'faf_init fixture', dependencies: {} }, null, 2),
    );

    const res = await client.callTool({ name: 'faf_init', arguments: { path: dir } });
    const text = textOf(res);
    expect(res.isError).toBeFalsy();

    const written = fs.readFileSync(path.join(dir, 'project.faf'), 'utf8');
    expect(written).toMatch(/^faf_version:/m);
    expect(written).toMatch(/^project:\s*$/m); // a mapping, not the legacy plain string
    for (const key of ENTERPRISE_KEYS) {
      expect(written).toMatch(new RegExp(`^\\s+${key}: slotignored\\s*$`, 'm'));
    }

    const cli = cliScore(dir);
    expect(text).toContain('always-33');
    expect(text).toContain(`${cli.score}%`);
    expect(text).not.toContain('90%+');
  });

  test('🌬️ faf_init refuses to overwrite without force, and leaves the file alone', async () => {
    const dir = mk(MARKED);
    const before = fs.readFileSync(path.join(dir, 'project.faf'), 'utf8');
    const text = textOf(await client.callTool({ name: 'faf_init', arguments: { path: dir } }));
    expect(text).toContain('already exists');
    expect(fs.readFileSync(path.join(dir, 'project.faf'), 'utf8')).toBe(before);
  });

  test('🛞 faf_score, faf_trust and the resources never shell out to a `faf` binary', async () => {
    const dir = mk(MARKED);
    const before = engineCalls.length;
    const score = textOf(await client.callTool({ name: 'faf_score', arguments: { path: dir } }));
    await client.callTool({ name: 'faf_trust', arguments: { path: dir } });
    await client.readResource({ uri: 'claude-faf://status' });
    await client.readResource({ uri: 'claude-faf://context' });
    expect(engineCalls.slice(before)).toEqual([]);
    expect(headline(score)).toBe(100);
  });

  test('🛞 the spy is live: faf_sync still goes through the engine adapter', async () => {
    // Negative control — proves the spy would catch a shell-out.
    const before = engineCalls.length;
    await client.callTool({ name: 'faf_sync', arguments: {} });
    expect(engineCalls.slice(before)).toContain('sync');
  });
});

// ── 🌐 LIVE — opt-in: hosted grok === this package ───────────────────────
const LIVE = process.env.WJTTC_LIVE === '1';
const liveSuite = LIVE && process.platform !== 'linux' ? describe : describe.skip;

liveSuite('🏁 WJTTC-200 — LIVE: mcpaas.live/grok scores like the npm package', () => {
  const REPOS = ['agents-md-facts', 'faf-python-sdk'];
  let client: Client;
  let server: GrokFafMcpServer;

  beforeAll(async () => {
    server = new GrokFafMcpServer({ transport: 'stdio', fafEnginePath: 'native' });
    const [clientT, serverT] = InMemoryTransport.createLinkedPair();
    await server.getServer().connect(serverT);
    client = new Client({ name: 'wjttc-200-live', version: '1.0.0' }, { capabilities: {} });
    await client.connect(clientT);
  });

  afterAll(async () => {
    try { await client.close(); } catch { /* best-effort */ }
    try { await server.getServer().close(); } catch { /* best-effort */ }
  });

  for (const repo of REPOS) {
    test(`hosted faf_score === local faf_score — ${repo}`, async () => {
      const content = await (await fetch(`https://raw.githubusercontent.com/Wolfe-Jam/${repo}/main/project.faf`)).text();
      const res = await fetch('https://mcpaas.live/grok/mcp/v1', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json, text/event-stream',
          'MCP-Protocol-Version': '2025-11-25',
        },
        body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/call', params: { name: 'faf_score', arguments: { content } } }),
      });
      const hosted = headline((await res.json()).result.content[0].text);
      const local = headline(textOf(await client.callTool({ name: 'faf_score', arguments: { path: mk(content) } })));
      expect(hosted).toBe(local);
    }, 20_000);
  }
});
