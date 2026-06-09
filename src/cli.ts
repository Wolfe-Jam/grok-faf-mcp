#!/usr/bin/env node

import { GrokFafMcpServer } from './server';

// The bin runs stdio transport only — SSE/http-sse has been removed.
async function main() {
  const server = new GrokFafMcpServer({
    transport: 'stdio',
    fafEnginePath: 'faf',
    debug: true,
    cors: true
  });

  await server.start();

  console.log('FAF MCP Server started in stdio mode');
}

main().catch((error) => {
  console.error('Failed to start MCP server:', error);
  process.exit(1);
});
