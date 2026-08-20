/**
 * L3 lock — Grok-named defaults (cascade 2026-08-20).
 *
 * RAG synthesis pin is the live xAI flagship API id.
 * faf_enhance (retired from advertised tools/list, still callable) defaults to grok.
 */
import { describe, it, expect } from 'bun:test';
import { readFileSync } from 'fs';
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

  it('faf_enhance schema and handler default to grok, not claude', () => {
    const tools = readFileSync(join(root, 'src/handlers/tools.ts'), 'utf8');
    expect(tools).toContain('(default: grok)');
    expect(tools).not.toContain('(default: claude)');
    expect(tools).toContain("args?.model || 'grok'");
  });

  it('callable faf_enhance labels Grok, not Claude', async () => {
    const handler = new FafToolHandler(new FafEngineAdapter('native'));
    const result = await handler.callTool('faf_enhance', {});
    const text = result.content.map((c) => ('text' in c ? c.text : '')).join('\n');
    expect(text).toContain('Grok FAF Enhancement');
    expect(text).not.toContain('Claude FAF Enhancement');
  });
});
