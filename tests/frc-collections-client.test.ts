/**
 * FRC Collections client (Phase III · §4.1) — the ONE real xAI Collections client.
 *
 * These tests pin the REST request-shaping to the verified contract
 * (docs.x.ai/developers/rest-api-reference) using an INJECTED fetch — no live
 * calls, no keys. The split-brain is dead when this client (not the chat shim)
 * is what talks to Collections.
 */
import { describe, it, expect } from 'bun:test';
import { CollectionsClient } from '../src/rag/collections-client';

type Captured = { url: string; init: RequestInit };

/** A fake fetch that captures the request and returns a canned JSON body. */
function fakeFetch(body: unknown, status = 200): { fetch: typeof fetch; calls: Captured[] } {
  const calls: Captured[] = [];
  const fn = (async (url: string | URL | Request, init?: RequestInit) => {
    calls.push({ url: String(url), init: init ?? {} });
    return {
      ok: status >= 200 && status < 300,
      status,
      json: async () => body,
      text: async () => (typeof body === 'string' ? body : JSON.stringify(body)),
    } as unknown as Response;
  }) as unknown as typeof fetch;
  return { fetch: fn, calls };
}

describe('CollectionsClient — search (POST https://api.x.ai/v1/documents/search)', () => {
  it('hits the search endpoint with the verified body shape + API key', async () => {
    const { fetch, calls } = fakeFetch({ matches: [] });
    const c = new CollectionsClient({ apiKey: 'sk-test', fetchImpl: fetch });
    await c.search({ query: 'what is the stack?', collectionIds: ['col_1'], limit: 5 });

    expect(calls.length).toBe(1);
    expect(calls[0].url).toBe('https://api.x.ai/v1/documents/search');
    expect((calls[0].init.method || '').toUpperCase()).toBe('POST');
    const headers = calls[0].init.headers as Record<string, string>;
    expect(headers.Authorization).toBe('Bearer sk-test');
    const sent = JSON.parse(String(calls[0].init.body));
    expect(sent.query).toBe('what is the stack?');
    expect(sent.source).toEqual({ collection_ids: ['col_1'] });
    expect(sent.limit).toBe(5);
    // retrieval_mode omitted unless requested (under-documented object shape)
    expect(sent.retrieval_mode).toBeUndefined();
  });

  it('normalizes matches[] snake_case → camelCase', async () => {
    const { fetch } = fakeFetch({
      matches: [
        {
          chunk_content: 'TypeScript + MCP SDK',
          chunk_id: 'ch_1',
          file_id: 'f_1',
          collection_ids: ['col_1'],
          score: 0.87,
          page_number: 3,
          fields: { section: 'stack' },
        },
      ],
    });
    const c = new CollectionsClient({ apiKey: 'sk-test', fetchImpl: fetch });
    const r = await c.search({ query: 'stack', collectionIds: ['col_1'] });
    expect(r.matches.length).toBe(1);
    const m = r.matches[0];
    expect(m.chunkContent).toBe('TypeScript + MCP SDK');
    expect(m.chunkId).toBe('ch_1');
    expect(m.fileId).toBe('f_1');
    expect(m.score).toBe(0.87);
    expect(m.pageNumber).toBe(3);
    expect(m.fields).toEqual({ section: 'stack' });
  });

  it('defaults limit to 10 and includes retrieval_mode only when set', async () => {
    const { fetch, calls } = fakeFetch({ matches: [] });
    const c = new CollectionsClient({ apiKey: 'sk-test', fetchImpl: fetch });
    await c.search({ query: 'q', collectionIds: ['col_1'], retrievalMode: 'hybrid' });
    const sent = JSON.parse(String(calls[0].init.body));
    expect(sent.limit).toBe(10);
    expect(sent.retrieval_mode).toEqual({ mode: 'hybrid' });
  });

  it('rejects empty query and empty collectionIds (guards before the call)', async () => {
    const { fetch, calls } = fakeFetch({ matches: [] });
    const c = new CollectionsClient({ apiKey: 'sk-test', fetchImpl: fetch });
    expect(c.search({ query: '   ', collectionIds: ['col_1'] })).rejects.toThrow('query is required');
    expect(c.search({ query: 'q', collectionIds: [] })).rejects.toThrow('collectionId');
    expect(calls.length).toBe(0); // never hit the network
  });

  it('throws with status + body on a non-OK response', async () => {
    const { fetch } = fakeFetch('rate limited', 429);
    const c = new CollectionsClient({ apiKey: 'sk-test', fetchImpl: fetch });
    expect(c.search({ query: 'q', collectionIds: ['col_1'] })).rejects.toThrow('429');
  });
});

describe('CollectionsClient — management (create/list) needs the management key', () => {
  it('createCollection posts to management base with the management key + embedding model', async () => {
    const { fetch, calls } = fakeFetch({ collection_id: 'col_new', collection_name: 'FAF Palace' });
    const c = new CollectionsClient({ apiKey: 'sk-test', managementApiKey: 'mk-test', fetchImpl: fetch });
    const out = await c.createCollection({ name: 'FAF Palace', description: 'context' });

    expect(calls[0].url).toBe('https://management-api.x.ai/v1/collections');
    const headers = calls[0].init.headers as Record<string, string>;
    expect(headers.Authorization).toBe('Bearer mk-test');
    const sent = JSON.parse(String(calls[0].init.body));
    expect(sent.collection_name).toBe('FAF Palace');
    expect(sent.index_configuration).toEqual({ model_name: 'grok-embedding-small' });
    expect(sent.collection_description).toBe('context');
    expect(out.collectionId).toBe('col_new');
  });

  it('listCollections tolerates both {collections:[]} and {data:[]} envelopes', async () => {
    const a = fakeFetch({ collections: [{ collection_id: 'c1', collection_name: 'A' }] });
    const ca = new CollectionsClient({ apiKey: 'sk', managementApiKey: 'mk', fetchImpl: a.fetch });
    expect((await ca.listCollections())[0].collectionId).toBe('c1');

    const b = fakeFetch({ data: [{ collection_id: 'c2', collection_name: 'B' }] });
    const cb = new CollectionsClient({ apiKey: 'sk', managementApiKey: 'mk', fetchImpl: b.fetch });
    expect((await cb.listCollections())[0].collectionId).toBe('c2');
  });

  it('management ops refuse without a management key', async () => {
    const { fetch, calls } = fakeFetch({});
    const c = new CollectionsClient({ apiKey: 'sk-test', fetchImpl: fetch });
    expect(c.createCollection({ name: 'x' })).rejects.toThrow('XAI_MANAGEMENT_API_KEY');
    expect(c.listCollections()).rejects.toThrow('XAI_MANAGEMENT_API_KEY');
    expect(calls.length).toBe(0);
    expect(c.canManage()).toBe(false);
    expect(c.isConfigured()).toBe(true); // search still works
  });
});

describe('CollectionsClient — upload is parked (FAF-don\'t-lie, conflicting contract)', () => {
  it('uploadDocument throws an explicit not-implemented error', async () => {
    const c = new CollectionsClient({ apiKey: 'sk', managementApiKey: 'mk' });
    expect(c.uploadDocument()).rejects.toThrow('not implemented');
  });
});

describe('CollectionsClient — base URL overrides (edge/staging)', () => {
  it('honors custom search/management bases and strips trailing slashes', async () => {
    const { fetch, calls } = fakeFetch({ matches: [] });
    const c = new CollectionsClient({
      apiKey: 'sk',
      searchBaseUrl: 'https://edge.example/',
      fetchImpl: fetch,
    });
    await c.search({ query: 'q', collectionIds: ['col_1'] });
    expect(calls[0].url).toBe('https://edge.example/v1/documents/search');
  });
});
