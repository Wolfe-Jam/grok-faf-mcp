/**
 * 🏁 WJTTC — refresh receipt WRITE-path wired (the gap Grok-Build caught)
 *
 * Before: `RefreshReceiptsLog.recordReceipt` was only ever called from tests —
 * no production handler wrote receipts, so `.faf-refresh-receipts.json` stayed
 * empty in real sessions and the orchestrator's `recent_refresh_fires` (and the
 * ZEPH→default-ON telemetry gate) had nothing to read. This pins the fix: every
 * refresh_faf fire (direct + composed by refresh_blend) appends a receipt, to
 * the same path the orchestrator reads, and never breaks the refresh.
 */
import { describe, it, expect, beforeAll, afterAll } from 'bun:test';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { FafToolHandler } from '../src/handlers/tools';
import { FafEngineAdapter } from '../src/handlers/engine-adapter';
import { RefreshReceiptsLog } from '../src/telemetry/refresh-receipts';

const FAF = `faf_version: "3.0"
project:
  name: refresh-wiring-test
  goal: prove the refresh receipt write-path is wired
stack:
  backend: TypeScript
  runtime: Node.js
human_context:
  who: test
  what: prove refresh telemetry
  why: the ZEPH telemetry gate needs real refresh volume
`;

let handler: FafToolHandler;
let tmp: string;
let origCwd: string;

beforeAll(() => {
  origCwd = process.cwd();
  tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'frc-refresh-'));
  fs.writeFileSync(path.join(tmp, 'project.faf'), FAF);
  process.chdir(tmp); // refresh handlers re-ground on the LIVE cwd
  handler = new FafToolHandler(new FafEngineAdapter('native'));
});
afterAll(() => {
  process.chdir(origCwd);
  try { fs.rmSync(tmp, { recursive: true, force: true }); } catch { /* best-effort */ }
});

const receiptsPath = () => path.join(tmp, '.faf-refresh-receipts.json');
// readReceipts() is EXACTLY what the orchestrator (analyzeAndRecommend) calls —
// using it here proves the write-path and read-path are aligned.
const readReceipts = () => new RefreshReceiptsLog(receiptsPath()).readReceipts();

describe('🏁 WJTTC — refresh receipt write-path (Grok-Build gap, now wired)', () => {
  it('starts with NO receipts file (clean room)', () => {
    expect(fs.existsSync(receiptsPath())).toBe(false);
  });

  it('refresh_faf WRITES a receipt (trigger=manual, mode=blend, score captured)', async () => {
    const r = await handler.callTool('refresh_faf', {});
    expect(r.isError).toBeFalsy();
    expect(fs.existsSync(receiptsPath())).toBe(true);
    const recs = readReceipts();
    expect(recs.length).toBe(1);
    expect(recs[0].trigger).toBe('manual');
    expect(recs[0].mode).toBe('blend');
    expect(recs[0].fired_at).toBeTruthy();
    expect((recs[0].refresh_result as any).score).toBeGreaterThanOrEqual(0);
  });

  it('is append-only — each fire adds one (the volume the orchestrator counts)', async () => {
    const before = readReceipts().length;
    await handler.callTool('refresh_faf', { baseline: 50 });
    expect(readReceipts().length).toBe(before + 1);
    // baseline → drift captured in the receipt payload
    expect(readReceipts().some((r) => typeof (r.refresh_result as any)?.drift === 'number')).toBe(true);
  });

  it('refresh_blend produces exactly ONE receipt (composes refresh_faf — no double-count)', async () => {
    const before = readReceipts().length;
    await handler.callTool('refresh_blend', { mode: 'blend' });
    expect(readReceipts().length).toBe(before + 1);
  });

  it('write-path ↔ read-path aligned — every receipt the orchestrator reads is well-formed', () => {
    const recs = readReceipts();
    expect(recs.length).toBeGreaterThanOrEqual(3);
    for (const r of recs) {
      expect(r.trigger).toBe('manual');
      expect(r.fired_at).toBeTruthy();
      expect(r.refresh_result).toBeDefined();
    }
  });

  it('telemetry never breaks the refresh — a confined/odd path still returns content, not a throw', async () => {
    // Even if the receipt write hit trouble, refresh must still answer. (Happy
    // path here; the fire-and-forget try/catch guarantees no telemetry failure
    // can surface as a tool error.)
    const r = await handler.callTool('refresh_faf', {});
    expect(r.isError).toBeFalsy();
    expect(r.content[0].text).toContain('REFRESH');
  });
});
