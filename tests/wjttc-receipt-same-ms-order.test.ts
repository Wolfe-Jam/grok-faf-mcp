/**
 * 🏁 WJTTC — same-millisecond receipts still read newest-first (all 4 logs)
 *
 * Every receipt log sorts newest-first by its ISO timestamp. Two receipts
 * written in the same millisecond compare equal, and the stable sort kept them
 * in write order — oldest first. On a fast CI runner the faf_memory
 * filtered → summary pair in wjttc-frc-usage-receipt-wiring landed in one ms
 * and read back the older receipt (ubuntu, run 34900366588). A tie now reads
 * the most recently written receipt first, and `limit` keeps it.
 */
import { describe, it, expect } from 'bun:test';
import { filterReceipts, type RefreshReceipt } from '../src/telemetry/refresh-receipts';
import { filterFafmReceipts, type FafmRefreshReceipt } from '../src/telemetry/fafm-refresh-receipts';
import { filterFrcUsage, type FrcUsageReceipt } from '../src/telemetry/frc-usage-receipts';
import {
  filterRecommendations,
  type RecommendationReceipt,
} from '../src/telemetry/recommendation-receipts';

const SAME_MS = '2026-09-14T21:43:46.459Z';

describe('🏁 WJTTC — same-ms receipts read newest-first', () => {
  it('FRC usage receipts (the faf_memory pair that flaked)', () => {
    const older: FrcUsageReceipt = { tool: 'faf_memory', fired_at: SAME_MS, outcome: { matched: 1 } };
    const newer: FrcUsageReceipt = { tool: 'faf_memory', fired_at: SAME_MS, outcome: { summary: 2 } };
    const log = [older, newer]; // write order
    expect(filterFrcUsage(log)[0]).toBe(newer);
    expect(filterFrcUsage(log, { limit: 1 })).toEqual([newer]);
    expect(log).toEqual([older, newer]); // input untouched — still a pure function
  });

  it('refresh receipts', () => {
    const older: RefreshReceipt = { trigger: 'manual', mode: 'blend', fired_at: SAME_MS };
    const newer: RefreshReceipt = { trigger: 'auto', mode: 'nuke', fired_at: SAME_MS };
    const log = [older, newer];
    expect(filterReceipts(log)[0]).toBe(newer);
    expect(filterReceipts(log, { limit: 1 })).toEqual([newer]);
    expect(log).toEqual([older, newer]);
  });

  it('.fafm refresh receipts', () => {
    const older: FafmRefreshReceipt = { trigger: 'manual', mode: 'delta', fired_at: SAME_MS };
    const newer: FafmRefreshReceipt = { trigger: 'auto', mode: 'verbatim', fired_at: SAME_MS };
    const log = [older, newer];
    expect(filterFafmReceipts(log)[0]).toBe(newer);
    expect(filterFafmReceipts(log, { limit: 1 })).toEqual([newer]);
    expect(log).toEqual([older, newer]);
  });

  it('recommendation receipts', () => {
    const older: RecommendationReceipt = {
      recommended_at: SAME_MS,
      recommend: 'no_action',
      severity: 'none',
      reason: 'older',
      acknowledged: false,
    };
    const newer: RecommendationReceipt = {
      recommended_at: SAME_MS,
      recommend: 'refresh_faf',
      severity: 'light',
      reason: 'newer',
      acknowledged: false,
    };
    const log = [older, newer];
    expect(filterRecommendations(log)[0]).toBe(newer);
    expect(filterRecommendations(log, { limit: 1 })).toEqual([newer]);
    expect(log).toEqual([older, newer]);
  });
});
