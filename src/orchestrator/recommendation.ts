/**
 * 🏎️ The #10 Orchestrator — `faf_orchestrate_recommendation` library
 *
 * Reads current substrate state, composes the 6 shipped 1.5 components into a
 * structured recommendation, writes an auditable receipt. Advisory only —
 * never auto-fires (subordinate-not-daemon per `[[grok-agent-alignment]]`).
 *
 * The "heavy orchestration layer" Grok-1 spec'd in FAF-DRIFT-DETECTION-SPEC
 * §9.5 + Appendix C, confirmed via two consult rounds 2026-05-31. Single
 * MCP tool: `faf_orchestrate_recommendation`. The agent calls it when it
 * wants a drift recommendation; the agent decides whether to act.
 *
 * Spec source:
 *   `~/export/grok-1-consult-orchestrator-code-gate-2026-05-31.md` + response
 *   `~/.claude/projects/-Users-wolfejam/memory/grok-orchestrator-spec.md`
 *
 * Architecture (pure-core + FS-shim, same as #5/#7/#12):
 *   analyzeAndRecommend(state)  — pure decision function, testable without FS
 *   readOrchestrationState(cwd) — FS-shim, builds the input state
 *
 * The orchestrator NEVER auto-fires a refresh. It writes a recommendation
 * receipt every call (no silent decisions per the receipt doctrine) and
 * returns the structured `Recommendation`. The agent surfaces it; the user
 * (or another agent) decides whether to call the recommended tool.
 */

import * as fs from 'fs';
import * as path from 'path';
import YAML from 'yaml';
import { detectFafmDrift } from '../detection/fafm-drift';
import { checkId } from '../integrity/check-id';
import { RepeatOffenderTracker } from './repeat-offender';
import { RefreshReceiptsLog, type RefreshReceipt } from '../telemetry/refresh-receipts';
import {
  RecommendationReceiptsLog,
  type RecommendationReceipt,
} from '../telemetry/recommendation-receipts';
import {
  evaluateTakeAHint,
  DEFAULT_THRESHOLDS,
  type EscalationThresholds,
  type RecommendationRecord,
} from './take-a-hint';
import type {
  DriftSignal,
  Contradiction,
  ContradictionReport,
  RepeatOffender,
} from '../types/drift-signals';
import type { RefreshMode } from '../types/refresh';
import type { EscalationLevel } from '../types/escalation';
import type { RecommendationAction } from '../types/recommendation';
import { fafCli } from '../utils/faf-cli-bridge.js';

// ── Public types ────────────────────────────────────────────────────────────

export type AggressivenessTier = 'conservative' | 'balanced' | 'aggressive';

/** Effective policy in force for this analysis — surfaced in hints per Promotion 1. */
export interface EffectivePolicy {
  tier: AggressivenessTier;
  thresholds: EscalationThresholds;
  /** Whether the tier came from default or from `.faf:orchestration:tier`. */
  source: 'default' | 'faf-block';
  /** Which fields the .faf block overrode (informational; empty when source='default'). */
  overrides_applied: string[];
}

/** A signal that couldn't run — surfaced when partial state is honest. */
export interface PartialSignalFailure {
  failed_signal: string;
  error: string;
}

export interface RecommendationHints {
  drift_signal?: DriftSignal;
  contradictions: Contradiction[];
  top_offenders: RepeatOffender[];
  /** Refresh fires in the last 24h (audit window). */
  recent_refresh_count: number;
  signals_run: string[];
  state_paths_read: string[];
  effective_policy: EffectivePolicy;
  /** Present only when one or more signals failed — silent-wrong prevention. */
  partial?: PartialSignalFailure[];
}

/**
 * The orchestrator's structured recommendation. Locked output shape from the
 * Round 1 + Round 2 + Code-Gate Grok-1 consults.
 */
export interface Recommendation {
  recommend: RecommendationAction;
  /** Refresh mode — only present when `recommend === 'refresh_blend'`. */
  mode?: RefreshMode;
  /** Human-readable explanation of the inputs driving the decision. */
  reason: string;
  severity: EscalationLevel;
  /** One-line human-readable explanation for /mcps UI + log readers (Grok bonus). */
  summary: string;
  hints: RecommendationHints;
}

/** State the pure analyzer needs. Built by `readOrchestrationState` or fixture for tests. */
export interface OrchestrationState {
  /** Raw `.faf` content. undefined when file missing or unreadable. */
  faf?: string;
  /** Raw `.fafm` content. undefined when missing. */
  fafm?: string;
  /** Raw `package.json` content. undefined when missing — checkId tolerates. */
  packageJson?: string;
  /** Raw `CHANGELOG.md` content. */
  changelog?: string;
  /** Raw `README.md` content. */
  readme?: string;
  /** Output of RepeatOffenderTracker.getRepeatOffenders. */
  offenders: RepeatOffender[];
  /** Refresh receipts within the audit window (last 24h). */
  recent_refresh_fires: RefreshReceipt[];
  /** Recommendation receipts since `take-a-hint`'s relevant horizon. */
  recent_recommendations: RecommendationReceipt[];
  /** The policy in force for this analysis — already resolved from .faf:orchestration: */
  effective_policy: EffectivePolicy;
  /** Absolute paths actually read during state building (honesty for the hints). */
  paths_read: string[];
  /** Any read-time signal failures (e.g. malformed YAML); passed through to hints.partial. */
  read_partials: PartialSignalFailure[];
}

// ── Defaults + tier table ───────────────────────────────────────────────────

const TIER_THRESHOLDS: Record<AggressivenessTier, EscalationThresholds> = Object.freeze({
  // Conservative = take-a-hint's existing defaults (quietest)
  conservative: DEFAULT_THRESHOLDS,
  // Balanced = each axis -1 (more sensitive)
  balanced: Object.freeze({
    light: Object.freeze({ ignored: 0, recurrence: 1 }),
    hard: Object.freeze({ ignored: 1, recurrence: 2 }),
    block: Object.freeze({ ignored: 2, recurrence: 3 }),
  }) as EscalationThresholds,
  // Aggressive = each axis -1 again (most sensitive, may surface noise)
  aggressive: Object.freeze({
    light: Object.freeze({ ignored: 0, recurrence: 0 }),
    hard: Object.freeze({ ignored: 0, recurrence: 1 }),
    block: Object.freeze({ ignored: 1, recurrence: 2 }),
  }) as EscalationThresholds,
}) as Record<AggressivenessTier, EscalationThresholds>;

const DEFAULT_TIER: AggressivenessTier = 'conservative';

const RECENT_FIRE_WINDOW_MS = 24 * 60 * 60 * 1000; // 24h audit window

// ── Pure-core: analyzeAndRecommend ─────────────────────────────────────────

/**
 * Given a fully-built `OrchestrationState`, decide what the agent should do.
 *
 * Pure function — same input → same output (modulo the wall-clock `summary`
 * doesn't carry timestamps). No FS, no MCP, no receipt writes (caller writes
 * the receipt with the returned `Recommendation`).
 *
 * Decision-table (spec-verbatim):
 *
 *   drift │ contradictions │ recommend       │ severity_base
 *   ──────┼────────────────┼─────────────────┼──────────────
 *   YES   │ errors         │ refresh_blend   │ hard
 *   YES   │ warn-only      │ refresh_blend   │ light
 *   YES   │ none           │ refresh_fafm    │ light
 *   NO    │ errors         │ refresh_faf     │ hard
 *   NO    │ warn-only      │ refresh_faf     │ light
 *   NO    │ none           │ no_action       │ none
 *
 * take-a-hint can PROMOTE the severity (light → hard → block) based on
 * recurrence + ignored history, but cannot DEMOTE.
 *
 * Partial-state degradation: if a signal failed to run, treat it as
 * "no signal" for the table but surface the failure via `hints.partial`.
 * Caller policy: `recommend: 'no_action'` when ALL signals failed.
 */
export function analyzeAndRecommend(state: OrchestrationState): Recommendation {
  const partial: PartialSignalFailure[] = [...state.read_partials];
  const signals_run: string[] = [];

  // Run drift detection (defensive; library throws on malformed YAML — catch + degrade).
  let driftSignal: DriftSignal | null = null;
  if (state.fafm !== undefined) {
    try {
      driftSignal = detectFafmDrift(state.fafm);
      signals_run.push('detect-fafm-drift');
    } catch (e) {
      partial.push({
        failed_signal: 'detect-fafm-drift',
        error: e instanceof Error ? e.message : String(e),
      });
    }
  }

  // Run contradiction check (same pattern).
  let contradictionReport: ContradictionReport | undefined;
  if (state.faf !== undefined) {
    try {
      contradictionReport = checkId(state.faf, state.fafm, {
        packageJson: state.packageJson,
        changelog: state.changelog,
        readme: state.readme,
      });
      signals_run.push('check-id');
    } catch (e) {
      partial.push({
        failed_signal: 'check-id',
        error: e instanceof Error ? e.message : String(e),
      });
    }
  }

  const contras = contradictionReport?.contradictions ?? [];
  const hasErrors = contras.some((c) => c.severity === 'error');
  const hasWarnsOnly = contras.length > 0 && !hasErrors;
  const hasDrift = driftSignal !== null;

  // Build take-a-hint inputs.
  const drift_recurrence = state.offenders[0]?.count ?? 0;
  const ignored_count = countIgnoredRecommendations(state.recent_recommendations, state.recent_refresh_fires);
  const recent_recommendations_for_takehint: RecommendationRecord[] = state.recent_recommendations.map((r) => ({
    timestamp: r.recommended_at,
    acknowledged: r.acknowledged,
  }));

  const escalation = evaluateTakeAHint({
    recent_recommendations: recent_recommendations_for_takehint,
    ignored_count,
    drift_recurrence,
    thresholds: state.effective_policy.thresholds,
  });

  // Decision table → (recommend, mode?, severity_base, reason)
  const allSignalsFailed = signals_run.length === 0;
  let recommend: RecommendationAction;
  let mode: RefreshMode | undefined;
  let severity_base: EscalationLevel;
  let reason: string;

  if (allSignalsFailed) {
    recommend = 'no_action';
    severity_base = 'none';
    reason = state.faf === undefined && state.fafm === undefined
      ? 'No .faf or .fafm in cwd — nothing to ground or refresh against.'
      : 'All available signals failed (see hints.partial). Cannot make an honest recommendation; investigate the failures.';
  } else if (hasDrift && hasErrors) {
    recommend = 'refresh_blend';
    mode = 'blend';
    severity_base = 'hard';
    reason = `Memory-layer drift detected (${formatScore(driftSignal!.score)}) AND ${contras.filter((c) => c.severity === 'error').length} hard contradiction(s) in the substrate — both layers stale.`;
  } else if (hasDrift && hasWarnsOnly) {
    recommend = 'refresh_blend';
    mode = 'blend';
    severity_base = 'light';
    reason = `Memory-layer drift detected (${formatScore(driftSignal!.score)}) plus ${contras.length} soft contradiction(s) — both layers should re-ground.`;
  } else if (hasDrift) {
    recommend = 'refresh_fafm';
    severity_base = 'light';
    reason = `Memory-layer drift detected (${formatScore(driftSignal!.score)}) with no contradictions in the substrate — refresh the .fafm only.`;
  } else if (hasErrors) {
    recommend = 'refresh_faf';
    severity_base = 'hard';
    reason = `${contras.filter((c) => c.severity === 'error').length} hard contradiction(s) in the substrate — .faf needs re-grounding against package.json/CHANGELOG/README.`;
  } else if (hasWarnsOnly) {
    recommend = 'refresh_faf';
    severity_base = 'light';
    reason = `${contras.length} soft contradiction(s) in the substrate — light .faf refresh advised.`;
  } else {
    recommend = 'no_action';
    severity_base = 'none';
    reason = 'No drift detected, no contradictions found. Substrate looks clean.';
  }

  // take-a-hint can PROMOTE severity but never demote.
  const severity = promoteSeverity(severity_base, escalation);

  const summary = buildSummary({
    recommend,
    mode,
    severity,
    hasDrift,
    driftScore: driftSignal?.score,
    errorCount: contras.filter((c) => c.severity === 'error').length,
    warnCount: contras.filter((c) => c.severity === 'warn').length,
    recurrence: drift_recurrence,
    tier: state.effective_policy.tier,
  });

  const hints: RecommendationHints = {
    drift_signal: driftSignal ?? undefined,
    contradictions: contras,
    top_offenders: state.offenders.slice(0, 5),
    recent_refresh_count: state.recent_refresh_fires.length,
    signals_run,
    state_paths_read: state.paths_read,
    effective_policy: state.effective_policy,
  };
  if (partial.length > 0) hints.partial = partial;

  return { recommend, mode, reason, severity, summary, hints };
}

// ── Helpers ────────────────────────────────────────────────────────────────

/**
 * Promote `base` to `from_escalation` if escalation is more severe. Never demotes.
 * Severity ranking: none < light < hard < block.
 */
function promoteSeverity(base: EscalationLevel, from_escalation: EscalationLevel): EscalationLevel {
  const rank: Record<EscalationLevel, number> = { none: 0, light: 1, hard: 2, block: 3 };
  return rank[from_escalation] > rank[base] ? from_escalation : base;
}

/**
 * Heuristic: a recommendation is "ignored" if no refresh fire happened
 * strictly AFTER it AND it wasn't explicitly acknowledged. Conservative —
 * unacknowledged + no-followup-fire counts as ignored.
 */
function countIgnoredRecommendations(
  recs: RecommendationReceipt[],
  fires: RefreshReceipt[],
): number {
  let n = 0;
  for (const rec of recs) {
    if (rec.acknowledged) continue;
    if (rec.recommend === 'no_action') continue; // no_action recs aren't actionable; can't be ignored
    const recMs = Date.parse(rec.recommended_at);
    if (!Number.isFinite(recMs)) continue;
    const hasFollowupFire = fires.some((f) => Date.parse(f.fired_at) > recMs);
    if (!hasFollowupFire) n++;
  }
  return n;
}

function formatScore(score: number): string {
  return `${Math.round(score * 100)}%`;
}

function buildSummary(args: {
  recommend: RecommendationAction;
  mode?: RefreshMode;
  severity: EscalationLevel;
  hasDrift: boolean;
  driftScore?: number;
  errorCount: number;
  warnCount: number;
  recurrence: number;
  tier: AggressivenessTier;
}): string {
  const parts: string[] = [];
  if (args.hasDrift) parts.push(`DRIFT ${args.driftScore !== undefined ? formatScore(args.driftScore) : ''}`.trim());
  if (args.errorCount > 0) parts.push(`${args.errorCount} error${args.errorCount === 1 ? '' : 's'}`);
  if (args.warnCount > 0) parts.push(`${args.warnCount} warn${args.warnCount === 1 ? '' : 's'}`);
  if (args.recurrence > 1) parts.push(`recurrence ${args.recurrence}`);

  const observation = parts.length === 0 ? 'no findings' : parts.join(' + ');
  const tool = args.recommend === 'no_action' ? 'no_action' : args.mode ? `${args.recommend} (${args.mode})` : args.recommend;
  return `${observation} → recommending ${tool} at ${args.severity} (tier: ${args.tier})`;
}

// ── FS-shim: readOrchestrationState ────────────────────────────────────────

export interface ReadOrchestrationStateOptions {
  cwd?: string;
  /** Drift index path override (defaults to cwd-relative). */
  trackerPath?: string;
  /** Refresh receipts path override. */
  refreshReceiptsPath?: string;
  /** Recommendation receipts path override. */
  recommendationReceiptsPath?: string;
  /** Reference "now" for window cutoffs. Defaults to wall clock. */
  now?: string;
}

/**
 * Build an `OrchestrationState` from the current cwd. Best-effort: missing
 * files become `undefined` fields (the analyzer degrades honestly).
 */
export function readOrchestrationState(options: ReadOrchestrationStateOptions = {}): OrchestrationState {
  const cwd = options.cwd ?? process.cwd();
  const nowIso = options.now ?? new Date().toISOString();
  const nowMs = Date.parse(nowIso);
  const cutoffMs = nowMs - RECENT_FIRE_WINDOW_MS;

  const paths_read: string[] = [];
  const read_partials: PartialSignalFailure[] = [];

  // .faf — try fafCli discovery first (handles .faf vs project.faf), else best-effort path
  let faf: string | undefined;
  try {
    // fafCli is a Promise — but readOrchestrationState should stay sync where possible.
    // Use direct fs check instead — keeps this function pure-sync + testable.
    const candidates = ['project.faf', '.faf'];
    for (const name of candidates) {
      const p = path.join(cwd, name);
      if (fs.existsSync(p)) {
        try {
          faf = fs.readFileSync(p, 'utf-8');
          paths_read.push(p);
          break;
        } catch (e) {
          read_partials.push({
            failed_signal: `read-${name}`,
            error: e instanceof Error ? e.message : String(e),
          });
        }
      }
    }
  } catch (e) {
    read_partials.push({ failed_signal: 'discover-faf', error: e instanceof Error ? e.message : String(e) });
  }

  // .fafm — cwd-relative `soul.fafm` per refresh_fafm convention
  let fafm: string | undefined;
  const fafmPath = path.join(cwd, 'soul.fafm');
  if (fs.existsSync(fafmPath)) {
    try {
      fafm = fs.readFileSync(fafmPath, 'utf-8');
      paths_read.push(fafmPath);
    } catch (e) {
      read_partials.push({
        failed_signal: 'read-fafm',
        error: e instanceof Error ? e.message : String(e),
      });
    }
  }

  // package.json / CHANGELOG.md / README.md (best-effort refs for checkId)
  const refReads: Array<['packageJson' | 'changelog' | 'readme', string]> = [
    ['packageJson', 'package.json'],
    ['changelog', 'CHANGELOG.md'],
    ['readme', 'README.md'],
  ];
  const refs: { packageJson?: string; changelog?: string; readme?: string } = {};
  for (const [key, filename] of refReads) {
    const p = path.join(cwd, filename);
    if (fs.existsSync(p)) {
      try {
        refs[key] = fs.readFileSync(p, 'utf-8');
        paths_read.push(p);
      } catch (e) {
        read_partials.push({
          failed_signal: `read-${filename}`,
          error: e instanceof Error ? e.message : String(e),
        });
      }
    }
  }

  // Repeat-offender tracker
  const tracker = new RepeatOffenderTracker(options.trackerPath ?? path.join(cwd, '.faf-drift-index.json'));
  paths_read.push(tracker.getIndexPath());
  const offenders = tracker.getRepeatOffenders({ now: nowIso });

  // Refresh receipts within audit window
  const refreshLog = new RefreshReceiptsLog(options.refreshReceiptsPath ?? path.join(cwd, '.faf-refresh-receipts.json'));
  paths_read.push(refreshLog.getReceiptsPath());
  const allFires = refreshLog.readReceipts();
  const recent_refresh_fires = allFires.filter((f) => Date.parse(f.fired_at) >= cutoffMs);

  // Recommendation receipts (window same as fires)
  const recLog = new RecommendationReceiptsLog(
    options.recommendationReceiptsPath ?? path.join(cwd, '.faf-recommendation-receipts.json'),
  );
  paths_read.push(recLog.getReceiptsPath());
  const allRecs = recLog.readRecommendations();
  const recent_recommendations = allRecs.filter((r) => Date.parse(r.recommended_at) >= cutoffMs);

  // Resolve effective policy from .faf:orchestration:
  const effective_policy = resolvePolicyFromFaf(faf);

  return {
    faf,
    fafm,
    packageJson: refs.packageJson,
    changelog: refs.changelog,
    readme: refs.readme,
    offenders,
    recent_refresh_fires,
    recent_recommendations,
    effective_policy,
    paths_read,
    read_partials,
  };
}

/**
 * Read `.faf:orchestration:tier` (and any future override fields) and resolve
 * to a concrete `EffectivePolicy`. Default tier is 'conservative' (quietest);
 * if `.faf` is absent or has no orchestration block, source='default'.
 *
 * Per Grok-1's Q1 answer: tier is the v1 override surface; other fields
 * (cooldown, event-hooks) are v2.
 */
export function resolvePolicyFromFaf(faf: string | undefined): EffectivePolicy {
  if (faf === undefined) {
    return {
      tier: DEFAULT_TIER,
      thresholds: TIER_THRESHOLDS[DEFAULT_TIER],
      source: 'default',
      overrides_applied: [],
    };
  }
  let doc: unknown;
  try {
    doc = YAML.parse(faf);
  } catch {
    return {
      tier: DEFAULT_TIER,
      thresholds: TIER_THRESHOLDS[DEFAULT_TIER],
      source: 'default',
      overrides_applied: [],
    };
  }
  const orchestration = (doc as { orchestration?: { tier?: unknown } })?.orchestration;
  const tierCandidate = orchestration?.tier;
  if (
    tierCandidate !== 'conservative' &&
    tierCandidate !== 'balanced' &&
    tierCandidate !== 'aggressive'
  ) {
    return {
      tier: DEFAULT_TIER,
      thresholds: TIER_THRESHOLDS[DEFAULT_TIER],
      source: 'default',
      overrides_applied: [],
    };
  }
  return {
    tier: tierCandidate,
    thresholds: TIER_THRESHOLDS[tierCandidate],
    source: 'faf-block',
    overrides_applied: ['tier'],
  };
}

/**
 * Full orchestrator entry point: read state, analyze, write recommendation
 * receipt, return the recommendation. The MCP handler calls this; tests can
 * also call it directly (or test analyzeAndRecommend in isolation with
 * fixture state).
 *
 * NEVER auto-fires the recommended tool. The agent decides whether to act.
 *
 * Writes a recommendation receipt as part of its honesty contract — every
 * call leaves an audit trail (even no_action). Receipt has acknowledged=false;
 * a future ack mechanism (or subsequent refresh-receipt timing) may flip it.
 */
export function orchestrate(options: ReadOrchestrationStateOptions = {}): Recommendation {
  const state = readOrchestrationState(options);
  const rec = analyzeAndRecommend(state);

  // Write a recommendation receipt — every analysis emits an auditable record.
  const recLog = new RecommendationReceiptsLog(
    options.recommendationReceiptsPath ?? path.join(options.cwd ?? process.cwd(), '.faf-recommendation-receipts.json'),
  );
  recLog.recordRecommendation({
    recommend: rec.recommend,
    mode: rec.mode,
    severity: rec.severity,
    reason: rec.reason,
    drift_signal: rec.hints.drift_signal,
    acknowledged: false,
  });

  return rec;
}
