/**
 * 🏎️ Refresh Blend (1.5 — baked-in two-intensity refresh, Cmd+R / Cmd+Shift+R analog)
 *
 * The blend doctrine is BAKED IN, not a dial — every refresh fires BOTH layers:
 *
 *   blend mode (Cmd+R analog, the everyday default):
 *     - refresh_faf  (light — .faf is project DNA, changes slowly)
 *     - refresh_fafm (delta — memory pollutes continuously, deltas are cheap)
 *
 *   nuke mode (Cmd+Shift+R analog, the hard reload):
 *     - refresh_faf  (the only refresh_faf intensity)
 *     - refresh_fafm (verbatim — full content reload, bypass the polluted cache)
 *
 * Intensity matches drift rate per layer. Cost matches the rot location.
 *
 * Spec source:
 *   ~/PLANET-FAF/docs/GROK-FAF-MCP-1.5-CODING-SESSION-BREAKDOWN-2026-05-30.md §#5
 *   memory/refresh-fafm-cmd-shift-r.md   (LOCK: "blend = light .faf + strong .fafm,
 *                                                BAKED IN, NOT a dial")
 *
 * Pure orchestrator — takes refresh callables as inputs, composes them. The
 * MCP handler in tools.ts binds the real `handleFafRefresh` / `handleFafmRefresh`
 * methods; this module orchestrates regardless of the binding.
 *
 * Output parity (spec requirement): the OUTER shape is identical across modes.
 * Internal fafm payload differs (delta vs content, mutually exclusive per
 * refresh_fafm's locked signature) — that's the layer's contract, not a parity
 * violation.
 */

import type { RefreshMode } from '../types/refresh';

// Re-export the canonical type so existing importers (`from '../orchestrator/refresh-blend'`)
// keep working unchanged. Single source of truth lives in `src/types/refresh.ts`.
export type { RefreshMode } from '../types/refresh';

/** Caller-facing args. Passed through to the appropriate underlying refresh. */
export interface RefreshBlendInput {
  /** Defaults to `'blend'` (Cmd+R analog — the everyday default). */
  mode?: RefreshMode;
  /** For refresh_faf: optional baseline score for drift delta reporting. */
  baseline?: number;
  /** For refresh_faf: project directory or .faf path. */
  path?: string;
  /** For refresh_fafm: specific soul to refresh. Defaults to 'default'. */
  soul?: string;
  /** For refresh_fafm: ISO timestamp baseline (delta mode only). */
  since?: string;
}

/**
 * Parity-shape result. Same fields regardless of mode — `mode` is the
 * discriminator. The fafm result's internal payload differs (delta vs content)
 * but the outer envelope is identical.
 */
export interface RefreshBlendResult {
  mode: RefreshMode;
  /** Raw result from refresh_faf (the MCP CallToolResult or equivalent shape). */
  faf: unknown;
  /** Raw result from refresh_fafm (the MCP CallToolResult or equivalent shape). */
  fafm: unknown;
  /** When this blend was orchestrated. Useful for telemetry (#7) downstream. */
  detected_at: string;
}

/** Injected callables — keeps `runRefreshBlend` pure / testable / handler-agnostic. */
export interface RefreshCallables {
  refreshFaf: (args: { baseline?: number; path?: string }) => Promise<unknown>;
  refreshFafm: (args: { soul?: string; verbatim?: boolean; since?: string }) => Promise<unknown>;
}

/**
 * Orchestrate a baked-in blend refresh. Fires BOTH refresh primitives at the
 * intensity that matches the mode and layer.
 *
 *   blend mode: refresh_faf() + refresh_fafm({ delta }) — default
 *   nuke mode:  refresh_faf() + refresh_fafm({ verbatim: true })
 *
 * Both primitives run; the blend never "skips" a layer (that would break the
 * doctrine — drift can land on either layer, you always want signal from both).
 *
 * Sequential, not parallel — the two operations are cheap and sequential
 * keeps the FS access pattern predictable. Optimize later only if measured
 * latency demands it.
 *
 * Same input → same parity-shape output (modulo `detected_at`). The function
 * is pure modulo wall-clock + the injected callables.
 */
export async function runRefreshBlend(
  input: RefreshBlendInput,
  callables: RefreshCallables,
): Promise<RefreshBlendResult> {
  const mode: RefreshMode = input.mode ?? 'blend';

  // refresh_faf has no intensity flag — it IS the light primitive. Pass
  // through baseline + path; the underlying handler honors both.
  const fafResult = await callables.refreshFaf({
    baseline: input.baseline,
    path: input.path,
  });

  // refresh_fafm intensity = verbatim flag. `nuke` requests verbatim; `blend`
  // uses the locked delta default. `since` is ignored when verbatim=true per
  // refresh_fafm's locked spec — the orchestrator preserves that contract.
  const fafmArgs: { soul?: string; verbatim?: boolean; since?: string } = {
    soul: input.soul,
  };
  if (mode === 'nuke') {
    fafmArgs.verbatim = true;
  } else if (input.since !== undefined) {
    fafmArgs.since = input.since;
  }
  const fafmResult = await callables.refreshFafm(fafmArgs);

  return {
    mode,
    faf: fafResult,
    fafm: fafmResult,
    detected_at: new Date().toISOString(),
  };
}
