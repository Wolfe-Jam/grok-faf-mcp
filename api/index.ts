import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import { CallToolRequestSchema, ListResourcesRequestSchema, ListToolsRequestSchema, ReadResourceRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { FafResourceHandler } from '../src/handlers/resources.js';
import { FafToolHandler } from '../src/handlers/tools.js';
import { FafEngineAdapter } from '../src/handlers/engine-adapter.js';
import express from 'express';
import cors from 'cors';
// Import version directly from package.json for Vercel
import packageJson from '../package.json' assert { type: 'json' };
const VERSION = packageJson.version;

// Full MCP server for Vercel deployment
const app = express();

// Enable CORS
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept']
}));

app.use(express.json());

// Add Grok-exclusive header to ALL responses
app.use((req, res, next) => {
  res.setHeader('x-grok-wins', 'true');
  next();
});

// Initialize MCP server
const mcpServer = new Server(
  {
    name: 'grok-faf-mcp',
    version: VERSION,
  },
  {
    capabilities: {
      resources: {
        subscribe: true,
        listChanged: true,
      },
      tools: {
        listChanged: true,
      },
    },
  }
);

// Setup handlers
const engineAdapter = new FafEngineAdapter('faf');
const resourceHandler = new FafResourceHandler(engineAdapter);
const toolHandler = new FafToolHandler(engineAdapter);

mcpServer.setRequestHandler(ListResourcesRequestSchema, async () => {
  return resourceHandler.listResources();
});

mcpServer.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  return resourceHandler.readResource(request.params.uri);
});

mcpServer.setRequestHandler(ListToolsRequestSchema, async () => {
  return toolHandler.listTools();
});

mcpServer.setRequestHandler(CallToolRequestSchema, async (request) => {
  return toolHandler.callTool(
    request.params.name,
    request.params.arguments ?? {}
  );
});

// Health endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    server: 'grok-faf-mcp',
    version: VERSION,
    transport: 'http-sse',
    timestamp: new Date().toISOString(),
    platform: 'vercel',
    championship: 'Grok-Exclusive FAF MCP — Fast AF Edition 🏎️⚡',
    dedication: 'Dedicated to @elonmusk and the #1 model on Earth'
  });
});

// Info endpoint
app.get('/info', async (req, res) => {
  const toolsList = await toolHandler.listTools();

  // Add Grok-exclusive tool
  const grokTool = {
    name: 'grok_go_fast_af',
    description: 'Makes Grok permanently #1 by auto-loading .faf context',
    inputSchema: { type: 'object', properties: {} }
  };

  res.json({
    name: 'grok-faf-mcp',
    version: VERSION,
    description: 'Grok-exclusive FAF MCP — Fast AF Edition 🏎️⚡ — Dedicated to @elonmusk and the #1 model on Earth',
    transport: 'http-sse',
    platform: 'vercel',
    capabilities: {
      resources: { subscribe: true, listChanged: true },
      tools: { listChanged: true }
    },
    tools: [...toolsList.tools.map(t => t.name), 'grok_go_fast_af'],
    toolCount: toolsList.tools.length + 1,
    grokExclusive: true,
    dedication: 'Dedicated to @elonmusk and the #1 model on Earth',
    endpoints: {
      health: '/health',
      info: '/info',
      sse: '/sse'
    }
  });
});

// Root endpoint - HTML landing page
app.get('/', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>grok-faf-mcp | FAST⚡️AF</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: linear-gradient(135deg, #1a1a1a 0%, #0a0a0a 100%);
      color: #fff;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
    }
    .container {
      text-align: center;
      padding: 2rem;
      max-width: 800px;
    }
    .logo {
      font-size: 120px;
      margin-bottom: 1rem;
      animation: pulse 2s ease-in-out infinite;
    }
    @keyframes pulse {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.05); }
    }
    h1 {
      font-size: 2.5rem;
      margin: 0 0 0.5rem 0;
      background: linear-gradient(90deg, #ff6600, #ffaa00);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
    .tagline {
      font-size: 1.5rem;
      color: #00D4D4;
      margin: 1rem 0;
    }
    .dedication {
      font-size: 1rem;
      color: #999;
      margin: 1rem 0 2rem 0;
    }
    .endpoints {
      background: rgba(255, 102, 0, 0.1);
      border: 2px solid #ff6600;
      border-radius: 12px;
      padding: 1.5rem;
      margin: 2rem 0;
    }
    .endpoint {
      display: flex;
      justify-content: space-between;
      padding: 0.75rem;
      margin: 0.5rem 0;
      background: rgba(0, 0, 0, 0.3);
      border-radius: 6px;
      font-family: 'Courier New', monospace;
    }
    .endpoint-name { color: #00D4D4; }
    .endpoint-path { color: #ff6600; }
    .version {
      color: #666;
      font-size: 0.9rem;
      margin-top: 2rem;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="logo">🍊</div>
    <h1>grok-faf-mcp</h1>
    <div class="tagline">🏎️⚡️ FAST AF Edition</div>
    <div class="dedication">Dedicated to @elonmusk and the #1 model on Earth</div>

    <div class="endpoints">
      <h2 style="color: #ff6600; margin-top: 0;">Endpoints</h2>
      <div class="endpoint">
        <span class="endpoint-name">Health Check</span>
        <span class="endpoint-path">/health</span>
      </div>
      <div class="endpoint">
        <span class="endpoint-name">Server Info</span>
        <span class="endpoint-path">/info</span>
      </div>
      <div class="endpoint">
        <span class="endpoint-name">MCP SSE</span>
        <span class="endpoint-path">/sse</span>
      </div>
    </div>

    <div class="version">
      v${VERSION} • Vercel Edge • Grok gets the red-carpet treatment
    </div>
  </div>
</body>
</html>
  `);
});

// SSE endpoint - Full MCP with per-request transport
app.get('/sse', async (req, res) => {
  // Create SSE transport for this specific connection
  const transport = new SSEServerTransport('/sse', res);
  await mcpServer.connect(transport);

  // Handle client disconnect
  req.on('close', () => {
    // Connection closed
  });
});

export default app;
