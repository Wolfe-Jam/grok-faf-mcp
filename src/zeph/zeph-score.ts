/**
 * ZEPH scoring path — the fast Zig→WASM engine (cascade.wasm), the delivery
 * system for the Zig score.
 *
 * OFF by default since 2.0.0. Every FAF app scores always-33 (faf-cli 8's
 * kernel). ZEPH delivers the Zig score exactly (the embedded blob is
 * byte-identical to cascade's build), but that Zig `score` is the older
 * 21-slot model: it matched always-33 on 47 of 80 FAF repos (2026-09-26).
 * Until the Zig engine is proven to give the always-33 number on every file,
 * faf-cli's scoreFafYaml is the score, and ZEPH is opt-in: USE_ZEPH=1
 * (or FAF_ZEPH=1 / ZEPH=1).
 *
 * Fail-safe: any engine/runtime error returns null and the caller keeps the
 * canonical score.
 */
import { CASCADE_WASM_B64 } from './cascade-wasm.js';

// Minimal ambient type for the one WASM API we use — the repo's tsconfig `lib`
// is ES2022-only (no DOM/WebWorker), so `WebAssembly` isn't otherwise declared.
// It's a runtime global in both Node and Cloudflare Workers; we only need instantiate().
declare const WebAssembly: {
  instantiate(bytes: Uint8Array): Promise<{ instance: { exports: Record<string, any> } }>;
};

const INPUT_OFFSET = 65536; // inputs past the first 64 KB WASM page (matches ZEPH demo/bench)

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let engine: any = null; // eslint-disable-line @typescript-eslint/no-explicit-any
let initFailed = false;

async function ensureEngine(): Promise<any> { // eslint-disable-line @typescript-eslint/no-explicit-any
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

/**
 * ZEPH is opt-in (OFF by default since 2.0.0): the Zig score is not yet the
 * always-33 number. USE_ZEPH=1 / FAF_ZEPH=1 / ZEPH=1 turns it on.
 */
export function zephEnabled(): boolean {
  const on = (v: string | undefined): boolean => v === '1' || v === 'true' || v === 'on';
  return on(process.env.USE_ZEPH) || on(process.env.FAF_ZEPH) || on(process.env.ZEPH);
}
