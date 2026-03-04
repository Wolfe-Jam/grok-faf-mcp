import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import { CallToolRequestSchema, ListResourcesRequestSchema, ListToolsRequestSchema, ReadResourceRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { FafResourceHandler } from '../src/handlers/resources.js';
import { FafToolHandler } from '../src/handlers/tools.js';
import { FafEngineAdapter } from '../src/handlers/engine-adapter.js';
import express from 'express';
import cors from 'cors';
// Hardcode version for Vercel serverless compatibility (import assert crashes)
const VERSION = '1.1.1';

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
  <meta name="description" content="Grok-exclusive FAF MCP — Fast AF Edition. 21 tools. Zero config. IANA-registered .FAF format.">
  <meta property="og:title" content="grok-faf-mcp | FAST⚡️AF">
  <meta property="og:description" content="Grok-exclusive FAF MCP — Fast AF Edition. 21 tools, zero config, persistent AI context.">
  <meta property="og:image" content="https://raw.githubusercontent.com/Wolfe-Jam/grok-faf-mcp/main/assets/thumbnail.png">
  <link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🍊</text></svg>">
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800;900&display=swap');
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Inter', -apple-system, sans-serif;
      background: #0a0a0a;
      color: #fff;
      min-height: 100vh;
      position: relative;
    }
    body::before {
      content: '';
      position: absolute;
      top: 0; left: 0; right: 0; bottom: 0;
      background: radial-gradient(ellipse at 50% 30%, rgba(255, 102, 0, 0.06) 0%, transparent 60%);
      pointer-events: none;
    }
    .accent-line {
      position: fixed;
      top: 0; left: 0; right: 0;
      height: 3px;
      background: linear-gradient(90deg, transparent 0%, #333 20%, #ff6600 50%, #333 80%, transparent 100%);
      z-index: 10;
    }
    .container {
      position: relative;
      z-index: 1;
      max-width: 800px;
      margin: 0 auto;
      padding: 60px 40px 40px;
      text-align: center;
    }
    .logo {
      font-size: 100px;
      margin-bottom: 12px;
      filter: drop-shadow(0 0 30px rgba(255, 165, 0, 0.3));
      animation: pulse 2s ease-in-out infinite;
    }
    @keyframes pulse {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.05); }
    }
    h1 {
      font-size: 2.5rem;
      font-weight: 900;
      letter-spacing: -1px;
      margin-bottom: 8px;
      color: #fff;
    }
    .tagline {
      font-size: 1.3rem;
      color: #FFD700;
      font-weight: 600;
      margin: 0.5rem 0;
    }
    .dedication {
      font-size: 0.95rem;
      color: #777;
      margin: 0.5rem 0;
    }
    .squeeze {
      font-size: 1rem;
      color: #fff;
      font-weight: 700;
      margin: 0.5rem 0 2rem 0;
    }
    .stats {
      display: flex;
      justify-content: center;
      gap: 48px;
      margin-bottom: 32px;
    }
    .stat-value { font-size: 2rem; font-weight: 800; color: #fff; }
    .stat-label { font-size: 11px; font-weight: 600; color: #555; text-transform: uppercase; letter-spacing: 1px; }
    .endpoints {
      background: rgba(255, 102, 0, 0.04);
      border: 1px solid rgba(255, 102, 0, 0.2);
      border-radius: 12px;
      padding: 24px;
      margin-bottom: 32px;
      text-align: left;
    }
    .endpoints h2 { font-size: 14px; color: #ff6600; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 16px; }
    .endpoint {
      display: flex;
      justify-content: space-between;
      padding: 10px 12px;
      margin: 6px 0;
      background: rgba(0, 0, 0, 0.4);
      border-radius: 6px;
      font-family: 'Courier New', monospace;
      font-size: 14px;
    }
    .endpoint-name { color: #ccc; }
    .endpoint-path { color: #ff6600; }
    .deploy { margin-bottom: 32px; }
    .deploy h2 { font-size: 14px; color: #ff6600; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 16px; }
    .deploy-grid {
      display: flex;
      gap: 16px;
      justify-content: center;
    }
    .deploy-option {
      background: rgba(255, 102, 0, 0.04);
      border: 1px solid rgba(255, 102, 0, 0.15);
      border-radius: 8px;
      padding: 16px 24px;
      flex: 1;
      max-width: 220px;
    }
    .deploy-option .label { font-size: 13px; font-weight: 700; color: #fff; margin-bottom: 4px; }
    .deploy-option .desc { font-size: 12px; color: #666; }
    .deploy-option code { font-size: 12px; color: #ff6600; font-family: 'Courier New', monospace; }
    .bottom-bar {
      border-top: 1px solid rgba(255, 102, 0, 0.1);
      padding-top: 24px;
      text-align: center;
      font-size: 12px;
      color: #555;
    }
    .bottom-bar .links { margin-bottom: 8px; }
    .bottom-bar .big-orange { color: #777; font-style: italic; }
    a { color: #ff6600; text-decoration: none; }
    a:hover { text-decoration: underline; }
  </style>
</head>
<body>
  <div class="accent-line"></div>
  <div class="container">
    <div class="logo">🍊</div>
    <h1>grok-faf-mcp</h1>
    <div class="tagline">🏎️⚡️ FAST AF Edition v${VERSION}</div>
    <div class="dedication">Dedicated to @elonmusk and the #1 model on Earth</div>
    <div class="squeeze">I/🍊 enjoy the squeeze!</div>

    <div class="stats">
      <div><div class="stat-value">21</div><div class="stat-label">MCP Tools</div></div>
      <div><div class="stat-value">0</div><div class="stat-label">Config Required</div></div>
      <div><div class="stat-value">19ms</div><div class="stat-label">Avg Response</div></div>
    </div>

    <div class="endpoints">
      <h2>Endpoints</h2>
      <div class="endpoint"><span class="endpoint-name">MCP SSE</span><span class="endpoint-path">/sse</span></div>
      <div class="endpoint"><span class="endpoint-name">Health Check</span><span class="endpoint-path">/health</span></div>
      <div class="endpoint"><span class="endpoint-name">Server Info</span><span class="endpoint-path">/info</span></div>
    </div>

    <div class="deploy">
      <h2>Three Ways to Deploy</h2>
      <div class="deploy-grid">
        <div class="deploy-option">
          <div class="label">Hosted</div>
          <div class="desc">Point to this URL</div>
          <code>/sse</code>
        </div>
        <div class="deploy-option">
          <div class="label">Self-Deploy</div>
          <div class="desc">Your own Vercel</div>
          <code>Deploy button</code>
        </div>
        <div class="deploy-option">
          <div class="label">Local</div>
          <div class="desc">Run anywhere</div>
          <code>npx grok-faf-mcp</code>
        </div>
      </div>
    </div>

    <div class="bottom-bar">
      <div class="links">v${VERSION} &bull; <a href="https://github.com/Wolfe-Jam/grok-faf-mcp">GitHub</a> &bull; <a href="https://npmjs.com/package/grok-faf-mcp">npm</a> &bull; <a href="https://faf.one">faf.one</a> &bull; Grok gets the red-carpet treatment</div>
      <div class="big-orange">We needed a Big-Orange, we got one! 🍊</div>
    </div>
  </div>
  <script defer src="https://va.vercel-scripts.com/v1/script.debug.js"></script>
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
