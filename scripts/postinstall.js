#!/usr/bin/env node

/**
 * Post-install message: Confirm successful installation
 *
 * Shows clear success message with version, tool count, and usage info.
 */

const packageJson = require('../package.json');

console.log('');
console.log('\x1b[32m✓\x1b[0m grok-faf-mcp@' + packageJson.version + ' installed successfully');
console.log('  17 MCP tools ready');
console.log('  URL: https://grok-faf-mcp.vercel.app/sse');
console.log('');
console.log('Test in Grok:');
console.log('  Point MCP client to the URL above');
console.log('');
