/**
 * 🏁 WJTTC — FRC usage receipt WRITE-path wired (Rail 1: the FRC → default-ON rail)
 *
 * ZEPH went opt-in → default-ON on a measurable usage trail; FRC needs the same.
 * Nothing logged FRC usage before this — the Closed-Loop receipts cover refresh /
 * drift / recommendation, NOT the FRC tools. This pins the fix: every FRC tool
 * call (faf_gate / faf_section / faf_memory) appends a `.frc-usage-receipts.json`
 * receipt carrying the per-tool outcome Rail 2 needs (gate verdict, section
 * hit/miss, memory selection count). Unconditional (independent of USE_FRC — the
 * flag governs surface visibility, not measurement) and NEVER breaks the tool.
 *
 * `rag_query`'s receipt (cache-hit-rate + FRC Collections path) writes on its
 * success path; it needs a live XAI key + network, so it's exercised by the rag
 * suites / live, not here — this suite covers the deterministic, no-network tools.
 */
import { describe, it, expect, beforeAll, afterAll } from 'bun:test';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { FafToolHandler } from '../src/handlers/tools';
import { FafEngineAdapter } from '../src/handlers/engine-adapter';
import { FrcUsageReceiptsLog } from '../src/telemetry/frc-usage-receipts';

const FAFM = `namepoint: "@frc-usage-test:1.0"
version: "1.0"
memory:
  facts:
    - id: f1
      text: "a durable decision"
      type: decision
      timestamp: "2026-06-01T00:00:00Z"
    - id: f2
      text: "an invariant worth keeping"
      type: invariant
      timestamp: "2026-06-02T00:00:00Z"
`;

const FAF = `faf_version: "3.0"
project:
  name: frc-usage-wiring-test
  goal: prove the FRC usage receipt write-path is wired
stack:
  backend: TypeScript
  runtime: Node.js
human_context:
  who: test
  what: prove FRC usage telemetry (Rail 1 of the FRC default-ON promotion)
  why: FRC needs a measurable usage trail before its flip, like ZEPH had
`;

let handler: FafToolHandler;
let tmp: string;
let origCwd: string;

beforeAll(() => {
  origCwd = process.cwd();
  tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'frc-usage-'));
  fs.writeFileSync(path.join(tmp, 'project.faf'), FAF);
  fs.writeFileSync(path.join(tmp, 'soul.fafm'), FAFM);
  process.chdir(tmp); // faf_memory + the cwd-relative receipt follow the live cwd
  handler = new FafToolHandler(new FafEngineAdapter('native'));
});
afterAll(() => {
  process.chdir(origCwd);
  try { fs.rmSync(tmp, { recursive: true, force: true }); } catch { /* best-effort */ }
});

const receiptsPath = () => path.join(tmp, '.frc-usage-receipts.json');
const readReceipts = () => new FrcUsageReceiptsLog(receiptsPath()).readReceipts();

describe('🏁 WJTTC — FRC usage receipt write-path (Rail 1)', () => {
  it('starts with NO .frc-usage-receipts file (clean room)', () => {
    expect(fs.existsSync(receiptsPath())).toBe(false);
  });

  it('faf_gate WRITES a receipt — tool=faf_gate, outcome has verdict + score + tokens', async () => {
    const r = await handler.callTool('faf_gate', { path: tmp });
    expect(r.isError).toBeFalsy();
    expect(fs.existsSync(receiptsPath())).toBe(true);
    const recs = readReceipts();
    expect(recs.length).toBe(1);
    expect(recs[0].tool).toBe('faf_gate');
    expect(recs[0].fired_at).toBeTruthy();
    const o = recs[0].outcome as any;
    expect(o.verdict === 'promote' || o.verdict === 'hold').toBe(true);
    expect(typeof o.score).toBe('number');
    expect(typeof o.tokens).toBe('number');
  });

  it('faf_section (specific path) → tool=faf_section, outcome.found=true', async () => {
    const before = readReceipts().length;
    await handler.callTool('faf_section', { path: tmp, section: 'stack' });
    const recs = readReceipts();
    expect(recs.length).toBe(before + 1);
    expect(recs[0].tool).toBe('faf_section'); // newest-first
    expect((recs[0].outcome as any).found).toBe(true);
    expect((recs[0].outcome as any).section).toBe('stack');
  });

  it('faf_section (missing path) → outcome.found=false', async () => {
    await handler.callTool('faf_section', { path: tmp, section: 'no.such.path' });
    const recs = readReceipts();
    expect(recs[0].tool).toBe('faf_section');
    expect((recs[0].outcome as any).found).toBe(false);
  });

  it('faf_section (no section → list mode) → outcome.listed is a count', async () => {
    await handler.callTool('faf_section', { path: tmp });
    const recs = readReceipts();
    expect(recs[0].tool).toBe('faf_section');
    expect(typeof (recs[0].outcome as any).listed).toBe('number');
  });

  it('faf_memory (filtered) → tool=faf_memory, outcome.matched is a count, NO score', async () => {
    await handler.callTool('faf_memory', { type: 'decision' });
    const recs = readReceipts();
    expect(recs[0].tool).toBe('faf_memory');
    expect(typeof (recs[0].outcome as any).matched).toBe('number');
    expect('score' in (recs[0].outcome as any)).toBe(false); // memories are not scored
  });

  it('faf_memory (no filter → summary) → outcome.summary is a count', async () => {
    await handler.callTool('faf_memory', {});
    const recs = readReceipts();
    expect(recs[0].tool).toBe('faf_memory');
    expect(typeof (recs[0].outcome as any).summary).toBe('number');
    expect('score' in (recs[0].outcome as any)).toBe(false);
  });

  it('DOCTRINE: no faf_memory receipt ever carries a score (memories are not scored)', () => {
    const recs = readReceipts().filter((r) => r.tool === 'faf_memory');
    expect(recs.length).toBeGreaterThanOrEqual(2);
    for (const r of recs) expect('score' in (r.outcome as any)).toBe(false);
  });

  it('every receipt is a known FRC tool with a valid timestamp (read-path validation)', () => {
    const recs = readReceipts();
    expect(recs.length).toBeGreaterThanOrEqual(6);
    for (const r of recs) {
      expect(['faf_gate', 'faf_section', 'faf_memory', 'rag_query']).toContain(r.tool);
      expect(Number.isFinite(Date.parse(r.fired_at))).toBe(true);
    }
  });

  it('telemetry never breaks the tool — still returns content, not a throw', async () => {
    const r = await handler.callTool('faf_gate', { path: tmp });
    expect(r.isError).toBeFalsy();
    expect(r.content[0].text).toContain('FAF GATE');
  });
});
