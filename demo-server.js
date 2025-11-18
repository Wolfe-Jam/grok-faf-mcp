const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3001;
const HOST = process.env.HOST || '0.0.0.0';

app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    server: 'faf-mcp',
    version: '1.1.1',
    transport: 'http-sse',
    timestamp: new Date().toISOString(),
    championship: 'Universal MCP - All Platforms'
  });
});

app.get('/info', (req, res) => {
  res.json({
    name: 'faf-mcp',
    version: '1.1.1',
    description: 'Universal FAF MCP Server for ALL platforms - AI Context Intelligence',
    transport: 'http-sse',
    capabilities: {
      resources: { subscribe: true, listChanged: true },
      tools: { listChanged: true }
    },
    tools: [
      'faf_status', 'faf_score', 'faf_init', 'faf_trust',
      'faf_sync', 'faf_enhance', 'faf_bi_sync', 'faf_clear', 'faf_debug'
    ],
    endpoints: {
      health: '/health',
      info: '/info',
      sse: '/sse'
    }
  });
});

app.get('/', (req, res) => {
  res.json({
    message: 'FAF MCP Server - Universal AI Context',
    version: '1.1.1',
    endpoints: {
      health: '/health',
      info: '/info'
    }
  });
});

app.listen(PORT, HOST, () => {
  console.log(`🏎️ FAF MCP Demo Server running on ${HOST}:${PORT}`);
  console.log(`  Health: http://${HOST}:${PORT}/health`);
  console.log(`  Info:   http://${HOST}:${PORT}/info`);
});
