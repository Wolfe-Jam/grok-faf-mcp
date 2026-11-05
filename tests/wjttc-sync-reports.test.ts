/**
 * 🏁 WJTTC — what faf_sync tells the user (follow-up to the injector Master, #186)
 *
 * From the independent review of #186:
 *   F1  a refused file was reported as "Failed to sync: undefined" — the reason must reach the reply
 *   F2  the live faf_sync never wrote the context files its description names, so faf-cli's
 *       note never reached it — faf_sync now writes them, and the reply is a sentence, not a JSON dump
 *   F3  one refused file stopped the whole sync — each file is now on its own: the others are
 *       written, and the reply says what was written and what was refused, and why
 */
import { describe, test, expect } from 'bun:test';
import { mkdtempSync, promises as fs, readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { GrokFafMcpServer } from '../src/server.js';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { syncBiDirectional } from '../src/faf-core/commands/bi-sync';

const FAF = 'faf_version: 2.5.0\nproject:\n  name: Sync Reports\n  goal: ship\n  main_language: TypeScript\n';
const CP1252 = Buffer.from([0x43, 0x61, 0x66, 0xe9, 0x0a]); // "Café" in cp1252: not UTF-8

/** Run one tool call against a server whose working directory is `d`. */
async function callIn(d: string, name: string, args: Record<string, unknown> = {}): Promise<any> {
  const cwd = process.cwd();
  process.chdir(d);
  const server = new GrokFafMcpServer({ transport: 'stdio', fafEnginePath: 'native' });
  const [ct, st] = InMemoryTransport.createLinkedPair();
  await server.getServer().connect(st);
  const c = new Client({ name: 'sync-reports', version: '1.0.0' }, { capabilities: {} });
  await c.connect(ct);
  try {
    return await c.callTool({ name, arguments: args });
  } finally {
    await c.close();
    await server.getServer().close();
    process.chdir(cwd);
  }
}

describe('🏁 WJTTC — faf_sync reports', () => {
  test('F3: one refused file does not stop the others; each is named', async () => {
    const d = mkdtempSync(join(tmpdir(), 'grok-sr-'));
    await fs.writeFile(join(d, 'project.faf'), FAF);
    writeFileSync(join(d, '.cursorrules'), CP1252);
    await fs.writeFile(join(d, 'CLAUDE.md'), '# Mine\nkeep\n');
    await fs.writeFile(join(d, '.clinerules'), '# rules\n');
    const r = await syncBiDirectional(d, { target: 'all' } as any);
    expect(r.success).toBe(true);
    expect(r.filesChanged).toEqual(expect.arrayContaining(['CLAUDE.md', '.clinerules', '.windsurfrules']));
    expect(r.refused?.map((x) => x.file)).toEqual(['.cursorrules']);
    expect(r.refused?.[0].reason).toMatch(/UTF-8/);
    expect(readFileSync(join(d, '.cursorrules')).equals(CP1252)).toBe(true);
    expect(r.message).toContain('Not written: .cursorrules');
    expect(readFileSync(join(d, 'CLAUDE.md'), 'utf-8')).toContain('keep');
  });

  test('F1: when every file is refused, the reply gives the reason, never "undefined"', async () => {
    const d = mkdtempSync(join(tmpdir(), 'grok-sr-'));
    await fs.writeFile(join(d, 'project.faf'), FAF);
    writeFileSync(join(d, 'CLAUDE.md'), CP1252);
    const res = await callIn(d, 'faf_sync', { target: 'CLAUDE.md' });
    const text: string = res.content[0].text;
    expect(res.isError).toBe(true);
    expect(text).not.toContain('undefined');
    expect(text).toMatch(/UTF-8/);
    expect(readFileSync(join(d, 'CLAUDE.md')).equals(CP1252)).toBe(true);
  });

  test('F2: faf_sync writes CLAUDE.md and the note arrives as a sentence', async () => {
    const d = mkdtempSync(join(tmpdir(), 'grok-sr-'));
    await fs.writeFile(join(d, 'project.faf'), FAF);
    await fs.writeFile(join(d, 'CLAUDE.md'), '<!-- faf: mine -->\n# Rules\nKeep me.\n');
    const res = await callIn(d, 'faf_sync');
    const text: string = res.content[0].text;
    expect(res.isError).toBeFalsy();
    const out = readFileSync(join(d, 'CLAUDE.md'), 'utf-8');
    expect(out).toContain('<!-- faf:start -->');
    expect(out).toContain('Keep me.');
    expect(text).toContain('Synced CLAUDE.md');
    expect(text).toMatch(/CLAUDE\.md: /);          // faf-cli's note, as text
    expect(text).not.toMatch(/^\s*\{/m);           // not a JSON dump
    expect(readFileSync(join(d, 'project.faf'), 'utf-8')).toBe(FAF);
  });

  test('N4: claude.md in lower case is found next to .cursorrules, on every OS', async () => {
    const d = mkdtempSync(join(tmpdir(), 'grok-sr-'));
    await fs.writeFile(join(d, 'project.faf'), FAF);
    await fs.writeFile(join(d, 'claude.md'), '# lower\n');
    await fs.writeFile(join(d, '.cursorrules'), '# rules\n');
    const r = await syncBiDirectional(d, {} as any);
    expect(r.filesChanged).toEqual(expect.arrayContaining(['claude.md', '.cursorrules']));
    expect(readFileSync(join(d, 'claude.md'), 'utf-8')).toContain('<!-- faf:start -->');
  });

  test('N5: an unknown target is refused by name, nothing written', async () => {
    const d = mkdtempSync(join(tmpdir(), 'grok-sr-'));
    await fs.writeFile(join(d, 'project.faf'), FAF);
    const res = await callIn(d, 'faf_sync', { target: 'AGENTS.md' });
    expect(res.isError).toBe(true);
    expect(res.content[0].text).toContain('Unknown target "AGENTS.md"');
    expect(existsSync(join(d, 'CLAUDE.md'))).toBe(false);
  });

  test('N6: two syncs in a row leave the file identical', async () => {
    const d = mkdtempSync(join(tmpdir(), 'grok-sr-'));
    await fs.writeFile(join(d, 'project.faf'), FAF);
    await syncBiDirectional(d, {} as any);
    const first = readFileSync(join(d, 'CLAUDE.md'), 'utf-8');
    await new Promise((r) => setTimeout(r, 1100));
    await syncBiDirectional(d, {} as any);
    expect(readFileSync(join(d, 'CLAUDE.md'), 'utf-8')).toBe(first);
  });

  test('N3 + N7: the reply has no unmeasured score and no absolute path', async () => {
    const d = mkdtempSync(join(tmpdir(), 'grok-sr-'));
    await fs.writeFile(join(d, 'project.faf'), FAF);
    writeFileSync(join(d, '.cursorrules'), CP1252);
    await fs.writeFile(join(d, 'CLAUDE.md'), '# Mine\n');
    const r = await syncBiDirectional(d, { target: 'all' } as any);
    expect(r.message).not.toContain('FAF Score');
    expect(r.message).not.toContain(d);
    expect(r.message).toContain('Not written: .cursorrules is not UTF-8');
  });
});
