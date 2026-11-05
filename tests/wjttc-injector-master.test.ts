/**
 * 🏁 WJTTC — the managed-block injector (Master for B3)
 *
 * grok writes AGENTS.md / CLAUDE.md / .cursorrules blocks through faf-cli's
 * injector, the one faf-cli, faf-mcp and claude-faf-mcp use. These cases are
 * the audit's reproductions (WJTTC MCP-family audit, 2026-11-04, §B3/§B4) and
 * the contract the other servers' writers are mapped onto:
 *
 *   1. a first line that looks like a faf stamp is never reclaimed — the
 *      human's lines stay, and the reply says why the block went on top
 *   2. a START with no END is not a block — nothing after it is cut
 *   3. a marker quoted in prose is not a marker — only whole lines count
 *   4. a file that isn't UTF-8 is refused and left byte-for-byte as it was
 *   5. a dangling link is refused — nothing is written through it
 *   6. markers present → only the block changes, idempotently
 */
import { describe, test, expect } from 'bun:test';
import { mkdtempSync, promises as fs, symlinkSync, existsSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { injectFafBlock, FAF_START, FAF_END } from '../src/faf-core/inject';
import { syncBiDirectional } from '../src/faf-core/commands/bi-sync';

const tmp = (): string => mkdtempSync(join(tmpdir(), 'grok-inj-'));
const blocks = (s: string): number => (s.match(/^<!-- faf:start -->$/gm) || []).length;

describe('🏁 WJTTC — injector Master (B3)', () => {
  test('1. legacy-looking first line: human lines kept, block on top, note returned', async () => {
    const p = join(tmp(), 'AGENTS.md');
    await fs.writeFile(p, '<!-- faf: my own note, hand-written -->\n# Team rules\nNever deploy on Friday.\n');
    const note = await injectFafBlock(p, 'generated block');
    const out = await fs.readFile(p, 'utf-8');
    expect(out).toContain('Never deploy on Friday.');
    expect(out).toContain('<!-- faf: my own note, hand-written -->');
    expect(out).toContain('generated block');
    expect(blocks(out)).toBe(1);
    expect(note).toBeTruthy();
  });

  test('2. START with no END: nothing after it is cut', async () => {
    const p = join(tmp(), 'AGENTS.md');
    await fs.writeFile(p, `${FAF_START}\nold block\n## My notes\nKeep this line.\n`);
    await injectFafBlock(p, 'new block');
    const out = await fs.readFile(p, 'utf-8');
    expect(out).toContain('Keep this line.');
    expect(out).toContain('new block');
  });

  test('3. a marker quoted in prose is not a marker', async () => {
    const p = join(tmp(), 'CLAUDE.md');
    await fs.writeFile(p, `## Rule\nOur block runs from \`${FAF_START}\` to \`${FAF_END}\` — do not edit inside it.\n\n${FAF_START}\nv1\n${FAF_END}\n\n## Rule two\nStill here.\n`);
    await injectFafBlock(p, 'v2');
    const out = await fs.readFile(p, 'utf-8');
    expect(out).toContain('v2');
    expect(out).not.toContain('v1');
    expect(out).toContain('do not edit inside it.');
    expect(out).toContain('Still here.');
  });

  test('4. not UTF-8: refused, file byte-identical', async () => {
    const p = join(tmp(), 'CLAUDE.md');
    const bytes = Buffer.concat([Buffer.from('# Notes\nCaf'), Buffer.from([0xe9]), Buffer.from(' au lait\n')]);
    writeFileSync(p, bytes);
    await expect(injectFafBlock(p, 'block')).rejects.toThrow();
    expect(readFileSync(p).equals(bytes)).toBe(true);
  });

  test.skipIf(process.platform === 'win32')('5. dangling link: refused, nothing written through it', async () => {
    const d = tmp();
    const outside = join(tmp(), 'elsewhere.txt');
    symlinkSync(outside, join(d, 'CLAUDE.md'));
    await expect(injectFafBlock(join(d, 'CLAUDE.md'), 'block')).rejects.toThrow();
    expect(existsSync(outside)).toBe(false);
  });

  test('6. markers present: only the block changes, idempotent', async () => {
    const p = join(tmp(), 'AGENTS.md');
    await fs.writeFile(p, `# Mine\n\n${FAF_START}\nv1\n${FAF_END}\n\nTail notes.\n`);
    expect(await injectFafBlock(p, 'v2')).toBeNull();
    await injectFafBlock(p, 'v2');
    const out = await fs.readFile(p, 'utf-8');
    expect(out).toContain('# Mine');
    expect(out).toContain('Tail notes.');
    expect(out).toContain('v2');
    expect(out).not.toContain('v1');
    expect(blocks(out)).toBe(1);
  });

  test('sync reply carries the note instead of claiming nothing happened', async () => {
    const d = tmp();
    await fs.writeFile(join(d, 'project.faf'), 'faf_version: 2.5.0\nproject:\n  name: Demo\n  goal: ship\n  main_language: TypeScript\n');
    await fs.writeFile(join(d, 'CLAUDE.md'), '<!-- faf: my own note -->\n# Rules\nKeep me.\n');
    const r = await syncBiDirectional(d, { target: 'claude' } as any);
    expect(r.success).toBe(true);
    expect(readFileSync(join(d, 'CLAUDE.md'), 'utf-8')).toContain('Keep me.');
    expect(r.notes?.length ?? 0).toBeGreaterThan(0);
    expect(r.message).toContain(r.notes![0]);
  });
});
