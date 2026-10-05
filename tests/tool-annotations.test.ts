/**
 * Tool annotations — every tool that can be advertised declares MCP hints, and
 * the hints match what the tool really does (checked against the handlers,
 * 2026-10-05). Hosts use these to decide what needs a confirmation.
 *
 * Read-only means "does not modify its environment": tools that append a
 * receipt file (.faf-refresh-receipts.json, .fafm-refresh-receipts.json,
 * .frc-usage-receipts.json, recommendation receipts) are writers, not readers.
 */
import { describe, test, expect, beforeAll, afterAll } from 'bun:test';
import { GrokFafMcpServer } from '../src/server.js';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';

const READ_ONLY = [
  'faf_score', 'faf_trust', 'faf_list', 'faf_read', 'faf_get_orchestration_policy',
  'rag_cache_stats', 'rag_query',
];
const DESTRUCTIVE = ['faf_init', 'faf_clear', 'faf_write'];
const OPEN_WORLD = ['rag_query']; // the only tool that calls out (xAI Collections)

let server: GrokFafMcpServer;
let client: Client;
const saved = { tools: process.env.FAF_TOOLS, frc: process.env.USE_FRC };

beforeAll(async () => {
  // Advertise the full surface (extended tools + the FRC module).
  process.env.FAF_TOOLS = 'all';
  process.env.USE_FRC = '1';
  server = new GrokFafMcpServer({ transport: 'stdio', fafEnginePath: 'native' });
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  await server.getServer().connect(serverTransport);
  client = new Client({ name: 'annotations', version: '1.0.0' }, { capabilities: {} });
  await client.connect(clientTransport);
});

afterAll(async () => {
  await client.close();
  await server.getServer().close();
  if (saved.tools === undefined) delete process.env.FAF_TOOLS; else process.env.FAF_TOOLS = saved.tools;
  if (saved.frc === undefined) delete process.env.USE_FRC; else process.env.USE_FRC = saved.frc;
});

describe('Tool annotations', () => {
  test('the full surface is 20 tools and every one declares annotations', async () => {
    const { tools } = await client.listTools();
    expect(tools.length).toBe(20);
    for (const t of tools) {
      expect(t.annotations, `${t.name} has no annotations`).toBeDefined();
    }
  });

  test('readOnlyHint matches what each tool does', async () => {
    const { tools } = await client.listTools();
    for (const t of tools) {
      expect(t.annotations?.readOnlyHint, t.name).toBe(READ_ONLY.includes(t.name));
    }
  });

  test('writers declare destructiveHint; only init, clear and write are destructive', async () => {
    const { tools } = await client.listTools();
    for (const t of tools.filter((x) => !READ_ONLY.includes(x.name))) {
      expect(t.annotations?.destructiveHint, t.name).toBe(DESTRUCTIVE.includes(t.name));
    }
  });

  test('only rag_query is open-world', async () => {
    const { tools } = await client.listTools();
    for (const t of tools) {
      expect(t.annotations?.openWorldHint, t.name).toBe(OPEN_WORLD.includes(t.name));
    }
  });
});
