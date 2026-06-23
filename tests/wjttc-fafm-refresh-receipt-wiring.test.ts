/**
 * 🏁 WJTTC — .fafm refresh receipt WRITE-path wired (symmetric to PR #132)
 *
 * PR #132 wired the `.faf` refresh receipt; `refresh_fafm` had no equivalent, so
 * `.fafm-refresh-receipts.json` stayed empty — an observability asymmetry. This
 * pins the fix: every refresh_fafm fire (direct + composed by refresh_blend)
 * appends a receipt, mode delta|verbatim, and — DOCTRINE — carries NO score
 * (.fafm memories are not scored). Never breaks the refresh.
 */
import { describe, it, expect, beforeAll, afterAll } from 'bun:test';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { FafToolHandler } from '../src/handlers/tools';
import { FafEngineAdapter } from '../src/handlers/engine-adapter';
import { FafmRefreshReceiptsLog } from '../src/telemetry/fafm-refresh-receipts';

const FAFM = `namepoint: "@fafm-wiring-test:1.0"
version: "1.0"
memory:
  facts:
    - id: f1
      text: "first durable fact"
      timestamp: "2026-06-01T00:00:00Z"
    - id: f2
      text: "second durable fact"
      timestamp: "2026-06-02T00:00:00Z"
`;

const FAF = `faf_version: "3.0"
project:
  name: fafm-refresh-wiring-test
  goal: prove the .fafm refresh receipt write-path is wired
stack:
  backend: TypeScript
  runtime: Node.js
human_context:
  who: test
  what: prove .fafm refresh telemetry (symmetric to .faf)
  why: observability writes, not just reads — both refresh primitives
`;

let handler: FafToolHandler;
let tmp: string;
let origCwd: string;

beforeAll(() => {
  origCwd = process.cwd();
  tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'fafm-refresh-'));
  fs.writeFileSync(path.join(tmp, 'soul.fafm'), FAFM);
  fs.writeFileSync(path.join(tmp, 'project.faf'), FAF); // refresh_blend composes refresh_faf too
  process.chdir(tmp); // refresh handlers re-ground on the LIVE cwd
  handler = new FafToolHandler(new FafEngineAdapter('native'));
});
afterAll(() => {
  process.chdir(origCwd);
  try { fs.rmSync(tmp, { recursive: true, force: true }); } catch { /* best-effort */ }
});

const receiptsPath = () => path.join(tmp, '.fafm-refresh-receipts.json');
const readReceipts = () => new FafmRefreshReceiptsLog(receiptsPath()).readReceipts();

describe('🏁 WJTTC — .fafm refresh receipt write-path (symmetric telemetry)', () => {
  it('starts with NO .fafm receipts file (clean room)', () => {
    expect(fs.existsSync(receiptsPath())).toBe(false);
  });

  it('refresh_fafm (delta default) WRITES a receipt — trigger=manual, mode=delta, NO score', async () => {
    const r = await handler.callTool('refresh_fafm', {});
    expect(r.isError).toBeFalsy();
    expect(fs.existsSync(receiptsPath())).toBe(true);
    const recs = readReceipts();
    expect(recs.length).toBe(1);
    expect(recs[0].trigger).toBe('manual');
    expect(recs[0].mode).toBe('delta');
    expect(recs[0].fired_at).toBeTruthy();
    // captured the memory scope (fact_count), but NOT a score
    expect((recs[0].refresh_result as any).fact_count).toBe(2);
    expect('score' in (recs[0].refresh_result as any)).toBe(false);
  });

  it('refresh_fafm verbatim → a mode=verbatim receipt', async () => {
    const before = readReceipts().length;
    await handler.callTool('refresh_fafm', { verbatim: true });
    const recs = readReceipts();
    expect(recs.length).toBe(before + 1);
    // newest-first ordering → the verbatim fire is recs[0]
    expect(recs[0].mode).toBe('verbatim');
  });

  it('DOCTRINE: no .fafm receipt ever carries a score (memories are not scored)', () => {
    const recs = readReceipts();
    expect(recs.length).toBeGreaterThanOrEqual(2);
    for (const r of recs) {
      expect('score' in (r.refresh_result as any)).toBe(false);
      expect(r.mode === 'delta' || r.mode === 'verbatim').toBe(true);
    }
  });

  it('refresh_blend composes refresh_fafm — adds a .fafm receipt too', async () => {
    const before = readReceipts().length;
    await handler.callTool('refresh_blend', { mode: 'blend' });
    expect(readReceipts().length).toBe(before + 1);
  });

  it('telemetry never breaks the refresh — still returns content, not a throw', async () => {
    const r = await handler.callTool('refresh_fafm', {});
    expect(r.isError).toBeFalsy();
    expect(r.content[0].text).toContain('REFRESH FAFM');
  });
});
