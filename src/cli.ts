#!/usr/bin/env node

import { ClaudeFafMcpServer } from './server';

// Parse command line arguments
const args = process.argv.slice(2);
const transportIndex = args.indexOf('--transport');
const portIndex = args.indexOf('--port');

const transport = transportIndex >= 0 ? args[transportIndex + 1] as 'stdio' | 'http-sse' : 'stdio';
const port = portIndex >= 0 ? parseInt(args[portIndex + 1], 10) : 3001;

async function main() {
  const server = new ClaudeFafMcpServer({
    transport,
    port,
    fafEnginePath: 'faf',
    debug: true,
    cors: true
  });

  await server.start();

  console.log(`FAF MCP Server started in ${transport} mode`);
  if (transport === 'http-sse') {
    console.log(`Endpoints:`);
    console.log(`  Health: http://localhost:${port}/health`);
    console.log(`  Info:   http://localhost:${port}/info`);
    console.log(`  SSE:    http://localhost:${port}/sse`);
  }
}

main().catch((error) => {
  console.error('Failed to start MCP server:', error);
  process.exit(1);
});
