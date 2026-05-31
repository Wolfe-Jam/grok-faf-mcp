import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import { CallToolRequestSchema, ListResourcesRequestSchema, ListToolsRequestSchema, ReadResourceRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { FafResourceHandler } from './handlers/resources';
import { FafToolHandler } from './handlers/tools';
import { FafEngineAdapter } from './handlers/engine-adapter';
import express from 'express';
import cors from 'cors';
import { isError } from './utils/type-guards.js';
import { VERSION } from './version';

export interface GrokFafMcpServerConfig {
  transport: 'stdio' | 'http-sse';
  port?: number;
  fafEnginePath: string;
  debug?: boolean;
  cors?: boolean;
  host?: string;
}

export class GrokFafMcpServer {
  private server: Server;
  private resourceHandler: FafResourceHandler;
  private toolHandler: FafToolHandler;
  private config: GrokFafMcpServerConfig;
  private httpServer?: any;

  constructor(config: GrokFafMcpServerConfig) {
    this.config = {
      port: 3001,
      host: '0.0.0.0',
      cors: true,
      ...config
    };

    this.server = new Server(
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

    // Create engine adapter to pass to handlers
    const engineAdapter = new FafEngineAdapter(config.fafEnginePath);

    this.resourceHandler = new FafResourceHandler(engineAdapter);
    this.toolHandler = new FafToolHandler(engineAdapter);

    this.setupHandlers();
  }
  
  /** Expose the raw MCP Server instance (used by Smithery sandbox scanning) */
  getServer(): Server {
    return this.server;
  }

  private setupHandlers(): void {
    // Resource handlers
    this.server.setRequestHandler(ListResourcesRequestSchema, async () => {
      return this.resourceHandler.listResources();
    });

    this.server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
      return this.resourceHandler.readResource(request.params.uri);
    });

    // Tool handlers
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return this.toolHandler.listTools();
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const startTime = Date.now();
      try {
        const result = await this.toolHandler.callTool(
          request.params.name,
          request.params.arguments ?? {}
        );
        
        if (this.config.debug) {
          const duration = Date.now() - startTime;
          console.error(`Tool ${request.params.name} executed in ${duration}ms`);
        }
        
        return result;
      } catch (error: unknown) {
        const errorMessage = isError(error) ? error.message : 'Unknown error';
        console.error(`Tool execution failed:`, errorMessage);
        throw error;
      }
    });
  }

  private createHttpApp(): express.Application {
    const app = express();
    
    // Enable CORS if requested
    if (this.config.cors) {
      app.use(cors({
        origin: true,
        credentials: true,
        methods: ['GET', 'POST', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'Accept']
      }));
    }

    // Health check endpoint
    app.get('/health', (_req, res) => {
      res.json({
        status: 'healthy',
        server: 'grok-faf-mcp',
        version: VERSION,
        transport: 'http-sse',
        timestamp: new Date().toISOString(),
        championship: 'Grok-Exclusive FAF MCP — Fast AF Edition 🏎️⚡'
      });
    });

    // Server info endpoint
    app.get('/info', (_req, res) => {
      res.json({
        name: 'grok-faf-mcp',
        version: VERSION,
        description: 'grok-faf-mcp — the first MCP for Grok. Persistent project context for xAI/Grok',
        transport: 'http-sse',
        capabilities: {
          resources: { subscribe: true, listChanged: true },
          tools: { listChanged: true }
        },
        // TODO v1.3+: make dynamic via toolHandler.listTools() instead of hardcoded
        tools: [
          'faf_about', 'faf_what', 'faf_status', 'faf_score', 'refresh_faf', 'refresh_fafm', 'refresh_blend', 'faf_orchestrate_recommendation', 'faf_init',
          'faf_trust', 'faf_sync', 'faf_enhance', 'faf_bi_sync', 'faf_clear',
          'faf_debug', 'faf_read', 'faf_write', 'faf_list',
          'faf_friday', 'faf_guide', 'rag_query', 'rag_cache_stats',
          'rag_cache_clear', 'grok_go_fast_af'
        ]
      });
    });

    return app;
  }

  async start(): Promise<void> {
    if (this.config.transport === 'stdio') {
      const transport = new StdioServerTransport();
      await this.server.connect(transport);
      if (this.config.debug) {
        console.error('grok-faf-mcp started with stdio transport');
      }
    } else if (this.config.transport === 'http-sse') {
      const app = this.createHttpApp();

      // Add SSE endpoint handler - create transport per request
      app.get('/sse', async (req, res) => {
        if (this.config.debug) {
          console.error('New SSE connection established');
        }

        // Create SSE transport for this specific connection
        const transport = new SSEServerTransport('/sse', res);
        await this.server.connect(transport);

        // Handle client disconnect
        req.on('close', () => {
          if (this.config.debug) {
            console.error('SSE connection closed');
          }
        });
      });

      // Start HTTP server (ensure port and host are defined)
      const port = this.config.port ?? 3001;
      const host = this.config.host ?? '0.0.0.0';
      this.httpServer = app.listen(port, host, () => {
        if (this.config.debug) {
          console.error(`grok-faf-mcp started with HTTP/SSE transport on ${host}:${port}`);
          console.error(`SSE endpoint: http://${host}:${port}/sse`);
          console.error(`Health check: http://${host}:${port}/health`);
        }
      });

      // Handle server errors
      this.httpServer.on('error', (error: unknown) => {
        const errorMessage = isError(error) ? error.message : 'Unknown HTTP server error';
        console.error('HTTP server error:', errorMessage);
        throw error;
      });
    } else {
      throw new Error(`Unsupported transport: ${this.config.transport}`);
    }
  }

  async stop(): Promise<void> {
    if (this.httpServer) {
      return new Promise((resolve) => {
        this.httpServer.close(() => {
          if (this.config.debug) {
            console.error('grok-faf-mcp HTTP/SSE transport stopped');
          }
          resolve();
        });
      });
    }
  }

  getServerInfo() {
    return {
      name: 'grok-faf-mcp',
      version: VERSION,
      transport: this.config.transport,
      port: this.config.port,
      host: this.config.host,
      championship: 'Grok-Exclusive FAF MCP — Fast AF Edition 🏎️⚡'
    };
  }
}
