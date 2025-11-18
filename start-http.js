const { ClaudeFafMcpServer } = require('./dist/src/server.js');

async function main() {
  const port = process.env.PORT || 3001;
  const host = process.env.HOST || '0.0.0.0';

  const server = new ClaudeFafMcpServer({
    transport: 'http-sse',
    port: port,
    host: host,
    fafEnginePath: 'faf',
    debug: true,
    cors: true
  });

  await server.start();
  console.log(`FAF MCP Server started on ${host}:${port}`);
  console.log('Endpoints:');
  console.log(`  Health: http://${host}:${port}/health`);
  console.log(`  Info:   http://${host}:${port}/info`);
  console.log(`  SSE:    http://${host}:${port}/sse`);
}

main().catch((error) => {
  console.error('Failed to start:', error);
  process.exit(1);
});
