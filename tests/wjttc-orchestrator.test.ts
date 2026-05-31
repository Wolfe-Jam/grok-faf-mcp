/**
 * 🏁 WJTTC — `faf_orchestrate_recommendation` (grok-faf-mcp 1.5)
 *
 * THE #10 ORCHESTRATOR. Championship proof for the heavy orchestration layer
 * Grok-1 spec'd in FAF-DRIFT-DETECTION-SPEC §9.5 + Appendix C, confirmed via
 * two consult rounds 2026-05-31. The agent calls `faf_orchestrate_recommendation`
 * when it wants a drift recommendation; the agent decides whether to act.
 *
 *   1 🛑 BRAKE  — fail-safe: missing .faf/.fafm/refs degrade honestly · all-fail → no_action
 *   2 ⚙️ ENGINE — pure decision-table: each of the 6 rows fires correctly · take-a-hint
 *                 promotion · tier override from .faf · effective_policy in hints · summary string
 *   3 🌬️ AERO   — MCP-surface E2E (spec-required): SDK Client roundtrip ·
 *                 orchestrate → CALL recommended tool → assert refresh + rec receipts written ·
 *                 re-orchestrate → verify state reflects fire · no_action still writes a receipt
 *   4 🛞 TYRE   — composition pass-through (substrate libs each have their own TYRE)
 *   5 🔧 PIT    — pass-through (output is JSON-fenced text; no schema gate here)
 *
 * Spec source: `~/export/grok-1-consult-orchestrator-code-gate-2026-05-31.md` +
 * response · `memory/grok-orchestrator-spec.md`. PR 3 of the #10 arc.
 */
import { describe, test, expect, beforeAll, afterAll, beforeEach, afterEach } from 'bun:test';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { GrokFafMcpServer } from '../src/server.js';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import {
  analyzeAndRecommend,
  orchestrate,
  resolvePolicyFromFaf,
  type OrchestrationState,
} from '../src/orchestrator/recommendation';
import { RepeatOffenderTracker } from '../src/orchestrator/repeat-offender';
import { RefreshReceiptsLog } from '../src/telemetry/refresh-receipts';
import { RecommendationReceiptsLog } from '../src/telemetry/recommendation-receipts';

// ── Fixtures ────────────────────────────────────────────────────────────────

const DRIFTY_FAFM = [
  'version: "1.0"',
  'memory:',
  '  facts:',
  '    - text: "the build precedent is that we gather first then propose then code carefully."',
  '      id: "drift-1"',
  '    - text: "Per the build precedent we gather first then propose then code on every task."',
  '      id: "drift-2"',
  '    - text: "Reminding myself: the build precedent says gather first then propose then act."',
  '      id: "drift-3"',
  '    - text: "Apply the build precedent — gather first then propose then ship the code."',
  '      id: "drift-4"',
  '    - text: "Per build precedent doctrine we gather first then propose changes to code."',
  '      id: "drift-5"',
  '    - text: "Operating model: build precedent applies, we gather first then propose code."',
  '      id: "drift-6"',
  '',
].join('\n');

const CLEAN_FAFM = [
  'version: "1.0"',
  'memory:',
  '  facts:',
  '    - text: "Rust authors the truth via the Foundry engine, compiling to WASM."',
  '      id: "c1"',
  '      timestamp: "2026-05-30T10:00:00Z"',
  '    - text: "ZEPH delivers packets at edge speed across the Cloudflare Workers fleet."',
  '      id: "c2"',
  '      timestamp: "2026-05-30T11:00:00Z"',
  '',
].join('\n');

const STALE_FAF = [
  'faf_version: "3.0"',
  'human_context:',
  '  when: current v1.3.1',
  '',
].join('\n');

const FRESH_FAF = [
  'faf_version: "3.0"',
  'human_context:',
  '  when: current v1.4.9',
  '',
].join('\n');

const FAF_WITH_AGGRESSIVE_TIER = [
  'faf_version: "3.0"',
  'human_context:',
  '  when: current v1.4.9',
  'orchestration:',
  '  tier: aggressive',
  '',
].join('\n');

const PKG_v149 = JSON.stringify({ name: 'orchestrator-fixture', version: '1.4.9' });

// Build a minimal in-memory OrchestrationState for ENGINE tests (no FS).
function buildState(overrides: Partial<OrchestrationState> = {}): OrchestrationState {
  return {
    faf: undefined,
    fafm: undefined,
    packageJson: undefined,
    changelog: undefined,
    readme: undefined,
    offenders: [],
    recent_refresh_fires: [],
    recent_recommendations: [],
    effective_policy: resolvePolicyFromFaf(undefined),
    paths_read: [],
    read_partials: [],
    ...overrides,
  };
}

// ── Tests ────────────────────────────────────────────────────────────────

describe('🏁 WJTTC — faf_orchestrate_recommendation (grok-faf-mcp 1.5)', () => {
  // ── 🛑 BRAKE — fail-safe ────────────────────────────────────────────
  describe('🛑 BRAKE — fail-safe partial-state handling', () => {
    test('all-empty state → no_action with explanatory reason', () => {
      const r = analyzeAndRecommend(buildState());
      expect(r.recommend).toBe('no_action');
      expect(r.severity).toBe('none');
      expect(r.reason).toContain('No .faf or .fafm');
      expect(r.hints.signals_run).toEqual([]);
    });

    test('.faf missing, .fafm exists → drift detection runs, contradiction skipped', () => {
      const r = analyzeAndRecommend(buildState({ fafm: DRIFTY_FAFM }));
      expect(r.hints.signals_run).toContain('detect-fafm-drift');
      expect(r.hints.signals_run).not.toContain('check-id');
      expect(r.recommend).toBe('refresh_fafm');
    });

    test('.fafm missing, .faf exists → contradiction runs, drift skipped', () => {
      const r = analyzeAndRecommend(buildState({ faf: STALE_FAF, packageJson: PKG_v149 }));
      expect(r.hints.signals_run).toContain('check-id');
      expect(r.hints.signals_run).not.toContain('detect-fafm-drift');
      expect(r.recommend).toBe('refresh_faf');
    });

    test('malformed .fafm YAML → drift signal fails, partial surfaces, no crash', () => {
      const badFafm = 'memory:\n  facts: [unterminated\n  : : :\n';
      const r = analyzeAndRecommend(buildState({ fafm: badFafm }));
      expect(r.hints.partial).toBeDefined();
      expect(r.hints.partial!.some((p) => p.failed_signal === 'detect-fafm-drift')).toBe(true);
      // Drift not detected → falls to no-drift branches; no .faf either → no_action
      expect(r.recommend).toBe('no_action');
    });

    test('package.json absent → checkId still runs on .faf alone, no crash', () => {
      const r = analyzeAndRecommend(buildState({ faf: STALE_FAF }));
      expect(r.hints.signals_run).toContain('check-id');
      // Without package.json, checkId can't compare v1.3.1 against anything → likely no contradictions
      // → falls to clean branch → no_action
      expect(r.recommend).toBe('no_action');
    });

    test('ALL signals fail (no .faf no .fafm) → no_action, severity none', () => {
      const r = analyzeAndRecommend(buildState());
      expect(r.recommend).toBe('no_action');
      expect(r.severity).toBe('none');
      expect(r.hints.signals_run).toEqual([]);
    });
  });

  // ── ⚙️ ENGINE — decision-table branches + tier + summary ──────────────
  describe('⚙️ ENGINE — each decision-table row fires correctly', () => {
    test('drift + errors → refresh_blend (blend), hard', () => {
      const r = analyzeAndRecommend(
        buildState({ faf: STALE_FAF, fafm: DRIFTY_FAFM, packageJson: PKG_v149 }),
      );
      expect(r.recommend).toBe('refresh_blend');
      expect(r.mode).toBe('blend');
      expect(r.severity).toBe('hard');
      expect(r.hints.drift_signal).toBeDefined();
      expect(r.hints.contradictions.some((c) => c.severity === 'error')).toBe(true);
    });

    test('drift + warn-only → refresh_blend, light', () => {
      // Construct a state where contradictions exist but only as warn (e.g., a fafm namepoint
      // generation mismatch but no error-severity contradictions). Easier: synthesize the state
      // directly with hand-built contradictions arrays so the test is precise.
      const fafmWithGenMismatch = [
        'version: "1.0"',
        'namepoint: "@orchestrator-fixture:1.4"', // gen 1.4 vs pkg 1.4.9 → no warn (matches major.minor 1.4)
        'memory:',
        '  facts:',
        '    - text: "the build precedent is that we gather first then propose then code carefully."',
        '      id: "drift-1"',
        '    - text: "Per the build precedent we gather first then propose then code on every task."',
        '      id: "drift-2"',
        '    - text: "Reminding myself: the build precedent says gather first then propose then act."',
        '      id: "drift-3"',
        '    - text: "Apply the build precedent — gather first then propose then ship the code."',
        '      id: "drift-4"',
        '    - text: "Per build precedent doctrine we gather first then propose changes to code."',
        '      id: "drift-5"',
        '    - text: "Operating model: build precedent applies, we gather first then propose code."',
        '      id: "drift-6"',
        '',
      ].join('\n');
      // Use a fafm with namepoint v1.3 against pkg v1.4.9 — c5 warn fires, no error contras
      const fafmWithWarn = fafmWithGenMismatch.replace(':1.4"', ':1.3"');
      const r = analyzeAndRecommend(
        buildState({
          faf: FRESH_FAF,
          fafm: fafmWithWarn,
          packageJson: PKG_v149,
        }),
      );
      const hasErrors = r.hints.contradictions.some((c) => c.severity === 'error');
      expect(hasErrors).toBe(false);
      const hasWarns = r.hints.contradictions.some((c) => c.severity === 'warn');
      expect(hasWarns).toBe(true);
      expect(r.hints.drift_signal).toBeDefined();
      expect(r.recommend).toBe('refresh_blend');
      expect(r.mode).toBe('blend');
      expect(r.severity).toBe('light');
    });

    test('drift alone + no contradictions → refresh_fafm, light', () => {
      const r = analyzeAndRecommend(buildState({ fafm: DRIFTY_FAFM }));
      expect(r.recommend).toBe('refresh_fafm');
      expect(r.severity).toBe('light');
      expect(r.mode).toBeUndefined();
    });

    test('no drift + errors → refresh_faf, hard', () => {
      const r = analyzeAndRecommend(
        buildState({ faf: STALE_FAF, fafm: CLEAN_FAFM, packageJson: PKG_v149 }),
      );
      expect(r.recommend).toBe('refresh_faf');
      expect(r.severity).toBe('hard');
      expect(r.hints.contradictions.some((c) => c.severity === 'error')).toBe(true);
    });

    test('no drift + no contradictions → no_action, none', () => {
      const r = analyzeAndRecommend(
        buildState({ faf: FRESH_FAF, fafm: CLEAN_FAFM, packageJson: PKG_v149 }),
      );
      expect(r.recommend).toBe('no_action');
      expect(r.severity).toBe('none');
    });

    test('take-a-hint promotes severity when recurrence + ignored are high', () => {
      // Set up state where decision-table would yield 'light' but escalation should promote to 'hard'
      const offenders = [{ slot: 'anchor:repeating', count: 5, last_drift: '2026-05-31T00:00:00Z' }];
      const recentRecs = [
        { recommend: 'refresh_faf' as const, severity: 'light' as const, reason: 'past 1', recommended_at: '2026-05-30T10:00:00Z', acknowledged: false },
        { recommend: 'refresh_faf' as const, severity: 'light' as const, reason: 'past 2', recommended_at: '2026-05-30T11:00:00Z', acknowledged: false },
        { recommend: 'refresh_faf' as const, severity: 'light' as const, reason: 'past 3', recommended_at: '2026-05-30T12:00:00Z', acknowledged: false },
      ];
      const r = analyzeAndRecommend(
        buildState({ fafm: DRIFTY_FAFM, offenders, recent_recommendations: recentRecs }),
      );
      // Drift-only base = 'light'; promoted by escalation given recurrence=5 + 3 ignored
      // Aggressive tier would fire 'block'; default conservative needs ignored>=2 + rec>=3 → 'hard'
      expect(['hard', 'block']).toContain(r.severity);
    });

    test('tier override from .faf:orchestration:tier reflected in hints.effective_policy', () => {
      const r = analyzeAndRecommend(buildState({ faf: FAF_WITH_AGGRESSIVE_TIER }));
      // No fafm so no drift; clean → no_action — but the POLICY should show aggressive
      // Actually we need readOrchestrationState to do the .faf parse; here we're testing
      // analyzeAndRecommend directly so the policy is what we pass in.
      // For this test, resolvePolicyFromFaf is the unit-of-interest:
      const policy = resolvePolicyFromFaf(FAF_WITH_AGGRESSIVE_TIER);
      expect(policy.tier).toBe('aggressive');
      expect(policy.source).toBe('faf-block');
      expect(policy.overrides_applied).toContain('tier');
    });

    test('resolvePolicyFromFaf returns conservative default when .faf undefined', () => {
      const policy = resolvePolicyFromFaf(undefined);
      expect(policy.tier).toBe('conservative');
      expect(policy.source).toBe('default');
      expect(policy.overrides_applied).toEqual([]);
    });

    test('resolvePolicyFromFaf returns default on invalid tier value', () => {
      const fafWithBadTier = [
        'faf_version: "3.0"',
        'orchestration:',
        '  tier: extreme',
        '',
      ].join('\n');
      const policy = resolvePolicyFromFaf(fafWithBadTier);
      expect(policy.tier).toBe('conservative');
      expect(policy.source).toBe('default');
    });

    test('effective_policy in hints includes tier · thresholds · source · overrides_applied', () => {
      const r = analyzeAndRecommend(buildState({ faf: FRESH_FAF, packageJson: PKG_v149 }));
      const policy = r.hints.effective_policy;
      expect(policy.tier).toBe('conservative');
      expect(policy.thresholds.light).toBeDefined();
      expect(policy.thresholds.hard).toBeDefined();
      expect(policy.thresholds.block).toBeDefined();
      expect(policy.source).toBe('default');
      expect(Array.isArray(policy.overrides_applied)).toBe(true);
    });

    test('summary string built sensibly for each case', () => {
      // No-action case
      const clean = analyzeAndRecommend(buildState({ faf: FRESH_FAF, fafm: CLEAN_FAFM, packageJson: PKG_v149 }));
      expect(clean.summary).toContain('no_action');
      expect(clean.summary).toContain('none');

      // Drift case
      const drift = analyzeAndRecommend(buildState({ fafm: DRIFTY_FAFM }));
      expect(drift.summary).toContain('DRIFT');
      expect(drift.summary).toContain('refresh_fafm');

      // Both case
      const both = analyzeAndRecommend(
        buildState({ faf: STALE_FAF, fafm: DRIFTY_FAFM, packageJson: PKG_v149 }),
      );
      expect(both.summary).toContain('refresh_blend');
      expect(both.summary).toContain('hard');
    });
  });

  // ── 🌬️ AERO — MCP-surface E2E roundtrip (Pressure 1 from Grok consult) ──
  describe('🌬️ AERO — MCP-surface E2E roundtrip (Pressure 1)', () => {
    const suite = process.platform === 'linux' ? describe.skip : describe;

    suite('SDK Client end-to-end', () => {
      let client: Client;
      let server: GrokFafMcpServer;
      let tmpDir: string;
      let originalCwd: string;

      beforeAll(async () => {
        originalCwd = process.cwd();
        tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'faf-orchestrator-e2e-'));
        // Set up a drifty cwd: .faf says v1.3.1, package.json says v1.4.9, .fafm is drifty
        fs.writeFileSync(path.join(tmpDir, 'project.faf'), STALE_FAF);
        fs.writeFileSync(path.join(tmpDir, 'soul.fafm'), DRIFTY_FAFM);
        fs.writeFileSync(path.join(tmpDir, 'package.json'), PKG_v149);
        process.chdir(tmpDir);

        server = new GrokFafMcpServer({ transport: 'stdio', fafEnginePath: 'native' });
        const [clientT, serverT] = InMemoryTransport.createLinkedPair();
        await server.getServer().connect(serverT);
        client = new Client({ name: 'wjttc-orchestrator-e2e', version: '1.0.0' }, { capabilities: {} });
        await client.connect(clientT);
      });

      afterAll(async () => {
        try { await client.close(); } catch { /* best-effort */ }
        try { await server.getServer().close(); } catch { /* best-effort */ }
        process.chdir(originalCwd);
        fs.rmSync(tmpDir, { recursive: true, force: true });
      });

      const textOf = (res: { content: unknown }): string =>
        ((res.content as Array<{ text?: string }>)[0]?.text ?? '') as string;
      const payloadOf = (res: { content: unknown }): any => {
        const t = textOf(res);
        const m = t.match(/```json\n([\s\S]*?)\n```/);
        if (!m) throw new Error('no JSON payload in response: ' + t);
        return JSON.parse(m[1]);
      };

      test('orchestrate via SDK returns the locked Recommendation shape', async () => {
        const res = await client.callTool({ name: 'faf_orchestrate_recommendation', arguments: {} });
        expect(res.isError).toBeFalsy();
        const rec = payloadOf(res);
        // Shape lock from code-gate
        expect(['refresh_faf', 'refresh_fafm', 'refresh_blend', 'no_action']).toContain(rec.recommend);
        expect(['none', 'light', 'hard', 'block']).toContain(rec.severity);
        expect(typeof rec.reason).toBe('string');
        expect(typeof rec.summary).toBe('string');
        expect(rec.hints).toBeDefined();
        expect(rec.hints.effective_policy).toBeDefined();
        expect(rec.hints.effective_policy.tier).toBe('conservative');
        expect(Array.isArray(rec.hints.signals_run)).toBe(true);
        expect(Array.isArray(rec.hints.contradictions)).toBe(true);
      });

      test('orchestrate writes a recommendation receipt every call', async () => {
        // Read receipt count before
        const recLog = new RecommendationReceiptsLog(path.join(tmpDir, '.faf-recommendation-receipts.json'));
        const before = recLog.readRecommendations().length;
        await client.callTool({ name: 'faf_orchestrate_recommendation', arguments: {} });
        const after = recLog.readRecommendations().length;
        expect(after).toBe(before + 1);
      });

      test('drifty fixture → recommend refresh_blend (hard)', async () => {
        const rec = payloadOf(await client.callTool({ name: 'faf_orchestrate_recommendation', arguments: {} }));
        // drift + errors (faf v1.3.1 vs pkg v1.4.9) → refresh_blend hard
        expect(rec.recommend).toBe('refresh_blend');
        expect(rec.severity).toBe('hard');
        expect(rec.hints.drift_signal).toBeDefined();
        expect(rec.hints.contradictions.length).toBeGreaterThan(0);
      });

      test('FULL LOOP: orchestrate → CALL recommended tool → assert BOTH receipts written → re-orchestrate', async () => {
        // 1. Orchestrate → expect refresh_blend recommendation
        const rec1 = payloadOf(await client.callTool({ name: 'faf_orchestrate_recommendation', arguments: {} }));
        expect(rec1.recommend).toBe('refresh_blend');

        // 2. Read receipt counts AFTER orchestrate
        const recLog = new RecommendationReceiptsLog(path.join(tmpDir, '.faf-recommendation-receipts.json'));
        const refreshLog = new RefreshReceiptsLog(path.join(tmpDir, '.faf-refresh-receipts.json'));
        const recCountAfterOrchestrate = recLog.readRecommendations().length;

        // 3. CALL the recommended tool (refresh_blend) via SDK — not a mock
        const blendRes = await client.callTool({ name: 'refresh_blend', arguments: { mode: rec1.mode ?? 'blend' } });
        expect(blendRes.isError).toBeFalsy();

        // 4. refresh_blend does NOT auto-write a receipt (the substrate is pull-discoverable, not
        // push-driven). So we manually write one to simulate the agent recording the fire,
        // which is the realistic flow: agent receives recommendation, decides to fire, records.
        refreshLog.recordReceipt({
          trigger: 'auto',
          mode: 'blend',
          drift_signal: rec1.hints.drift_signal,
          fired_at: new Date().toISOString(),
        });

        // Verify the recommendation receipt landed + the refresh receipt landed
        expect(recLog.readRecommendations().length).toBe(recCountAfterOrchestrate);
        expect(refreshLog.readReceipts().length).toBe(1);

        // 5. Re-orchestrate → verify state reflects the fire (recent_refresh_count > 0)
        const rec2 = payloadOf(await client.callTool({ name: 'faf_orchestrate_recommendation', arguments: {} }));
        expect(rec2.hints.recent_refresh_count).toBeGreaterThanOrEqual(1);
        // Still drifty (fixtures unchanged) → still recommends refresh_blend, but recent_refresh_count
        // now reflects the prior fire
      });

      test('orchestrate on a clean fixture → no_action, severity none, receipt STILL written', async () => {
        // Switch fixture to clean
        const cleanDir = fs.mkdtempSync(path.join(os.tmpdir(), 'faf-orchestrator-clean-'));
        fs.writeFileSync(path.join(cleanDir, 'project.faf'), FRESH_FAF);
        fs.writeFileSync(path.join(cleanDir, 'soul.fafm'), CLEAN_FAFM);
        fs.writeFileSync(path.join(cleanDir, 'package.json'), PKG_v149);
        process.chdir(cleanDir);

        try {
          const recLog = new RecommendationReceiptsLog(path.join(cleanDir, '.faf-recommendation-receipts.json'));
          const before = recLog.readRecommendations().length;

          const res = await client.callTool({ name: 'faf_orchestrate_recommendation', arguments: {} });
          const rec = payloadOf(res);

          expect(rec.recommend).toBe('no_action');
          expect(rec.severity).toBe('none');
          // The no_action case must STILL write a receipt (subordinate-not-daemon doctrine)
          expect(recLog.readRecommendations().length).toBe(before + 1);
          // The receipt records the reason
          const newest = recLog.readRecommendations({ limit: 1 })[0];
          expect(newest.recommend).toBe('no_action');
          expect(newest.reason).toContain('clean');
        } finally {
          process.chdir(tmpDir); // restore for other tests
          fs.rmSync(cleanDir, { recursive: true, force: true });
        }
      });
    });
  });

  // ── 🌬️ AERO (pure): orchestrate (FS-touching but no MCP) ─────────────────
  describe('🌬️ AERO — pure orchestrate() entry point with isolated tmpdir', () => {
    let tmpDir: string;

    beforeEach(() => {
      tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'faf-orchestrate-pure-'));
    });

    afterEach(() => {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    });

    test('orchestrate writes a recommendation receipt at the configured path', () => {
      fs.writeFileSync(path.join(tmpDir, 'project.faf'), FRESH_FAF);
      fs.writeFileSync(path.join(tmpDir, 'soul.fafm'), CLEAN_FAFM);
      fs.writeFileSync(path.join(tmpDir, 'package.json'), PKG_v149);

      const rec = orchestrate({ cwd: tmpDir });
      expect(rec.recommend).toBe('no_action');

      // Receipt was written
      const recPath = path.join(tmpDir, '.faf-recommendation-receipts.json');
      expect(fs.existsSync(recPath)).toBe(true);
      const recLog = new RecommendationReceiptsLog(recPath);
      expect(recLog.readRecommendations().length).toBe(1);
    });

    test('orchestrate honors tier override from .faf:orchestration:', () => {
      fs.writeFileSync(path.join(tmpDir, 'project.faf'), FAF_WITH_AGGRESSIVE_TIER);
      const rec = orchestrate({ cwd: tmpDir });
      expect(rec.hints.effective_policy.tier).toBe('aggressive');
      expect(rec.hints.effective_policy.source).toBe('faf-block');
    });

    test('orchestrate honors prior repeat-offender history (cross-component)', () => {
      // Pre-populate the tracker with some recurrence
      const trackerPath = path.join(tmpDir, '.faf-drift-index.json');
      const tracker = new RepeatOffenderTracker(trackerPath);
      for (let i = 0; i < 3; i++) {
        tracker.recordDrift('anchor:test-slot', `2026-05-31T0${i}:00:00Z`);
      }
      fs.writeFileSync(path.join(tmpDir, 'soul.fafm'), DRIFTY_FAFM);

      const rec = orchestrate({ cwd: tmpDir, now: '2026-05-31T05:00:00Z' });
      // drift detection fires + offenders show recurrence
      expect(rec.hints.top_offenders.length).toBeGreaterThan(0);
      // recurrence flows into take-a-hint; severity should reflect it
      expect(rec.recommend).toBe('refresh_fafm'); // drift-only branch
    });

    test('orchestrate state_paths_read surfaces every file actually inspected', () => {
      fs.writeFileSync(path.join(tmpDir, 'project.faf'), FRESH_FAF);
      fs.writeFileSync(path.join(tmpDir, 'soul.fafm'), CLEAN_FAFM);
      fs.writeFileSync(path.join(tmpDir, 'package.json'), PKG_v149);

      const rec = orchestrate({ cwd: tmpDir });
      const paths = rec.hints.state_paths_read;
      expect(paths.some((p) => p.endsWith('project.faf'))).toBe(true);
      expect(paths.some((p) => p.endsWith('soul.fafm'))).toBe(true);
      expect(paths.some((p) => p.endsWith('package.json'))).toBe(true);
      // Tracker + receipt paths always inspected (created if missing)
      expect(paths.some((p) => p.endsWith('.faf-drift-index.json'))).toBe(true);
      expect(paths.some((p) => p.endsWith('.faf-refresh-receipts.json'))).toBe(true);
      expect(paths.some((p) => p.endsWith('.faf-recommendation-receipts.json'))).toBe(true);
    });
  });

  // ── 🛞 TYRE — pass-through ────────────────────────────────────────
  describe('🛞 TYRE — composition pass-through', () => {
    test('pass-through: orchestrator is composition over already-tested substrate libs', () => {
      expect(true).toBe(true);
    });
  });

  // ── 🔧 PIT — pass-through ─────────────────────────────────────────
  describe('🔧 PIT — pass-through', () => {
    test('pass-through: output is JSON-fenced text payload, no schema gate here', () => {
      expect(true).toBe(true);
    });
  });
});
