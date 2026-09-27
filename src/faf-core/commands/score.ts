/**
 * faf score - Programmatic API (MCP-ready)
 * No console output, returns structured data.
 *
 * 2.0.0: the score is faf-cli's scoreFafYaml — the always-33 kernel every
 * FAF app scores with. The bundled Mk3.1 FafCompiler is retired (archive tag
 * archive/grok-faf-compiler-mk31).
 */

import { fafCli } from '../../utils/faf-cli-bridge.js';
import { findFafFile } from '../utils/file-utils.js';

export interface ScoreOptions {
  json?: boolean;
}

export interface ScoreResult {
  score: number;
  /** Populated slots. */
  filled: number;
  /** Always 33. */
  total: number;
  /** Slots that count: 33 minus the slotignored ones. */
  active: number;
  ignored: number;
  tier: string;
}

/**
 * Score a .faf file - programmatic API
 * Returns structured data, no console output
 */
export async function scoreFafFile(file?: string, _options: ScoreOptions = {}): Promise<ScoreResult> {
  const fafPath = file || await findFafFile(process.cwd());
  if (!fafPath) {
    throw new Error('No .faf file found');
  }
  const { readFafRaw, scoreFafYaml } = await fafCli;
  const r = scoreFafYaml(readFafRaw(fafPath));
  return {
    score: r.score,
    filled: r.populated,
    total: r.total,
    active: r.active,
    ignored: r.ignored,
    tier: typeof r.tier === 'string' ? r.tier : r.tier?.name ?? '',
  };
}
