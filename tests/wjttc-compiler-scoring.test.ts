/**
 * WJTTC Compiler Scoring Tests
 * Championship-grade tests for FafCompiler scoring engine
 * Ported from claude-faf-mcp + type-definitions + parity tests
 *
 * Covers: Mk4 WASM kernel, Bouncer pattern, type system,
 * slot_ignore, alias resolution, edge cases, determinism
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { FafCompiler, compile } from '../src/faf-core/compiler/faf-compiler';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';

// Test temp directory — never touch real project files
let tmpDir: string;

beforeAll(async () => {
  tmpDir = path.join(os.tmpdir(), `grok-compiler-test-${Date.now()}`);
  await fs.mkdir(tmpDir, { recursive: true });
});

afterAll(async () => {
  await fs.rm(tmpDir, { recursive: true, force: true });
});

async function writeFaf(name: string, content: string): Promise<string> {
  const filePath = path.join(tmpDir, name);
  await fs.writeFile(filePath, content, 'utf-8');
  return filePath;
}

async function scoreFaf(content: string, name = 'test.faf'): Promise<any> {
  const filePath = await writeFaf(name, content);
  const compiler = new FafCompiler();
  return compiler.compile(filePath);
}

// ============================================================================
// TIER 1: BRAKE TESTS — Compiler Must Never Crash
// ============================================================================

describe('Tier 1: Brake — No Crash', () => {
  it('should handle empty YAML object', async () => {
    const result = await scoreFaf('{}');
    expect(result.score).toBeDefined();
    expect(typeof result.score).toBe('number');
  });

  it('should handle empty file', async () => {
    const result = await scoreFaf('');
    expect(result.score).toBeDefined();
  });

  it('should handle whitespace-only file', async () => {
    const result = await scoreFaf('   \n\n  \t  \n');
    expect(result.score).toBeDefined();
  });

  it('should handle markdown (not YAML)', async () => {
    const result = await scoreFaf('# This is markdown\n\nNot YAML at all.');
    expect(result.score).toBeDefined();
  });

  it('should handle deeply nested YAML', async () => {
    const result = await scoreFaf(`
project:
  name: deep
  goal: test
  main_language: YAML
  nested:
    level1:
      level2:
        level3:
          level4: value
`);
    expect(result.score).toBeDefined();
  });

  it('should handle YAML with comments', async () => {
    const result = await scoreFaf(`
# This is a comment
project:
  name: commented # inline comment
  goal: test goal
  # another comment
  main_language: TypeScript
`);
    expect(result.score).toBeDefined();
    expect(result.score).toBeGreaterThan(0);
  });
});

// ============================================================================
// TIER 2: ENGINE TESTS — Scoring Accuracy
// ============================================================================

describe('Tier 2: Engine — Scoring Accuracy', () => {
  it('should score 100% for complete CLI project', async () => {
    const result = await scoreFaf(`
project:
  name: my-cli
  type: cli
  goal: Command line tool
  main_language: TypeScript
human_context:
  who: Developer
  what: CLI tool for automation
  why: Simplify workflows
  where: Terminal
  when: "2026"
  how: Node.js runtime
`);
    expect(result.score).toBe(100);
    expect(result.total).toBe(9);
  });

  it('should score 100% for complete fullstack project (21 slots)', async () => {
    const result = await scoreFaf(`
project:
  name: my-app
  type: fullstack
  goal: Full stack web app
  main_language: TypeScript
stack:
  frontend: React
  css_framework: Tailwind
  ui_library: Radix
  state_management: Zustand
  backend: Express
  api_type: REST
  runtime: Node.js
  database: PostgreSQL
  connection: pg
  hosting: Vercel
  build: Vite
  cicd: GitHub Actions
human_context:
  who: Developer
  what: Web application
  why: Serve users
  where: Cloud
  when: "2026"
  how: Modern stack
`);
    expect(result.score).toBe(100);
    expect(result.total).toBe(21);
  });

  it('should score 0% for empty project', async () => {
    const result = await scoreFaf(`
project: {}
stack: {}
human_context: {}
`);
    expect(result.score).toBe(0);
  });

  it('should never have filled exceed total', async () => {
    const result = await scoreFaf(`
project:
  name: test
  goal: test
  main_language: TypeScript
`);
    expect(result.filled).toBeLessThanOrEqual(result.total);
  });

  it('should return integer scores', async () => {
    const result = await scoreFaf(`
project:
  name: test
  type: cli
  goal: test
  main_language: TypeScript
human_context:
  who: Developer
  what: Test
`);
    expect(Number.isInteger(result.score)).toBe(true);
  });

  it('should have breakdown sections sum to total', async () => {
    const result = await scoreFaf(`
project:
  name: test
  type: fullstack
  goal: test
  main_language: TypeScript
stack:
  frontend: React
  backend: Express
human_context:
  who: Dev
`);
    const { project, stack, human } = result.breakdown;
    const sectionTotal = project.total + stack.total + human.total + (result.breakdown.discovery?.total || 0);
    expect(sectionTotal).toBe(result.total);
  });
});

// ============================================================================
// TIER 3: AERO TESTS — Edge Cases & Slot Values
// ============================================================================

describe('Tier 3: Aero — Edge Cases', () => {
  it('should treat null values as empty', async () => {
    const result = await scoreFaf(`
project:
  name: null
  goal: null
  main_language: null
`);
    expect(result.score).toBe(0);
  });

  it('should treat empty strings as empty', async () => {
    const result = await scoreFaf(`
project:
  name: ""
  goal: ""
  main_language: ""
`);
    expect(result.score).toBe(0);
  });

  it('should treat "None" and "Unknown" as empty', async () => {
    const result = await scoreFaf(`
project:
  name: None
  goal: Unknown
  main_language: "Not specified"
`);
    expect(result.score).toBe(0);
  });

  it('should accept numeric values as filled', async () => {
    const result = await scoreFaf(`
project:
  name: 42
  type: cli
  goal: test
  main_language: TypeScript
`);
    expect(result.filled).toBeGreaterThan(0);
  });

  it('should accept unicode/emoji values as filled', async () => {
    const result = await scoreFaf(`
project:
  name: "🚀 My Project"
  type: cli
  goal: "Build something great 🏆"
  main_language: TypeScript
`);
    expect(result.filled).toBeGreaterThanOrEqual(3);
  });

  it('should produce deterministic scores', async () => {
    const yaml = `
project:
  name: determinism-test
  type: cli
  goal: Testing
  main_language: TypeScript
human_context:
  who: Tester
`;
    const result1 = await scoreFaf(yaml, 'det1.faf');
    const result2 = await scoreFaf(yaml, 'det2.faf');
    expect(result1.score).toBe(result2.score);
    expect(result1.filled).toBe(result2.filled);
    expect(result1.total).toBe(result2.total);
    expect(result1.checksum).toBe(result2.checksum);
  });

  it('should reduce denominator with slot_ignore', async () => {
    const withIgnore = await scoreFaf(`
project:
  name: test
  type: cli
  goal: test
  main_language: TypeScript
slot_ignore: [who, what]
human_context:
  who: Dev
  what: Test
  why: Because
  where: Here
  when: Now
  how: Magic
`);

    const withoutIgnore = await scoreFaf(`
project:
  name: test
  type: cli
  goal: test
  main_language: TypeScript
human_context:
  who: Dev
  what: Test
  why: Because
  where: Here
  when: Now
  how: Magic
`);

    expect(withIgnore.total).toBeLessThan(withoutIgnore.total);
  });

  it('should handle slot_ignore as comma-separated string', async () => {
    const result = await scoreFaf(`
project:
  name: test
  type: cli
  goal: test
  main_language: TypeScript
slot_ignore: "who, what"
human_context:
  why: Because
  where: Here
  when: Now
  how: Magic
`);
    // 9 cli slots - 2 ignored = 7
    expect(result.total).toBe(7);
  });
});

// ============================================================================
// TIER 4: SAFETY TESTS — Error Handling
// ============================================================================

describe('Tier 4: Safety — Error Handling', () => {
  it('should throw on nonexistent file', async () => {
    const compiler = new FafCompiler();
    await expect(compiler.compile('/nonexistent/path/fake.faf')).rejects.toThrow();
  });

  it('should throw on directory path', async () => {
    const compiler = new FafCompiler();
    await expect(compiler.compile(tmpDir)).rejects.toThrow();
  });

  it('should handle binary file content', async () => {
    const binaryPath = path.join(tmpDir, 'binary.faf');
    const buf = Buffer.alloc(256);
    for (let i = 0; i < 256; i++) buf[i] = i;
    await fs.writeFile(binaryPath, buf);

    const compiler = new FafCompiler();
    const result = await compiler.compile(binaryPath);
    expect(result.score).toBeDefined();
  });

  it('should handle invalid YAML syntax', async () => {
    const result = await scoreFaf(`
project:
  name: test
    bad_indent: this is invalid
  goal: test
`);
    expect(result.score).toBeDefined();
  });

  it('should populate diagnostics on issues', async () => {
    const result = await scoreFaf(`
ai_score: 92
project:
  name: test
`);
    // ai_score is deprecated, should generate a diagnostic
    expect(result.diagnostics.length).toBeGreaterThan(0);
  });
});

// ============================================================================
// TYPE DEFINITIONS — Project Type Slot Counts
// ============================================================================

describe('Type Definitions — Slot Counts', () => {
  it('cli should have 9 slots (project + human)', async () => {
    const result = await scoreFaf(`
project:
  name: test
  type: cli
  goal: test
  main_language: TypeScript
`);
    expect(result.total).toBe(9);
  });

  it('cli-tool should have 9 slots (same as cli)', async () => {
    const result = await scoreFaf(`
project:
  name: test
  type: cli-tool
  goal: test
  main_language: TypeScript
`);
    expect(result.total).toBe(9);
  });

  it('mcp-server should have 14 slots (project + backend + human)', async () => {
    const result = await scoreFaf(`
project:
  name: test
  type: mcp-server
  goal: test
  main_language: TypeScript
`);
    expect(result.total).toBe(14);
  });

  it('frontend should have 16 slots (project + frontend + universal + human)', async () => {
    const result = await scoreFaf(`
project:
  name: test
  type: frontend
  goal: test
  main_language: TypeScript
`);
    expect(result.total).toBe(16);
  });

  it('react should have 16 slots (same as frontend)', async () => {
    const result = await scoreFaf(`
project:
  name: test
  type: react
  goal: test
  main_language: TypeScript
`);
    expect(result.total).toBe(16);
  });

  it('backend-api should have 17 slots (project + backend + universal + human)', async () => {
    const result = await scoreFaf(`
project:
  name: test
  type: backend-api
  goal: test
  main_language: TypeScript
`);
    expect(result.total).toBe(17);
  });

  it('fullstack should have 21 slots (all categories)', async () => {
    const result = await scoreFaf(`
project:
  name: test
  type: fullstack
  goal: test
  main_language: TypeScript
`);
    expect(result.total).toBe(21);
  });

  it('monorepo should have 21 slots (all categories)', async () => {
    const result = await scoreFaf(`
project:
  name: test
  type: monorepo
  goal: test
  main_language: TypeScript
`);
    expect(result.total).toBe(21);
  });

  it('chrome-extension should have 9 slots (project + human)', async () => {
    const result = await scoreFaf(`
project:
  name: test
  type: chrome-extension
  goal: test
  main_language: JavaScript
`);
    expect(result.total).toBe(9);
  });

  it('generic fallback should have 12 slots (project + universal + human)', async () => {
    const result = await scoreFaf(`
project:
  name: test
  goal: test
  main_language: TypeScript
`);
    expect(result.total).toBe(12);
  });
});

// ============================================================================
// ALIAS RESOLUTION
// ============================================================================

describe('Alias Resolution', () => {
  it('k8s should resolve to kubernetes (9 slots)', async () => {
    const result = await scoreFaf(`
project:
  name: test
  type: k8s
  goal: test
  main_language: YAML
`);
    expect(result.total).toBe(9);
  });

  it('tf should resolve to terraform (9 slots)', async () => {
    const result = await scoreFaf(`
project:
  name: test
  type: tf
  goal: test
  main_language: HCL
`);
    expect(result.total).toBe(9);
  });

  it('rn should resolve to react-native (13 slots)', async () => {
    const result = await scoreFaf(`
project:
  name: test
  type: rn
  goal: test
  main_language: TypeScript
`);
    expect(result.total).toBe(13);
  });

  it('next should resolve to nextjs (21 slots)', async () => {
    const result = await scoreFaf(`
project:
  name: test
  type: next
  goal: test
  main_language: TypeScript
`);
    expect(result.total).toBe(21);
  });

  it('flask should resolve to python-api (17 slots)', async () => {
    const result = await scoreFaf(`
project:
  name: test
  type: flask
  goal: test
  main_language: Python
`);
    expect(result.total).toBe(17);
  });

  it('express should resolve to node-api (17 slots)', async () => {
    const result = await scoreFaf(`
project:
  name: test
  type: express
  goal: test
  main_language: TypeScript
`);
    expect(result.total).toBe(17);
  });

  it('turbo should resolve to turborepo (21 slots)', async () => {
    const result = await scoreFaf(`
project:
  name: test
  type: turbo
  goal: test
  main_language: TypeScript
`);
    expect(result.total).toBe(21);
  });

  it('gha should resolve to github-action (9 slots)', async () => {
    const result = await scoreFaf(`
project:
  name: test
  type: gha
  goal: test
  main_language: YAML
`);
    expect(result.total).toBe(9);
  });
});

// ============================================================================
// SLOT_IGNORE EDGE CASES
// ============================================================================

describe('slot_ignore Edge Cases', () => {
  it('should handle slot_ignore as array', async () => {
    const result = await scoreFaf(`
project:
  name: test
  type: cli
  goal: test
  main_language: TypeScript
slot_ignore:
  - who
  - what
human_context:
  why: Because
  where: Here
  when: Now
  how: Magic
`);
    expect(result.total).toBe(7); // 9 - 2
  });

  it('should handle shorthand names (who -> human.who)', async () => {
    const result = await scoreFaf(`
project:
  name: test
  type: cli
  goal: test
  main_language: TypeScript
slot_ignore: [hosting]
human_context:
  who: Dev
  what: Test
  why: Because
  where: Here
  when: Now
  how: Magic
`);
    // hosting is not in cli's applicable slots anyway, so no change
    expect(result.total).toBe(9);
  });

  it('should handle empty slot_ignore gracefully', async () => {
    const result = await scoreFaf(`
project:
  name: test
  type: cli
  goal: test
  main_language: TypeScript
slot_ignore: []
`);
    expect(result.total).toBe(9);
  });

  it('should handle nonexistent slot gracefully', async () => {
    const result = await scoreFaf(`
project:
  name: test
  type: cli
  goal: test
  main_language: TypeScript
slot_ignore: [nonexistent_slot]
`);
    expect(result.total).toBe(9); // no valid slot to ignore
  });
});

// ============================================================================
// REGRESSION GUARDS
// ============================================================================

describe('Regression Guards', () => {
  it('score should never exceed 100', async () => {
    const result = await scoreFaf(`
project:
  name: test
  type: cli
  goal: test
  main_language: TypeScript
  extra_field_1: value
  extra_field_2: value
human_context:
  who: Dev
  what: Test
  why: Because
  where: Here
  when: Now
  how: Magic
`);
    expect(result.score).toBeLessThanOrEqual(100);
  });

  it('score should never go negative', async () => {
    const result = await scoreFaf('{}');
    expect(result.score).toBeGreaterThanOrEqual(0);
  });

  it('total slots should never exceed 21', async () => {
    const result = await scoreFaf(`
project:
  name: test
  type: fullstack
  goal: test
  main_language: TypeScript
stack:
  frontend: React
  css_framework: Tailwind
  ui_library: Radix
  state_management: Zustand
  backend: Express
  api_type: REST
  runtime: Node.js
  database: PostgreSQL
  connection: pg
  hosting: Vercel
  build: Vite
  cicd: GitHub Actions
human_context:
  who: Dev
  what: Test
  why: Because
  where: Here
  when: Now
  how: Magic
`);
    expect(result.total).toBeLessThanOrEqual(21);
  });
});

// ============================================================================
// SPECIAL TYPE CASES
// ============================================================================

describe('Special Type Cases', () => {
  it('data-science should have 14 slots', async () => {
    const result = await scoreFaf(`
project:
  name: test
  type: data-science
  goal: test
  main_language: Python
`);
    expect(result.total).toBe(14);
  });

  it('ml-model should have 14 slots', async () => {
    const result = await scoreFaf(`
project:
  name: test
  type: ml-model
  goal: test
  main_language: Python
`);
    expect(result.total).toBe(14);
  });

  it('jupyter should have 9 slots', async () => {
    const result = await scoreFaf(`
project:
  name: test
  type: jupyter
  goal: test
  main_language: Python
`);
    expect(result.total).toBe(9);
  });

  it('smart-contract should have 9 slots', async () => {
    const result = await scoreFaf(`
project:
  name: test
  type: smart-contract
  goal: test
  main_language: Solidity
`);
    expect(result.total).toBe(9);
  });

  it('dapp should have 13 slots', async () => {
    const result = await scoreFaf(`
project:
  name: test
  type: dapp
  goal: test
  main_language: TypeScript
`);
    expect(result.total).toBe(13);
  });

  it('library should have 9 slots', async () => {
    const result = await scoreFaf(`
project:
  name: test
  type: library
  goal: test
  main_language: TypeScript
`);
    expect(result.total).toBe(9);
  });
});
