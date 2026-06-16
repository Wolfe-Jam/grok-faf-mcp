import { test, expect, describe, beforeEach, afterEach } from 'bun:test';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { composedTurboCatSlots } from '../src/faf-core/extract/turbocat-bridge';
import { autoCommand } from '../src/faf-core/commands/auto';

// 🏎️ WJTTC — Dart/Flutter by COMPOSITION (faf-cli >= 6.13.0).
//
// grok composes faf-cli's turbo-cat (the Truth) for stack detection; it does
// NOT fork a pubspec parser. The drift Randal Schwartz exposed (a pubspec
// invisible to the MCP — main_language defaulting to JavaScript) is fixed at
// the source. These pass once grok is on faf-cli >= 6.13.0 (the dep range).

describe('AERO — Dart/Flutter via composed turbo-cat', () => {
  let dir: string;
  const file = (rel: string, c = '') => {
    const p = path.join(dir, rel);
    fs.mkdirSync(path.dirname(p), { recursive: true });
    fs.writeFileSync(p, c);
  };
  beforeEach(() => { dir = fs.mkdtempSync(path.join(os.tmpdir(), 'grok-dart-')); });
  afterEach(() => { try { fs.rmSync(dir, { recursive: true, force: true }); } catch { /* */ } });

  test('D1 — composedTurboCatSlots: Flutter app → main_language Dart, frontend Flutter, pub', async () => {
    file('pubspec.yaml', 'name: my_app\ndependencies:\n  flutter:\n    sdk: flutter\n  flutter_riverpod: ^2.5.0\n');
    file('lib/main.dart', '');
    const s = await composedTurboCatSlots(dir);
    expect(s).not.toBeNull();
    expect(s!.project?.main_language).toBe('Dart');
    expect(s!.stack?.frontend).toBe('Flutter');
    expect(s!.stack?.package_manager).toBe('pub');
  });

  test('D2 — the no-guess proof: a pure-Dart CLI is Dart, NOT Flutter', async () => {
    file('pubspec.yaml', 'name: mytool\nexecutables:\n  mytool:\ndependencies:\n  args: ^2.5.0\n');
    const s = await composedTurboCatSlots(dir);
    expect(s!.project?.main_language).toBe('Dart');
    expect(s!.stack?.frontend).toBeUndefined();   // NOT Flutter
  });

  test('D3 — a Dart MCP server → api_type MCP', async () => {
    file('pubspec.yaml', 'name: my_mcp\ndependencies:\n  dart_mcp: ^0.2.0\n');
    const s = await composedTurboCatSlots(dir);
    expect(s!.stack?.api_type).toBe('MCP');
  });

  test('D4 — INTEGRATION: autoCommand writes a Dart/Flutter .faf', async () => {
    file('pubspec.yaml', 'name: weather\ndescription: A Flutter app\ndependencies:\n  flutter:\n    sdk: flutter\n');
    file('lib/main.dart', '');
    const res = await autoCommand(dir, { force: true });
    expect(res.success).toBe(true);
    const faf = fs.readFileSync(res.initResult!.outputPath!, 'utf-8');
    expect(faf).toContain('main_language: Dart');
    expect(/flutter/i.test(faf)).toBe(true);
  });

  test('D5 — INTEGRATION no-guess: a pure-Dart package .faf is Dart, NOT Flutter', async () => {
    file('pubspec.yaml', 'name: my_pkg\ndependencies:\n  meta: ^1.12.0\n');
    const res = await autoCommand(dir, { force: true });
    expect(res.success).toBe(true);
    const faf = fs.readFileSync(res.initResult!.outputPath!, 'utf-8');
    expect(faf).toContain('main_language: Dart');
    expect(/flutter/i.test(faf)).toBe(false);
  });
});
