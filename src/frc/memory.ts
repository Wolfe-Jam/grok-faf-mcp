/**
 * FRC portable-memory surface (Phase III · §4) — the structured upgrade to GROK.md.
 *
 * The wedge Grok named: experienced users hand-maintain `AGENTS.md`/`GROK.md` to
 * compensate for the lack of real memory. FAF already auto-generates `GROK.md`
 * (OBS-2) AND keeps the durable model in `.fafm` (decisions/invariants/
 * conventions/WHY). This module makes that memory STRUCTURED and QUERYABLE —
 * select facts by type/tag/priority/text — instead of a flat markdown blob you
 * scroll. Portable across sessions/tools/teammates (the FAFHub direction).
 *
 * ⚠️ LOAD-BEARING DOCTRINE (etched in the .fafm itself): `.fafm` is NOT scored.
 * Memories are not graded. `confidence_score`/`verification_status` are
 * PROVENANCE (witness data), NOT score components. This module SELECTS and
 * RETURNS facts — it never ranks, grades, or invents a quality number for them.
 * (Selection ≠ scoring. The "scored project model" in scope is `.faf`, not `.fafm`.)
 *
 * Complements (does not replace) `refresh_fafm` — that RE-DELIVERS the memory;
 * this gives a structured query/filter over the facts. Flag-gated FRC (off by
 * default, cf. USE_ZEPH / faf_gate / faf_section).
 */

import YAML from 'yaml';

/** One memory fact. Provenance fields are witness data, NOT a score. */
export interface MemoryFact {
  text: string;
  id?: string;
  type?: string;
  priority?: string;
  tags: string[];
  source?: string;
  timestamp?: string;
  /** Provenance only — NOT a quality score. */
  confidenceScore?: number;
  /** Provenance only — NOT a verdict we compute. */
  verificationStatus?: string;
}

export interface FafmDoc {
  version?: string;
  profile?: string;
  namepoint?: string;
  retention?: string;
  /** Human-readable "slug — hook" lines. */
  index: string[];
  facts: MemoryFact[];
}

export interface FactSelector {
  /** Exact fact type, case-insensitive (e.g. "feedback", "reference"). */
  type?: string;
  /** A tag the fact must carry, case-insensitive. */
  tag?: string;
  /** Exact priority, case-insensitive (e.g. "critical", "high"). */
  priority?: string;
  /** Case-insensitive substring match against fact text. */
  query?: string;
}

function asArray<T = unknown>(v: unknown): T[] {
  return Array.isArray(v) ? (v as T[]) : [];
}

function normalizeFact(raw: Record<string, unknown>): MemoryFact {
  const tags = asArray(raw.tags).map((t) => String(t));
  const fact: MemoryFact = {
    text: typeof raw.text === 'string' ? raw.text.trim() : String(raw.text ?? ''),
    tags,
  };
  if (raw.id !== undefined) fact.id = String(raw.id);
  if (raw.type !== undefined) fact.type = String(raw.type);
  if (raw.priority !== undefined) fact.priority = String(raw.priority);
  if (raw.source !== undefined) fact.source = String(raw.source);
  if (raw.timestamp !== undefined) fact.timestamp = String(raw.timestamp);
  if (typeof raw.confidence_score === 'number') fact.confidenceScore = raw.confidence_score;
  if (raw.verification_status !== undefined) fact.verificationStatus = String(raw.verification_status);
  return fact;
}

/** Parse a raw `.fafm` (YAML) into a structured doc. Throws on malformed YAML. */
export function parseFafm(raw: string): FafmDoc {
  const doc = YAML.parse(raw);
  if (doc === null || typeof doc !== 'object' || Array.isArray(doc)) {
    throw new Error('parseFafm: .fafm did not parse to an object');
  }
  const d = doc as Record<string, unknown>;
  const memory = (d.memory ?? {}) as Record<string, unknown>;
  const facts = asArray<Record<string, unknown>>(memory.facts).map(normalizeFact);
  const out: FafmDoc = {
    index: asArray(d.index).map((s) => String(s)),
    facts,
  };
  if (d.version !== undefined) out.version = String(d.version);
  if (d.profile !== undefined) out.profile = String(d.profile);
  if (d.namepoint !== undefined) out.namepoint = String(d.namepoint);
  if (d.retention !== undefined) out.retention = String(d.retention);
  return out;
}

/**
 * Select facts by metadata — deterministic AND filter, document order preserved.
 * This is selection, NOT ranking: no relevance score, no reordering. Empty
 * selector returns all facts.
 */
export function selectFacts(fafm: FafmDoc, selector: FactSelector = {}): MemoryFact[] {
  const type = selector.type?.toLowerCase();
  const tag = selector.tag?.toLowerCase();
  const priority = selector.priority?.toLowerCase();
  const query = selector.query?.toLowerCase();

  return fafm.facts.filter((f) => {
    if (type && (f.type?.toLowerCase() ?? '') !== type) return false;
    if (priority && (f.priority?.toLowerCase() ?? '') !== priority) return false;
    if (tag && !f.tags.some((t) => t.toLowerCase() === tag)) return false;
    if (query && !f.text.toLowerCase().includes(query)) return false;
    return true;
  });
}

export interface MemorySummary {
  totalFacts: number;
  byType: Record<string, number>;
  byPriority: Record<string, number>;
  tags: string[];
  index: string[];
}

/** Structured shape of the memory — counts by type/priority + the tag vocabulary + index. */
export function summarizeMemory(fafm: FafmDoc): MemorySummary {
  const byType: Record<string, number> = {};
  const byPriority: Record<string, number> = {};
  const tagSet = new Set<string>();
  for (const f of fafm.facts) {
    const t = f.type ?? 'untyped';
    byType[t] = (byType[t] ?? 0) + 1;
    const p = f.priority ?? 'unset';
    byPriority[p] = (byPriority[p] ?? 0) + 1;
    f.tags.forEach((tag) => tagSet.add(tag));
  }
  return {
    totalFacts: fafm.facts.length,
    byType,
    byPriority,
    tags: Array.from(tagSet).sort(),
    index: fafm.index,
  };
}
