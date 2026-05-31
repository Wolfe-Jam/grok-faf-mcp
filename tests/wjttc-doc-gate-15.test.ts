/**
 * 🏁 WJTTC — Doc Gate 1.5 (dogfoods CheckID against THIS repo)
 *
 * The permanent CI shield that promotes Doc Gate 101 (the version-stamp
 * consistency check in pubpro) from a publish-time shell check to a
 * continuous test-suite shield. Any future commit that drifts version
 * stamps across `.faf` / package.json / CHANGELOG / README fails this
 * test loudly in CI — the substrate eats its own dog food.
 *
 * Also asserts the 1.5 README documents the full substrate the agent will
 * see when calling `tools/list` — every shipped MCP tool described,
 * limitations surfaced honestly, performance characterized.
 *
 *   1 🛑 BRAKE  — all required files exist + readable
 *   2 ⚙️ ENGINE — README documents the 1.5 substrate (each tool · status section ·
 *                 performance notes · receipt discoverability)
 *   3 🌬️ AERO   — CheckID dogfood against the actual repo state — ZERO contradictions
 *                 (the load-bearing assertion; this is THE permanent ship gate)
 *   4 🛞 TYRE   — pass-through (no cred-costing roundtrip; this is local content)
 *   5 🔧 PIT    — pass-through (no schema gate; CheckID IS the schema enforcer)
 *
 * Spec source: PR 4 of the #10 arc. Per the wolfejam/Grok-1 PR-4 elevation:
 * "Status & known limitations" is a load-bearing 1.5 release artifact, not
 * ship-prep afterthought. This test makes it permanent.
 */
import { describe, test, expect } from 'bun:test';
import * as fs from 'fs';
import * as path from 'path';
import { checkId } from '../src/integrity/check-id';

// Anchor to THIS repo regardless of where the test runner cwd's to.
const REPO_ROOT = path.resolve(__dirname, '..');

const readRepoFile = (relPath: string): string | undefined => {
  const p = path.join(REPO_ROOT, relPath);
  return fs.existsSync(p) ? fs.readFileSync(p, 'utf-8') : undefined;
};

describe('🏁 WJTTC — Doc Gate 1.5 (dogfoods CheckID against THIS repo)', () => {
  // ── 🛑 BRAKE — required files exist + readable ──────────────────────
  describe('🛑 BRAKE — required files present + readable', () => {
    test('repo has project.faf', () => {
      expect(readRepoFile('project.faf')).toBeDefined();
    });
    test('repo has package.json', () => {
      expect(readRepoFile('package.json')).toBeDefined();
    });
    test('repo has CHANGELOG.md', () => {
      expect(readRepoFile('CHANGELOG.md')).toBeDefined();
    });
    test('repo has README.md', () => {
      expect(readRepoFile('README.md')).toBeDefined();
    });
  });

  // ── ⚙️ ENGINE — README documents the 1.5 substrate ──────────────────
  describe('⚙️ ENGINE — README documents the 1.5 substrate', () => {
    const readme = readRepoFile('README.md') ?? '';

    test('README mentions `refresh_faf` MCP tool', () => {
      expect(readme).toContain('refresh_faf');
    });
    test('README mentions `refresh_fafm` MCP tool (1.5 — memory layer)', () => {
      expect(readme).toContain('refresh_fafm');
    });
    test('README mentions `refresh_blend` MCP tool (1.5 — Cmd+R/Cmd+Shift+R analog)', () => {
      expect(readme).toContain('refresh_blend');
    });
    test('README mentions `faf_orchestrate_recommendation` MCP tool (1.5 — the heavy orchestrator)', () => {
      expect(readme).toContain('faf_orchestrate_recommendation');
    });
    test('README has "Status & known limitations" section (Promotion 2)', () => {
      // Match case-insensitively + tolerate emoji/punctuation around the words
      expect(readme).toMatch(/status\s*&\s*known\s*limitations/i);
    });
    test('README documents performance characteristics for the orchestrator (Pressure 3)', () => {
      // Performance section exists AND mentions the orchestrator's read pattern
      expect(readme).toMatch(/##\s*Performance/i);
      // Performance section must call out the orchestrator's file-read + analyzer cost
      expect(readme).toMatch(/orchestrat|orchestrate/i);
    });
    test('README has receipt-files discoverability note (pull-based, for TAF + others)', () => {
      // The "pull-based · TAF can index" note from the PR 2 discussion
      expect(readme).toMatch(/receipt/i);
      expect(readme).toMatch(/\.faf-(drift-index|refresh-receipts|recommendation-receipts)\.json/);
    });
  });

  // ── 🌬️ AERO — CheckID dogfood against THIS repo (THE load-bearing gate) ──
  describe('🌬️ AERO — CheckID against THIS repo finds ZERO contradictions', () => {
    test('CheckID(this repo) → contradictions=[] (Doc Gate 101 as continuous CI shield)', () => {
      const faf = readRepoFile('project.faf');
      const fafm = readRepoFile('soul.fafm');
      const refs = {
        packageJson: readRepoFile('package.json'),
        changelog: readRepoFile('CHANGELOG.md'),
        readme: readRepoFile('README.md'),
      };

      expect(faf).toBeDefined();

      const report = checkId(faf!, fafm, refs);

      // THE assertion — every cross-stamp must agree. If any future commit
      // drifts (.faf says one version, package.json says another, CHANGELOG
      // topmost mismatches, README arch-tree stale, .fafm namepoint pins
      // wrong line), this test fires loudly in CI.
      if (report.contradictions.length > 0) {
        // Build a human-readable error message — the test failure should
        // tell maintainers exactly what to fix.
        const details = report.contradictions
          .map((c) => `  [${c.severity}] ${c.check} @ ${c.location}\n    expected: ${c.expected}  found: ${c.found}\n    ${c.message}`)
          .join('\n\n');
        throw new Error(
          `Doc Gate 1.5 FAILED — ${report.contradictions.length} contradiction(s) found in repo stamps:\n\n${details}\n\n` +
          `Fix the stamps above so every surface agrees on the current version.`,
        );
      }
      expect(report.contradictions).toEqual([]);
    });

    test('CheckID actually ran the cross-checks (not just .faf-internal)', () => {
      const faf = readRepoFile('project.faf');
      const fafm = readRepoFile('soul.fafm');
      const refs = {
        packageJson: readRepoFile('package.json'),
        changelog: readRepoFile('CHANGELOG.md'),
        readme: readRepoFile('README.md'),
      };
      const report = checkId(faf!, fafm, refs);
      // Every cross-check should appear in `checked` (proves the refs were actually inspected)
      const checked = new Set(report.checked);
      expect(checked.has('c1-faf-when-vs-pkg')).toBe(true);
      expect(checked.has('c2-changelog-meta-vs-top')).toBe(true);
      expect(checked.has('c3-changelog-top-vs-pkg')).toBe(true);
      expect(checked.has('c4-readme-arch-vs-pkg')).toBe(true);
      // C5 (fafm-namepoint) only runs if .fafm exists; assert IF fafm present
      if (fafm !== undefined) {
        expect(checked.has('c5-fafm-namepoint-vs-pkg')).toBe(true);
      }
    });
  });

  // ── 🛞 TYRE — pass-through ──────────────────────────────────────────
  describe('🛞 TYRE — live [pass-through]', () => {
    test('pass-through: this test is local content checks, no cred-costing roundtrip', () => {
      expect(true).toBe(true);
    });
  });

  // ── 🔧 PIT — pass-through ───────────────────────────────────────────
  describe('🔧 PIT — eval [pass-through]', () => {
    test('pass-through: CheckID IS the schema enforcer (PR #95) — no separate gate here', () => {
      expect(true).toBe(true);
    });
  });
});
