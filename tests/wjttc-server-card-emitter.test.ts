import { describe, test, expect } from 'bun:test';
import { execFileSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

// WJTTC — the server.json identity emitter (faf-cli's `faf server-card`).
//
// server.json's identity half (name + title + the one.faf/context _meta block)
// MUST be composed from faf-cli, never hand-authored (compose-not-fork). grok's
// display title flows project.title -> `faf server-card` -> server.json — the
// SAME single source claude uses (no per-repo emitter fork). This suite proves
// the command reproduces the live server.json idempotently, so a release can
// regenerate it without drift.

const ROOT = path.join(__dirname, '..');
const KEY = 'io.modelcontextprotocol.registry/publisher-provided';
const FAF = path.join(ROOT, 'node_modules', 'faf-cli', 'dist', 'cli.js');

function emit(args: string[] = []): Record<string, any> {
  const out = execFileSync('node', [FAF, 'server-card', '--check', ...args], {
    cwd: ROOT,
    encoding: 'utf-8',
  });
  return JSON.parse(out);
}
const live = (): Record<string, any> =>
  JSON.parse(fs.readFileSync(path.join(ROOT, 'server.json'), 'utf-8'));

describe('BRAKE — identity is emitted + idempotent', () => {
  test('B1 — emitted server.json reproduces the live file EXACTLY (no drift)', () => {
    expect(emit()).toEqual(live());
  });

  test('B2 — name is the emitted one.faf/* identity (never io.faf, never hand-typed)', () => {
    const s = emit();
    expect(s.name).toBe('one.faf/grok-faf-mcp');
    expect(s.name.startsWith('one.faf/')).toBe(true);
    expect(s.name).not.toContain('io.faf');
  });

  test('B3 — title is the emitted display name, sourced from project.title (not hand-edited)', () => {
    expect(emit().title).toBe('Grok FAF');
  });

  test('B4 — the one.faf/context _meta block is emitted, well-formed', () => {
    const ctx = emit()._meta[KEY]['one.faf/context'];
    expect(ctx.faf).toBe('./project.faf');
    expect(ctx.mediaType).toBe('application/vnd.faf+yaml');
    expect(ctx.iana).toContain('iana.org');
    expect(ctx.deterministic).toBe(true);
    expect(typeof ctx.generated).toBe('string');
  });

  test('B5 — --generated overrides the context timestamp (release input)', () => {
    const s = emit(['--generated', '2099-01-01T00:00:00.000Z']);
    expect(s._meta[KEY]['one.faf/context'].generated).toBe('2099-01-01T00:00:00.000Z');
  });
});
