/**
 * 🏁 WJTTC — repeat-offender WRITE-path wired (Gap B — the #132 sibling)
 *
 * Before: `RepeatOffenderTracker.recordFrom*` was called only from tests.
 * `readOrchestrationState` READ the index (`getRepeatOffenders`) but nothing
 * WROTE it, so `.faf-drift-index.json` stayed empty in real sessions and
 * recurrence never climbed. This pins the fix: `orchestrate()` bridges the
 * detected drift into the tracker — append-only, READ-THEN-RECORD (the run uses
 * prior history for recurrence, then banks this run's drift for next time),
 * and fire-and-forget (a telemetry write never breaks the recommendation).
 *
 * Assertions read the RAW event file (not getRepeatOffenders) so they prove the
 * WRITE directly, independent of the offender-surfacing count threshold.
 */
import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { orchestrate } from '../src/orchestrator/recommendation';

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

let tmp: string;
beforeEach(() => { tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'gapb-')); });
afterEach(() => { try { fs.rmSync(tmp, { recursive: true, force: true }); } catch { /* best-effort */ } });

const indexPath = () => path.join(tmp, '.faf-drift-index.json');
const readEvents = (): Array<{ slot: string; timestamp: string }> =>
  fs.existsSync(indexPath()) ? JSON.parse(fs.readFileSync(indexPath(), 'utf-8')) : [];

describe('🏁 WJTTC — drift-index write-path (Gap B, now wired)', () => {
  test('clean room: no drift-index file before orchestrate', () => {
    expect(fs.existsSync(indexPath())).toBe(false);
  });

  test('orchestrate WRITES the drift-index when drift is detected', () => {
    fs.writeFileSync(path.join(tmp, 'soul.fafm'), DRIFTY_FAFM);
    const rec = orchestrate({ cwd: tmp, now: '2026-06-22T00:00:00Z' });

    expect(rec.hints.drift_signal).toBeDefined();          // drift detected
    expect(fs.existsSync(indexPath())).toBe(true);          // ← the WRITE (was the Gap B gap)
    const events = readEvents();
    expect(events.length).toBeGreaterThan(0);               // anchors actually recorded
    expect(events.some((e) => e.slot.startsWith('anchor:'))).toBe(true);
  });

  test('READ-THEN-RECORD: run uses prior (empty) history; banks this run for next time', () => {
    fs.writeFileSync(path.join(tmp, 'soul.fafm'), DRIFTY_FAFM);

    // Call 1 — prior history is empty → recurrence read BEFORE this run's record.
    const r1 = orchestrate({ cwd: tmp, now: '2026-06-22T00:00:00Z' });
    expect(r1.hints.top_offenders.length).toBe(0);          // read happened before record
    const after1 = readEvents().length;
    expect(after1).toBeGreaterThan(0);                      // …but the run DID bank its drift

    // Call 2 — append-only: the log grows; the prior run's drift is now on disk.
    orchestrate({ cwd: tmp, now: '2026-06-22T01:00:00Z' });
    expect(readEvents().length).toBeGreaterThan(after1);
  });

  test('clean .fafm → no drift → silent no-op (never writes an empty file)', () => {
    fs.writeFileSync(path.join(tmp, 'soul.fafm'), CLEAN_FAFM);
    const rec = orchestrate({ cwd: tmp, now: '2026-06-22T00:00:00Z' });

    expect(rec.hints.drift_signal).toBeUndefined();
    expect(fs.existsSync(indexPath())).toBe(false);
  });

  test('fire-and-forget: telemetry never breaks orchestrate — a recommendation always returns', () => {
    fs.writeFileSync(path.join(tmp, 'soul.fafm'), DRIFTY_FAFM);
    const rec = orchestrate({ cwd: tmp, now: '2026-06-22T00:00:00Z' });
    expect(rec.recommend).toBeDefined();
    expect(typeof rec.summary).toBe('string');
  });
});
