/**
 * Version-stamp guard — regression test for #136.
 *
 * #136: the hero banner (assets/grok-faf-mcp-hero.png), hotlinked from `main`,
 * had "v1.5.1 · 14 MCP TOOLS" drawn on it. That number was never an authoritative
 * version record — just decorative text — but npm & Glama RENDER the README, so the
 * embedded image made them display a stale version with no republish.
 *
 * The rule this enforces: the product version reaches any npm/Glama-facing surface
 * ONLY through live, auto-deriving sources — package.json -> the live npm badge —
 * never a hand-typed stamp. The banner art carries NO version, so there are no
 * pixels to test; this guard just forbids a static version stamp on the README's
 * own text (H1 + banner reference), which is the same drift trap in text form.
 */
import { describe, test, expect } from 'bun:test';
import { readFileSync } from 'fs';
import { join } from 'path';

const root = join(import.meta.dir, '..');
const readme = readFileSync(join(root, 'README.md'), 'utf8');
const lines = readme.split('\n');

const SEMVER = /\bv?\d+\.\d+\.\d+\b/;

describe('🏁 version-stamp guard (#136)', () => {
  test('README H1 carries no hand-typed version stamp (was "...Edition v1.5.1")', () => {
    const h1 = lines.find((l) => /^#\s+grok-faf-mcp/.test(l)) ?? '';
    expect(h1).not.toMatch(SEMVER);
  });

  test('version is shown to npm via the LIVE npm badge (auto-derives from package.json)', () => {
    expect(readme).toContain('img.shields.io/npm/v/grok-faf-mcp');
  });

  test('hero banner is hotlinked from /main/ and version-less by filename', () => {
    const hero = lines.find((l) => l.includes('grok-faf-mcp-hero')) ?? '';
    expect(hero).toContain('/main/assets/grok-faf-mcp-hero.png');
    expect(hero).not.toMatch(/hero[-_]?v?\d+\.\d+/i); // no version in the asset name
  });
});
