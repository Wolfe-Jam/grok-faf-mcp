/**
 * Composed Turbo-Cat — single-source stack detection via faf-cli.
 *
 * faf-cli's turbo-cat (the ~200-format knowledge base, content-aware Dart/Flutter
 * since 6.13.0) is public via `turboCatSlots`. grok COMPOSES it — it does NOT
 * fork a detector. The championship generator uses this as an authoritative
 * gap-fill for the stack slots, so every stack faf-cli knows (Dart/Flutter
 * included) reaches grok BY CONSTRUCTION. Requires faf-cli >= 6.13.0 for Dart.
 *
 * The feature-detect + null-return survive a mis-installed older faf-cli
 * (degrade to fab-formats only) rather than crash — detection must never break
 * a tool. Mirrors claude-faf-mcp's turbocat-bridge; the seam is identical.
 */
import { fafCli } from "../../utils/faf-cli-bridge";

/** faf-cli's `turboCatSlots` shape — a .faf-routed partial. */
export interface TurboCatSlots {
  project?: Record<string, string>;
  stack?: Record<string, string>;
}

type TurboCatCapable = {
  turboCatSlots?: (dir: string) => TurboCatSlots;
};

/** `.faf`-routed slot fills ({project, stack}) from faf-cli, or null if unavailable. */
export async function composedTurboCatSlots(dir: string): Promise<TurboCatSlots | null> {
  try {
    const mod = (await fafCli) as unknown as TurboCatCapable;
    if (typeof mod.turboCatSlots === "function") return mod.turboCatSlots(dir);
  } catch {
    /* unavailable — caller degrades to fab-formats only */
  }
  return null;
}
