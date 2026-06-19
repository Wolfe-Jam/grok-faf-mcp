/**
 * ZEPH scoring path — the fast Zig→WASM engine (cascade.wasm) as a flag-gated,
 * parallel high-performance scorer for grok-faf-mcp (Phase II).
 *
 * Hybrid by design: ZEPH returns the score; the existing FafCompiler keeps the
 * per-slot breakdown. Score parity with faf-cli is proven byte-identical 5→100
 * (xai-faf-zeph/benchmarks/parity_vs_cli.mjs) — so routing the score through
 * ZEPH changes nothing about the number, only the cost of computing it.
 *
 * Fail-safe: any engine/runtime error returns null and the caller falls back to
 * the current scorer. ZEPH never breaks scoring; it only accelerates it.
 *
 * Opt-in via FAF_ZEPH=1 (or ZEPH=1). Default off until production-validated.
 */
import { CASCADE_WASM_B64 } from './cascade-wasm.js';

const INPUT_OFFSET = 65536; // inputs past the first 64 KB WASM page (matches ZEPH demo/bench)

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let engine: any | null = null;
let initFailed = false;

async function ensureEngine(): Promise<any | null> { // eslint-disable-line @typescript-eslint/no-explicit-any
  if (engine) return engine;
  if (initFailed) return null;
  try {
    const bytes = Uint8Array.from(Buffer.from(CASCADE_WASM_B64, 'base64'));
    const { instance } = await WebAssembly.instantiate(bytes);
    engine = instance.exports;
    return engine;
  } catch {
    initFailed = true;
    return null;
  }
}

/**
 * Score a `.faf` YAML string via ZEPH cascade.wasm.
 * @returns the 0–100 score, or `null` if the engine is unavailable (caller falls back).
 */
export async function zephScore(yaml: string): Promise<number | null> {
  const c = await ensureEngine();
  if (!c || typeof c.score !== 'function' || !c.memory) return null;
  try {
    const bytes = new TextEncoder().encode(yaml);
    const need = INPUT_OFFSET + bytes.length;
    if (c.memory.buffer.byteLength < need) {
      c.memory.grow(Math.ceil((need - c.memory.buffer.byteLength) / 65536));
    }
    new Uint8Array(c.memory.buffer).set(bytes, INPUT_OFFSET);
    const s = c.score(INPUT_OFFSET, bytes.length);
    return typeof s === 'number' && s >= 0 && s <= 100 ? s : null;
  } catch {
    return null;
  }
}

/** ZEPH scoring is opt-in (Phase II rollout: flag-gated → prod → default). */
export function zephEnabled(): boolean {
  return process.env.FAF_ZEPH === '1' || process.env.ZEPH === '1';
}
