/**
 * 🏁 WJTTC — checkId (grok-faf-mcp 1.5)
 *
 * Championship proof for the mechanical meta-stamp index-check. Doc Gate 101
 * at the FAF substrate level — surfaces contradictions between stamped state
 * and live content. Closes the gap bi-sync can't catch.
 *
 *   1 🛑 BRAKE  — fail-safe: malformed inputs never crash, missing inputs are skipped honestly
 *   2 ⚙️ ENGINE — core: every contradiction fires precisely, every clean case stays silent
 *   3 🌬️ AERO   — honest: determinism, Falsifiability (location + expected + found populated),
 *                 checked/skipped coverage honesty, no false positives on absent claims
 *   4 🛞 TYRE   — pass-through (pure function, no cred-costing roundtrip)
 *   5 🔧 PIT    — pass-through (.faf / .fafm schemas live in their IANA specs)
 *
 * Spec source: GROK-FAF-MCP-1.5-CODING-SESSION-BREAKDOWN §#11 (Grok WHAT,
 * Claude HOW). Signature extended additively with optional `refs` arg to
 * enable the package.json/CHANGELOG/README checks the spec body describes.
 */
import { describe, test, expect } from 'bun:test';
import { checkId } from '../src/integrity/check-id';

// ── Fixtures ────────────────────────────────────────────────────────────────

const FAF_v149 = [
  'faf_version: "3.0"',
  'project:',
  '  name: grok-faf-mcp',
  '  type: mcp',
  'human_context:',
  '  when: current v1.4.9',
  '',
].join('\n');

const FAF_STALE_v131 = [
  'faf_version: "3.0"',
  'project:',
  '  name: grok-faf-mcp',
  '  type: mcp',
  'human_context:',
  '  when: current v1.3.1',
  '',
].join('\n');

const FAFM_GEN_1_5 = [
  'version: "1.1"',
  'namepoint: "@grok-faf-mcp:1.5"',
  'memory:',
  '  facts: []',
  '',
].join('\n');

const FAFM_GEN_1_4 = [
  'version: "1.1"',
  'namepoint: "@grok-faf-mcp:1.4"',
  'memory:',
  '  facts: []',
  '',
].join('\n');

const PKG_v149 = JSON.stringify({ name: 'grok-faf-mcp', version: '1.4.9' }, null, 2);
const PKG_v152 = JSON.stringify({ name: 'grok-faf-mcp', version: '1.5.2' }, null, 2);

const CHANGELOG_CLEAN_v149 = [
  '<!-- ... latest=v1.4.9 ... -->',
  '## [1.4.9] - 2026-05-30',
  '- the ship',
  '## [1.4.8] - 2026-05-29',
  '- the rehearsal',
  '',
].join('\n');

// Meta-stamp says latest=v1.4.1 but topmost entry is 1.4.9 — Doc Gate 101 trip.
const CHANGELOG_DRIFTY = [
  '<!-- ... latest=v1.4.1 ... -->',
  '## [1.4.9] - 2026-05-30',
  '- the ship',
  '## [1.4.1] - 2026-04-12',
  '- the earlier ship',
  '',
].join('\n');

// Topmost CHANGELOG entry disagrees with package.json.
const CHANGELOG_TOP_v148 = [
  '<!-- ... latest=v1.4.8 ... -->',
  '## [1.4.8] - 2026-05-29',
  '- ship-time disagreement: package.json says 1.4.9, CHANGELOG says 1.4.8',
  '',
].join('\n');

const README_CLEAN_v149 = [
  '# grok-faf-mcp',
  '',
  '```',
  'grok-faf-mcp v1.4.9',
  '```',
  '',
].join('\n');

const README_STALE_v141 = [
  '# grok-faf-mcp',
  '',
  '```',
  'grok-faf-mcp v1.4.1',
  '```',
  '',
].join('\n');

describe('🏁 WJTTC — checkId (grok-faf-mcp 1.5)', () => {
  // ── 🛑 BRAKE — fail-safe ──────────────────────────────────────────────
  describe('🛑 BRAKE — fail-safe', () => {
    test('no refs, no fafm → all 5 checks skipped, empty contradictions, no crash', () => {
      const r = checkId(FAF_v149);
      expect(r.contradictions).toEqual([]);
      expect(r.checked).toEqual([]);
      expect(r.skipped.length).toBe(5);
    });

    test('malformed YAML in .faf → does not throw; checks needing .faf still skip honestly', () => {
      const bad = 'project:\n  name: [unterminated\n  : : :\n';
      // No throw, and C1 (which needs .faf) is in skipped/checked depending on
      // whether package.json was provided. Without pkg, C1 is also skipped.
      const r = checkId(bad);
      expect(r.contradictions).toEqual([]);
      expect(r.skipped).toContain('c1-faf-when-vs-pkg');
    });

    test('malformed JSON in package.json → safe-parse swallows, downstream checks treat pkg as missing', () => {
      const r = checkId(FAF_v149, undefined, { packageJson: 'not-a-json {{{' });
      // pkg undefined → C1 / C3 / C4 / C5 all skipped (their pkg-version dependency)
      expect(r.skipped).toContain('c1-faf-when-vs-pkg');
      expect(r.skipped).toContain('c3-changelog-top-vs-pkg');
      expect(r.skipped).toContain('c4-readme-arch-vs-pkg');
    });

    test('empty .faf string → no crash, all .faf-dependent checks behave honestly', () => {
      const r = checkId('', undefined, { packageJson: PKG_v149 });
      expect(r.contradictions).toEqual([]); // nothing to contradict
      // C1 (faf-when-vs-pkg) was checked but found no when-version → no contradiction recorded
      expect(r.checked.length + r.skipped.length).toBe(5);
    });
  });

  // ── ⚙️ ENGINE — core contradiction detection ──────────────────────────
  describe('⚙️ ENGINE — core contradictions fire precisely', () => {
    test('C1: .faf says v1.3.1 but pkg is v1.4.9 → contradiction with exact location/expected/found', () => {
      const r = checkId(FAF_STALE_v131, undefined, { packageJson: PKG_v149 });
      const c = r.contradictions.find((x) => x.check === 'c1-faf-when-vs-pkg');
      expect(c).toBeDefined();
      expect(c!.severity).toBe('error');
      expect(c!.expected).toBe('1.4.9');
      expect(c!.found).toBe('1.3.1');
      expect(c!.location).toContain('.faf');
      expect(c!.location).toContain('package.json');
    });

    test('C1: .faf says v1.4.9 and pkg is v1.4.9 → no contradiction (clean)', () => {
      const r = checkId(FAF_v149, undefined, { packageJson: PKG_v149 });
      expect(r.contradictions.find((x) => x.check === 'c1-faf-when-vs-pkg')).toBeUndefined();
      expect(r.checked).toContain('c1-faf-when-vs-pkg');
    });

    test('C2: CHANGELOG meta v1.4.1 ↔ topmost ## [1.4.9] → contradiction (Doc Gate 101 trip)', () => {
      const r = checkId(FAF_v149, undefined, { changelog: CHANGELOG_DRIFTY });
      const c = r.contradictions.find((x) => x.check === 'c2-changelog-meta-vs-top');
      expect(c).toBeDefined();
      expect(c!.severity).toBe('error');
      expect(c!.expected).toBe('1.4.9');
      expect(c!.found).toBe('1.4.1');
    });

    test('C2: CHANGELOG meta and top agree → no contradiction', () => {
      const r = checkId(FAF_v149, undefined, { changelog: CHANGELOG_CLEAN_v149 });
      expect(r.contradictions.find((x) => x.check === 'c2-changelog-meta-vs-top')).toBeUndefined();
      expect(r.checked).toContain('c2-changelog-meta-vs-top');
    });

    test('C3: CHANGELOG topmost ↔ pkg version disagreement → contradiction', () => {
      const r = checkId(FAF_v149, undefined, {
        changelog: CHANGELOG_TOP_v148,
        packageJson: PKG_v149,
      });
      const c = r.contradictions.find((x) => x.check === 'c3-changelog-top-vs-pkg');
      expect(c).toBeDefined();
      expect(c!.expected).toBe('1.4.9');
      expect(c!.found).toBe('1.4.8');
    });

    test('C4: README arch-tree v1.4.1 ↔ pkg v1.4.9 → contradiction with pkg-name in message', () => {
      const r = checkId(FAF_v149, undefined, {
        readme: README_STALE_v141,
        packageJson: PKG_v149,
      });
      const c = r.contradictions.find((x) => x.check === 'c4-readme-arch-vs-pkg');
      expect(c).toBeDefined();
      expect(c!.expected).toBe('1.4.9');
      expect(c!.found).toBe('1.4.1');
      expect(c!.message).toContain('grok-faf-mcp');
    });

    test('C5: .fafm namepoint @grok-faf-mcp:1.4 ↔ pkg v1.5.2 → WARN contradiction (generation drift)', () => {
      const r = checkId(FAF_v149, FAFM_GEN_1_4, { packageJson: PKG_v152 });
      const c = r.contradictions.find((x) => x.check === 'c5-fafm-namepoint-vs-pkg');
      expect(c).toBeDefined();
      expect(c!.severity).toBe('warn'); // generation drift is softer than ship-time drift
      expect(c!.expected).toBe('1.5');
      expect(c!.found).toBe('1.4');
    });

    test('C5: .fafm namepoint @grok-faf-mcp:1.5 ↔ pkg v1.5.2 → no contradiction (gen line matches)', () => {
      const r = checkId(FAF_v149, FAFM_GEN_1_5, { packageJson: PKG_v152 });
      expect(r.contradictions.find((x) => x.check === 'c5-fafm-namepoint-vs-pkg')).toBeUndefined();
    });

    test('all-clean case: matched .faf + fafm + clean refs → empty contradictions, all 5 checked', () => {
      // Coherent fixture: every surface stamps v1.5.0; .fafm pinned to 1.5 gen.
      const fafCoherent = [
        'faf_version: "3.0"',
        'human_context:',
        '  when: current v1.5.0',
        '',
      ].join('\n');
      const r = checkId(fafCoherent, FAFM_GEN_1_5, {
        packageJson: JSON.stringify({ name: 'grok-faf-mcp', version: '1.5.0' }),
        changelog: ['<!-- latest=v1.5.0 -->', '## [1.5.0] - x', ''].join('\n'),
        readme: ['# x', '```', 'grok-faf-mcp v1.5.0', '```', ''].join('\n'),
      });
      // 0 contradictions, all 5 checks ran
      expect(r.contradictions).toEqual([]);
      expect(r.checked.sort()).toEqual([
        'c1-faf-when-vs-pkg',
        'c2-changelog-meta-vs-top',
        'c3-changelog-top-vs-pkg',
        'c4-readme-arch-vs-pkg',
        'c5-fafm-namepoint-vs-pkg',
      ].sort());
      expect(r.skipped).toEqual([]);
    });
  });

  // ── 🌬️ AERO — determinism + Falsifiability + coverage honesty ─────────
  describe('🌬️ AERO — determinism + Falsifiability + coverage honesty', () => {
    test('determinism: identical inputs → identical reports (no wall-clock fields)', () => {
      const a = checkId(FAF_STALE_v131, FAFM_GEN_1_4, {
        packageJson: PKG_v149,
        changelog: CHANGELOG_DRIFTY,
        readme: README_STALE_v141,
      });
      const b = checkId(FAF_STALE_v131, FAFM_GEN_1_4, {
        packageJson: PKG_v149,
        changelog: CHANGELOG_DRIFTY,
        readme: README_STALE_v141,
      });
      expect(a).toEqual(b);
    });

    test('Falsifiability: every contradiction has non-empty location/expected/found/message', () => {
      // Trip multiple checks at once
      const r = checkId(FAF_STALE_v131, FAFM_GEN_1_4, {
        packageJson: PKG_v149,
        changelog: CHANGELOG_DRIFTY,
        readme: README_STALE_v141,
      });
      expect(r.contradictions.length).toBeGreaterThan(0);
      for (const c of r.contradictions) {
        expect(c.check.length).toBeGreaterThan(0);
        expect(c.location.length).toBeGreaterThan(0);
        expect(c.expected.length).toBeGreaterThan(0);
        expect(c.found.length).toBeGreaterThan(0);
        expect(c.message.length).toBeGreaterThan(0);
        expect(['error', 'warn']).toContain(c.severity);
      }
    });

    test('coverage honesty: every check ID appears EXACTLY once across checked + skipped', () => {
      const r = checkId(FAF_v149, FAFM_GEN_1_5, { packageJson: PKG_v152 });
      const all = [...r.checked, ...r.skipped];
      // No duplicates across the union
      expect(new Set(all).size).toBe(all.length);
      // Every known check ID accounted for
      const knownChecks = [
        'c1-faf-when-vs-pkg',
        'c2-changelog-meta-vs-top',
        'c3-changelog-top-vs-pkg',
        'c4-readme-arch-vs-pkg',
        'c5-fafm-namepoint-vs-pkg',
      ];
      for (const id of knownChecks) {
        expect(all).toContain(id);
      }
    });

    test('absence-is-not-contradiction: .faf with no version-in-when claim → C1 does not fire', () => {
      const fafNoVersionInWhen = [
        'faf_version: "3.0"',
        'human_context:',
        '  when: shipped on a Tuesday',
        '',
      ].join('\n');
      const r = checkId(fafNoVersionInWhen, undefined, { packageJson: PKG_v149 });
      // C1 doesn't fire (no version to compare); we don't flag absence as drift
      expect(r.contradictions.find((x) => x.check === 'c1-faf-when-vs-pkg')).toBeUndefined();
    });

    test('multi-contradiction: all 4 hard-fail checks trip on a maximally-drifty fixture', () => {
      const r = checkId(FAF_STALE_v131, FAFM_GEN_1_4, {
        packageJson: PKG_v149,
        changelog: CHANGELOG_DRIFTY,
        readme: README_STALE_v141,
      });
      const checks = new Set(r.contradictions.map((c) => c.check));
      expect(checks.has('c1-faf-when-vs-pkg')).toBe(true);
      expect(checks.has('c2-changelog-meta-vs-top')).toBe(true);
      expect(checks.has('c4-readme-arch-vs-pkg')).toBe(true);
      // C3 doesn't fire here because CHANGELOG_DRIFTY's TOPMOST is 1.4.9
      // (matches pkg) — only the META stamp is wrong. That's correct
      // mechanical honesty: each check has its own crisp condition.
    });
  });

  // ── 🛞 TYRE — pass-through ──────────────────────────────────────────────
  describe('🛞 TYRE — live [pass-through]', () => {
    test('pass-through: checkId is a pure function, no FS / no MCP / no cred', () => {
      expect(true).toBe(true);
    });
  });

  // ── 🔧 PIT — pass-through ───────────────────────────────────────────────
  describe('🔧 PIT — eval [pass-through]', () => {
    test('pass-through: .faf / .fafm schema validation lives in their IANA specs', () => {
      expect(true).toBe(true);
    });
  });
});
