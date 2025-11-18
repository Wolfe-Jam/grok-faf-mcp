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

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Grok-exclusive FAF MCP — Fast AF Edition 🏎️⚡',
    dedication: 'Dedicated to @elonmusk and the #1 model on Earth',
    version: VERSION,
    platform: 'vercel',
    grokExclusive: true,
    tagline: 'Grok gets the red-carpet treatment',
    endpoints: {
      health: '/health',
      info: '/info',
      sse: '/sse'
    }
  });
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
