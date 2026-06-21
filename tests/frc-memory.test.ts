/**
 * FRC portable-memory surface (Phase III · §4) — structured query over .fafm.
 *
 * The structured upgrade to a hand-maintained GROK.md: select durable facts by
 * type/tag/priority/text. ⚠️ Doctrine pinned by these tests: .fafm is NOT scored
 * — selection ≠ ranking; provenance (confidence_score/verification_status) is
 * surfaced as-is, never turned into a quality verdict.
 */
import { describe, it, expect } from 'bun:test';
import { parseFafm, selectFacts, summarizeMemory } from '../src/frc/memory';

const RAW = `version: "1.1"
profile: "knowledge"
namepoint: "@grok-faf-mcp:1.6"
retention: "forever"
index:
  - "fafm-not-about-scoring — load-bearing doctrine"
  - "build-precedent — Grok WHAT · wolfejam HOW"
memory:
  facts:
    - text: "FAFm is NOT about scoring. Memories are not graded."
      id: "fafm-not-scoring"
      type: "feedback"
      priority: "critical"
      tags: ["doctrine", "format", "scoring"]
      source: "wolfejam"
      timestamp: "2026-05-30T17:37:31Z"
      confidence_score: 1.0
      verification_status: "verified"
    - text: "Build precedent: Grok defines WHAT, wolfejam builds HOW."
      id: "build-precedent"
      type: "feedback"
      priority: "high"
      tags: ["doctrine", "process"]
      confidence_score: 1.0
      verification_status: "verified"
    - text: "See MEMORY-FORMAT.md for the .fafm spec."
      id: "spec-ref"
      type: "reference"
      priority: "standard"
      tags: ["spec"]
`;

const fafm = parseFafm(RAW);

describe('FRC memory — parseFafm', () => {
  it('parses header + facts, mapping provenance to camelCase (kept as provenance)', () => {
    expect(fafm.version).toBe('1.1');
    expect(fafm.profile).toBe('knowledge');
    expect(fafm.facts.length).toBe(3);
    const f = fafm.facts[0];
    expect(f.type).toBe('feedback');
    expect(f.tags).toEqual(['doctrine', 'format', 'scoring']);
    expect(f.confidenceScore).toBe(1.0); // provenance, NOT a score we compute
    expect(f.verificationStatus).toBe('verified');
  });

  it('captures the index lines', () => {
    expect(fafm.index.length).toBe(2);
    expect(fafm.index[0]).toContain('fafm-not-about-scoring');
  });

  it('throws on non-object YAML', () => {
    expect(() => parseFafm('- a\n- b')).toThrow('did not parse to an object');
  });

  it('tolerates a .fafm with no memory/facts', () => {
    const empty = parseFafm('version: "1.0"\nprofile: "x"');
    expect(empty.facts).toEqual([]);
    expect(empty.index).toEqual([]);
  });
});

describe('FRC memory — selectFacts (selection, NOT ranking)', () => {
  it('empty selector returns all facts in document order', () => {
    const r = selectFacts(fafm);
    expect(r.length).toBe(3);
    expect(r[0].id).toBe('fafm-not-scoring');
    expect(r[2].id).toBe('spec-ref'); // order preserved, no reordering by "relevance"
  });

  it('filters by type (case-insensitive)', () => {
    expect(selectFacts(fafm, { type: 'feedback' }).length).toBe(2);
    expect(selectFacts(fafm, { type: 'FEEDBACK' }).length).toBe(2);
    expect(selectFacts(fafm, { type: 'reference' }).length).toBe(1);
  });

  it('filters by tag and by priority', () => {
    expect(selectFacts(fafm, { tag: 'doctrine' }).length).toBe(2);
    expect(selectFacts(fafm, { priority: 'critical' }).length).toBe(1);
  });

  it('filters by text substring (case-insensitive)', () => {
    const r = selectFacts(fafm, { query: 'scoring' });
    expect(r.length).toBe(1);
    expect(r[0].id).toBe('fafm-not-scoring');
  });

  it('combines filters as AND', () => {
    expect(selectFacts(fafm, { type: 'feedback', priority: 'high' }).length).toBe(1);
    expect(selectFacts(fafm, { type: 'reference', tag: 'doctrine' }).length).toBe(0);
  });

  it('is deterministic — same selector, same result', () => {
    const sel = { type: 'feedback' };
    expect(selectFacts(fafm, sel)).toEqual(selectFacts(fafm, sel));
  });
});

describe('FRC memory — summarizeMemory (structured shape, no grades)', () => {
  it('counts by type and priority, collects sorted tag vocabulary + index', () => {
    const s = summarizeMemory(fafm);
    expect(s.totalFacts).toBe(3);
    expect(s.byType).toEqual({ feedback: 2, reference: 1 });
    expect(s.byPriority).toEqual({ critical: 1, high: 1, standard: 1 });
    expect(s.tags).toEqual(['doctrine', 'format', 'process', 'scoring', 'spec']); // sorted, deduped
    expect(s.index.length).toBe(2);
    // No "score" / "quality" field anywhere — .fafm is not graded.
    expect((s as any).score).toBeUndefined();
  });
});
