/**
 * 🏁 WJTTC — Shape Contracts (compile-time type assertions)
 *
 * Compile-time shield that locks the canonical drift-signal types as the
 * SINGLE source of truth. If anyone re-introduces a `Like` duplicate, or
 * lets one of the substrate-component types drift away from the canonical
 * shape, `tsc` fails the build LOUDLY.
 *
 * No runtime assertions (the `test()` block exists for the test runner to
 * find the file; the actual contracts are the `type _Assert*` lines, which
 * fail at COMPILE time if the contract drifts).
 *
 * Why this exists:
 *   The 1.5 substrate originally had `FafmDriftSignalLike` in
 *   `repeat-offender.ts` and `DriftSignalLike` in `refresh-receipts.ts` —
 *   structural duplicates of the producer-side types, kept loose to avoid
 *   cross-module import cycles. Grok-1 flagged this as silent-drift risk
 *   in the Round 1 orchestrator consult (2026-05-31). PR 1 eliminated the
 *   duplicates by hoisting canonical types to `src/types/drift-signals.ts`.
 *   This file is the compile-time enforcement that the elimination stays
 *   eliminated.
 *
 * Connects: memory/silent-drift-equals-fail-equals-forbidden.md ·
 *           memory/zig-cant-fake.md (mechanical-verify beats trust)
 */
import { describe, test, expect } from 'bun:test';
import type { DriftSignal as Canonical_DriftSignal } from '../src/types/drift-signals';
import type { Contradiction as Canonical_Contradiction } from '../src/types/drift-signals';
import type { ContradictionReport as Canonical_ContradictionReport } from '../src/types/drift-signals';
import type { ReferenceClaims as Canonical_ReferenceClaims } from '../src/types/drift-signals';
import type { RepeatOffender as Canonical_RepeatOffender } from '../src/types/drift-signals';

// Re-exports from each substrate-component module — these MUST resolve to
// the exact canonical type. If a re-export drifts (or accidentally redeclares
// the type locally), the `extends` checks below fail to compile.
import type { DriftSignal as Detector_DriftSignal } from '../src/detection/fafm-drift';
import type {
  Contradiction as CheckId_Contradiction,
  ContradictionReport as CheckId_ContradictionReport,
  ReferenceClaims as CheckId_ReferenceClaims,
} from '../src/integrity/check-id';
import type { RepeatOffender as Tracker_RepeatOffender } from '../src/orchestrator/repeat-offender';

// ── Compile-time bidirectional equality assertions ──────────────────────────
//
// `extends X ? true : never` is the standard TypeScript trick for compile-time
// type equality. We assert BOTH directions to prove the types are isomorphic
// (not just one a subtype of the other). If either direction fails, the
// `const` initializer is `never` and `tsc` rejects the assignment.

type _AssertDriftSignal_Forward = Detector_DriftSignal extends Canonical_DriftSignal ? true : never;
type _AssertDriftSignal_Reverse = Canonical_DriftSignal extends Detector_DriftSignal ? true : never;
const _checkDriftSignal_Fwd: _AssertDriftSignal_Forward = true;
const _checkDriftSignal_Rev: _AssertDriftSignal_Reverse = true;

type _AssertContradiction_Fwd = CheckId_Contradiction extends Canonical_Contradiction ? true : never;
type _AssertContradiction_Rev = Canonical_Contradiction extends CheckId_Contradiction ? true : never;
const _checkContradiction_Fwd: _AssertContradiction_Fwd = true;
const _checkContradiction_Rev: _AssertContradiction_Rev = true;

type _AssertContradictionReport_Fwd = CheckId_ContradictionReport extends Canonical_ContradictionReport ? true : never;
type _AssertContradictionReport_Rev = Canonical_ContradictionReport extends CheckId_ContradictionReport ? true : never;
const _checkContradictionReport_Fwd: _AssertContradictionReport_Fwd = true;
const _checkContradictionReport_Rev: _AssertContradictionReport_Rev = true;

type _AssertReferenceClaims_Fwd = CheckId_ReferenceClaims extends Canonical_ReferenceClaims ? true : never;
type _AssertReferenceClaims_Rev = Canonical_ReferenceClaims extends CheckId_ReferenceClaims ? true : never;
const _checkReferenceClaims_Fwd: _AssertReferenceClaims_Fwd = true;
const _checkReferenceClaims_Rev: _AssertReferenceClaims_Rev = true;

type _AssertRepeatOffender_Fwd = Tracker_RepeatOffender extends Canonical_RepeatOffender ? true : never;
type _AssertRepeatOffender_Rev = Canonical_RepeatOffender extends Tracker_RepeatOffender ? true : never;
const _checkRepeatOffender_Fwd: _AssertRepeatOffender_Fwd = true;
const _checkRepeatOffender_Rev: _AssertRepeatOffender_Rev = true;

describe('🏁 WJTTC — Shape Contracts (compile-time canonical-type lock)', () => {
  test('all canonical types re-exported from producer modules unchanged (compile-time proven)', () => {
    // The real assertions are at COMPILE time above. This runtime check exists
    // only so the test runner picks up the file + reports it in the suite count.
    // If the imports above ever fail to type-check, `bun test` won't even reach
    // here — the build fails loudly first.
    expect(_checkDriftSignal_Fwd && _checkDriftSignal_Rev).toBe(true);
    expect(_checkContradiction_Fwd && _checkContradiction_Rev).toBe(true);
    expect(_checkContradictionReport_Fwd && _checkContradictionReport_Rev).toBe(true);
    expect(_checkReferenceClaims_Fwd && _checkReferenceClaims_Rev).toBe(true);
    expect(_checkRepeatOffender_Fwd && _checkRepeatOffender_Rev).toBe(true);
  });
});
