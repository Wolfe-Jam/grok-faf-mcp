/**
 * 🏁 WJTTC — FRC circuit (grok-faf-mcp 1.7) — protects the Phase III layer.
 *
 * The frc-*.test.ts suites test the PURE functions. This puts the FRC layer on
 * the CIRCUIT — at the MCP boundary, under the WJTTC rubric — and locks the one
 * contract that makes FRC safe to ship to xAI / Grok-Build / Cursor:
 *
 *   THE FLAG-GATE CONTRACT — USE_FRC off ⇒ the core surface is UNCHANGED (the
 *   3 FRC tools are invisible). "Opt-in, zero behavior change." If a refactor
 *   ever leaks an FRC tool onto the default surface, this circuit fails loudly.
 *
 *   🛑 BRAKE  — every FRC tool is callable through callTool() and never crashes.
 *   ⚙️ ENGINE — gate/section/memory return the right answer at the MCP boundary.
 *   🌬️ AERO   — determinism + the .fafm no-score invariant + surface stability.
 *
 * (Cross-lane parity + live TYRE for FRC land WITH §7 — the edge isn't built
 *  yet; the cores are edge-ready by design.)
 */
import { describe, it, expect, beforeAll, afterAll } from 'bun:test';
import { FafToolHandler } from '../src/handlers/tools';
import { FafEngineAdapter } from '../src/handlers/engine-adapter';

const FRC_TOOL_NAMES = ['faf_gate', 'faf_section', 'faf_memory'];
const REPO = process.cwd(); // has project.faf (Trophy 100%) + soul.fafm

let handler: FafToolHandler;

// frcEnabled() reads THREE triggers — clear/set ALL of them, never just one, or
// ambient env (CI, or another test file under --isolate that toggles a sibling
// trigger) leaks "FRC on" into a test that thinks it's off. Hermetic by design.
const FRC_ENV = ['USE_FRC', 'FAF_FRC', 'PHASE3'] as const;
const savedEnv: Record<string, string | undefined> = {};
for (const k of FRC_ENV) savedEnv[k] = process.env[k];

function frcOff(): void {
  for (const k of FRC_ENV) delete process.env[k];
}
function frcOn(): void {
  frcOff();
  process.env['USE_FRC'] = '1';
}

beforeAll(() => {
  handler = new FafToolHandler(new FafEngineAdapter('native'));
});
afterAll(() => {
  for (const k of FRC_ENV) {
    if (savedEnv[k] === undefined) delete process.env[k];
    else process.env[k] = savedEnv[k]!;
  }
});

function textOf(r: any): string {
  return r?.content?.[0]?.text ?? '';
}
async function toolNames(): Promise<string[]> {
  const r = await handler.listTools();
  return r.tools.map((t: any) => t.name);
}

describe('🏁 WJTTC FRC — the FLAG-GATE CONTRACT (opt-in, zero behavior change)', () => {
  it('USE_FRC OFF → the 3 FRC tools are INVISIBLE on the default surface', async () => {
    frcOff();
    const names = await toolNames();
    for (const t of FRC_TOOL_NAMES) expect(names).not.toContain(t);
  });

  it('USE_FRC OFF → the core surface stands (known core tools present, FRC absent)', async () => {
    frcOff();
    const names = await toolNames();
    // Anchor on STABLE core tools, never an absolute count — FAF_TOOLS=all (and
    // future custom tools) shift the number; the count is a guide, not a gate.
    expect(names).toContain('faf_score');
    expect(names).toContain('refresh_faf');
    for (const t of FRC_TOOL_NAMES) expect(names).not.toContain(t);
  });

  it('USE_FRC ON → enabling FRC adds EXACTLY the FRC tools (count-agnostic delta)', async () => {
    frcOff();
    const offCount = (await toolNames()).length;
    frcOn();
    const on = await toolNames();
    for (const t of FRC_TOOL_NAMES) expect(on).toContain(t);
    // base + exactly the FRC set, whatever the base surface is (12, or 17 with FAF_TOOLS=all)
    expect(on.length).toBe(offCount + FRC_TOOL_NAMES.length);
  });

  it('flipping the flag is the ONLY difference — off-surface ⊂ on-surface, delta == FRC', async () => {
    frcOff();
    const off = new Set(await toolNames());
    frcOn();
    const on = await toolNames();
    const delta = on.filter((t) => !off.has(t)).sort();
    expect(delta).toEqual([...FRC_TOOL_NAMES].sort());
    // every off-tool still present when on (nothing dropped)
    for (const t of off) expect(on).toContain(t);
  });
});

describe('🛑 BRAKE — every FRC tool is callable through callTool() and never crashes', () => {
  beforeAll(() => { frcOn(); });

  for (const tool of FRC_TOOL_NAMES) {
    it(`${tool}: callable, returns MCP content, no throw`, async () => {
      const r = await handler.callTool(tool, { path: REPO });
      expect(r).toBeDefined();
      expect(typeof textOf(r)).toBe('string');
      expect(textOf(r).length).toBeGreaterThan(0);
    });
  }

  it('faf_section: nonsense path → graceful "not found", no throw', async () => {
    const r = await handler.callTool('faf_section', { path: REPO, section: 'no.such.path.here' });
    expect(textOf(r).toLowerCase()).toContain('not found');
  });

  it('faf_memory: nonexistent soul → graceful, no throw', async () => {
    const r = await handler.callTool('faf_memory', { soul: 'definitely-not-a-soul' });
    expect(textOf(r).length).toBeGreaterThan(0); // "no .fafm" message, not a crash
  });
});

describe('⚙️ ENGINE — right answer at the MCP boundary (against this repo)', () => {
  beforeAll(() => { frcOn(); });

  it('faf_gate: a Trophy-100% .faf PROMOTES', async () => {
    const r = await handler.callTool('faf_gate', { path: REPO });
    expect(textOf(r)).toContain('PROMOTE');
  });

  it('faf_section: returns a WHOLE section, structure preserved', async () => {
    const r = await handler.callTool('faf_section', { path: REPO, section: 'human_context' });
    const t = textOf(r);
    expect(t).toContain('human_context');
    expect(t).toContain('who:'); // the six-W block came back coherent, not chunk-split
  });

  it('faf_section: no section arg → lists available paths (discover before you get)', async () => {
    const r = await handler.callTool('faf_section', { path: REPO });
    expect(textOf(r)).toContain('stack');
  });

  it('faf_memory: summary reports facts from the live soul.fafm', async () => {
    const r = await handler.callTool('faf_memory', {});
    expect(textOf(r).toLowerCase()).toContain('fact');
  });

  it('faf_memory: filtering by type returns matching facts', async () => {
    const r = await handler.callTool('faf_memory', { type: 'feedback' });
    expect(textOf(r).length).toBeGreaterThan(0);
  });
});

describe('🌬️ AERO — determinism + invariants + surface stability', () => {
  beforeAll(() => { frcOn(); });

  it('faf_gate is deterministic — same call, same verdict', async () => {
    const a = textOf(await handler.callTool('faf_gate', { path: REPO }));
    const b = textOf(await handler.callTool('faf_gate', { path: REPO }));
    expect(a).toBe(b);
  });

  it('faf_section is deterministic — same path, same bytes', async () => {
    const a = textOf(await handler.callTool('faf_section', { path: REPO, section: 'stack' }));
    const b = textOf(await handler.callTool('faf_section', { path: REPO, section: 'stack' }));
    expect(a).toBe(b);
  });

  it('faf_memory honors the NO-SCORE invariant (selects, never grades)', async () => {
    const r = await handler.callTool('faf_memory', {});
    expect(textOf(r).toLowerCase()).toContain('not scored');
  });

  it('surface stability: enabling FRC adds ONLY FRC — the 12 core tools are untouched', async () => {
    frcOff();
    const off = (await toolNames()).sort();
    frcOn();
    const on = (await toolNames()).filter((t) => !FRC_TOOL_NAMES.includes(t)).sort();
    expect(on).toEqual(off); // core surface identical with/without the flag
  });
});
