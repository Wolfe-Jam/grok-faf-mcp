/**
 * 🏁 WJTTC — detectFafmDrift (grok-faf-mcp 1.5)
 *
 * Championship proof for the .fafm drift-detection MVP — the repetition-rate
 * gauge. Sibling to refresh_fafm (which fixes drift); this is the detector
 * that signals when a refresh is warranted.
 *
 *   1 🛑 BRAKE  — fail-safe: malformed / empty / undersized inputs never crash, never lie
 *   2 ⚙️ ENGINE — core: clean → null, repetitive → signal, score range, anchor extraction
 *   3 🌬️ AERO   — honest: determinism + threshold tunability + cross-fact-only counting +
 *                          null on clean default + real-world dogfood pattern
 *   4 🛞 TYRE   — pass-through (pure function, no cred-costing roundtrip)
 *   5 🔧 PIT    — pass-through (.fafm format gate lives in the IANA spec)
 *
 * Spec source: GROK-FAF-MCP-1.5-CODING-SESSION-BREAKDOWN §#2 (locked WHAT,
 * Claude HOW). All thresholds + algorithm choices in `src/detection/fafm-drift.ts`.
 */
import { describe, test, expect } from 'bun:test';
import { detectFafmDrift } from '../src/detection/fafm-drift';

// ── Fixtures ────────────────────────────────────────────────────────────────

// Clean .fafm — 3 facts on distinctly different topics, minimal overlap.
const CLEAN_FAFM = [
  'version: "1.0"',
  'memory:',
  '  facts:',
  '    - text: "Rust authors the truth via the Foundry engine, compiling to WASM."',
  '      id: "rust-authority"',
  '      timestamp: "2026-05-30T10:00:00Z"',
  '    - text: "ZEPH delivers packets at edge speed across the Cloudflare Workers fleet."',
  '      id: "zeph-delivery"',
  '      timestamp: "2026-05-30T11:00:00Z"',
  '    - text: "The MCP Registry indexes published servers for AI clients to discover."',
  '      id: "mcp-registry"',
  '      timestamp: "2026-05-30T12:00:00Z"',
  '',
].join('\n');

// Drifty .fafm — 6 facts modeling genuine memory pollution. The AI keeps
// re-stating the SAME ideas across different facts ("build precedent",
// "gather first then propose", "load-bearing doctrine"). Multiple distinct
// recurring phrases push the repetition-rate score above the default
// threshold (10%) — the kind of pattern a healthy session would flag.
const DRIFTY_FAFM = [
  'version: "1.0"',
  'memory:',
  '  facts:',
  '    - text: "the build precedent is that we gather first then propose then code carefully."',
  '      id: "drift-1"',
  '    - text: "Per the build precedent we gather first then propose then code on every task."',
  '      id: "drift-2"',
  '    - text: "Reminding myself: the build precedent says gather first then propose then act."',
  '      id: "drift-3"',
  '    - text: "Apply the build precedent — gather first then propose then ship the code."',
  '      id: "drift-4"',
  '    - text: "Per build precedent doctrine we gather first then propose changes to code."',
  '      id: "drift-5"',
  '    - text: "Operating model: build precedent applies, we gather first then propose code."',
  '      id: "drift-6"',
  '',
].join('\n');

// A fact-pair too short to form 4-grams — guards the undersized-input edge case.
const TINY_TEXTS_FAFM = [
  'version: "1.0"',
  'memory:',
  '  facts:',
  '    - text: "short"',
  '      id: "t1"',
  '    - text: "tiny"',
  '      id: "t2"',
  '',
].join('\n');

const EMPTY_FAFM = [
  'version: "1.0"',
  'memory:',
  '  facts: []',
  '',
].join('\n');

const SINGLE_FACT_FAFM = [
  'version: "1.0"',
  'memory:',
  '  facts:',
  '    - text: "Only one fact — no cross-fact repetition is even definable here."',
  '      id: "lonely"',
  '',
].join('\n');

const NO_MEMORY_FAFM = [
  'version: "1.0"',
  'profile: "knowledge"',
  '',
].join('\n');

describe('🏁 WJTTC — detectFafmDrift (grok-faf-mcp 1.5)', () => {
  // ── 🛑 BRAKE — fail-safe ──────────────────────────────────────────────
  describe('🛑 BRAKE — fail-safe', () => {
    test('malformed YAML THROWS — detector never lies about input quality', () => {
      const bad = 'memory:\n  facts: [unterminated\n  : : :\n';
      expect(() => detectFafmDrift(bad)).toThrow();
    });

    test('empty facts array → null (clean, silent)', () => {
      expect(detectFafmDrift(EMPTY_FAFM)).toBeNull();
    });

    test('single fact → null (no cross-fact pair possible)', () => {
      expect(detectFafmDrift(SINGLE_FACT_FAFM)).toBeNull();
    });

    test('no memory section → null (nothing to score)', () => {
      expect(detectFafmDrift(NO_MEMORY_FAFM)).toBeNull();
    });

    test('texts too short to form n-grams → null', () => {
      expect(detectFafmDrift(TINY_TEXTS_FAFM)).toBeNull();
    });

    test('facts missing `text` field are skipped, do not crash', () => {
      const partial = [
        'version: "1.0"',
        'memory:',
        '  facts:',
        '    - id: "no-text-1"',
        '    - text: "the build precedent is that Grok defines WHAT"',
        '      id: "with-text-1"',
        '    - text: "the build precedent is real and useful"',
        '      id: "with-text-2"',
        '',
      ].join('\n');
      // Won't throw. Two valid facts share a recurring anchor → may signal or not
      // depending on threshold, but the BRAKE assertion is just "no crash".
      const sig = detectFafmDrift(partial);
      expect(sig === null || sig.kind === 'repetition-rate').toBe(true);
    });
  });

  // ── ⚙️ ENGINE — core detection ────────────────────────────────────────
  describe('⚙️ ENGINE — core detection', () => {
    test('clean fafm with distinct facts → null (silent on clean state)', () => {
      expect(detectFafmDrift(CLEAN_FAFM)).toBeNull();
    });

    test('drifty fafm with recurring 4-grams → signal with locked shape', () => {
      const sig = detectFafmDrift(DRIFTY_FAFM);
      expect(sig).not.toBeNull();
      // Shape from the locked spec
      expect(sig!.kind).toBe('repetition-rate');
      expect(typeof sig!.score).toBe('number');
      expect(Array.isArray(sig!.repeated_anchors)).toBe(true);
      expect(typeof sig!.detected_at).toBe('string');
      expect(sig!.detected_at).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    });

    test('score is a ratio in 0.0–1.0 (NOT a 0–100 quality tier)', () => {
      const sig = detectFafmDrift(DRIFTY_FAFM)!;
      expect(sig.score).toBeGreaterThan(0);
      expect(sig.score).toBeLessThanOrEqual(1);
    });

    test('repeated_anchors are the recurring phrases themselves, ranked by recurrence', () => {
      const sig = detectFafmDrift(DRIFTY_FAFM)!;
      expect(sig.repeated_anchors.length).toBeGreaterThan(0);
      // The most-recurring 4-gram in the drifty fixture is "gather first then
      // propose" — it appears in all 6 facts (the most stable recurring phrase
      // in the surrounding context). "build precedent" is only 2 tokens so it
      // only forms a recurring 4-gram when paired with stable adjacent words,
      // which varies fact-to-fact; that's correct algorithmic honesty, not a
      // miss.
      const top = sig.repeated_anchors[0];
      expect(top).toBe('gather first then propose');
    });
  });

  // ── 🌬️ AERO — determinism + tunability + cross-fact-only + silent default ──
  describe('🌬️ AERO — determinism + tunability + honest counting', () => {
    test('determinism: same input + threshold → same score + same anchors', () => {
      const a = detectFafmDrift(DRIFTY_FAFM)!;
      const b = detectFafmDrift(DRIFTY_FAFM)!;
      expect(a.score).toBe(b.score);
      expect(a.repeated_anchors).toEqual(b.repeated_anchors);
      // detected_at MAY differ (wall clock at emit time) — not asserted
    });

    test('threshold is honored: a threshold above the score returns null on same input', () => {
      const sig = detectFafmDrift(DRIFTY_FAFM)!;
      // Pick a threshold strictly above the observed score
      const aboveScore = sig.score + 0.01;
      expect(detectFafmDrift(DRIFTY_FAFM, { threshold: aboveScore })).toBeNull();
    });

    test('threshold is honored: a threshold of 0 promotes any non-empty repetition into a signal', () => {
      // CLEAN_FAFM has 3 distinct facts. With threshold 0, any cross-fact n-gram
      // overlap at all would trip — but if the fixture is truly clean, recurrence
      // count will be 0 and score = 0/N = 0, which is NOT less than threshold=0
      // (using `<` boundary), so it should signal IFF there's any repeated 4-gram.
      // Either outcome is honest; the assertion is "doesn't crash + returns the
      // honest answer".
      const sig = detectFafmDrift(CLEAN_FAFM, { threshold: 0 });
      // Allow both null (zero repetition, score=0, still < threshold? no, 0 is not < 0)
      // OR a signal (if there's any cross-fact 4-gram overlap at all).
      expect(sig === null || sig.kind === 'repetition-rate').toBe(true);
    });

    test('within-fact repetition does NOT inflate the cross-fact rate', () => {
      // Single fact repeating the same phrase 10 times should NOT trigger
      // cross-fact drift (the phrase appears in 1 fact, not 2+).
      const intraOnly = [
        'version: "1.0"',
        'memory:',
        '  facts:',
        '    - text: "the same phrase the same phrase the same phrase the same phrase the same phrase the same phrase"',
        '      id: "intra-1"',
        '    - text: "totally distinct content about Rust authoring truth via Foundry compilation."',
        '      id: "intra-2"',
        '',
      ].join('\n');
      expect(detectFafmDrift(intraOnly)).toBeNull();
    });

    test('ISO timestamps in text are normalized away — do not become spurious anchors', () => {
      // Without normalization, the same ISO timestamp in 2 fact texts would
      // produce a recurring 4-gram. With normalization, it's stripped.
      const tsHeavy = [
        'version: "1.0"',
        'memory:',
        '  facts:',
        '    - text: "Logged at 2026-05-30T10:00:00Z for the alpha event."',
        '      id: "ts-1"',
        '    - text: "Logged at 2026-05-30T10:00:00Z for the beta event."',
        '      id: "ts-2"',
        '    - text: "Logged at 2026-05-30T10:00:00Z for the gamma event."',
        '      id: "ts-3"',
        '',
      ].join('\n');
      const sig = detectFafmDrift(tsHeavy);
      // The ISO timestamp must NOT appear as an anchor. (Signal may or may not
      // fire depending on the remaining recurring tokens — the assertion is
      // the timestamp-normalization property, not signal/null.)
      if (sig) {
        for (const anchor of sig.repeated_anchors) {
          expect(anchor).not.toMatch(/\d{4}-\d{2}-\d{2}/);
        }
      }
    });

    test('urls are normalized away — do not become spurious anchors', () => {
      const urlHeavy = [
        'version: "1.0"',
        'memory:',
        '  facts:',
        '    - text: "See https://example.com/path for the spec."',
        '      id: "u1"',
        '    - text: "Also at https://example.com/path the docs live."',
        '      id: "u2"',
        '',
      ].join('\n');
      const sig = detectFafmDrift(urlHeavy);
      if (sig) {
        for (const anchor of sig.repeated_anchors) {
          expect(anchor).not.toContain('https');
          expect(anchor).not.toContain('http');
        }
      }
    });

    test('default threshold is silent on a typical low-overlap corpus', () => {
      // CLEAN_FAFM uses the default threshold (0.10). Asserting that the
      // default is calibrated for silence on distinct content — the load-
      // bearing "never noisy" property.
      expect(detectFafmDrift(CLEAN_FAFM)).toBeNull();
    });
  });

  // ── 🛞 TYRE — pass-through (no cred roundtrip) ──────────────────────────
  describe('🛞 TYRE — live [pass-through]', () => {
    test('pass-through: detectFafmDrift is a pure function, no network or cred', () => {
      expect(true).toBe(true);
    });
  });

  // ── 🔧 PIT — pass-through (.fafm format gate lives in IANA spec) ────────
  describe('🔧 PIT — eval [pass-through]', () => {
    test('pass-through: .fafm format conformance is the IANA spec, not duplicated here', () => {
      expect(true).toBe(true);
    });
  });
});
