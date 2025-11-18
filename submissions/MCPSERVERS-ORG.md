# MCPServers.org Submission

## Server Information

**Server Name:** faf-mcp
**Display Name:** .faf (USE>FAF™)
**Package:** faf-mcp
**Version:** 1.0.6
**npm URL:** https://www.npmjs.com/package/faf-mcp

## Classification

**Type:** MCP Server
**Category:** Developer Tools / AI Context Management
**Platform Compatibility:** Universal (Claude Desktop, Cursor, Windsurf, VS Code, all MCP clients)

## Overview

> **"README for the AI era"** — Google Gemini

**Championship Credentials:**
- 🏅 Creators of the Format - We designed .FAF (IANA-registered `application/vnd.faf+yaml`)
- 🏅 First & Only - Persistent Project Context MCP Server approved by Anthropic
- 🏅 Creators of Context-Mirroring - faf_bi_sync creates native files (.cursorrules, .clinerules, .windsurfrules, CLAUDE.md) for persistence across all AI setups
- 🏅 Google Chrome-Approved - Published Chrome Extension
- 🏅 12K+ npm Downloads - Proven adoption across the ecosystem

Universal MCP server providing 50 championship-grade tools for .FAF (Foundational AI-context Format). Built on IANA-registered standard, delivering persistent AI context that works across all platforms.

**project.faf is to AI context what package.json is to dependencies.**

## Key Innovation: "Use FAF" Pattern

**MCP Standard for Explicit Tool Invocation**

Start every prompt with "Use FAF" to invoke MCP tools correctly:

- ✅ Claude Desktop: Calls MCP tool instead of searching web, no void containers
- ✅ Claude.ai (Web): Stops web search addiction immediately, forces MCP usage
- ✅ Cursor/Windsurf/Cline: MCP compliance, tool invocation not manual file creation
- ✅ VS Code: Consistent behavior across all MCP clients

## Tools Provided

**50 MCP Tools (Bundled Engine - Zero Dependencies):**

### Core Operations
- `faf_quick` - Lightning-fast project.faf creation (3ms avg)
- `faf_init` - Initialize FAF context with auto-detection
- `faf_enhance` - Intelligent enhancement with 153 framework types
- `faf_read` - Parse and validate FAF files
- `faf_write` - Create/update FAF with strict validation
- `faf_validate` - Schema validation and error reporting

### Intelligence & Scoring
- `faf_score` - AI-readiness scoring (0-100%)
- `faf_analyze` - Deep context analysis
- `faf_compress` - Intelligent size optimization
- `faf_diff` - Compare FAF versions

### Platform Sync
- `faf_bi_sync` - Platform-aware sync to .cursorrules, .clinerules, .windsurfrules, CLAUDE.md
- `faf_migrate` - Migrate legacy formats
- `faf_export` - Export to various formats

### Discovery & Formats
- `faf_formats` - Discover all project formats (153 validated types)
- `faf_detect` - Auto-detect project stack
- `faf_list` - List all FAF files in project

### 35+ Additional Specialized Tools
- Full list in documentation

## Performance Metrics

**Championship-Grade Engineering:**

- **16.2x faster** than CLI alternatives (direct function calls vs process spawning)
- **19ms average** execution time across all bundled commands
- **Fastest tool: 1ms** (formats command)
- **Zero memory leaks** with strict TypeScript
- **100% standalone** - bundled engine, no external CLI dependencies

## Installation

```bash
npm install -g faf-mcp
```

## Configuration Examples

### Universal Config (All Platforms)

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

### Platform-Specific Paths

**Claude Desktop:**
- macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
- Windows: `%APPDATA%\Claude\claude_desktop_config.json`

**Cursor IDE:**
- `~/.cursor/mcp.json`

**Windsurf Editor:**
- `~/.codeium/windsurf/mcp_config.json`

**VS Code:**
- Add via MCP extension settings

## Usage Examples

### Initialize New Project

**Input:**
```
Use FAF to initialize my project
```

**Action:** Calls `faf_init` tool, auto-detects stack, creates `project.faf`

### Sync to All Platforms

**Input:**
```
Use FAF to sync my project.faf to all platforms
```

**Action:** Calls `faf_bi_sync` with `target: 'all'`, creates:
- `.cursorrules` for Cursor IDE
- `.clinerules` for Cline
- `.windsurfrules` for Windsurf
- `CLAUDE.md` for Claude Desktop

### Check AI-Readiness

**Input:**
```
Use FAF to score my AI-readiness
```

**Action:** Calls `faf_score` tool, returns 0-100% score with detailed breakdown

### Enhance Project Context

**Input:**
```
Use FAF to enhance my project context
```

**Action:** Calls `faf_enhance` tool, auto-detects missing sections, enriches context

## Technical Specifications

**IANA-Registered Standard:**
- MIME Type: `application/vnd.faf+yaml`
- W3C-compliant structured format
- Universal AI context protocol
- Cross-platform compatibility

**Architecture:**
- Language: TypeScript (Strict Mode)
- Dependencies: Minimal (@modelcontextprotocol/sdk, yaml)
- Bundled Commands: 14 core FAF operations
- Tool Count: 50 MCP tools

**AI-Readiness Scoring:**
- 0-54%: INCOMPLETE (Pit Stop Required)
- 55-84%: GOOD (Racing Condition)
- 85-94%: BRONZE (Podium Contender)
- 95-99%: SILVER (Championship Form)
- 100%: GOLD (Pole Position)

## Platform-Aware Sync

Automatically creates platform-specific context files from universal `project.faf`:

| Platform | File Created | Purpose |
|----------|--------------|---------|
| Cursor IDE | `.cursorrules` | Cursor-native context |
| Cline | `.clinerules` | Cline-native context |
| Windsurf | `.windsurfrules` | Windsurf-native context |
| Claude Desktop | `CLAUDE.md` | Universal markdown context |

All synced from one source of truth: `project.faf`

## Use Cases

1. **Persistent AI Context** - Project DNA lives in `project.faf`, readable by any AI or human
2. **Universal Format** - One file works across Claude, Gemini, Cursor, Windsurf, any MCP platform
3. **Zero Setup Tax** - Eliminate AI context setup across entire team
4. **Cross-Platform Sync** - Maintain consistency across multiple AI IDEs
5. **AI-Readiness Measurement** - Objective scoring of context quality
6. **Championship Engineering** - F1-inspired performance, zero errors

## Resources

**Documentation:**
- Full Docs: https://wolfe-jam.github.io/claude-faf-mcp/
- Getting Started: https://github.com/Wolfe-Jam/faf-mcp#quick-start
- MCP Tools Reference: https://github.com/Wolfe-Jam/claude-faf-mcp/blob/main/docs/mcp-tools.md
- FAQ: https://github.com/Wolfe-Jam/claude-faf-mcp/blob/main/docs/FAQ.md

**Community:**
- Discord: https://discord.com/invite/3pjzpKsP
- GitHub: https://github.com/Wolfe-Jam/faf-mcp
- Website: https://faf.one

**Ecosystem:**
- FAF Specification: https://github.com/Wolfe-Jam/faf
- Chrome Extension: https://chromewebstore.google.com/detail/lnecebepmpjpilldfmndnaofbfjkjlkm
- FAF CLI: https://github.com/Wolfe-Jam/faf-cli

## Maintainer

**Author:** wolfejam
**Email:** team@faf.one
**Website:** https://wolfejam.dev

## License

MIT License - Free and open source forever

## Keywords

mcp, mcp-server, model-context-protocol, faf, dot-faf, claude, claude-desktop, cursor, cursor-ide, windsurf, windsurf-editor, gemini, vscode, anthropic, ai-context, project-dna, ai-readiness, context-management, persistent-project-context, universal-context, iana-format, project-intelligence, codebase-understanding, ai-assistant, ai-tools, llm-tools, developer-tools, devtools, typescript, open-source, mit-license, free-forever

---

**USE>FAF™ - Universal AI context for all platforms** 🏎️⚡

Built with F1-inspired engineering principles - Championship performance, zero errors, maximum speed.
