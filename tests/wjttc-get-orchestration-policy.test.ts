/**
 * 🏁 WJTTC — faf_get_orchestration_policy (grok-faf-mcp 1.5)
 *
 * Pure introspection of the effective orchestration policy. The companion to
 * `faf_orchestrate_recommendation` — surfaces what the NEXT analysis would
 * use, without running one or writing a receipt.
 *
 * Per Grok-1's Round 2 follow-up + the existing `hints.effective_policy`
 * field on Recommendation (single source of truth via `resolvePolicyFromFaf`).
 *
 *   1 🛑 BRAKE  — fail-safe: no .faf · unreadable · malformed YAML · garbage
 *                  override values never crash, always return a structured result
 *   2 ⚙️ ENGINE — core: defaults applied when no override · `.faf:orchestration:tier`
 *                 maps to balanced/aggressive correctly · garbage tier falls back
 *                 to default · source + overrides_applied honest
 *   3 🌬️ AERO   — parity vs orchestrator's `hints.effective_policy` (single
 *                  source — both call resolvePolicyFromFaf) · cwd discipline
 *                  (no-path = live process.cwd, NOT engineAdapter cache)
 *   4 🛞 TYRE   — pass-through (local FS, no cred-costing roundtrip)
 *   5 🔧 PIT    — pass-through (no schema gate; resolvePolicyFromFaf IS the gate)
 */
import { describe, test, expect, beforeAll, afterAll } from 'bun:test';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { GrokFafMcpServer } from '../src/server.js';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { getOrchestrationPolicy } from '../src/orchestrator/get-policy';

// Test fixtures — vary the orchestration block to exercise every branch.
const FAF_DEFAULT_TIER = [
  'faf_version: "3.0"',
  'project:',
  '  name: policy-fixture-default',
  '  goal: prove default policy applies when no orchestration block present',
  '',
].join('\n');

const FAF_BALANCED = [
  'faf_version: "3.0"',
  'project:',
  '  name: policy-fixture-balanced',
  'orchestration:',
  '  tier: balanced',
  '',
].join('\n');

const FAF_AGGRESSIVE = [
  'faf_version: "3.0"',
  'project:',
  '  name: policy-fixture-aggressive',
  'orchestration:',
  '  tier: aggressive',
  '',
].join('\n');

const FAF_GARBAGE_TIER = [
  'faf_version: "3.0"',
  'project:',
  '  name: policy-fixture-garbage',
  'orchestration:',
  '  tier: super-mega-yolo-tier',
  '',
].join('\n');

const FAF_MALFORMED_YAML = [
  'faf_version: "3.0"',
  'project:',
  '  name: malformed',
  '  goal: [unterminated',
  '  : : :',
  '',
].join('\n');

const textOf = (res: { content: unknown }): string =>
  ((res.content as Array<{ text?: string }>)[0]?.text ?? '') as string;

const policyJsonOf = (res: { content: unknown }): {
  policy: { tier: string; source: string; overrides_applied: string[] };
  faf_found: boolean;
  faf_path?: string;
  read_error?: string;
} => {
  const text = textOf(res);
  const m = text.match(/```json\n([\s\S]+?)\n```/);
  if (!m) throw new Error(`No JSON block in response: ${text}`);
  return JSON.parse(m[1]);
};

// Bun-on-Linux flake: MCP-server-heavy files intermittently trip
// `epoll_ctl EEXIST` under `bun test --isolate` on ubuntu. Skipped on Linux
// ONLY so the CI gate stays honest; full coverage on macOS + Windows.
const suite = process.platform === 'linux' ? describe.skip : describe;

suite('🏁 WJTTC — faf_get_orchestration_policy (grok-faf-mcp 1.5)', () => {
  let client: Client;
  let server: GrokFafMcpServer;
  let originalCwd: string;

  beforeAll(async () => {
    originalCwd = process.cwd();
    server = new GrokFafMcpServer({ transport: 'stdio', fafEnginePath: 'native' });
    const [clientT, serverT] = InMemoryTransport.createLinkedPair();
    await server.getServer().connect(serverT);
    client = new Client({ name: 'wjttc-get-policy', version: '1.0.0' }, { capabilities: {} });
    await client.connect(clientT);
  });

  afterAll(async () => {
    try {
      await client.close();
    } catch {
      /* best-effort */
    }
    try {
      await server.getServer().close();
    } catch {
      /* best-effort */
    }
    process.chdir(originalCwd);
  });

  // ── 🛑 BRAKE — fail-safe handling ──────────────────────────────────────
  describe('🛑 BRAKE — fail-safe never crashes', () => {
    test('no .faf in cwd → defaults applied, faf_found=false', () => {
      const dir = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'faf-policy-nofaf-')));
      try {
        const result = getOrchestrationPolicy({ cwd: dir });
        expect(result.faf_found).toBe(false);
        expect(result.faf_path).toBeUndefined();
        expect(result.policy.source).toBe('default');
        expect(result.policy.tier).toBe('conservative');
      } finally {
        fs.rmSync(dir, { recursive: true, force: true });
      }
    });

    test('malformed YAML in .faf → defaults applied, faf_found=true (silent fall-through, not throw)', () => {
      const dir = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'faf-policy-malformed-')));
      try {
        fs.writeFileSync(path.join(dir, 'project.faf'), FAF_MALFORMED_YAML);
        const result = getOrchestrationPolicy({ cwd: dir });
        // .faf was found and read, but YAML parse failed — resolvePolicyFromFaf
        // returns defaults rather than throwing (silent-wrong is forbidden,
        // but here the policy IS the default state honestly).
        expect(result.faf_found).toBe(true);
        expect(result.policy.source).toBe('default');
      } finally {
        fs.rmSync(dir, { recursive: true, force: true });
      }
    });

    test('garbage tier value → defaults applied (resolver rejects invalid enum)', () => {
      const dir = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'faf-policy-garbage-')));
      try {
        fs.writeFileSync(path.join(dir, 'project.faf'), FAF_GARBAGE_TIER);
        const result = getOrchestrationPolicy({ cwd: dir });
        expect(result.faf_found).toBe(true);
        // Garbage enum is rejected → falls back to default
        expect(result.policy.source).toBe('default');
        expect(result.policy.tier).toBe('conservative');
      } finally {
        fs.rmSync(dir, { recursive: true, force: true });
      }
    });

    test('options={} → uses process.cwd() with no crash', () => {
      // Doesn't care what's in process.cwd() — just that no-args call works
      const result = getOrchestrationPolicy();
      expect(result.policy.tier).toBeDefined();
      expect(['conservative', 'balanced', 'aggressive']).toContain(result.policy.tier);
      expect(['default', 'faf-block']).toContain(result.policy.source);
    });

    test('explicit fafPath that does not exist → defaults applied (read_error set)', () => {
      const result = getOrchestrationPolicy({ fafPath: '/nonexistent/path/project.faf' });
      // Behavior: explicit fafPath set → tries readFileSync → throws → caught
      // → returns default + read_error. The contract: never throws.
      expect(result.faf_found).toBe(true);
      expect(result.read_error).toBeDefined();
      expect(result.policy.source).toBe('default');
    });
  });

  // ── ⚙️ ENGINE — core override resolution ────────────────────────────
  describe('⚙️ ENGINE — orchestration:tier resolves correctly', () => {
    test('no orchestration block → default tier + source=default', () => {
      const dir = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'faf-policy-noov-')));
      try {
        fs.writeFileSync(path.join(dir, 'project.faf'), FAF_DEFAULT_TIER);
        const result = getOrchestrationPolicy({ cwd: dir });
        expect(result.faf_found).toBe(true);
        expect(result.policy.tier).toBe('conservative');
        expect(result.policy.source).toBe('default');
        expect(result.policy.overrides_applied).toEqual([]);
      } finally {
        fs.rmSync(dir, { recursive: true, force: true });
      }
    });

    test('orchestration.tier=balanced → tier=balanced, source=faf-block, override recorded', () => {
      const dir = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'faf-policy-bal-')));
      try {
        fs.writeFileSync(path.join(dir, 'project.faf'), FAF_BALANCED);
        const result = getOrchestrationPolicy({ cwd: dir });
        expect(result.policy.tier).toBe('balanced');
        expect(result.policy.source).toBe('faf-block');
        expect(result.policy.overrides_applied).toEqual(['tier']);
      } finally {
        fs.rmSync(dir, { recursive: true, force: true });
      }
    });

    test('orchestration.tier=aggressive → tier=aggressive, source=faf-block', () => {
      const dir = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'faf-policy-agg-')));
      try {
        fs.writeFileSync(path.join(dir, 'project.faf'), FAF_AGGRESSIVE);
        const result = getOrchestrationPolicy({ cwd: dir });
        expect(result.policy.tier).toBe('aggressive');
        expect(result.policy.source).toBe('faf-block');
      } finally {
        fs.rmSync(dir, { recursive: true, force: true });
      }
    });

    test('thresholds object is populated for every tier (debug data is real)', () => {
      const dir = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'faf-policy-thresh-')));
      try {
        fs.writeFileSync(path.join(dir, 'project.faf'), FAF_BALANCED);
        const result = getOrchestrationPolicy({ cwd: dir });
        // The thresholds object must contain the escalation ladder
        expect(result.policy).toHaveProperty('thresholds');
        const t = result.policy.thresholds as Record<string, unknown>;
        expect(t).toHaveProperty('light');
        expect(t).toHaveProperty('hard');
        expect(t).toHaveProperty('block');
      } finally {
        fs.rmSync(dir, { recursive: true, force: true });
      }
    });
  });

  // ── 🌬️ AERO — MCP surface + parity vs orchestrator ─────────────────
  describe('🌬️ AERO — MCP roundtrip + cwd discipline + orchestrator parity', () => {
    test('MCP: faf_get_orchestration_policy returns parseable JSON block', async () => {
      const res = await client.callTool({ name: 'faf_get_orchestration_policy', arguments: {} });
      expect(res.isError).toBeFalsy();
      const parsed = policyJsonOf(res);
      expect(parsed.policy.tier).toBeDefined();
      expect(parsed.policy.source).toBeDefined();
    });

    test('MCP: explicit path arg resolves correctly when pointing at a .faf file', async () => {
      const dir = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'faf-policy-mcp-')));
      try {
        const fafPath = path.join(dir, 'project.faf');
        fs.writeFileSync(fafPath, FAF_AGGRESSIVE);
        const res = await client.callTool({
          name: 'faf_get_orchestration_policy',
          arguments: { path: fafPath },
        });
        expect(res.isError).toBeFalsy();
        const parsed = policyJsonOf(res);
        expect(parsed.policy.tier).toBe('aggressive');
        expect(parsed.policy.source).toBe('faf-block');
        expect(parsed.faf_path).toBe(fafPath);
      } finally {
        fs.rmSync(dir, { recursive: true, force: true });
      }
    });

    test('CWD-DISCOVERY: no-path call uses LIVE process.cwd(), not engineAdapter cache', async () => {
      const liveDir = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'faf-policy-live-')));
      try {
        fs.writeFileSync(path.join(liveDir, 'project.faf'), FAF_AGGRESSIVE);
        const savedCwd = process.cwd();
        try {
          process.chdir(liveDir);
          // NO path arg — exercises live-cwd resolution
          const res = await client.callTool({ name: 'faf_get_orchestration_policy', arguments: {} });
          expect(res.isError).toBeFalsy();
          const parsed = policyJsonOf(res);
          // If handler read engineAdapter cache, it wouldn't find AGGRESSIVE
          expect(parsed.policy.tier).toBe('aggressive');
          expect(parsed.faf_path).toBe(path.join(liveDir, 'project.faf'));
        } finally {
          process.chdir(savedCwd);
        }
      } finally {
        fs.rmSync(liveDir, { recursive: true, force: true });
      }
    });

    test('PARITY: get_policy and orchestrate agree on effective_policy (single-source)', async () => {
      const dir = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'faf-policy-parity-')));
      try {
        fs.writeFileSync(path.join(dir, 'project.faf'), FAF_BALANCED);
        const savedCwd = process.cwd();
        try {
          process.chdir(dir);
          const policyRes = await client.callTool({
            name: 'faf_get_orchestration_policy',
            arguments: {},
          });
          const orchRes = await client.callTool({
            name: 'faf_orchestrate_recommendation',
            arguments: {},
          });
          const policyTier = policyJsonOf(policyRes).policy.tier;
          // Orchestrate also surfaces effective_policy in its JSON block
          const orchText = textOf(orchRes);
          const orchJsonM = orchText.match(/```json\n([\s\S]+?)\n```/);
          expect(orchJsonM).toBeTruthy();
          const orchParsed = JSON.parse(orchJsonM![1]);
          // Both must agree — they call the same resolvePolicyFromFaf
          expect(orchParsed.hints.effective_policy.tier).toBe(policyTier);
        } finally {
          process.chdir(savedCwd);
        }
      } finally {
        fs.rmSync(dir, { recursive: true, force: true });
      }
    });

    test('NO SIDE EFFECTS: get_policy does NOT write a recommendation receipt', async () => {
      const dir = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'faf-policy-noside-')));
      try {
        fs.writeFileSync(path.join(dir, 'project.faf'), FAF_DEFAULT_TIER);
        const savedCwd = process.cwd();
        try {
          process.chdir(dir);
          await client.callTool({ name: 'faf_get_orchestration_policy', arguments: {} });
          // After call, no receipt file should exist (this is pure introspection)
          const receiptPath = path.join(dir, '.faf-recommendation-receipts.json');
          expect(fs.existsSync(receiptPath)).toBe(false);
        } finally {
          process.chdir(savedCwd);
        }
      } finally {
        fs.rmSync(dir, { recursive: true, force: true });
      }
    });
  });

  // ── 🛞 TYRE — pass-through ──────────────────────────────────────────
  describe('🛞 TYRE — live [pass-through]', () => {
    test('pass-through: pure introspection, no cred-costing roundtrip', () => {
      expect(true).toBe(true);
    });
  });

  // ── 🔧 PIT — pass-through ───────────────────────────────────────────
  describe('🔧 PIT — eval [pass-through]', () => {
    test('pass-through: resolvePolicyFromFaf IS the schema gate (no parallel validator)', () => {
      expect(true).toBe(true);
    });
  });
});
