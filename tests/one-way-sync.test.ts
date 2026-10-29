/**
 * Sync is one way: project.faf → CLAUDE.md (#164).
 * faf_sync is the listed tool. faf_bi_sync is its old name: never listed, still
 * callable, and it never writes project.faf. No listed tool says "bi-directional".
 */
import { describe, test, expect, beforeAll, afterAll } from 'bun:test';
import { mkdtempSync, promises as fs } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { GrokFafMcpServer } from '../src/server.js';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { TOOL_REGISTRY } from '../src/types/tool-visibility';

const FAF = 'faf_version: 2.5.0\nproject:\n  name: One Way Demo\n  goal: ship\n  main_language: TypeScript\n';
const TWO_WAY = /bi-?directional|two-way|↔/i;

let server: GrokFafMcpServer;
let client: Client;

beforeAll(async () => {
  server = new GrokFafMcpServer({ transport: 'stdio', fafEnginePath: 'native' });
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  await server.getServer().connect(serverTransport);
  client = new Client({ name: 'one-way-sync', version: '1.0.0' }, { capabilities: {} });
  await client.connect(clientTransport);
});

afterAll(async () => {
  await client.close();
  await server.getServer().close();
});

describe('one-way sync (#164)', () => {
  test('faf_sync is listed; faf_bi_sync is not', async () => {
    const names = (await client.listTools()).tools.map((t) => t.name);
    expect(names).toContain('faf_sync');
    expect(names).not.toContain('faf_bi_sync');
  });

  test('no listed tool claims two-way sync', async () => {
    const { tools } = await client.listTools();
    for (const t of tools) expect(`${t.name}: ${t.description}`).not.toMatch(TWO_WAY);
  });

  test('registry descriptions for faf_sync and faf_bi_sync say one way', () => {
    for (const name of ['faf_sync', 'faf_bi_sync']) {
      expect(TOOL_REGISTRY[name].description).not.toMatch(TWO_WAY);
      expect(TOOL_REGISTRY[name].description).toMatch(/one way/);
    }
  });

  test('faf_bi_sync (old name) still works, writes CLAUDE.md, leaves project.faf as it was', async () => {
    const d = mkdtempSync(join(tmpdir(), 'grok-oneway-'));
    await fs.writeFile(join(d, 'project.faf'), FAF);
    await fs.writeFile(join(d, 'CLAUDE.md'), '# Mine\nhand-written\n');
    // The engine takes its working directory when the server starts, so start one in d.
    const cwd = process.cwd();
    process.chdir(d);
    const local = new GrokFafMcpServer({ transport: 'stdio', fafEnginePath: 'native' });
    const [ct, st] = InMemoryTransport.createLinkedPair();
    await local.getServer().connect(st);
    const c = new Client({ name: 'one-way-sync-local', version: '1.0.0' }, { capabilities: {} });
    await c.connect(ct);
    try {
      const result: any = await c.callTool({ name: 'faf_bi_sync', arguments: {} });
      expect(result.isError).toBeFalsy();
      expect(result.content[0].text).toContain('project.faf → context files');
      expect(result.content[0].text).not.toMatch(/bi-sync/i);
    } finally {
      await c.close();
      await local.getServer().close();
      process.chdir(cwd);
    }
    expect(await fs.readFile(join(d, 'project.faf'), 'utf-8')).toBe(FAF);
    const claude = await fs.readFile(join(d, 'CLAUDE.md'), 'utf-8');
    expect(claude).toContain('hand-written');
    expect(claude).toContain('One Way Demo');
    expect(claude).not.toContain('BI-SYNC');
  });
});
