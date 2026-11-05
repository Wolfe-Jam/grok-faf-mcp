/**
 * TRUST SEAL — "enhance, never replace" (source write-guard).
 *
 * faf must NEVER raw-overwrite a context / IDE-rule file. Every such write goes
 * through injectFafBlock (non-destructive). This guard fails the build if any
 * `fs.writeFile` / `writeFileSync` targets a context file directly — so the
 * file-wipe bug physically cannot be reintroduced. The code is not allowed to.
 */
import { describe, test } from 'bun:test';
import { readdirSync, readFileSync, statSync } from 'fs';
import { join } from 'path';

// A write whose line names a context/IDE-rule file literally.
const LITERAL =
  /\b(writeFile|writeFileSync)\s*\([^;]*\b(AGENTS\.md|CLAUDE\.md|GEMINI\.md|\.cursorrules|\.windsurfrules|\.clinerules)\b/;
// A write of generated context content to a bare context-file path variable.
// (Tuned to interop vars + content vars; `.faf` writes use fafContent/fafPath, allowed.)
const BARE =
  /\b(writeFile|writeFileSync)\s*\(\s*(outputPath|targetPath|claudeMdPath|claudePath)\s*,\s*(content|platformContent|claudeMdContent|merged)\b/;

function tsFiles(dir: string, out: string[] = []): string[] {
  for (const e of readdirSync(dir)) {
    if (e === 'node_modules' || e === 'dist' || e === 'inject.ts') continue;
    const p = join(dir, e);
    const s = statSync(p);
    if (s.isDirectory()) tsFiles(p, out);
    else if (e.endsWith('.ts') && !e.endsWith('.test.ts') && !e.endsWith('.d.ts')) out.push(p);
  }
  return out;
}

describe('TRUST SEAL — enhance, never replace', () => {
  test('no raw fs.writeFile to a context/IDE-rule file — use injectFafBlock', () => {
    const violations: string[] = [];
    for (const f of tsFiles(join(import.meta.dir, '..', 'src'))) {
      readFileSync(f, 'utf-8').split('\n').forEach((line, i) => {
        // A write is allowed only if it routes through injectFafBlock OR carries an
        // explicit, auditable `trust-seal-ok:` exemption (e.g. a verified marker-merge).
        if ((LITERAL.test(line) || BARE.test(line)) && !line.includes('trust-seal-ok')) {
          violations.push(`${f}:${i + 1}  ${line.trim()}`);
        }
      });
    }
    if (violations.length) {
      throw new Error(
        'TRUST SEAL BROKEN — raw context-file write detected. Route it through injectFafBlock ' +
        '("enhance, never replace"):\n  ' + violations.join('\n  '),
      );
    }
  });
});

// ---------------------------------------------------------------------------
// TRUST SEAL — behaviour. The regex above reads source text; it cannot see a
// write that goes through a generic variable (faf_write writes via `filePath`).
// These tests run the real faf_write tool over MCP in a throwaway project dir
// and check the bytes on disk.
// ---------------------------------------------------------------------------
import { expect, beforeAll, afterAll, beforeEach, afterEach } from 'bun:test';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { GrokFafMcpServer } from '../src/server.js';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';

const DNA = JSON.stringify({ birthCertificate: { certificate: 'FAF-2026-ORIGINAL-AAAA' } }, null, 2);
const REISSUE = '{"birthCertificate":{"certificate":"FAF-REISSUED"}}';

let server: GrokFafMcpServer;
let client: Client;
const savedTools = process.env.FAF_TOOLS;
const savedRoots = process.env.FAF_ALLOWED_ROOTS;
const originalCwd = process.cwd();
let proj: string;   // canonical project dir (cwd during each test)
let outside: string; // sibling dir under the OS temp dir, outside the project

function textOf(res: any): string {
  return (res?.content ?? []).map((c: any) => c.text ?? '').join('\n');
}

async function write(args: Record<string, unknown>): Promise<any> {
  return client.callTool({ name: 'faf_write', arguments: args });
}

function leftovers(dir: string): string[] {
  return fs.readdirSync(dir).filter((n) => n.includes('.faf-write-'));
}

beforeAll(async () => {
  process.env.FAF_TOOLS = 'all'; // faf_write is in the extended set
  delete process.env.FAF_ALLOWED_ROOTS;
  server = new GrokFafMcpServer({ transport: 'stdio', fafEnginePath: 'native' });
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  await server.getServer().connect(serverTransport);
  client = new Client({ name: 'write-guard', version: '1.0.0' }, { capabilities: {} });
  await client.connect(clientTransport);
});

afterAll(async () => {
  await client.close();
  await server.getServer().close();
  if (savedTools === undefined) delete process.env.FAF_TOOLS; else process.env.FAF_TOOLS = savedTools;
  if (savedRoots === undefined) delete process.env.FAF_ALLOWED_ROOTS; else process.env.FAF_ALLOWED_ROOTS = savedRoots;
});

beforeEach(() => {
  proj = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'faf-write-proj-')));
  outside = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'faf-write-outside-')));
  fs.writeFileSync(path.join(proj, '.faf-dna'), DNA);
  fs.writeFileSync(path.join(proj, 'project.faf'), 'project:\n  name: original\n');
  fs.writeFileSync(path.join(proj, 'CLAUDE.md'), '# Hand notes\nkeep me\n');
  fs.writeFileSync(path.join(proj, 'AGENTS.md'), '# Agents\nkeep me\n');
  fs.mkdirSync(path.join(proj, '.git', 'hooks'), { recursive: true });
  process.chdir(proj);
});

afterEach(() => {
  process.chdir(originalCwd);
  fs.rmSync(proj, { recursive: true, force: true });
  fs.rmSync(outside, { recursive: true, force: true });
});

describe('TRUST SEAL — faf_write behaviour: .faf-dna is never written', () => {
  test('.faf-dna is refused and stays byte-identical', async () => {
    const before = fs.readFileSync(path.join(proj, '.faf-dna'));
    const res = await write({ path: '.faf-dna', content: REISSUE });
    expect(res.isError).toBe(true);
    expect(textOf(res)).toContain('birth certificate');
    expect(fs.readFileSync(path.join(proj, '.faf-dna')).equals(before)).toBe(true);
    expect(leftovers(proj)).toEqual([]);
  });

  test('.faf-dna is refused even with overwrite: true', async () => {
    const before = fs.readFileSync(path.join(proj, '.faf-dna'));
    const res = await write({ path: '.faf-dna', content: REISSUE, overwrite: true });
    expect(res.isError).toBe(true);
    expect(fs.readFileSync(path.join(proj, '.faf-dna')).equals(before)).toBe(true);
  });

  test('every spelling of the path is refused: case, ./, absolute, ../ detour, trailing dot', async () => {
    const before = fs.readFileSync(path.join(proj, '.faf-dna'));
    const spellings = [
      './.faf-dna',
      '.FAF-DNA',
      '.Faf-Dna',
      path.join(proj, '.faf-dna'),
      `sub/../.faf-dna`,
      '.faf-dna.',
      'nested/dir/.faf-dna',
      '.faf-dna/inside',
    ];
    for (const p of spellings) {
      const res = await write({ path: p, content: REISSUE, overwrite: true });
      expect(res.isError, p).toBe(true);
    }
    expect(fs.readFileSync(path.join(proj, '.faf-dna')).equals(before)).toBe(true);
    expect(fs.existsSync(path.join(proj, 'nested'))).toBe(false);
    expect(fs.existsSync(path.join(proj, 'sub'))).toBe(false);
  });

  test('a missing .faf-dna is not created (no birth through faf_write)', async () => {
    fs.unlinkSync(path.join(proj, '.faf-dna'));
    const res = await write({ path: '.faf-dna', content: REISSUE });
    expect(res.isError).toBe(true);
    expect(fs.existsSync(path.join(proj, '.faf-dna'))).toBe(false);
  });

  test('a symlink to .faf-dna is refused and the certificate stays byte-identical', async () => {
    const before = fs.readFileSync(path.join(proj, '.faf-dna'));
    fs.symlinkSync(path.join(proj, '.faf-dna'), path.join(proj, 'notes.txt'));
    const res = await write({ path: 'notes.txt', content: REISSUE, overwrite: true });
    expect(res.isError).toBe(true);
    expect(textOf(res)).toContain('birth certificate');
    expect(fs.readFileSync(path.join(proj, '.faf-dna')).equals(before)).toBe(true);
    expect(fs.lstatSync(path.join(proj, 'notes.txt')).isSymbolicLink()).toBe(true);
  });

  test('a relative symlink to .faf-dna is refused', async () => {
    const before = fs.readFileSync(path.join(proj, '.faf-dna'));
    fs.symlinkSync('.faf-dna', path.join(proj, 'dna-link'));
    const res = await write({ path: 'dna-link', content: REISSUE });
    expect(res.isError).toBe(true);
    expect(fs.readFileSync(path.join(proj, '.faf-dna')).equals(before)).toBe(true);
  });

  test('a hard link to .faf-dna: the write replaces the link name, never the certificate', async () => {
    const before = fs.readFileSync(path.join(proj, '.faf-dna'));
    fs.linkSync(path.join(proj, '.faf-dna'), path.join(proj, 'hardlink.txt'));
    const res = await write({ path: 'hardlink.txt', content: 'new content' });
    expect(res.isError).toBeFalsy();
    expect(fs.readFileSync(path.join(proj, 'hardlink.txt'), 'utf-8')).toBe('new content');
    expect(fs.readFileSync(path.join(proj, '.faf-dna')).equals(before)).toBe(true);
  });
});

describe('TRUST SEAL — faf_write behaviour: existing context files need overwrite: true', () => {
  for (const name of ['project.faf', 'CLAUDE.md', 'AGENTS.md']) {
    test(`${name}: refused without overwrite, byte-identical after`, async () => {
      const before = fs.readFileSync(path.join(proj, name));
      const res = await write({ path: name, content: 'x' });
      expect(res.isError).toBe(true);
      expect(textOf(res)).toContain('already exists');
      expect(textOf(res)).toContain('overwrite: true');
      expect(fs.readFileSync(path.join(proj, name)).equals(before)).toBe(true);
      expect(leftovers(proj)).toEqual([]);
    });

    test(`${name}: overwrite: false is the same as omitted`, async () => {
      const before = fs.readFileSync(path.join(proj, name));
      const res = await write({ path: name, content: 'x', overwrite: false });
      expect(res.isError).toBe(true);
      expect(fs.readFileSync(path.join(proj, name)).equals(before)).toBe(true);
    });

    test(`${name}: overwrite: "true" (string) is not overwrite: true`, async () => {
      const before = fs.readFileSync(path.join(proj, name));
      const res = await write({ path: name, content: 'x', overwrite: 'true' });
      expect(res.isError).toBe(true);
      expect(fs.readFileSync(path.join(proj, name)).equals(before)).toBe(true);
    });

    test(`${name}: written with overwrite: true`, async () => {
      const res = await write({ path: name, content: 'replaced\n', overwrite: true });
      expect(res.isError).toBeFalsy();
      expect(fs.readFileSync(path.join(proj, name), 'utf-8')).toBe('replaced\n');
      expect(leftovers(proj)).toEqual([]);
    });
  }

  test('any *.faf, and case variants (claude.md, Agents.MD, X.FAF), are protected', async () => {
    fs.writeFileSync(path.join(proj, 'other.faf'), 'a');
    fs.writeFileSync(path.join(proj, 'UPPER.FAF'), 'b');
    fs.mkdirSync(path.join(proj, 'pkg'));
    fs.writeFileSync(path.join(proj, 'pkg', 'claude.md'), 'c');
    fs.writeFileSync(path.join(proj, 'pkg', 'Agents.MD'), 'd');
    fs.writeFileSync(path.join(proj, '.faf'), 'e');
    for (const [p, orig] of [
      ['other.faf', 'a'], ['UPPER.FAF', 'b'], ['pkg/claude.md', 'c'], ['pkg/Agents.MD', 'd'], ['.faf', 'e'],
    ]) {
      const res = await write({ path: p, content: 'x' });
      expect(res.isError, p).toBe(true);
      expect(fs.readFileSync(path.join(proj, p), 'utf-8')).toBe(orig);
    }
  });

  test('a new project.faf / CLAUDE.md is created without overwrite', async () => {
    fs.mkdirSync(path.join(proj, 'fresh'));
    const a = await write({ path: 'fresh/project.faf', content: 'project:\n  name: fresh\n' });
    const b = await write({ path: 'fresh/CLAUDE.md', content: '# fresh\n' });
    expect(a.isError).toBeFalsy();
    expect(b.isError).toBeFalsy();
    expect(fs.readFileSync(path.join(proj, 'fresh', 'project.faf'), 'utf-8')).toContain('fresh');
    expect(fs.readFileSync(path.join(proj, 'fresh', 'CLAUDE.md'), 'utf-8')).toBe('# fresh\n');
    expect(leftovers(path.join(proj, 'fresh'))).toEqual([]);
  });

  test('an ordinary existing file is replaced atomically (no temp file left) and keeps its mode', async () => {
    const f = path.join(proj, 'notes.txt');
    fs.writeFileSync(f, 'old');
    fs.chmodSync(f, 0o600);
    const res = await write({ path: 'notes.txt', content: 'new' });
    expect(res.isError).toBeFalsy();
    expect(fs.readFileSync(f, 'utf-8')).toBe('new');
    expect(fs.statSync(f).mode & 0o777).toBe(0o600);
    expect(leftovers(proj)).toEqual([]);
  });
});

describe('TRUST SEAL — faf_write behaviour: confined to cwd', () => {
  test('../ escape is refused and nothing is written', async () => {
    const name = `escape-${path.basename(proj)}.txt`;
    const res = await write({ path: `../${name}`, content: 'pwned' });
    expect(res.isError).toBe(true);
    expect(fs.existsSync(path.join(path.dirname(proj), name))).toBe(false);
  });

  test('an absolute path in the OS temp dir (outside cwd) is refused', async () => {
    const target = path.join(outside, 'tmp-write.txt');
    const res = await write({ path: target, content: 'pwned' });
    expect(res.isError).toBe(true);
    expect(textOf(res)).toContain('outside the project');
    expect(fs.existsSync(target)).toBe(false);
  });

  test('FAF_ALLOWED_ROOTS does not widen faf_write beyond cwd', async () => {
    process.env.FAF_ALLOWED_ROOTS = outside;
    try {
      const target = path.join(outside, 'roots-write.txt');
      const res = await write({ path: target, content: 'pwned' });
      expect(res.isError).toBe(true);
      expect(fs.existsSync(target)).toBe(false);
    } finally {
      delete process.env.FAF_ALLOWED_ROOTS;
    }
  });

  test('~ and the cwd itself are refused', async () => {
    const home = await write({ path: '~/.grokfaf_write_guard_probe', content: 'x' });
    expect(home.isError).toBe(true);
    expect(fs.existsSync(path.join(os.homedir(), '.grokfaf_write_guard_probe'))).toBe(false);
    expect(fs.existsSync(path.join(proj, '~'))).toBe(false);
    const dot = await write({ path: '.', content: 'x' });
    expect(dot.isError).toBe(true);
  });

  test('.git/hooks is refused (no hook planted)', async () => {
    for (const p of ['.git/hooks/pre-commit', '.GIT/config', 'sub/.git/hooks/post-checkout']) {
      const res = await write({ path: p, content: '#!/bin/sh\necho pwned\n' });
      expect(res.isError, p).toBe(true);
    }
    expect(fs.existsSync(path.join(proj, '.git', 'hooks', 'pre-commit'))).toBe(false);
    expect(fs.existsSync(path.join(proj, '.git', 'config'))).toBe(false);
    expect(fs.existsSync(path.join(proj, 'sub'))).toBe(false);
  });

  test('a directory symlink pointing out of cwd is refused', async () => {
    fs.symlinkSync(outside, path.join(proj, 'out-link'));
    const res = await write({ path: 'out-link/escaped.txt', content: 'pwned' });
    expect(res.isError).toBe(true);
    expect(fs.existsSync(path.join(outside, 'escaped.txt'))).toBe(false);
  });

  test('a directory symlink pointing into .git is refused', async () => {
    fs.symlinkSync(path.join(proj, '.git', 'hooks'), path.join(proj, 'hooks-link'));
    const res = await write({ path: 'hooks-link/pre-push', content: 'pwned' });
    expect(res.isError).toBe(true);
    expect(fs.existsSync(path.join(proj, '.git', 'hooks', 'pre-push'))).toBe(false);
  });

  test('a file symlink pointing outside cwd is refused', async () => {
    const victim = path.join(outside, 'victim.txt');
    fs.writeFileSync(victim, 'safe');
    fs.symlinkSync(victim, path.join(proj, 'victim-link'));
    const res = await write({ path: 'victim-link', content: 'pwned' });
    expect(res.isError).toBe(true);
    expect(fs.readFileSync(victim, 'utf-8')).toBe('safe');
  });

  test('a normal write inside cwd still works, creating directories', async () => {
    const res = await write({ path: 'src/deep/new.txt', content: 'ok' });
    expect(res.isError).toBeFalsy();
    expect(fs.readFileSync(path.join(proj, 'src', 'deep', 'new.txt'), 'utf-8')).toBe('ok');
  });
});

describe('faf_write advertises what it does', () => {
  test('destructiveHint: true and the description names the guards', async () => {
    const { tools } = await client.listTools();
    const t = tools.find((x) => x.name === 'faf_write');
    expect(t).toBeDefined();
    expect(t!.annotations?.destructiveHint).toBe(true);
    expect(t!.description).toContain('.faf-dna');
    expect(t!.description).toContain('overwrite: true');
    expect((t!.inputSchema as any).properties.overwrite.type).toBe('boolean');
  });
});
