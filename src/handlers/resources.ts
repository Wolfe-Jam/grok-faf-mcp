import type { Resource } from '@modelcontextprotocol/sdk/types.js';
import { FafEngineAdapter } from './engine-adapter';
import { fafCli } from '../utils/faf-cli-bridge.js';

export class FafResourceHandler {
  constructor(private engineAdapter: FafEngineAdapter) {}

  async listResources() {
    // Get the working directory for file system resources
    const workingDir = process.env.FAF_WORKING_DIR ?? process.cwd();

    return {
      resources: [
        {
          uri: 'claude-faf://context',
          name: 'Current FAF Context',
          description: 'Current project FAF context and metadata',
          mimeType: 'application/json'
        },
        {
          uri: 'claude-faf://status',
          name: 'FAF Status Summary',
          description: 'Project health and AI readiness status',
          mimeType: 'text/plain'
        },
        // Declare file system access for the working directory
        {
          uri: `file://${workingDir}`,
          name: 'FAF Working Directory',
          description: 'File system access for FAF operations',
          mimeType: 'text/directory'
        }
      ] as Resource[]
    };
  }

  async readResource(uri: string) {
    // Handle file:// URIs for file system access
    if (uri.startsWith('file://')) {
      return {
        contents: [{
          uri: uri,
          mimeType: 'text/directory',
          text: `File system resource: ${uri.replace('file://', '')}`
        }]
      };
    }

    switch (uri) {
      case 'claude-faf://context':
        return await this.getFafContext();
      case 'claude-faf://status':
        return await this.getFafStatus();
      default:
        throw new Error(`Unknown resource: ${uri}`);
    }
  }

  // 2.0.0: both resources compose faf-cli in-process (reader + always-33
  // scoreFafYaml) instead of shelling out to whatever `faf` is on the PATH.
  private async readProject(): Promise<{ fafPath: string | null; data?: unknown; score?: ReturnType<Awaited<typeof fafCli>['scoreFafYaml']>; error?: string }> {
    const { findFafFile, readFaf, readFafRaw, scoreFafYaml } = await fafCli;
    const fafPath = findFafFile(this.engineAdapter.getWorkingDirectory());
    if (!fafPath) return { fafPath: null, error: 'no .faf found' };
    try {
      return { fafPath, data: readFaf(fafPath), score: scoreFafYaml(readFafRaw(fafPath)) };
    } catch (e: any) {
      return { fafPath, error: e?.message ?? String(e) };
    }
  }

  private async getFafContext() {
    const p = await this.readProject();
    const body = p.error
      ? { error: p.error, path: p.fafPath }
      : { path: p.fafPath, score: p.score?.score, populated: p.score?.populated, active: p.score?.active, total: p.score?.total, faf: p.data };
    return {
      contents: [{
        uri: 'claude-faf://context',
        mimeType: 'application/json',
        text: JSON.stringify(body, null, 2)
      }]
    };
  }

  private async getFafStatus() {
    const p = await this.readProject();
    const { scoreText } = await fafCli;
    const text = p.error
      ? `Error: ${p.error}${p.fafPath ? ` (${p.fafPath})` : ''}`
      : `${p.fafPath}\nScore: ${scoreText(p.score!)} (always-33) — ${p.score!.populated}/${p.score!.active} slots`;
    return {
      contents: [{
        uri: 'claude-faf://status',
        mimeType: 'text/plain',
        text
      }]
    };
  }

}
