/**
 * FRC structure-aware retrieval (Phase III · §2) — the answer to OBS-6.
 *
 * Grok Collections chunks blindly (~1024 tokens, structure-blind) — at scale it
 * FLATTENS a `.faf`, splitting `stack` from `human_context`, severing the
 * relationships that make the context worth anything. This module is the other
 * half of the hybrid Grok himself proposed: FAF returns EXACT, WHOLE `.faf`
 * sections by path — structure preserved, relationships intact, deterministic.
 *
 * Public + de-faffed: this is mechanical path-precise extraction (parse → resolve
 * dotted path → return the whole subtree). The retrieval *ranking / weighted
 * depth* — which section matters most, how to fuse structure with semantic
 * search — is the PRIVATE engine and is deliberately NOT here.
 *
 * Composition seam (hybrid): the §4.1 CollectionsClient finds WHICH sections are
 * relevant (semantic); this returns them WHOLE and EXACT (structural). The fusion
 * ranking is the moat — kept out of this module on purpose.
 *
 * Flag-gated as the FRC module (frcEnabled, OFF by default; cf. USE_ZEPH).
 */

import YAML from 'yaml';

export interface SectionResult {
  /** The dotted path requested, e.g. "stack.backend" or "human_context". */
  path: string;
  /** True when the path resolved to an existing node. */
  found: boolean;
  /** The raw value at the path (scalar, object, or array) — structure preserved. */
  value: unknown;
  /** The subtree re-serialized as YAML (whole section, relationships intact). */
  yaml: string;
  /** True when the resolved node is a branch (object/array), false for a leaf scalar. */
  isBranch: boolean;
}

/** Parse a raw `.faf` (YAML) into a plain object. Throws on malformed YAML. */
export function parseFaf(raw: string): Record<string, unknown> {
  const doc = YAML.parse(raw);
  if (doc === null || typeof doc !== 'object' || Array.isArray(doc)) {
    throw new Error('parseFaf: .faf did not parse to an object');
  }
  return doc as Record<string, unknown>;
}

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

/**
 * Enumerate every dotted path in a `.faf` — branches AND leaves — so retrieval
 * is discoverable (you can list before you get). Deterministic order (depth-first,
 * key order as written). Arrays are treated as leaves (returned whole).
 */
export function listSections(faf: Record<string, unknown>): string[] {
  const paths: string[] = [];
  const walk = (node: Record<string, unknown>, prefix: string): void => {
    for (const key of Object.keys(node)) {
      const path = prefix ? `${prefix}.${key}` : key;
      paths.push(path);
      const child = node[key];
      if (isPlainObject(child)) walk(child, path);
    }
  };
  walk(faf, '');
  return paths;
}

/**
 * Resolve a dotted path to its EXACT subtree — path-precise, structure-preserving.
 * "stack" → the whole stack object; "stack.backend" → the backend value;
 * "human_context" → all six W's as one coherent block. Relationships intact.
 */
export function getSection(faf: Record<string, unknown>, path: string): SectionResult {
  const segments = path.split('.').map((s) => s.trim()).filter(Boolean);
  if (segments.length === 0) {
    return { path, found: false, value: undefined, yaml: '', isBranch: false };
  }

  let node: unknown = faf;
  for (const seg of segments) {
    if (!isPlainObject(node) || !(seg in node)) {
      return { path, found: false, value: undefined, yaml: '', isBranch: false };
    }
    node = node[seg];
  }

  const isBranch = isPlainObject(node) || Array.isArray(node);
  // Serialize the subtree as a standalone YAML block (whole section, not flattened).
  const yamlOut = isBranch
    ? YAML.stringify(node).trimEnd()
    : YAML.stringify({ [segments[segments.length - 1]]: node }).trimEnd();

  return { path, found: true, value: node, yaml: yamlOut, isBranch };
}

/**
 * Convenience: resolve several paths at once, in order. Missing paths come back
 * with found=false rather than throwing — the caller decides what to do.
 */
export function getSections(faf: Record<string, unknown>, paths: string[]): SectionResult[] {
  return paths.map((p) => getSection(faf, p));
}
