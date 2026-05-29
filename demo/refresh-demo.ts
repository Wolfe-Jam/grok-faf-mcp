/**
 * refresh_faf — live demo: drift → refresh → re-grounded
 *
 * No mocks, no network, no script-faking. Spins up grok-faf-mcp in-process,
 * calls the REAL `refresh_faf` tool over the MCP protocol, on a real `.faf` you
 * watch change between calls. The score moves because the file moved — proof
 * refresh re-reads LIVE state, not a cache.
 *
 * Run it yourself (reproducible — FAF don't lie):
 *   bun demo/refresh-demo.ts
 */
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { GrokFafMcpServer } from '../src/server.js';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';

// ① thin context — a brand-new project, DNA barely filled in.
const SPARSE = [
  'faf_version: "3.0"',
  'project:',
  '  name: my-grok-app',
  '  goal: fresh project, context still thin',
  '',
].join('\n');

// ③ the project moved — stack + 6-Ws land; N/A slots honestly slotignored.
const POPULATED = [
  'faf_version: "3.0"',
  'project:',
  '  name: my-grok-app',
  '  goal: real-time MCP context for Grok',
  '  main_language: TypeScript',
  '  type: mcp',
  '  framework: MCP SDK',
  'stack:',
  '  frontend: slotignored',
  '  css_framework: slotignored',
  '  ui_library: slotignored',
  '  state_management: slotignored',
  '  backend: MCP SDK',
  '  api_type: MCP',
  '  runtime: Node.js',
  '  database: slotignored',
  '  connection: slotignored',
  '  hosting: Cloudflare Workers',
  '  build: tsc',
  '  cicd: GitHub Actions',
  '  monorepo_tool: slotignored',
  '  package_manager: npm',
  '  workspaces: slotignored',
  '  admin: slotignored',
  '  cache: slotignored',
  '  search: slotignored',
  '  storage: slotignored',
  'human_context:',
  '  who: Grok / xAI developers',
  '  what: persistent project DNA for Grok',
  '  why: every session starts from zero — refresh_faf re-grounds it',
  '',
].join('\n');

const log = (s = ''): void => console.log(s);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const textOf = (r: any): string => (r?.content?.[0]?.text ?? '') as string;
const scoreOf = (t: string): number => parseInt(t.match(/tier:[^\n]*?(\d{1,3})%/)![1], 10);
const card = (t: string): string =>
  t.split('— fresh DNA')[0].trim().split('\n').map((l) => '    ' + l).join('\n');

async function main(): Promise<void> {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'refresh-demo-'));
  const faf = path.join(dir, 'project.faf');

  const server = new GrokFafMcpServer({ transport: 'stdio', fafEnginePath: 'native' });
  const [ct, st] = InMemoryTransport.createLinkedPair();
  await server.getServer().connect(st);
  const client = new Client({ name: 'refresh-demo', version: '1.0.0' }, { capabilities: {} });
  await client.connect(ct);

  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  log('  refresh_faf  ·  drift → refresh → re-grounded');
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  log();

  // ① thin context
  fs.writeFileSync(faf, SPARSE);
  log('①  New project — context still thin:');
  const r1 = textOf(await client.callTool({ name: 'refresh_faf', arguments: { path: dir } }));
  const s1 = scoreOf(r1);
  log(card(r1));
  log();

  // ② drift — the project moves on disk
  log('②  You build. The project moves — stack + 6-Ws land in project.faf …');
  fs.writeFileSync(faf, POPULATED);
  log();

  // ③ refresh — re-ground on the LIVE file, report the drift
  log('③  refresh_faf — re-read the LIVE .faf, re-score, report drift:');
  const r2 = textOf(await client.callTool({ name: 'refresh_faf', arguments: { path: dir, baseline: s1 } }));
  const s2 = scoreOf(r2);
  log(card(r2));
  log();
  log(`    ↑ the score moved ${s1}% → ${s2}% on a LIVE edit — refresh re-read the`);
  log('      file, not a cache. Deterministic, single-source (faf-cli scorer).');
  log('      drift → refresh → re-grounded.   reproducible: bun demo/refresh-demo.ts');

  await client.close();
  await server.getServer().close();
  fs.rmSync(dir, { recursive: true, force: true });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
