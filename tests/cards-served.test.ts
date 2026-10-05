/**
 * grok.faf.one serves Grok's FAF passport (agent.fafa) and the AI Catalog / ARD
 * entries that point to it. The MCP Server Card is the hosted one on mcpaas.live.
 */
import { describe, it, expect } from 'bun:test';
import { readFileSync } from 'node:fs';
import { parse } from 'yaml';
import worker, { SERVED_CARDS, SERVER_CARD_URL, isServerCardPath } from '../src/index.js';
import { SERVED } from '../scripts/sync-cards.mjs';

const pkg = JSON.parse(readFileSync('package.json', 'utf8'));

// A stand-in for the Workers Assets binding: serves files from docs/.
const env = {
  ASSETS: {
    fetch: async (req: Request) => {
      try {
        return new Response(readFileSync('docs' + new URL(req.url).pathname));
      } catch {
        return new Response('not found', { status: 404 });
      }
    },
  },
};
const get = (path: string) => worker.fetch(new Request('https://grok.faf.one' + path), env);

describe('Served cards', () => {
  it('serves the passport as .fafa YAML, and it is this version', async () => {
    const res = await get('/.well-known/fafa');
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toMatch(/^application\/vnd\.fafa\+yaml/);
    const fafa = parse(await res.text());
    expect(fafa.agent.name).toBe('grok-faf-mcp');
    expect(fafa.agent.version).toBe(pkg.version);
    expect(fafa.agent.homepage).toBe('https://grok.faf.one');
  });

  it('serves the AI Catalog and ARD, pointing at this passport', async () => {
    for (const path of ['/.well-known/ai-catalog.json', '/.well-known/ard.json']) {
      const res = await get(path);
      expect(res.status).toBe(200);
      expect(await res.text()).toContain('https://grok.faf.one/.well-known/fafa');
    }
  });

  it('sends both Server Card paths to the hosted card', async () => {
    for (const path of ['/mcp/server-card', '/.well-known/mcp/server-card.json']) {
      expect(isServerCardPath(path)).toBe(true);
      const res = await get(path);
      expect(res.status).toBe(308);
      expect(res.headers.get('location')).toBe(SERVER_CARD_URL);
    }
  });

  it('served copies match the cards faf wrote (run `npm run cards` on drift)', () => {
    for (const [from, to] of SERVED) {
      expect(readFileSync(to, 'utf8'), `${to} is stale`).toBe(readFileSync(from, 'utf8'));
    }
    expect(Object.values(SERVED_CARDS).map((c) => 'docs' + c.asset).sort())
      .toEqual(SERVED.map(([, to]) => to).sort());
  });
});
