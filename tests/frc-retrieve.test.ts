/**
 * FRC structure-aware retrieval (Phase III · §2) — the answer to OBS-6.
 *
 * Collections chunks blindly and flattens a .faf; this returns EXACT, WHOLE
 * sections by path with structure intact. Deterministic, no LLM. These tests pin
 * path resolution, the whole-subtree (relationship-preserving) guarantee, and
 * discoverability.
 */
import { describe, it, expect } from 'bun:test';
import { parseFaf, listSections, getSection, getSections } from '../src/frc/retrieve';

const RAW = `faf_version: "3.0"
project:
  name: grok-faf-mcp
  goal: persistent context for Grok
stack:
  backend: MCP SDK (TS)
  runtime: Node.js
  hosting: Cloudflare Workers
human_context:
  who: Developers using Grok
  what: First MCP for Grok
  why: Every AI session starts from zero
tags:
  - mcp
  - faf
`;

const faf = parseFaf(RAW);

describe('FRC retrieve — parseFaf', () => {
  it('parses a .faf to an object', () => {
    expect(faf.faf_version).toBe('3.0');
    expect((faf.project as any).name).toBe('grok-faf-mcp');
  });

  it('throws on YAML that is not an object', () => {
    expect(() => parseFaf('- just\n- a\n- list')).toThrow('did not parse to an object');
  });
});

describe('FRC retrieve — getSection (path-precise, structure preserved)', () => {
  it('returns a WHOLE branch with relationships intact (human_context = all six-ish Ws together)', () => {
    const r = getSection(faf, 'human_context');
    expect(r.found).toBe(true);
    expect(r.isBranch).toBe(true);
    expect(r.value).toEqual({
      who: 'Developers using Grok',
      what: 'First MCP for Grok',
      why: 'Every AI session starts from zero',
    });
    // the YAML keeps the section coherent (not flattened across a chunk boundary)
    expect(r.yaml).toContain('who:');
    expect(r.yaml).toContain('why: Every AI session starts from zero');
  });

  it('resolves a nested leaf path exactly', () => {
    const r = getSection(faf, 'stack.backend');
    expect(r.found).toBe(true);
    expect(r.isBranch).toBe(false);
    expect(r.value).toBe('MCP SDK (TS)');
    // leaf is serialized with its key for context
    expect(r.yaml).toContain('backend: MCP SDK (TS)');
  });

  it('returns arrays whole (treated as a leaf section)', () => {
    const r = getSection(faf, 'tags');
    expect(r.found).toBe(true);
    expect(r.value).toEqual(['mcp', 'faf']);
  });

  it('found=false for a missing path (no throw)', () => {
    const r = getSection(faf, 'stack.database');
    expect(r.found).toBe(false);
    expect(r.value).toBeUndefined();
    expect(r.yaml).toBe('');
  });

  it('found=false for a path that descends into a leaf', () => {
    const r = getSection(faf, 'stack.backend.nope');
    expect(r.found).toBe(false);
  });

  it('empty / whitespace path → not found, no throw', () => {
    expect(getSection(faf, '').found).toBe(false);
    expect(getSection(faf, '   ').found).toBe(false);
  });

  it('is deterministic — same path, same result', () => {
    expect(getSection(faf, 'stack')).toEqual(getSection(faf, 'stack'));
  });
});

describe('FRC retrieve — listSections (discover before you get)', () => {
  it('enumerates branches AND leaves, depth-first in written order', () => {
    const paths = listSections(faf);
    expect(paths).toContain('stack');
    expect(paths).toContain('stack.backend');
    expect(paths).toContain('human_context.why');
    // branch listed before its children
    expect(paths.indexOf('stack')).toBeLessThan(paths.indexOf('stack.backend'));
  });

  it('every listed path resolves with getSection (list ⇒ get round-trips)', () => {
    for (const p of listSections(faf)) {
      expect(getSection(faf, p).found).toBe(true);
    }
  });
});

describe('FRC retrieve — getSections (batch)', () => {
  it('resolves several paths in order; missing come back found=false', () => {
    const rs = getSections(faf, ['stack.runtime', 'stack.missing', 'project.name']);
    expect(rs.map((r) => r.found)).toEqual([true, false, true]);
    expect(rs[0].value).toBe('Node.js');
    expect(rs[2].value).toBe('grok-faf-mcp');
  });
});
