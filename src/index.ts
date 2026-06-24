#!/usr/bin/env node

import { GrokFafMcpServer } from './server.js';
import { VERSION } from './version.js';

// Smithery sandbox support — allows Smithery to scan server capabilities
export function createSandboxServer() {
  const wrapper = new GrokFafMcpServer({
    transport: 'stdio',
    fafEnginePath: 'faf'
  });
  return wrapper.getServer();
}

// MCP servers run via stdio transport when launched by an MCP host
async function main() {
  // CLI flags — handled BEFORE the server starts (and before any stdio is
  // touched), so they never pollute the MCP protocol channel. An MCP host
  // launches the bare binary (no args) → falls through to server.start().
  const args = process.argv.slice(2);
  if (args.includes('--version') || args.includes('-v')) {
    console.log(`grok-faf-mcp ${VERSION}`);
    return;
  }
  if (args.includes('--help') || args.includes('-h')) {
    console.log(
      `grok-faf-mcp ${VERSION} — the Grok MCP server (persistent project context via .faf/.fafm)\n\n` +
      `Usage:\n` +
      `  grok-faf-mcp            start the MCP server over stdio (how an MCP host launches it)\n` +
      `  grok-faf-mcp --version  print the version\n` +
      `  grok-faf-mcp --help     show this help\n\n` +
      `Hosted: https://mcpaas.live/grok/mcp/v1 · Docs: https://faf.one/grok`
    );
    return;
  }

  const server = new GrokFafMcpServer({
    transport: 'stdio',
    fafEnginePath: 'faf'
  });

  await server.start();
}

main().catch((error) => {
  console.error('Failed to start MCP server:', error);
  process.exit(1);
});