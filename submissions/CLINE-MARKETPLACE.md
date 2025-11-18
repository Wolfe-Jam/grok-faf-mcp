# Cline MCP Marketplace Submission

## Package Information

**Name:** faf-mcp
**Version:** 1.0.6
**npm:** https://www.npmjs.com/package/faf-mcp
**GitHub:** https://github.com/Wolfe-Jam/faf-mcp

## Short Description

USE>FAF™ - Creators of .FAF format. First & only Persistent Project Context MCP approved by Anthropic. Context-Mirroring (faf_bi_sync) creates `.clinerules` and all platform files automatically. 50 tools, IANA-registered. Start every prompt with "Use FAF". Works across all platforms including Cline.

## Installation

```bash
npm install -g faf-mcp
```

## Configuration

Add to your Cline MCP config:

```json
{
  "mcpServers": {
    "faf": {
      "command": "npx",
      "args": ["-y", "faf-mcp"]
    }
  }
}
```

## Key Features for Cline Users

- **Platform-Aware Sync:** Automatically creates `.clinerules` from your `project.faf`
- **"Use FAF" Pattern:** MCP standard invocation - start every prompt with "Use FAF"
- **50 MCP Tools:** Including faf_quick, faf_enhance, faf_score, faf_bi_sync
- **16.2x Performance:** Faster than CLI alternatives with bundled engine
- **IANA Standard:** Official `application/vnd.faf+yaml` MIME type

## Usage in Cline

```
Use FAF to initialize my project
Use FAF to sync my project.faf to all platforms
Use FAF to score my AI-readiness
```

## Why It Matters for Cline

- ✅ Creates `.clinerules` automatically from universal `project.faf`
- ✅ Syncs context across Cline, Cursor, Windsurf, Claude Desktop
- ✅ MCP standard compliance - "Use FAF" triggers tool invocation
- ✅ Championship performance with zero dependencies

## Documentation

- Full docs: https://wolfe-jam.github.io/claude-faf-mcp/
- Getting Started: https://github.com/Wolfe-Jam/faf-mcp#quick-start
- FAQ: https://github.com/Wolfe-Jam/claude-faf-mcp/blob/main/docs/FAQ.md

## License

MIT

---

**USE>FAF™ - Universal AI context for all platforms** 🏎️⚡
