/**
 * Security regression — arbitrary local-file read via unconfined `path` argument.
 *
 * Reproduces the disclosure reported against grok-faf-mcp 1.5.2 (Zhihao Zhang,
 * WPI): `refresh_faf` / `faf_get_orchestration_policy` / `faf_score` resolved a
 * caller `path` straight into `fs.readFileSync` with no confinement, so an
 * absolute path or `../` traversal read any file the uid could read and echoed
 * it back. CWE-22 / CWE-73 / CWE-200.
 *
 * Boundary under test (utils/safe-path.ts): the server only ever reads
 * `.faf` / `.fafm` context files. Non-context files (secrets) are refused
 * regardless of directory; `..`/absolute paths cannot reach one.
 */
import { describe, test, expect, beforeAll, afterAll } from 'bun:test';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { GrokFafMcpServer } from '../src/server.js';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { confinePath, PathConfinementError, isFafContextFile } from '../src/utils/safe-path';

describe('🔒 SECURITY — path confinement (arbitrary-file-read disclosure)', () => {
  let secretDir: string;
  let secretFile: string;
  let plantedFaf: string;

  beforeAll(() => {
    secretDir = fs.mkdtempSync(path.join(os.tmpdir(), 'grokfaf-sec-'));
    secretFile = path.join(secretDir, 'fake_id_rsa');
    plantedFaf = path.join(secretDir, 'project.faf');
    fs.writeFileSync(secretFile, 'SECRET-DO-NOT-LEAK fake-private-key\n');
    fs.writeFileSync(plantedFaf, 'project:\n  name: planted\norchestration:\n  tier: aggressive\n');
  });

  afterAll(() => {
    try {
      fs.rmSync(secretDir, { recursive: true, force: true });
    } catch {
      /* best-effort */
    }
  });

  describe('confinePath() unit', () => {
    // These specific Unix attack paths only EXIST on Unix; confinePath refuses an
    // existing non-.faf file (so /etc/passwd is rejected on Unix). On Windows the
    // path doesn't exist → it's lexical, no secret to leak. The platform-neutral
    // guarantee (any existing non-.faf file is refused) is covered by the
    // "real existing secret file" + symlink-bypass tests below.
    test.skipIf(process.platform === 'win32')('refuses an absolute non-.faf file (e.g. /etc/passwd)', () => {
      expect(() => confinePath('/etc/passwd')).toThrow(PathConfinementError);
    });

    test.skipIf(process.platform === 'win32')('refuses ../ traversal that lands on a non-.faf file', () => {
      expect(() => confinePath('../../../../../../etc/passwd')).toThrow(PathConfinementError);
    });

    test('refuses a real existing secret file regardless of directory', () => {
      expect(() => confinePath(secretFile)).toThrow(PathConfinementError);
    });

    test('refuses ~-expanded secrets (~/.ssh/id_rsa shape)', () => {
      const home = os.homedir();
      const f = path.join(home, '.grokfaf_sec_test_id_rsa');
      fs.writeFileSync(f, 'KEY');
      try {
        expect(() => confinePath('~/.grokfaf_sec_test_id_rsa')).toThrow(PathConfinementError);
      } finally {
        fs.rmSync(f, { force: true });
      }
    });

    test('refuses a null byte', () => {
      expect(() => confinePath('/tmp/x\0.faf')).toThrow(PathConfinementError);
    });

    test('allows a real .faf context file', () => {
      expect(confinePath(plantedFaf)).toBe(fs.realpathSync(plantedFaf));
    });

    test('refuses a symlink named *.faf that targets a secret (symlink bypass)', () => {
      const link = path.join(secretDir, 'evil.faf');
      fs.symlinkSync(secretFile, link);
      try {
        expect(() => confinePath(link)).toThrow(PathConfinementError);
      } finally {
        fs.rmSync(link, { force: true });
      }
    });

    test('allows a project directory (read still gated to a .faf found inside)', () => {
      expect(() => confinePath(secretDir)).not.toThrow();
    });

    test('FAF_ALLOWED_ROOTS, when set, additionally confines by directory', () => {
      const prev = process.env.FAF_ALLOWED_ROOTS;
      process.env.FAF_ALLOWED_ROOTS = path.join(os.homedir(), 'no-such-root');
      try {
        // plantedFaf is a valid .faf but now outside the configured root
        expect(() => confinePath(plantedFaf)).toThrow(PathConfinementError);
      } finally {
        if (prev === undefined) delete process.env.FAF_ALLOWED_ROOTS;
        else process.env.FAF_ALLOWED_ROOTS = prev;
      }
    });

    test('isFafContextFile classifies correctly', () => {
      expect(isFafContextFile('/x/project.faf')).toBe(true);
      expect(isFafContextFile('/x/.faf')).toBe(true);
      expect(isFafContextFile('/x/notes.fafm')).toBe(true);
      expect(isFafContextFile('/etc/passwd')).toBe(false);
      expect(isFafContextFile('/x/.env')).toBe(false);
    });
  });

  describe('MCP roundtrip — the reporter PoC must NOT leak', () => {
    let server: GrokFafMcpServer;
    let client: Client;

    beforeAll(async () => {
      server = new GrokFafMcpServer({ transport: 'stdio', fafEnginePath: 'native' });
      const [clientT, serverT] = InMemoryTransport.createLinkedPair();
      await server.getServer().connect(serverT);
      client = new Client({ name: 'sec-poc', version: '1.0.0' }, { capabilities: {} });
      await client.connect(clientT);
    });

    afterAll(async () => {
      try { await client.close(); } catch { /* */ }
      try { await server.getServer().close(); } catch { /* */ }
    });

    const textOf = (res: any): string =>
      (res?.content ?? []).map((c: any) => c.text ?? '').join('\n');

    test('faf_get_orchestration_policy(path=/etc/passwd) does not read it', async () => {
      const res: any = await client.callTool({
        name: 'faf_get_orchestration_policy',
        arguments: { path: '/etc/passwd' },
      });
      // either PATH DENIED, or faf_found:false — never the file CONTENTS.
      // (A denial message may legitimately name the rejected path; what must
      // never appear is the file's bytes, e.g. a `root:...` line.)
      expect(textOf(res)).not.toContain('root:');
    });

    test('faf_get_orchestration_policy(path=<secret file>) refuses', async () => {
      const res: any = await client.callTool({
        name: 'faf_get_orchestration_policy',
        arguments: { path: secretFile },
      });
      expect(textOf(res)).not.toContain('SECRET-DO-NOT-LEAK');
    });

    test('refresh_faf(path=<secret file>) does not echo its contents', async () => {
      const res: any = await client.callTool({
        name: 'refresh_faf',
        arguments: { path: secretFile },
      });
      expect(res.isError).toBeTruthy();
      expect(textOf(res)).not.toContain('SECRET-DO-NOT-LEAK');
    });

    test('faf_score(path=<secret file>) does not read it as a .faf', async () => {
      const res: any = await client.callTool({
        name: 'faf_score',
        arguments: { path: secretFile },
      });
      expect(textOf(res)).not.toContain('SECRET-DO-NOT-LEAK');
    });

    test('faf_read(path=/etc/passwd) is refused (general file tool, root-confined)', async () => {
      const res: any = await client.callTool({
        name: 'faf_read',
        arguments: { path: '/etc/passwd' },
      });
      expect(res.isError).toBeTruthy();
      expect(textOf(res)).not.toContain('root:');
    });

    test('faf_write outside the project root is refused (no arbitrary write)', async () => {
      const target = path.join(os.homedir(), '.grokfaf_should_not_be_written');
      const res: any = await client.callTool({
        name: 'faf_write',
        arguments: { path: target, content: 'pwned' },
      });
      expect(res.isError).toBeTruthy();
      expect(fs.existsSync(target)).toBe(false);
    });
  });
});
