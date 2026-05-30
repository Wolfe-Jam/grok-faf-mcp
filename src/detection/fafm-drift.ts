/**
 * 🏎️ .fafm Drift Detector (MVP — repetition-rate gauge)
 *
 * Detects when `.fafm` content shows REPETITION-RATE drift — the AI re-saying
 * things it already said, signaling stale memory or session-data pollution.
 *
 * Spec source (Grok-defined WHAT, wolfejam HOW):
 *   ~/PLANET-FAF/docs/GROK-FAF-MCP-1.5-CODING-SESSION-BREAKDOWN-2026-05-30.md §#2
 *   memory/grok-drift-requirements.md       (parent drift-management spec)
 *   memory/grok-agent-alignment.md          ("tunable/observable policy")
 *   memory/fafm-not-about-scoring.md        (`score` here is a RATE gauge, not a quality tier)
 *
 * Doctrine: silent on clean state, never noisy — returns `null` when no drift
 * detected. The signal is consumed downstream by detection→refresh telemetry
 * (#7) and repeat-offender tracking (#12) — neither exists yet in 1.5.
 *
 * Pure function. No FS. No MCP. Deterministic for a given input + threshold.
 */

import YAML from 'yaml';

/**
 * Structured drift signal. Matches the locked spec from the 1.5 breakdown.
 *
 *   - `kind`             — discriminator for future multi-detector unions
 *   - `score`            — repetition rate, 0.0–1.0 ratio
 *                          (NOT a 0–100 quality tier — `.fafm` is not scored,
 *                          this is a *gauge* of redundancy)
 *   - `repeated_anchors` — the recurring normalized n-gram phrases themselves,
 *                          ranked by recurrence count, capped at TOP_ANCHORS
 *   - `detected_at`      — ISO timestamp when the signal was emitted
 */
export interface DriftSignal {
  kind: 'repetition-rate';
  score: number;
  repeated_anchors: string[];
  detected_at: string;
}

export interface DetectFafmDriftOptions {
  /**
   * Repetition-rate threshold. Below this, the detector returns null (clean).
   * Default 0.10 (10% of unique n-grams recurring across facts = drift).
   */
  threshold?: number;
}

// ── Tunables (defaults — surface to .fafignore/config in a later task) ──────
const DEFAULT_THRESHOLD = 0.10;
const NGRAM_SIZE = 4; // 4-word sliding window — coarse enough to ignore stopword noise, fine enough to catch recurring phrases
const TOP_ANCHORS = 10; // cap repeated_anchors list at this many (highest-recurrence first)

// Normalize a fact text body before tokenization:
//   - lowercase
//   - strip ISO-8601 timestamps (provenance noise, not content)
//   - strip URLs (noise)
//   - strip punctuation → whitespace
//   - collapse whitespace
const ISO_TIMESTAMP_RE = /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z?/g;
const URL_RE = /https?:\/\/\S+/g;
const PUNCT_RE = /[^\p{L}\p{N}\s]/gu;
const WHITESPACE_RE = /\s+/g;

function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(ISO_TIMESTAMP_RE, ' ')
    .replace(URL_RE, ' ')
    .replace(PUNCT_RE, ' ')
    .replace(WHITESPACE_RE, ' ')
    .trim();
}

// Generate the set of N-grams for a normalized text. Returns a Set so each
// n-gram counts at most once PER FACT — repetition WITHIN a fact doesn't
// inflate the cross-fact recurrence signal (that's a different kind of drift,
// not what this detector is measuring).
function ngramSet(normalized: string, n: number): Set<string> {
  const tokens = normalized.split(' ').filter(Boolean);
  const grams = new Set<string>();
  if (tokens.length < n) return grams;
  for (let i = 0; i + n <= tokens.length; i++) {
    grams.add(tokens.slice(i, i + n).join(' '));
  }
  return grams;
}

/**
 * Detect repetition-rate drift in a `.fafm` content string.
 *
 * Returns `null` on a clean state (silent default — drift detectors should
 * be quiet until they have something honest to say). Returns a `DriftSignal`
 * when the repetition rate crosses the threshold.
 *
 * Algorithm (MVP):
 *   1. YAML.parse → extract `memory.facts[].text`
 *   2. For each fact: normalize → 4-gram Set (within-fact repeats collapsed)
 *   3. Across all facts: count how many DIFFERENT facts each n-gram appears in
 *   4. `repeated_anchors` = n-grams appearing in ≥2 facts (cross-fact recurrence)
 *   5. `score` = sum_excess / total_occurrences
 *      where sum_excess = Σ (count - 1) over recurring n-grams
 *      and total_occurrences = sum of |grams_per_fact|
 *      Semantically: "what fraction of n-gram occurrences are redundant
 *      repeats?" — a true *rate* of repetition, sensitive at small fact-
 *      counts (4 distinct recurring phrases across 6 facts → ~20%, which is
 *      a textbook drift pattern even though only 4 unique anchors are
 *      involved). Ratio bounded [0, 1).
 *   6. If `score < threshold` → return null
 *
 * Edge cases:
 *   - < 2 facts             → null (no cross-fact pairs possible)
 *   - empty memory.facts    → null
 *   - no n-grams at all     → null (texts too short)
 *   - malformed YAML        → THROWS — caller policy decides whether to
 *                             swallow; the detector won't lie about it
 *   - bad shape (no memory) → null (nothing to score)
 *
 * Pure function. Same input + threshold → same output (modulo `detected_at`,
 * which is wall-clock at emit time).
 */
export function detectFafmDrift(
  content: string,
  options: DetectFafmDriftOptions = {},
): DriftSignal | null {
  const threshold = typeof options.threshold === 'number' ? options.threshold : DEFAULT_THRESHOLD;

  // Parse — let YAML errors propagate. The detector doesn't get to lie about
  // input quality; the caller decides whether to swallow.
  const doc = YAML.parse(content);

  const facts: unknown = doc?.memory?.facts;
  if (!Array.isArray(facts) || facts.length < 2) {
    return null;
  }

  // Extract + normalize fact text bodies. Skip facts without a string `text`.
  const factGrams: Array<Set<string>> = [];
  for (const f of facts) {
    const t = (f as { text?: unknown })?.text;
    if (typeof t !== 'string' || t.length === 0) continue;
    const grams = ngramSet(normalize(t), NGRAM_SIZE);
    if (grams.size > 0) factGrams.push(grams);
  }

  if (factGrams.length < 2) return null;

  // Count cross-fact recurrence for each n-gram: in how many DIFFERENT facts
  // did this phrase appear? (Within-fact repeats already collapsed by Set.)
  const recurrence = new Map<string, number>();
  let totalOccurrences = 0;
  for (const grams of factGrams) {
    for (const gram of grams) {
      recurrence.set(gram, (recurrence.get(gram) ?? 0) + 1);
      totalOccurrences++;
    }
  }

  if (totalOccurrences === 0) return null;

  // Repeated anchors = n-grams appearing in ≥2 facts, ranked by recurrence.
  const repeated = Array.from(recurrence.entries())
    .filter(([, count]) => count >= 2)
    .sort((a, b) => b[1] - a[1]);

  // Sum of excess occurrences = how many occurrences are "redundant repeats"
  // beyond the first instance of each recurring phrase. The "rate" is excess
  // over total — a true measure of how much of the corpus is repetition.
  const sumExcess = repeated.reduce((sum, [, count]) => sum + (count - 1), 0);
  const score = sumExcess / totalOccurrences;

  if (score < threshold) return null;

  return {
    kind: 'repetition-rate',
    score,
    repeated_anchors: repeated.slice(0, TOP_ANCHORS).map(([gram]) => gram),
    detected_at: new Date().toISOString(),
  };
}
