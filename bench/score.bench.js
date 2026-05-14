#!/usr/bin/env node
/**
 * Mk4 WASM scoring kernel bench
 *
 * Measures faf-scoring-kernel.score_faf(yaml) wall-clock time over
 * a fixed input. Captures hardware + runtime + methodology + results
 * as a JSON receipt suitable for archival and public quote.
 *
 * Path measured: direct kernel.score_faf(yaml) call. No HTTP. No MCP wire.
 * No file I/O inside the loop (input loaded once, held in memory).
 */

const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');
const { performance } = require('perf_hooks');

const ROOT = path.resolve(__dirname, '..');
const FAF_PATH = path.join(ROOT, 'project.faf');
const OUTPUT_PATH = path.join(__dirname, 'results-2026-05-14.json');
const WARMUP = 100;
const ITERATIONS = 1000;
const BATCHES = 3;

function statsOf(timings) {
  const sorted = [...timings].sort((a, b) => a - b);
  const sum = sorted.reduce((a, b) => a + b, 0);
  return {
    min_ms: sorted[0],
    p50_ms: sorted[Math.floor(sorted.length * 0.5)],
    p95_ms: sorted[Math.floor(sorted.length * 0.95)],
    p99_ms: sorted[Math.floor(sorted.length * 0.99)],
    max_ms: sorted[sorted.length - 1],
    mean_ms: sum / sorted.length,
    iterations: sorted.length
  };
}

function fmt(n) { return n.toFixed(4); }

function benchOne(yaml, kernel) {
  // Warmup
  for (let i = 0; i < WARMUP; i++) kernel.score_faf(yaml);
  // Measure
  const timings = new Array(ITERATIONS);
  for (let i = 0; i < ITERATIONS; i++) {
    const start = performance.now();
    kernel.score_faf(yaml);
    timings[i] = performance.now() - start;
  }
  return statsOf(timings);
}

function main() {
  const kernel = require('faf-scoring-kernel');
  const yaml = fs.readFileSync(FAF_PATH, 'utf-8');
  const fafHash = crypto.createHash('sha256').update(yaml).digest('hex').slice(0, 16);
  const sanity = JSON.parse(kernel.score_faf(yaml));

  console.log(`Input: ${FAF_PATH}`);
  console.log(`  ${yaml.length} bytes, sha256:${fafHash}`);
  console.log(`Kernel sanity: score=${sanity.score}%  populated=${sanity.populated}/${sanity.active}`);
  console.log(`Running ${BATCHES} batches × ${ITERATIONS} iterations (${WARMUP} warmup each)...\n`);

  const batches = [];
  for (let b = 0; b < BATCHES; b++) {
    process.stdout.write(`  batch ${b + 1}/${BATCHES}... `);
    const t0 = performance.now();
    const result = benchOne(yaml, kernel);
    const elapsedSec = (performance.now() - t0) / 1000;
    batches.push(result);
    console.log(`done in ${elapsedSec.toFixed(2)}s`);
  }

  // Aggregate across batches (min/median of medians for stability)
  const medians = batches.map(b => b.p50_ms).sort((a, b) => a - b);
  const opsPerSec = 1000 / medians[Math.floor(medians.length / 2)];

  const receipt = {
    schema: 'grok-faf-mcp/bench/score@1',
    date: new Date().toISOString(),
    measurer: 'wolfejam',
    target: {
      module: 'faf-scoring-kernel',
      version: require('faf-scoring-kernel/package.json').version,
      entry: 'kernel.score_faf(yaml) — Mk4 WASM kernel call',
      path_measured: 'YAML string in → JSON score out. No HTTP, no MCP wire, no file I/O in loop.'
    },
    hardware: {
      os: `${os.type()} ${os.release()}`,
      platform: process.platform,
      arch: process.arch,
      cpu: os.cpus()[0].model,
      cores: os.cpus().length,
      total_mem_mb: Math.round(os.totalmem() / 1024 / 1024)
    },
    runtime: {
      node: process.version,
      v8: process.versions.v8
    },
    input: {
      path: FAF_PATH,
      size_bytes: yaml.length,
      sha256_16: fafHash,
      score_returned_pct: sanity.score,
      populated_active: `${sanity.populated}/${sanity.active}`
    },
    method: {
      warmup_iterations: WARMUP,
      measured_iterations_per_batch: ITERATIONS,
      batches: BATCHES,
      units: 'milliseconds (wall clock via performance.now)'
    },
    results: {
      per_batch: batches,
      cross_batch_median_p50_ms: medians[Math.floor(medians.length / 2)],
      ops_per_second_at_median: Math.round(opsPerSec)
    }
  };

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(receipt, null, 2));

  console.log('\n=== Results ===');
  batches.forEach((b, i) => {
    console.log(`batch ${i + 1}: min=${fmt(b.min_ms)}ms  p50=${fmt(b.p50_ms)}ms  p95=${fmt(b.p95_ms)}ms  p99=${fmt(b.p99_ms)}ms  max=${fmt(b.max_ms)}ms  mean=${fmt(b.mean_ms)}ms`);
  });
  console.log(`\nCross-batch p50: ${fmt(receipt.results.cross_batch_median_p50_ms)} ms`);
  console.log(`Ops/sec (at median): ${receipt.results.ops_per_second_at_median.toLocaleString()}`);
  console.log(`\nReceipt saved: ${OUTPUT_PATH}`);
}

main();
