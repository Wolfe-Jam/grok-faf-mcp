/**
 * FRC (FAF-RAG-Collections · Phase III) — the pre-promotion QUALITY GATE.
 *
 * "Better candidates for Collections, not better search." The gate decides
 * whether a `.faf` candidate is worth promoting to a Grok Collection — built
 * ENTIRELY from shipped pieces: faf-cli's deterministic `faf_score` (0–100) +
 * the in-repo token estimate. No new engine, no Collections call (the gate is
 * PRE-promotion — it scores/sizes/decides; the upload is a separate step).
 *
 * Flag-gated as the Phase III (FRC) module — OFF by default, same rollout
 * discipline as USE_ZEPH in Phase II (opt-in → prod → default).
 *
 * Internal edge framing (private): "FAF decides what deserves Collections."
 * Public framing flips the agency: "FAF scores it; you decide what to promote."
 */

export interface GatePolicy {
  /** Minimum faf_score (0–100) to be promotable. */
  minScore: number;
  /** Maximum estimated tokens to be promotable. */
  maxTokens: number;
}

/** Defaults. xAI owns the threshold; FAF ships the gate. Overridable per call/env. */
export const GATE_DEFAULTS: GatePolicy = { minScore: 85, maxTokens: 8000 };

export interface GateInput {
  /** Deterministic faf-cli score, 0–100. */
  score: number;
  /** Estimated tokens for the candidate. */
  tokens: number;
  /** Empty slots dragging the score (the actionable gaps). */
  emptySlots?: string[];
  /** Optional policy overrides. */
  policy?: Partial<GatePolicy>;
}

export interface GateResult {
  verdict: 'promote' | 'hold';
  score: number;
  tokens: number;
  policy: GatePolicy;
  /** Why it's held (empty array when promote). Actionable. */
  reasons: string[];
}

/**
 * Pure, deterministic gate. promote IFF score ≥ minScore AND tokens ≤ maxTokens.
 * Same input → same output (score is score, applied to promotion).
 */
export function evaluateGate(input: GateInput): GateResult {
  const policy: GatePolicy = { ...GATE_DEFAULTS, ...(input.policy ?? {}) };
  const empties = input.emptySlots ?? [];
  const reasons: string[] = [];

  if (input.score < policy.minScore) {
    const fix = empties.length ? ` — fill: ${empties.slice(0, 8).join(', ')}${empties.length > 8 ? ', …' : ''}` : '';
    reasons.push(`score ${input.score} < ${policy.minScore}${fix}`);
  }
  if (input.tokens > policy.maxTokens) {
    reasons.push(`tokens ~${input.tokens} > ${policy.maxTokens} — trim before promoting`);
  }

  return {
    verdict: reasons.length === 0 ? 'promote' : 'hold',
    score: input.score,
    tokens: input.tokens,
    policy,
    reasons,
  };
}

/** Phase III (FRC) module — opt-in, OFF by default (cf. USE_ZEPH, Phase II). */
export function frcEnabled(): boolean {
  return (
    process.env.USE_FRC === '1' ||
    process.env.FAF_FRC === '1' ||
    process.env.PHASE3 === '1'
  );
}

/** Estimate tokens the same way the rest of grok-faf-mcp does (~chars/4). */
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}
