/**
 * 🏎️ CheckID — meta-stamp index-check (1.5 MVP)
 *
 * Mechanical cross-check across meta-stamps in `.faf` / `.fafm` / package.json /
 * CHANGELOG / README. Surfaces contradictions between **stamped state** and
 * **live content** — closes the gap that `bi-sync` can't catch
 * ([[faf-sync-must-be-content-aware-not-handshake]]).
 *
 * This is the FAF-substrate analog of Doc Gate 101 (the version-stamp
 * consistency check in pubpro) — mechanical, falsifiable, refuses to skim.
 *
 * Pure function. No FS. No MCP. Deterministic — same inputs → same output
 * (the report shape carries no wall-clock fields).
 *
 * SIGNATURE NOTE: the spec'd signature was `(faf, fafm?)`. Extended additively
 * with an optional `refs` arg to enable the package.json / CHANGELOG / README
 * checks the spec body explicitly describes as examples. 2-arg callers still
 * work; passing `refs` unlocks the full check set.
 *
 * Spec source:
 *   ~/PLANET-FAF/docs/GROK-FAF-MCP-1.5-CODING-SESSION-BREAKDOWN-2026-05-30.md §#11
 *   memory/faf-sync-must-be-content-aware-not-handshake.md
 *   memory/silent-drift-equals-fail-equals-forbidden.md
 *   memory/zig-cant-fake.md   (mechanical-verify beats trust)
 */

import YAML from 'yaml';

/** A single mechanical contradiction. Every field is required — Falsifiability. */
export interface Contradiction {
  /** Stable check ID — see CHECKS table below. Used by callers to filter / dedupe. */
  check: string;
  /** `'error'` = stamp-of-record disagrees with reality; `'warn'` = softer disagreement. */
  severity: 'error' | 'warn';
  /** Human-readable location — e.g. `"CHANGELOG.md:meta-stamp"`. */
  location: string;
  /** What this check expected to find. */
  expected: string;
  /** What was actually present. */
  found: string;
  /** Short one-line explanation suitable for surfacing in a report. */
  message: string;
}

export interface ContradictionReport {
  /** Contradictions detected. Empty = clean across all checks that ran. */
  contradictions: Contradiction[];
  /** Check IDs that actually ran (required inputs were present). */
  checked: string[];
  /** Check IDs that were skipped (a required input was missing). */
  skipped: string[];
}

/** Optional external content for cross-checks beyond `.faf` + `.fafm`. */
export interface ReferenceClaims {
  /** Raw `package.json` content. */
  packageJson?: string;
  /** Raw `CHANGELOG.md` content. */
  changelog?: string;
  /** Raw `README.md` content. */
  readme?: string;
}

// ── Internal extraction helpers ────────────────────────────────────────────

// Match a semver, optionally `v`-prefixed. `\b` before the optional `v` so a
// bare "1.2.3" also matches (start-of-string or preceding non-word), but the
// `v1.2.3` form is handled because `\b` between space and `v` is honest (the
// naive `\b(\d+...)` form fails on `v1.2.3` since `v`→`1` is word-to-word, NOT
// a word boundary).
const SEMVER_RE = /\bv?(\d+\.\d+\.\d+(?:[-+][\w.-]+)?)\b/;
const CHANGELOG_META_RE = /latest=v(\d+\.\d+\.\d+(?:[-+][\w.-]+)?)/;
const CHANGELOG_TOP_HEADER_RE = /^##\s*\[(\d+\.\d+\.\d+(?:[-+][\w.-]+)?)\]/m;
// README arch-tree pattern: `<package-name> vX.Y.Z` (matches Doc Gate 101 exactly).
function readmeArchVersion(readme: string, packageName: string): string | undefined {
  // Escape regex metacharacters in the package name (npm names allow `-`, `_`, `@`, `/`).
  const escaped = packageName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp(`${escaped}\\s+v(\\d+\\.\\d+\\.\\d+(?:[-+][\\w.-]+)?)`);
  const m = readme.match(re);
  return m?.[1];
}

function safeParseYaml(content: string): unknown {
  try {
    return YAML.parse(content);
  } catch {
    return undefined;
  }
}

function safeParseJson(content: string): unknown {
  try {
    return JSON.parse(content);
  } catch {
    return undefined;
  }
}

/** Pull a semver string out of an arbitrary text fragment (e.g. `"current v1.4.9"` → `"1.4.9"`). */
function extractVersion(text: unknown): string | undefined {
  if (typeof text !== 'string') return undefined;
  const m = text.match(SEMVER_RE);
  return m?.[1];
}

// ── Public API ─────────────────────────────────────────────────────────────

/**
 * Run mechanical meta-stamp contradiction checks across the FAF substrate.
 *
 * Inputs are content strings, not paths — the caller decides what to provide.
 * Every check requires specific inputs; if an input is missing, the check is
 * recorded under `skipped` rather than failing silently.
 *
 * Returns a structured report. Empty `contradictions` array means every check
 * that ran agreed — NOT silent-null, because the caller deserves to see which
 * checks were even possible given what was provided.
 */
export function checkId(
  faf: string,
  fafm?: string,
  refs: ReferenceClaims = {},
): ContradictionReport {
  const contradictions: Contradiction[] = [];
  const checked: string[] = [];
  const skipped: string[] = [];

  const fafDoc = safeParseYaml(faf);
  const fafmDoc = fafm !== undefined ? safeParseYaml(fafm) : undefined;
  const pkgDoc = refs.packageJson !== undefined ? safeParseJson(refs.packageJson) : undefined;

  const pkgVersion: string | undefined = (pkgDoc as { version?: unknown })?.version as
    | string
    | undefined;
  const pkgName: string | undefined = (pkgDoc as { name?: unknown })?.name as string | undefined;

  // ── C1: .faf.human_context.when version ↔ package.json.version ──────────
  // Catches the "current v1.3.1 / actually v1.4.9" silent-drift pattern that
  // motivated [[faf-sync-must-be-content-aware-not-handshake]].
  if (pkgVersion !== undefined) {
    // `checked` means "the check actually ran" — we had its required inputs,
    // we looked, and we reached a conclusion (positive or negative). Absence
    // of a version inside human_context.when is a CLEAN conclusion (nothing
    // to contradict), not a skip.
    checked.push('c1-faf-when-vs-pkg');
    const when = (fafDoc as { human_context?: { when?: unknown } })?.human_context?.when;
    const fafVersion = extractVersion(when);
    if (fafVersion !== undefined && fafVersion !== pkgVersion) {
      contradictions.push({
        check: 'c1-faf-when-vs-pkg',
        severity: 'error',
        location: '.faf:human_context.when ↔ package.json:version',
        expected: pkgVersion,
        found: fafVersion,
        message: `.faf:human_context.when carries version ${fafVersion}, but package.json is at ${pkgVersion}. Sync's stamped, content is stale.`,
      });
    }
  } else {
    skipped.push('c1-faf-when-vs-pkg');
  }

  // ── C2: CHANGELOG `latest=vX.Y.Z` ↔ topmost `## [X.Y.Z]` (Doc Gate 101) ─
  if (refs.changelog !== undefined) {
    checked.push('c2-changelog-meta-vs-top');
    const meta = refs.changelog.match(CHANGELOG_META_RE)?.[1];
    const top = refs.changelog.match(CHANGELOG_TOP_HEADER_RE)?.[1];
    if (meta !== undefined && top !== undefined && meta !== top) {
      contradictions.push({
        check: 'c2-changelog-meta-vs-top',
        severity: 'error',
        location: 'CHANGELOG.md:meta-stamp ↔ CHANGELOG.md:topmost ## [X.Y.Z]',
        expected: top,
        found: meta,
        message: `CHANGELOG meta-stamp says latest=v${meta} but the topmost entry is ## [${top}]. Doc Gate 101 contradiction.`,
      });
    }
  } else {
    skipped.push('c2-changelog-meta-vs-top');
  }

  // ── C3: CHANGELOG topmost ↔ package.json.version ────────────────────────
  if (refs.changelog !== undefined && pkgVersion !== undefined) {
    checked.push('c3-changelog-top-vs-pkg');
    const top = refs.changelog.match(CHANGELOG_TOP_HEADER_RE)?.[1];
    if (top !== undefined && top !== pkgVersion) {
      contradictions.push({
        check: 'c3-changelog-top-vs-pkg',
        severity: 'error',
        location: 'CHANGELOG.md:topmost ## [X.Y.Z] ↔ package.json:version',
        expected: pkgVersion,
        found: top,
        message: `CHANGELOG topmost entry is ## [${top}] but package.json is at ${pkgVersion}. Ship-time disagreement.`,
      });
    }
  } else {
    skipped.push('c3-changelog-top-vs-pkg');
  }

  // ── C4: README arch-tree `<name> vX.Y.Z` ↔ package.json.version ────────
  if (refs.readme !== undefined && pkgVersion !== undefined && pkgName !== undefined) {
    checked.push('c4-readme-arch-vs-pkg');
    const archVersion = readmeArchVersion(refs.readme, pkgName);
    if (archVersion !== undefined && archVersion !== pkgVersion) {
      contradictions.push({
        check: 'c4-readme-arch-vs-pkg',
        severity: 'error',
        location: 'README.md:arch-tree ↔ package.json:version',
        expected: pkgVersion,
        found: archVersion,
        message: `README arch-tree shows ${pkgName} v${archVersion} but package.json is at ${pkgVersion}.`,
      });
    }
  } else {
    skipped.push('c4-readme-arch-vs-pkg');
  }

  // ── C5: .fafm.namepoint version ↔ package.json.version ─────────────────
  // .fafm namepoints look like "@grok-faf-mcp:1.5" — the trailing fragment after
  // the colon is the version generation. WARN (not error) because namepoint
  // versions are minor/major lines, not patch — a 1.5-line .fafm SHOULDN'T be
  // expected to track every 1.5.x bump on the package.
  if (fafmDoc !== undefined && pkgVersion !== undefined) {
    checked.push('c5-fafm-namepoint-vs-pkg');
    const namepoint = (fafmDoc as { namepoint?: unknown })?.namepoint;
    if (typeof namepoint === 'string') {
      const colonIdx = namepoint.lastIndexOf(':');
      const fafmGen = colonIdx >= 0 ? namepoint.slice(colonIdx + 1) : undefined;
      if (fafmGen !== undefined && /^\d+\.\d+$/.test(fafmGen)) {
        const pkgGen = pkgVersion.split('.').slice(0, 2).join('.');
        if (fafmGen !== pkgGen) {
          contradictions.push({
            check: 'c5-fafm-namepoint-vs-pkg',
            severity: 'warn',
            location: '.fafm:namepoint ↔ package.json:version',
            expected: pkgGen,
            found: fafmGen,
            message: `.fafm namepoint pins generation ${fafmGen} but package.json is in the ${pkgGen} line. The .fafm may be stale relative to the current generation.`,
          });
        }
      }
    }
  } else {
    skipped.push('c5-fafm-namepoint-vs-pkg');
  }

  return { contradictions, checked, skipped };
}
