#!/usr/bin/env node

/**
 * Post-install message: Confirm successful installation
 *
 * Shows clear success message with version, tool count, and usage info.
 *
 * Writes directly to /dev/tty to bypass npm output suppression.
 */

const packageJson = require('../package.json');
const fs = require('fs');

const message = `
\x1b[32m✓\x1b[0m grok-faf-mcp@${packageJson.version} installed successfully
  17 MCP tools ready
  URL: https://grok-faf-mcp.vercel.app/sse

Test in Grok:
  Point MCP client to the URL above
`;

try {
  // Write directly to terminal, bypassing npm's output suppression
  fs.writeSync(fs.openSync('/dev/tty', 'w'), message);
} catch (e) {
  // Fallback to stderr if /dev/tty not available (Windows, etc.)
  console.error(message);
}
