#!/usr/bin/env node

import { GrokFafMcpServer } from './server.js';

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