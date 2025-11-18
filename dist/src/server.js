"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClaudeFafMcpServer = void 0;
const index_js_1 = require("@modelcontextprotocol/sdk/server/index.js");
const stdio_js_1 = require("@modelcontextprotocol/sdk/server/stdio.js");
const sse_js_1 = require("@modelcontextprotocol/sdk/server/sse.js");
const types_js_1 = require("@modelcontextprotocol/sdk/types.js");
const resources_1 = require("./handlers/resources");
const tools_1 = require("./handlers/tools");
const engine_adapter_1 = require("./handlers/engine-adapter");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const type_guards_js_1 = require("./utils/type-guards.js");
const version_1 = require("./version");
class ClaudeFafMcpServer {
    server;
    resourceHandler;
    toolHandler;
    config;
    httpServer;
    constructor(config) {
        this.config = {
            port: 3001,
            host: '0.0.0.0',
            cors: true,
            ...config
        };
        this.server = new index_js_1.Server({
            name: 'claude-faf-mcp',
            version: version_1.VERSION,
        }, {
            capabilities: {
                resources: {
                    subscribe: true,
                    listChanged: true,
                },
                tools: {
                    listChanged: true,
                },
            },
        });
        // Create engine adapter to pass to handlers
        const engineAdapter = new engine_adapter_1.FafEngineAdapter(config.fafEnginePath);
        this.resourceHandler = new resources_1.FafResourceHandler(engineAdapter);
        this.toolHandler = new tools_1.FafToolHandler(engineAdapter);
        this.setupHandlers();
    }
    setupHandlers() {
        // Resource handlers
        this.server.setRequestHandler(types_js_1.ListResourcesRequestSchema, async () => {
            return this.resourceHandler.listResources();
        });
        this.server.setRequestHandler(types_js_1.ReadResourceRequestSchema, async (request) => {
            return this.resourceHandler.readResource(request.params.uri);
        });
        // Tool handlers
        this.server.setRequestHandler(types_js_1.ListToolsRequestSchema, async () => {
            return this.toolHandler.listTools();
        });
        this.server.setRequestHandler(types_js_1.CallToolRequestSchema, async (request) => {
            const startTime = Date.now();
            try {
                const result = await this.toolHandler.callTool(request.params.name, request.params.arguments ?? {});
                if (this.config.debug) {
                    const duration = Date.now() - startTime;
                    console.error(`Tool ${request.params.name} executed in ${duration}ms`);
                }
                return result;
            }
            catch (error) {
                const errorMessage = (0, type_guards_js_1.isError)(error) ? error.message : 'Unknown error';
                console.error(`Tool execution failed:`, errorMessage);
                throw error;
            }
        });
    }
    createHttpApp() {
        const app = (0, express_1.default)();
        // Enable CORS if requested
        if (this.config.cors) {
            app.use((0, cors_1.default)({
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
                server: 'claude-faf-mcp',
                version: version_1.VERSION,
                transport: 'http-sse',
                timestamp: new Date().toISOString(),
                championship: '33+ tools, zero shell execution'
            });
        });
        // Server info endpoint
        app.get('/info', (_req, res) => {
            res.json({
                name: 'claude-faf-mcp',
                version: version_1.VERSION,
                description: 'Universal FAF MCP Server for Claude - AI Context Intelligence & Project Enhancement',
                transport: 'http-sse',
                capabilities: {
                    resources: { subscribe: true, listChanged: true },
                    tools: { listChanged: true }
                },
                tools: [
                    'faf_status', 'faf_score', 'faf_init', 'faf_trust',
                    'faf_sync', 'faf_enhance', 'faf_bi_sync', 'faf_clear', 'faf_debug'
                ]
            });
        });
        return app;
    }
    async start() {
        if (this.config.transport === 'stdio') {
            const transport = new stdio_js_1.StdioServerTransport();
            await this.server.connect(transport);
            if (this.config.debug) {
                console.error('Claude FAF MCP Server started with stdio transport');
            }
        }
        else if (this.config.transport === 'http-sse') {
            const app = this.createHttpApp();
            // Add SSE endpoint handler - create transport per request
            app.get('/sse', async (req, res) => {
                if (this.config.debug) {
                    console.error('New SSE connection established');
                }
                // Create SSE transport for this specific connection
                const transport = new sse_js_1.SSEServerTransport('/sse', res);
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
                    console.error(`Claude FAF MCP Server started with HTTP/SSE transport on ${host}:${port}`);
                    console.error(`SSE endpoint: http://${host}:${port}/sse`);
                    console.error(`Health check: http://${host}:${port}/health`);
                }
            });
            // Handle server errors
            this.httpServer.on('error', (error) => {
                const errorMessage = (0, type_guards_js_1.isError)(error) ? error.message : 'Unknown HTTP server error';
                console.error('HTTP server error:', errorMessage);
                throw error;
            });
        }
        else {
            throw new Error(`Unsupported transport: ${this.config.transport}`);
        }
    }
    async stop() {
        if (this.httpServer) {
            return new Promise((resolve) => {
                this.httpServer.close(() => {
                    if (this.config.debug) {
                        console.error('Claude FAF MCP Server HTTP/SSE transport stopped');
                    }
                    resolve();
                });
            });
        }
    }
    getServerInfo() {
        return {
            name: 'claude-faf-mcp',
            version: version_1.VERSION,
            transport: this.config.transport,
            port: this.config.port,
            host: this.config.host,
            championship: 'v3.0.0 - 33+ native tools'
        };
    }
}
exports.ClaudeFafMcpServer = ClaudeFafMcpServer;
//# sourceMappingURL=server.js.map