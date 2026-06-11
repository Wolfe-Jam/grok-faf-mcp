/**
 * Non-destructive interop — regression guard for the file-wipe bug.
 * grok's multi-platform bi-sync writes CLAUDE.md + .cursorrules + .windsurfrules +
 * .clinerules — it must ENHANCE each, never replace, and never corrupt project.faf.
 * Enhance, never replace.
 */
import { describe, test, expect } from 'bun:test';
import { mkdtempSync, promises as fs } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { syncBiDirectional } from '../src/faf-core/commands/bi-sync';
import { injectFafBlock } from '../src/faf-core/inject';

const MARK = '## HAND-WRITTEN — MUST SURVIVE';
const blocks = (s: string) => (s.match(/faf:start/g) || []).length;
function tmp(): string { return mkdtempSync(join(tmpdir(), 'grok-nd-')); }

describe('injectFafBlock — non-destructive', () => {
  test('prefix preserves; markers update in place; legacy reclaimed; idempotent', async () => {
    const p = join(tmp(), 'F.md');
    await fs.writeFile(p, `# Mine\n${MARK}\n`);
    await injectFafBlock(p, 'v1');
    await injectFafBlock(p, 'v2');
    const out = await fs.readFile(p, 'utf-8');
    expect(out).toContain('v2');
    expect(out).not.toContain('v1');
    expect(out).toContain(MARK);
    expect(blocks(out)).toBe(1);
  });
});

describe('bi-sync (multi-platform) — enhance, never replace', () => {
  test('syncBiDirectional --all preserves every target + leaves project.faf intact', async () => {
    const d = tmp();
    await fs.writeFile(join(d, 'project.faf'),
      'faf_version: 2.5.0\nproject:\n  name: Grok Demo\n  goal: ship\n  main_language: TypeScript\n');
    const targets = ['CLAUDE.md', '.cursorrules', '.windsurfrules', '.clinerules'];
    for (const f of targets) await fs.writeFile(join(d, f), `# Mine\n${MARK}\nnotes\n`);

    await syncBiDirectional(d, { target: 'all' } as any);
    await syncBiDirectional(d, { target: 'all' } as any); // idempotent

    for (const f of targets) {
      const out = await fs.readFile(join(d, f), 'utf-8');
      expect(out).toContain(MARK);   // user content preserved
      expect(blocks(out)).toBe(1);   // exactly one faf block, no duplication
    }
    // project.faf must never be touched/corrupted by a sync
    const faf = await fs.readFile(join(d, 'project.faf'), 'utf-8');
    expect(faf.startsWith('faf_version')).toBe(true);
    expect(faf).not.toContain('faf:start');
  });
});
