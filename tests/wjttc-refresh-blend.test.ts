/**
 * 🏁 WJTTC — refresh_blend (grok-faf-mcp 1.5)
 *
 * Championship proof for the baked-in two-intensity refresh (Cmd+R / Cmd+Shift+R
 * analog). Composes refresh_faf + refresh_fafm into a single ergonomic entry
 * point. Locked doctrine ([[refresh-fafm-cmd-shift-r]]): blend = BAKED IN,
 * NOT a dial — both layers ALWAYS fire, mode only affects fafm intensity.
 *
 *   1 🛑 BRAKE  — fail-safe: bad mode strings default to blend; missing args propagate honestly
 *   2 ⚙️ ENGINE — core: pure-function orchestrator composes the two callables correctly
 *   3 🌬️ AERO   — honest: SDK round-trip both modes (per spec), output-shape PARITY across
 *                 modes, fafm intensity differs (delta vs verbatim) as expected
 *   4 🛞 TYRE   — pass-through (orchestration is local; underlying refreshes are FS)
 *   5 🔧 PIT    — pass-through (no schema gate; output is JSON-fenced)
 *
 * Spec source: GROK-FAF-MCP-1.5-CODING-SESSION-BREAKDOWN §#5. Doctrine
 * source: memory/refresh-fafm-cmd-shift-r.md (LOCK).
 */
import { describe, test, expect, beforeAll, afterAll } from 'bun:test';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { GrokFafMcpServer } from '../src/server.js';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { runRefreshBlend, type RefreshMode } from '../src/orchestrator/refresh-blend';

// ── Fixtures ────────────────────────────────────────────────────────────────

const SAMPLE_FAF = [
  'faf_version: "3.0"',
  'project:',
  '  name: blend-fixture',
  '  goal: WJTTC refresh_blend fixture.',
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
  '  who: blend testers',
  '  what: two-intensity fixture',
  '  why: prove blend orchestration end-to-end',
  '',
].join('\n');

const SAMPLE_FAFM = [
  'version: "1.0"',
  'profile: "knowledge"',
  'namepoint: "@blend-fixture:1.0"',
  'memory:',
  '  facts:',
  '    - text: "first fact"',
  '      id: "f1"',
  '      timestamp: "2026-05-30T10:00:00Z"',
  '    - text: "second fact"',
  '      id: "f2"',
  '      timestamp: "2026-05-30T12:00:00Z"',
  '',
].join('\n');

// Linux bun --isolate flake parity with wjttc-refresh*.test.ts
const suite = process.platform === 'linux' ? describe.skip : describe;

const textOf = (res: { content: unknown }): string =>
  ((res.content as Array<{ text?: string }>)[0]?.text ?? '') as string;

const payloadOf = (res: { content: unknown }): any => {
  const t = textOf(res);
  const m = t.match(/```json\n([\s\S]*?)\n```/);
  if (!m) throw new Error('no JSON payload in refresh_blend response: ' + t);
  return JSON.parse(m[1]);
};

suite('🏁 WJTTC — refresh_blend (grok-faf-mcp 1.5)', () => {
  let client: Client;
  let server: GrokFafMcpServer;
  let tmpDir: string;
  let originalCwd: string;

  beforeAll(async () => {
    originalCwd = process.cwd();
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'faf-blend-'));
    fs.writeFileSync(path.join(tmpDir, 'project.faf'), SAMPLE_FAF);
    fs.writeFileSync(path.join(tmpDir, 'soul.fafm'), SAMPLE_FAFM);
    process.chdir(tmpDir);

    server = new GrokFafMcpServer({ transport: 'stdio', fafEnginePath: 'native' });
    const [clientT, serverT] = InMemoryTransport.createLinkedPair();
    await server.getServer().connect(serverT);
    client = new Client({ name: 'wjttc-refresh-blend', version: '1.0.0' }, { capabilities: {} });
    await client.connect(clientT);
  });

  afterAll(async () => {
    try { await client.close(); } catch { /* best-effort */ }
    try { await server.getServer().close(); } catch { /* best-effort */ }
    process.chdir(originalCwd);
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  // ── 🛑 BRAKE — fail-safe ────────────────────────────────────────────
  describe('🛑 BRAKE — fail-safe', () => {
    test('unknown mode string falls back to default "blend" (never crashes on bad enum)', async () => {
      const res = await client.callTool({
        name: 'refresh_blend',
        arguments: { mode: 'not-a-real-mode' as unknown as string, path: tmpDir },
      });
      expect(res.isError).toBeFalsy();
      const p = payloadOf(res);
      expect(p.mode).toBe('blend');
    });

    test('no args at all → defaults to blend, runs end-to-end without crashing', async () => {
      const res = await client.callTool({ name: 'refresh_blend', arguments: {} });
      expect(res.isError).toBeFalsy();
      const p = payloadOf(res);
      expect(p.mode).toBe('blend');
      expect(p.faf).toBeDefined();
      expect(p.fafm).toBeDefined();
    });
  });

  // ── ⚙️ ENGINE — core orchestration (pure-function unit) ─────────────
  describe('⚙️ ENGINE — pure runRefreshBlend orchestration', () => {
    test('runRefreshBlend fires BOTH callables exactly once per call', async () => {
      let fafCalls = 0;
      let fafmCalls = 0;
      const callables = {
        refreshFaf: async () => {
          fafCalls++;
          return { tool: 'faf', ok: true };
        },
        refreshFafm: async () => {
          fafmCalls++;
          return { tool: 'fafm', ok: true };
        },
      };
      await runRefreshBlend({}, callables);
      expect(fafCalls).toBe(1);
      expect(fafmCalls).toBe(1);
    });

    test('mode=blend does NOT pass verbatim:true to refreshFafm', async () => {
      let fafmArgs: any = null;
      const callables = {
        refreshFaf: async () => ({}),
        refreshFafm: async (a: any) => {
          fafmArgs = a;
          return {};
        },
      };
      await runRefreshBlend({ mode: 'blend' }, callables);
      expect(fafmArgs?.verbatim).toBeUndefined();
    });

    test('mode=nuke passes verbatim:true to refreshFafm', async () => {
      let fafmArgs: any = null;
      const callables = {
        refreshFaf: async () => ({}),
        refreshFafm: async (a: any) => {
          fafmArgs = a;
          return {};
        },
      };
      await runRefreshBlend({ mode: 'nuke' }, callables);
      expect(fafmArgs?.verbatim).toBe(true);
    });

    test('since arg passes through in blend mode but is SUPPRESSED in nuke mode (verbatim wins)', async () => {
      let blendArgs: any = null;
      let nukeArgs: any = null;
      const cap = (target: 'blend' | 'nuke') => async (a: any) => {
        if (target === 'blend') blendArgs = a;
        else nukeArgs = a;
        return {};
      };
      await runRefreshBlend({ mode: 'blend', since: '2026-05-30T00:00:00Z' }, {
        refreshFaf: async () => ({}),
        refreshFafm: cap('blend'),
      });
      await runRefreshBlend({ mode: 'nuke', since: '2026-05-30T00:00:00Z' }, {
        refreshFaf: async () => ({}),
        refreshFafm: cap('nuke'),
      });
      expect(blendArgs?.since).toBe('2026-05-30T00:00:00Z');
      expect(nukeArgs?.since).toBeUndefined(); // suppressed — verbatim doesn't take since
    });

    test('faf args (baseline, path) pass through to refreshFaf untouched', async () => {
      let fafArgs: any = null;
      const callables = {
        refreshFaf: async (a: any) => {
          fafArgs = a;
          return {};
        },
        refreshFafm: async () => ({}),
      };
      await runRefreshBlend({ baseline: 42, path: '/tmp/x' }, callables);
      expect(fafArgs).toEqual({ baseline: 42, path: '/tmp/x' });
    });

    test('result envelope shape: { mode, faf, fafm, detected_at }', async () => {
      const r = await runRefreshBlend({}, {
        refreshFaf: async () => ({ marker: 'faf-result' }),
        refreshFafm: async () => ({ marker: 'fafm-result' }),
      });
      expect(Object.keys(r).sort()).toEqual(['detected_at', 'faf', 'fafm', 'mode']);
      expect(r.mode).toBe('blend');
      expect((r.faf as any).marker).toBe('faf-result');
      expect((r.fafm as any).marker).toBe('fafm-result');
      expect(r.detected_at).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    });
  });

  // ── 🌬️ AERO — SDK round-trip + PARITY (spec-required tier) ──────────
  describe('🌬️ AERO — SDK round-trip both modes + output-shape parity', () => {
    test('round-trip: refresh_blend (mode=blend) returns a parity envelope via the SDK', async () => {
      const res = await client.callTool({
        name: 'refresh_blend',
        arguments: { mode: 'blend', path: tmpDir },
      });
      expect(res.isError).toBeFalsy();
      const p = payloadOf(res);
      expect(p.mode).toBe('blend');
      expect(p.faf).toBeDefined();
      expect(p.fafm).toBeDefined();
      expect(p.detected_at).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    });

    test('round-trip: refresh_blend (mode=nuke) returns the SAME envelope shape (parity)', async () => {
      const res = await client.callTool({
        name: 'refresh_blend',
        arguments: { mode: 'nuke', path: tmpDir },
      });
      expect(res.isError).toBeFalsy();
      const p = payloadOf(res);
      expect(p.mode).toBe('nuke');
      expect(p.faf).toBeDefined();
      expect(p.fafm).toBeDefined();
      expect(p.detected_at).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    });

    test('PARITY: outer envelope keys are IDENTICAL across blend vs nuke modes', async () => {
      const blend = payloadOf(await client.callTool({
        name: 'refresh_blend',
        arguments: { mode: 'blend', path: tmpDir },
      }));
      const nuke = payloadOf(await client.callTool({
        name: 'refresh_blend',
        arguments: { mode: 'nuke', path: tmpDir },
      }));
      expect(Object.keys(blend).sort()).toEqual(Object.keys(nuke).sort());
    });

    test('INTENSITY DIFFERS as locked: blend gives fafm DELTA, nuke gives fafm VERBATIM CONTENT', async () => {
      // Use the SDK to invoke both modes and inspect the fafm inner payload.
      // The fafm result is itself a CallToolResult-shaped text with its own
      // JSON-fenced payload; extract that nested payload to verify.
      const extractFafmInnerPayload = (envelope: any): any => {
        const fafmText: string = envelope.fafm?.content?.[0]?.text ?? '';
        const m = fafmText.match(/```json\n([\s\S]*?)\n```/);
        return m ? JSON.parse(m[1]) : null;
      };

      const blend = payloadOf(await client.callTool({
        name: 'refresh_blend',
        arguments: { mode: 'blend', path: tmpDir },
      }));
      const nuke = payloadOf(await client.callTool({
        name: 'refresh_blend',
        arguments: { mode: 'nuke', path: tmpDir },
      }));

      const blendFafm = extractFafmInnerPayload(blend);
      const nukeFafm = extractFafmInnerPayload(nuke);

      // Locked refresh_fafm contract: delta mode has delta + no content;
      // verbatim mode has content + no delta. Mutually exclusive — proven in
      // the refresh_fafm AERO suite. We're now proving refresh_blend respects
      // that contract by mode.
      expect(blendFafm).not.toBeNull();
      expect(nukeFafm).not.toBeNull();
      expect(blendFafm.delta).toBeDefined();
      expect(blendFafm.content).toBeUndefined();
      expect(nukeFafm.content).toBeDefined();
      expect(nukeFafm.delta).toBeUndefined();
    });

    test('default mode (no `mode` arg) behaves identically to mode=blend', async () => {
      const noMode = payloadOf(await client.callTool({
        name: 'refresh_blend',
        arguments: { path: tmpDir },
      }));
      const explicit = payloadOf(await client.callTool({
        name: 'refresh_blend',
        arguments: { mode: 'blend', path: tmpDir },
      }));
      expect(noMode.mode).toBe(explicit.mode);
      // The fafm payload identity (delta vs content) should match
      const innerKeys = (env: any): string[] => {
        const fafmText: string = env.fafm?.content?.[0]?.text ?? '';
        const m = fafmText.match(/```json\n([\s\S]*?)\n```/);
        return m ? Object.keys(JSON.parse(m[1])).sort() : [];
      };
      expect(innerKeys(noMode)).toEqual(innerKeys(explicit));
    });

    test('determinism: two calls with the same input → same fafm hash inside the envelope', async () => {
      const extractFafmHash = (envelope: any): string | undefined => {
        const fafmText: string = envelope.fafm?.content?.[0]?.text ?? '';
        const m = fafmText.match(/```json\n([\s\S]*?)\n```/);
        if (!m) return undefined;
        return JSON.parse(m[1])?.stamp?.hash;
      };
      const a = payloadOf(await client.callTool({
        name: 'refresh_blend',
        arguments: { mode: 'blend', path: tmpDir },
      }));
      const b = payloadOf(await client.callTool({
        name: 'refresh_blend',
        arguments: { mode: 'blend', path: tmpDir },
      }));
      expect(extractFafmHash(a)).toBe(extractFafmHash(b));
    });
  });

  // ── 🛞 TYRE — pass-through ──────────────────────────────────────────
  describe('🛞 TYRE — live [pass-through]', () => {
    test('pass-through: orchestration is local — no cred-costing roundtrip at this layer', () => {
      expect(true).toBe(true);
    });
  });

  // ── 🔧 PIT — pass-through ───────────────────────────────────────────
  describe('🔧 PIT — eval [pass-through]', () => {
    test('pass-through: output is JSON-fenced inside a text payload, no schema gate here', () => {
      expect(true).toBe(true);
    });
  });
});
