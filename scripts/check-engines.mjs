#!/usr/bin/env node
// check-engines.mjs — the Node engine floor must match what CI actually runs.
//
// House rule (memory: feedback-node-engine-floor-and-terminal-release-test):
// `engines.node` == the LOWEST Node in the CI matrix, never aspirational. You
// can't raise the floor without dropping that Node from CI (a visible,
// deliberate act), and you can't claim support for a Node the gate never runs.
// faf-mcp receipt (copied here for grok-faf-mcp 2026-10-01): the floor said >=18 while six production transitives
// required >=20 — every Node-18 install printed EBADENGINE six times.
//
// Runs in CI (Code Quality) and in prepublishOnly.

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFileSync(join(root, p), 'utf8');

const enginesRaw = JSON.parse(read('package.json')).engines?.node ?? '';
const floorMatch = enginesRaw.match(/(\d+)/);
if (!floorMatch) {
  console.error(`✗ package.json engines.node missing or unparseable: ${JSON.stringify(enginesRaw)}`);
  process.exit(1);
}
const floor = Number(floorMatch[1]);

// CI node matrix — this repo writes it as `node: [22.x, 24.x]`.
const ci = read('.github/workflows/ci.yml');
const matrixMatch = ci.match(/node:\s*\[([^\]]+)\]/);
if (!matrixMatch) {
  console.error('✗ .github/workflows/ci.yml — could not find `node: [ ... ]` matrix');
  process.exit(1);
}
const matrix = matrixMatch[1]
  .split(',')
  .map((s) => Number(s.replace(/['"\s]/g, '').replace(/\.x$/, '')))
  .filter((n) => Number.isFinite(n))
  .sort((a, b) => a - b);
if (matrix.length === 0) {
  console.error('✗ CI node matrix parsed empty');
  process.exit(1);
}
const ciMin = matrix[0];

if (floor !== ciMin) {
  console.error(
    `✗ engine floor drift — package.json engines.node = ">=${floor}", CI node matrix low = ${ciMin} (matrix: ${matrix.join(', ')}).\n` +
      `  Make them equal: lower the floor to ${ciMin}, or drop Node ${ciMin} from ci.yml on purpose.`,
  );
  process.exit(1);
}
console.log(`✓ engine floor ${floor} == CI matrix low ${ciMin} (matrix: ${matrix.join(', ')})`);
