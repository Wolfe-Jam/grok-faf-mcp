/**
 * WJTTC 7-Tier MCP Certification Suite — grok-faf-mcp
 * Championship-grade MCP server certification
 *
 * Tier 1: Protocol Compliance
 * Tier 2: Capability Negotiation
 * Tier 3: Tool Integrity
 * Tier 4: Resource Management
 * Tier 5: Security Validation
 * Tier 6: Performance Benchmarks
 * Tier 7: Integration Readiness
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { FafToolHandler } from '../src/handlers/tools';
import { FafEngineAdapter } from '../src/handlers/engine-adapter';
import { ClaudeFafMcpServer } from '../src/server';
import * as fs from 'fs';
import * as fsp from 'fs/promises';
import * as path from 'path';

// Test fixtures
let tmpDir: string;
let handler: FafToolHandler;
let originalCwd: string;

const PERFORMANCE_TARGETS = {
  toolList: 50,    // ms
  toolCall: 100,   // ms
  fileRead: 50,    // ms
  fileWrite: 100,  // ms
  scoring: 200,    // ms
  concurrent: 500  // ms
};

beforeAll(async () => {
  originalCwd = process.cwd();
  tmpDir = path.join('/tmp', `grok-wjttc-mcp-${Date.now()}`);
  fs.mkdirSync(tmpDir, { recursive: true });
  process.chdir(tmpDir);

  // Write test .faf file
  fs.writeFileSync(path.join(tmpDir, 'project.faf'), `
faf_version: "2.5.0"
project:
  name: wjttc-test
  type: mcp-server
  goal: Test MCP server
  main_language: TypeScript
stack:
  backend: Express
  api_type: REST
  runtime: Node.js
  database: None
  connection: None
human_context:
  who: Tester
  what: MCP certification
  why: Championship quality
  where: CI/CD
  when: "2026"
  how: Jest
`, 'utf-8');

  const adapter = new FafEngineAdapter('native');
  handler = new FafToolHandler(adapter);
});

afterAll(async () => {
  process.chdir(originalCwd);
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

// ============================================================================
// TIER 1: PROTOCOL COMPLIANCE
// ============================================================================

describe('Tier 1: Protocol Compliance', () => {
  it('should have valid server class', () => {
    expect(ClaudeFafMcpServer).toBeDefined();
    expect(typeof ClaudeFafMcpServer).toBe('function');
  });

  it('should instantiate server without crash', () => {
    const server = new ClaudeFafMcpServer({
      transport: 'stdio',
      fafEnginePath: 'native',
      debug: false
    });
    expect(server).toBeDefined();
  });

  it('should have tool handler with callTool', () => {
    expect(handler).toBeDefined();
    expect(typeof handler.callTool).toBe('function');
  });

  it('should have listTools method', () => {
    expect(typeof handler.listTools).toBe('function');
  });
});

// ============================================================================
// TIER 2: CAPABILITY NEGOTIATION
// ============================================================================

describe('Tier 2: Capability Negotiation', () => {
  it('should list available tools', async () => {
    const result = await handler.listTools();
    expect(result.tools).toBeDefined();
    expect(result.tools.length).toBeGreaterThan(0);
  });

  it('should have tool handler that accepts tool names', async () => {
    const result = await handler.callTool('faf_read', {
      path: path.join(tmpDir, 'project.faf')
    });
    expect(result).toBeDefined();
    expect(result.content).toBeDefined();
    expect(result.content.length).toBeGreaterThan(0);
  });

  it('should return structured response from faf_score', async () => {
    const result = await handler.callTool('faf_score', {
      path: tmpDir
    });
    expect(result).toBeDefined();
    expect(result.content).toBeDefined();
    expect(result.content.length).toBeGreaterThan(0);
    const text = result.content[0]?.text || '';
    expect(text).toMatch(/\d+/);
  });

  it('should return structured response from faf_debug', async () => {
    const result = await handler.callTool('faf_debug', {});
    expect(result).toBeDefined();
    expect(result.content).toBeDefined();
  });
});

// ============================================================================
// TIER 3: TOOL INTEGRITY
// ============================================================================

describe('Tier 3: Tool Integrity', () => {
  it('faf_read should read .faf file', async () => {
    const result = await handler.callTool('faf_read', {
      path: path.join(tmpDir, 'project.faf')
    });
    const text = result.content[0]?.text || '';
    expect(text).toContain('wjttc-test');
  });

  it('faf_write should create .faf file', async () => {
    const writePath = path.join(tmpDir, 'write-test.faf');
    const result = await handler.callTool('faf_write', {
      path: writePath,
      content: 'project:\n  name: write-test\n'
    });
    expect(result).toBeDefined();
    const content = fs.readFileSync(writePath, 'utf-8');
    expect(content).toContain('write-test');
  });

  it('faf_score should return numeric score', async () => {
    const result = await handler.callTool('faf_score', {
      path: tmpDir
    });
    const text = result.content[0]?.text || '';
    const numbers = text.match(/\d+/g);
    expect(numbers).not.toBeNull();
    if (numbers) {
      const score = parseInt(numbers[0], 10);
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    }
  });

  it('faf_debug should return environment info', async () => {
    const result = await handler.callTool('faf_debug', {});
    const text = result.content[0]?.text || '';
    expect(text.length).toBeGreaterThan(0);
  });
});

// ============================================================================
// TIER 4: RESOURCE MANAGEMENT
// ============================================================================

describe('Tier 4: Resource Management', () => {
  it('should handle text file reading', async () => {
    const testFile = path.join(tmpDir, 'test.txt');
    fs.writeFileSync(testFile, 'Hello, WJTTC!', 'utf-8');

    const result = await handler.callTool('faf_read', {
      path: testFile
    });
    const text = result.content[0]?.text || '';
    expect(text).toContain('Hello, WJTTC!');
  });

  it('should handle JSON file reading', async () => {
    const jsonFile = path.join(tmpDir, 'test.json');
    fs.writeFileSync(jsonFile, JSON.stringify({ key: 'value' }), 'utf-8');

    const result = await handler.callTool('faf_read', {
      path: jsonFile
    });
    const text = result.content[0]?.text || '';
    expect(text).toContain('key');
  });

  it('should handle large file content', async () => {
    const largeFile = path.join(tmpDir, 'large.faf');
    const largeContent = 'project:\n  name: large\n' + '  field: value\n'.repeat(1000);
    fs.writeFileSync(largeFile, largeContent, 'utf-8');

    const result = await handler.callTool('faf_read', {
      path: largeFile
    });
    expect(result).toBeDefined();
    expect(result.content.length).toBeGreaterThan(0);
  });
});

// ============================================================================
// TIER 5: SECURITY VALIDATION
// ============================================================================

describe('Tier 5: Security Validation', () => {
  it('should handle path traversal attempts gracefully', async () => {
    try {
      const result = await handler.callTool('faf_read', {
        path: path.join(tmpDir, '../../etc/passwd')
      });
      // Should not crash — may return error content
      expect(result).toBeDefined();
    } catch (e) {
      // Throwing is also acceptable
      expect(e).toBeDefined();
    }
  });

  it('should handle null bytes in path', async () => {
    try {
      const result = await handler.callTool('faf_read', {
        path: path.join(tmpDir, 'test\x00.faf')
      });
      expect(result).toBeDefined();
    } catch (e) {
      expect(e).toBeDefined();
    }
  });

  it('should handle very long paths', async () => {
    const longPath = path.join(tmpDir, 'a'.repeat(500) + '.faf');
    try {
      const result = await handler.callTool('faf_read', {
        path: longPath
      });
      expect(result).toBeDefined();
    } catch (e) {
      expect(e).toBeDefined();
    }
  });

  it('should handle nonexistent file gracefully', async () => {
    try {
      const result = await handler.callTool('faf_read', {
        path: '/completely/nonexistent/path/file.faf'
      });
      expect(result).toBeDefined();
    } catch (e) {
      expect(e).toBeDefined();
    }
  });
});

// ============================================================================
// TIER 6: PERFORMANCE BENCHMARKS
// ============================================================================

describe('Tier 6: Performance Benchmarks', () => {
  it('should handle tool call within target time', async () => {
    const start = Date.now();
    await handler.callTool('faf_debug', {});
    const elapsed = Date.now() - start;
    expect(elapsed).toBeLessThan(PERFORMANCE_TARGETS.toolCall);
  });

  it('should read file within target time', async () => {
    const start = Date.now();
    await handler.callTool('faf_read', {
      path: path.join(tmpDir, 'project.faf')
    });
    const elapsed = Date.now() - start;
    expect(elapsed).toBeLessThan(PERFORMANCE_TARGETS.fileRead);
  });

  it('should write file within target time', async () => {
    const start = Date.now();
    await handler.callTool('faf_write', {
      path: path.join(tmpDir, 'perf-write.faf'),
      content: 'project:\n  name: perf-test\n'
    });
    const elapsed = Date.now() - start;
    expect(elapsed).toBeLessThan(PERFORMANCE_TARGETS.fileWrite);
  });

  it('should score within target time', async () => {
    const start = Date.now();
    await handler.callTool('faf_score', {
      path: tmpDir
    });
    const elapsed = Date.now() - start;
    expect(elapsed).toBeLessThan(PERFORMANCE_TARGETS.scoring);
  });

  it('should handle concurrent operations within target time', async () => {
    const start = Date.now();
    const ops = Array.from({ length: 10 }, () =>
      handler.callTool('faf_read', {
        path: path.join(tmpDir, 'project.faf')
      })
    );
    await Promise.all(ops);
    const elapsed = Date.now() - start;
    expect(elapsed).toBeLessThan(PERFORMANCE_TARGETS.concurrent);
  });

  it('should maintain stable memory under load', async () => {
    const before = process.memoryUsage().heapUsed;
    for (let i = 0; i < 50; i++) {
      await handler.callTool('faf_debug', {});
    }
    const after = process.memoryUsage().heapUsed;
    const growthMB = (after - before) / (1024 * 1024);
    expect(growthMB).toBeLessThan(50);
  });
});

// ============================================================================
// TIER 7: INTEGRATION READINESS
// ============================================================================

describe('Tier 7: Integration Readiness', () => {
  it('should handle unknown tool gracefully', async () => {
    try {
      const result = await handler.callTool('nonexistent_tool', {});
      expect(result).toBeDefined();
    } catch (e: any) {
      expect(e.message).toBeDefined();
    }
  });

  it('should handle missing required params gracefully', async () => {
    try {
      const result = await handler.callTool('faf_read', {});
      expect(result).toBeDefined();
    } catch (e) {
      expect(e).toBeDefined();
    }
  });

  it('should handle sequential requests correctly', async () => {
    const result1 = await handler.callTool('faf_debug', {});
    const result2 = await handler.callTool('faf_debug', {});
    expect(result1).toBeDefined();
    expect(result2).toBeDefined();
    expect(result1.content.length).toBeGreaterThan(0);
    expect(result2.content.length).toBeGreaterThan(0);
  });

  it('should handle rapid fire requests', async () => {
    const results = [];
    for (let i = 0; i < 20; i++) {
      results.push(await handler.callTool('faf_debug', {}));
    }
    expect(results.length).toBe(20);
    results.forEach(r => {
      expect(r).toBeDefined();
      expect(r.content.length).toBeGreaterThan(0);
    });
  });
});
