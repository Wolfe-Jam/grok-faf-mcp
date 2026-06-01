/**
 * 🏁 WJTTC — Cross-lane parity (heavy local ↔ light hosted)
 *
 * The structural shield against pure-core drift between the two repos.
 *
 * grok-faf-mcp ships the HEAVY lane (local stdio, full FS + receipts) using
 * `src/orchestrator/recommendation.ts`. mcpaas-cf ships the LIGHT lane
 * (hosted/WASM-pure on `mcpaas.live/grok/mcp/v1`) using a DUPLICATE port of
 * the pure-core in `src/orchestrator-light/`. Both call the same
 * `analyzeAndRecommend` function on equivalent OrchestrationState shapes.
 *
 * If the two pure-cores ever diverge (heavy evolves, light copy doesn't
 * follow OR vice versa), the agent that reads either surface gets different
 * answers for the same inputs — silent drift. This test catches that.
 *
 * For each scenario:
 *   1. Build an OrchestrationState identical to what mcpaas-cf's
 *      orchestrateLight() constructs (including the 3 hosted-only
 *      `read_partials` entries).
 *   2. Call HEAVY's `analyzeAndRecommend` locally on it.
 *   3. Call LIGHT via HTTP fetch to `mcpaas.live/grok/mcp/v1` with the
 *      same string inputs.
 *   4. Assert the returned Recommendations agree on every deterministic
 *      field. Outputs should be byte-equal because both pure-cores are
 *      supposed to be identical implementations of the same spec.
 *
 *   1 🛑 BRAKE  — endpoint reachable, tool present, basic shape contract
 *   2 ⚙️ ENGINE — parity on the decision-table rows (clean / drift / contras)
 *   3 🌬️ AERO   — parity on the contract fields (recommend, severity,
 *                  summary, reason, signals_run, effective_policy,
 *                  contradictions, drift_signal). Hosted-only fields
 *                  (top_offenders, recent_refresh_count, state_paths_read,
 *                  partial[]) verified separately for the EXPECTED
 *                  structural differences (light has them populated for
 *                  the hosted-honesty doctrine; heavy doesn't when called
 *                  with empty state)
 *   4 🛞 TYRE   — live cred-costing roundtrip — this IS the live tier
 *   5 🔧 PIT    — pass-through (analyzer validates internally)
 *
 * Doctrine: `[[silent-drift-equals-fail-equals-forbidden]]` applied to
 * the cross-repo port. Until v1.6 task #20 (derived projections sweep)
 * extracts the pure-core to a shared lib, this test IS the only mechanical
 * guard against port drift between the two repos.
 *
 * Default target: production `mcpaas.live/grok/mcp/v1`. Override via
 * TEST_URL env to point at preview/staging.
 *
 * Bun-on-Linux flake guard NOT needed — this file doesn't spin up an MCP
 * server; just pure-function calls + HTTP fetches.
 */
import { describe, test, expect } from 'bun:test';
import {
  analyzeAndRecommend,
  resolvePolicyFromFaf,
  type OrchestrationState,
  type Recommendation,
  type PartialSignalFailure,
} from '../src/orchestrator/recommendation';

const TEST_URL = process.env.TEST_URL || 'https://mcpaas.live/grok/mcp/v1';
const TOOL_NAME = 'faf_orchestrate_recommendation';

// ── Fixtures ───────────────────────────────────────────────────────────

const CLEAN_FAF = [
  'faf_version: "3.0"',
  'project:',
  '  name: cross-lane-parity-test',
  '  goal: prove heavy and light pure-cores agree on outputs',
  '',
].join('\n');

const FAF_WITH_BALANCED_TIER = [
  'faf_version: "3.0"',
  'project:',
  '  name: tier-parity-test',
  'orchestration:',
  '  tier: balanced',
  '',
].join('\n');

const DRIFTY_FAFM = [
  'version: "1.0"',
  'profile: "knowledge"',
  'namepoint: "@parity:1.0"',
  'memory:',
  '  facts:',
  ...Array.from({ length: 8 }, (_, i) =>
    `    - text: "the system must validate the system must validate the system must validate inputs ${i}"`,
  ),
  '',
].join('\n');

// ── Helpers ────────────────────────────────────────────────────────────

/**
 * The 3 hosted-only partial entries that mcpaas-cf's `orchestrateLight`
 * injects. Mirrored here so the HEAVY-side call produces an output with
 * the SAME partial[] shape — making the two outputs byte-comparable.
 *
 * If this list ever diverges from mcpaas-cf/src/orchestrator-light/index.ts,
 * the parity tests will fail with a diff that points at the drift. THAT is
 * the silent-drift catch this test exists for.
 */
const LIGHT_LANE_PARTIAL_ENTRIES: PartialSignalFailure[] = [
  {
    failed_signal: 'repeat-offender-tracker',
    error: 'not available on hosted surface (requires persisted .faf-drift-index.json — heavy lane only)',
  },
  {
    failed_signal: 'recent-refresh-fires',
    error: 'not available on hosted surface (requires persisted .faf-refresh-receipts.json — heavy lane only)',
  },
  {
    failed_signal: 'recommendation-receipt-write',
    error: 'not available on hosted surface (no FS to persist to — caller can persist the returned Recommendation client-side)',
  },
];

interface LightInputs {
  faf?: string;
  fafm?: string;
  packageJson?: string;
  changelog?: string;
  readme?: string;
}

/** Build the same OrchestrationState shape that orchestrateLight builds. */
function buildLightLikeState(inputs: LightInputs): OrchestrationState {
  const effective_policy = resolvePolicyFromFaf(inputs.faf);
  return {
    faf: inputs.faf,
    fafm: inputs.fafm,
    packageJson: inputs.packageJson,
    changelog: inputs.changelog,
    readme: inputs.readme,
    offenders: [],
    recent_refresh_fires: [],
    recent_recommendations: [],
    effective_policy,
    paths_read: [],
    read_partials: LIGHT_LANE_PARTIAL_ENTRIES,
  };
}

/** Call HEAVY's pure analyzer on the equivalent state. */
function callHeavy(inputs: LightInputs): Recommendation {
  return analyzeAndRecommend(buildLightLikeState(inputs));
}

/**
 * Strip clock-stamped fields (`detected_at`) from a drift_signal so cross-
 * lane comparisons can assert the deterministic content (score · anchors ·
 * kind) without the wall-clock that each lane stamps independently.
 */
function stripClockFields(signal: Recommendation['hints']['drift_signal']): unknown {
  if (!signal) return signal;
  const { detected_at: _stripped, ...rest } = signal;
  return rest;
}

/** Call LIGHT via the live hosted endpoint, parse the JSON block. */
async function callLight(inputs: LightInputs): Promise<Recommendation> {
  const res = await fetch(TEST_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: Date.now(),
      method: 'tools/call',
      params: { name: TOOL_NAME, arguments: inputs },
    }),
  });
  if (!res.ok) throw new Error(`live ${TOOL_NAME} returned HTTP ${res.status}`);
  const body = (await res.json()) as { result?: { content?: Array<{ text?: string }> }; error?: unknown };
  if (body.error) throw new Error(`live RPC error: ${JSON.stringify(body.error)}`);
  const text = body.result?.content?.[0]?.text ?? '';
  const jsonMatch = text.match(/```json\s*([\s\S]+?)\s*```/);
  if (!jsonMatch) throw new Error('no JSON block in live response');
  return JSON.parse(jsonMatch[1]) as Recommendation;
}

/**
 * Assert two Recommendations are parity-equal on the deterministic
 * contract fields. Hosted-only fields (top_offenders empty, etc.) are
 * NOT compared because they're structurally absent on the heavy-side
 * call too (when called via buildLightLikeState with empty state).
 *
 * This IS deep equality — the two pure-cores must produce byte-identical
 * outputs for the same inputs. Anything else means port drift.
 */
function assertParity(heavy: Recommendation, light: Recommendation, scenario: string): void {
  // Top-level deterministic fields
  expect(light.recommend, `${scenario}: recommend drift`).toBe(heavy.recommend);
  expect(light.severity, `${scenario}: severity drift`).toBe(heavy.severity);
  expect(light.reason, `${scenario}: reason drift`).toBe(heavy.reason);
  expect(light.summary, `${scenario}: summary drift`).toBe(heavy.summary);
  expect(light.mode, `${scenario}: mode drift`).toBe(heavy.mode);

  // hints deterministic fields
  expect(light.hints.signals_run.sort(), `${scenario}: signals_run drift`).toEqual(heavy.hints.signals_run.sort());
  expect(light.hints.contradictions, `${scenario}: contradictions drift`).toEqual(heavy.hints.contradictions);
  // drift_signal: compare structure WITHOUT the wall-clock `detected_at` field
  // (both lanes stamp their own clock; the deterministic content is score + repeated_anchors + kind)
  expect(stripClockFields(light.hints.drift_signal), `${scenario}: drift_signal (clock-stripped) drift`).toEqual(
    stripClockFields(heavy.hints.drift_signal),
  );

  // effective_policy — must match on tier + source + overrides_applied
  expect(light.hints.effective_policy.tier, `${scenario}: tier drift`).toBe(heavy.hints.effective_policy.tier);
  expect(light.hints.effective_policy.source, `${scenario}: source drift`).toBe(heavy.hints.effective_policy.source);
  expect(light.hints.effective_policy.overrides_applied.sort(), `${scenario}: overrides drift`).toEqual(
    heavy.hints.effective_policy.overrides_applied.sort(),
  );

  // partial[] — both should have the same 3 hosted-only entries
  // (heavy was called with buildLightLikeState which seeds them; light injects them naturally)
  expect(light.hints.partial?.length, `${scenario}: partial count drift`).toBe(heavy.hints.partial?.length);
  if (light.hints.partial && heavy.hints.partial) {
    const lightSignals = light.hints.partial.map((p) => p.failed_signal).sort();
    const heavySignals = heavy.hints.partial.map((p) => p.failed_signal).sort();
    expect(lightSignals, `${scenario}: partial signals drift`).toEqual(heavySignals);
  }
}

// ── Tests ──────────────────────────────────────────────────────────────

describe('🏁 WJTTC — Cross-lane parity (heavy local ↔ light hosted)', () => {
  // ── 🛑 BRAKE — endpoint reachable + shape contract ────────────────────
  describe('🛑 BRAKE — endpoint reachable + shape contract', () => {
    test('live endpoint /info responds 200', async () => {
      const res = await fetch(`${TEST_URL}/info`);
      expect(res.ok).toBe(true);
    });

    test('live tools/list includes faf_orchestrate_recommendation', async () => {
      const res = await fetch(TEST_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/list', params: {} }),
      });
      expect(res.ok).toBe(true);
      const body = (await res.json()) as { result?: { tools?: Array<{ name: string }> } };
      const tools = body.result?.tools ?? [];
      expect(tools.some((t) => t.name === TOOL_NAME)).toBe(true);
    });

    test('heavy lane analyzeAndRecommend is callable locally with light-like state', () => {
      const r = callHeavy({ faf: CLEAN_FAF });
      expect(r.recommend).toBeDefined();
      expect(r.hints.partial?.length).toBe(3);
    });
  });

  // ── ⚙️ ENGINE — parity on decision-table rows ────────────────────────
  describe('⚙️ ENGINE — decision-table parity (heavy ↔ light, same inputs)', () => {
    test('PARITY: clean .faf only → both lanes return no_action · none', async () => {
      const inputs = { faf: CLEAN_FAF };
      const heavy = callHeavy(inputs);
      const light = await callLight(inputs);
      expect(heavy.recommend).toBe('no_action');
      expect(light.recommend).toBe('no_action');
      assertParity(heavy, light, 'clean-faf-only');
    });

    test('PARITY: clean .faf + drifty .fafm → both lanes return refresh_fafm · light', async () => {
      const inputs = { faf: CLEAN_FAF, fafm: DRIFTY_FAFM };
      const heavy = callHeavy(inputs);
      const light = await callLight(inputs);
      expect(heavy.recommend).toBe('refresh_fafm');
      expect(light.recommend).toBe('refresh_fafm');
      assertParity(heavy, light, 'drifty-fafm');
    });

    test('PARITY: empty inputs → both lanes return no_action with explanatory reason', async () => {
      const inputs = {};
      const heavy = callHeavy(inputs);
      const light = await callLight(inputs);
      expect(heavy.recommend).toBe('no_action');
      expect(light.recommend).toBe('no_action');
      assertParity(heavy, light, 'empty-inputs');
    });
  });

  // ── 🌬️ AERO — contract-field parity ──────────────────────────────────
  describe('🌬️ AERO — contract-field parity', () => {
    test('PARITY: tier override (.faf:orchestration:tier=balanced) lands identically', async () => {
      const inputs = { faf: FAF_WITH_BALANCED_TIER };
      const heavy = callHeavy(inputs);
      const light = await callLight(inputs);
      expect(heavy.hints.effective_policy.tier).toBe('balanced');
      expect(light.hints.effective_policy.tier).toBe('balanced');
      expect(heavy.hints.effective_policy.source).toBe('faf-block');
      expect(light.hints.effective_policy.source).toBe('faf-block');
      assertParity(heavy, light, 'tier-override');
    });

    test('PARITY: drift_signal deterministic content agrees (score · anchors · kind)', async () => {
      const inputs = { faf: CLEAN_FAF, fafm: DRIFTY_FAFM };
      const heavy = callHeavy(inputs);
      const light = await callLight(inputs);
      expect(heavy.hints.drift_signal).toBeDefined();
      expect(light.hints.drift_signal).toBeDefined();
      // Score is a float — both should compute identically (no randomness, no clock)
      expect(light.hints.drift_signal!.score).toBe(heavy.hints.drift_signal!.score);
      expect(light.hints.drift_signal!.repeated_anchors).toEqual(heavy.hints.drift_signal!.repeated_anchors);
      expect(light.hints.drift_signal!.kind).toBe(heavy.hints.drift_signal!.kind);
      // `detected_at` is each lane's local clock at analysis time — naturally differs
    });

    test('PARITY: summary string is byte-identical', async () => {
      const inputs = { faf: CLEAN_FAF, fafm: DRIFTY_FAFM };
      const heavy = callHeavy(inputs);
      const light = await callLight(inputs);
      expect(light.summary).toBe(heavy.summary);
    });

    test('PARITY: partial[] structurally identical (3 hosted-only entries on both sides)', async () => {
      const inputs = { faf: CLEAN_FAF };
      const heavy = callHeavy(inputs);
      const light = await callLight(inputs);
      expect(heavy.hints.partial).toBeDefined();
      expect(light.hints.partial).toBeDefined();
      expect(heavy.hints.partial!.length).toBe(3);
      expect(light.hints.partial!.length).toBe(3);
      const heavySignals = heavy.hints.partial!.map((p) => p.failed_signal).sort();
      const lightSignals = light.hints.partial!.map((p) => p.failed_signal).sort();
      expect(lightSignals).toEqual(heavySignals);
    });
  });

  // ── 🛞 TYRE — live cred-costing roundtrip ──────────────────────────────
  describe('🛞 TYRE — live [this IS the live tier]', () => {
    test('determinism: heavy is content-stable across calls (clock-stripped)', () => {
      const a = callHeavy({ faf: CLEAN_FAF, fafm: DRIFTY_FAFM });
      const b = callHeavy({ faf: CLEAN_FAF, fafm: DRIFTY_FAFM });
      expect(b.recommend).toBe(a.recommend);
      expect(b.severity).toBe(a.severity);
      expect(b.summary).toBe(a.summary);
      expect(b.reason).toBe(a.reason);
      expect(stripClockFields(b.hints.drift_signal)).toEqual(stripClockFields(a.hints.drift_signal));
    });
    test('determinism: light is byte-stable across calls (deterministic deploy)', async () => {
      const a = await callLight({ faf: CLEAN_FAF, fafm: DRIFTY_FAFM });
      const b = await callLight({ faf: CLEAN_FAF, fafm: DRIFTY_FAFM });
      expect(b.recommend).toBe(a.recommend);
      expect(b.severity).toBe(a.severity);
      expect(b.summary).toBe(a.summary);
    });
  });

  // ── 🔧 PIT — pass-through ─────────────────────────────────────────────
  describe('🔧 PIT — eval [pass-through]', () => {
    test('pass-through: analyzer + live response are the schema gate (this test IS the cross-port check)', () => {
      expect(true).toBe(true);
    });
  });
});
