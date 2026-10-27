/**
 * 🏁 WJTTC — skills detection composed from faf-cli (compose floor 8.5)
 *
 * faf-cli proves the behaviour in its own suite (tests/detect/skills-detect.test.ts,
 * v8.5.0). This proves faf_init reaches it over MCP: the type project.faf gets.
 * Every case uses its own tmp folder.
 */
import { describe, test, expect, beforeAll, afterAll } from 'bun:test';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { GrokFafMcpServer } from '../src/server.js';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';

const SKILL = (n: string): string => `---\nname: ${n}\ndescription: Does ${n}.\n---\nBody\n`;

const CASES: Array<{ name: string; files: Record<string, string>; type: string }> = [
  { name: 'skills', files: { 'skills/alpha/SKILL.md': SKILL('alpha'), 'skills/beta/SKILL.md': SKILL('beta') }, type: 'skills' },
  {
    name: 'skills-plugin',
    files: {
      'skills/alpha/SKILL.md': SKILL('alpha'),
      'skills/beta/SKILL.md': SKILL('beta'),
      '.claude-plugin/plugin.json': '{"name":"alpha-skills","version":"0.1.0"}\n',
    },
    type: 'skills-plugin',
  },
  {
    name: 'cli-ships-a-skill',
    files: {
      'package.json': '{"name":"tool","version":"1.0.0","bin":{"tool":"cli.js"}}\n',
      'cli.js': '#!/usr/bin/env node\n',
      'skills/tool/SKILL.md': SKILL('tool'),
      '.claude-plugin/plugin.json': '{"name":"tool","version":"1.0.0"}\n',
    },
    type: 'cli',
  },
];

describe('🏁 WJTTC — skills detection via faf_init (faf-cli compose floor 8.5)', () => {
  let client: Client;
  let server: GrokFafMcpServer;
  let originalCwd = '';
  const dirs: string[] = [];

  beforeAll(async () => {
    originalCwd = process.cwd();
    server = new GrokFafMcpServer({ transport: 'stdio', fafEnginePath: 'native' });
    const [clientT, serverT] = InMemoryTransport.createLinkedPair();
    await server.getServer().connect(serverT);
    client = new Client({ name: 'wjttc-skills', version: '1.0.0' }, { capabilities: {} });
    await client.connect(clientT);
  });

  afterAll(async () => {
    try { await client.close(); } catch { /* best-effort */ }
    try { await server.getServer().close(); } catch { /* best-effort */ }
    process.chdir(originalCwd);
    for (const d of dirs) fs.rmSync(d, { recursive: true, force: true });
  });

  for (const c of CASES) {
    test(`faf_init on ${c.name} writes type: ${c.type}`, async () => {
      const dir = fs.mkdtempSync(path.join(os.tmpdir(), `wjttc-skills-${c.name}-`));
      dirs.push(dir);
      for (const [rel, body] of Object.entries(c.files)) {
        fs.mkdirSync(path.dirname(path.join(dir, rel)), { recursive: true });
        fs.writeFileSync(path.join(dir, rel), body);
      }
      const res = await client.callTool({ name: 'faf_init', arguments: { path: dir } });
      expect(res.isError).toBeFalsy();
      const faf = fs.readFileSync(path.join(dir, 'project.faf'), 'utf8');
      expect(faf).toMatch(new RegExp(`^\\s*type: ${c.type}(\\s|$)`, 'm'));
    });
  }
});
