/**
 * L3 lock — Grok-named defaults + faf_enhance drop (cascade 2026-08-20).
 *
 * RAG synthesis pin is the live xAI flagship API id.
 * faf_enhance is gone: silent DNA clobber. Same drop as faf-cli / claude-faf-mcp.
 */
import { describe, it, expect } from 'bun:test';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { DEFAULT_MODEL, XAIClient } from '../src/rag/xai-client';
import { FafToolHandler } from '../src/handlers/tools';
import { FafEngineAdapter } from '../src/handlers/engine-adapter';

const root = join(import.meta.dir, '..');

describe('Grok-named defaults', () => {
  it('RAG DEFAULT_MODEL is the current xAI flagship API id', () => {
    expect(DEFAULT_MODEL).toBe('grok-4.6');
    expect(new XAIClient({ apiKey: 'test' }).getModel()).toBe(DEFAULT_MODEL);
  });

  it('src does not pin the retired grok-3-fast id', () => {
    const client = readFileSync(join(root, 'src/rag/xai-client.ts'), 'utf8');
    expect(client).not.toContain('grok-3-fast');
  });
});

describe('faf_enhance dropped', () => {
  it('bundled enhance command is gone', () => {
    expect(existsSync(join(root, 'src/faf-core/commands/enhance.ts'))).toBe(false);
  });

  it('is not advertised on default or FAF_TOOLS=all', async () => {
    const saved = process.env.FAF_TOOLS;
    delete process.env.FAF_TOOLS;
    const handler = new FafToolHandler(new FafEngineAdapter('native'));
    const def = await handler.listTools();
    expect(def.tools.map((t) => t.name)).not.toContain('faf_enhance');
    process.env.FAF_TOOLS = 'all';
    const all = await handler.listTools();
    expect(all.tools.map((t) => t.name)).not.toContain('faf_enhance');
    if (saved === undefined) delete process.env.FAF_TOOLS;
    else process.env.FAF_TOOLS = saved;
  });

  it('callTool refuses with the DNA-clobber reason and does not write', async () => {
    const handler = new FafToolHandler(new FafEngineAdapter('native'));
    const result = await handler.callTool('faf_enhance', {});
    expect(result.isError).toBe(true);
    const text = result.content.map((c) => ('text' in c ? c.text : '')).join('\n');
    expect(text).toContain('silent DNA clobber');
    expect(text).toContain('faf_auto');
    expect(text).toContain('faf_go');
    expect(text).not.toContain('Grok FAF Enhancement');
  });
});
