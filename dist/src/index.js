#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const server_js_1 = require("./server.js");
// MCP servers run via stdio transport when launched by Claude Desktop
async function main() {
    const server = new server_js_1.ClaudeFafMcpServer({
        transport: 'stdio',
        fafEnginePath: 'faf'
    });
    await server.start();
}
main().catch((error) => {
    console.error('Failed to start MCP server:', error);
    process.exit(1);
});
//# sourceMappingURL=index.js.map