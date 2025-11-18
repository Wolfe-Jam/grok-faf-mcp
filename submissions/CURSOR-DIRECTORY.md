# Cursor.directory Submission

## Package Information

**Name:** faf-mcp
**Tagline:** USE>FAF™ - Universal AI Context with "Use FAF" Pattern
**Category:** Developer Tools / AI Context Management
**npm:** https://www.npmjs.com/package/faf-mcp

## Description

> **"README for the AI era"** — Google Gemini

**Creators of the .FAF format.** First & only Persistent Project Context MCP server approved by Anthropic. **Context-Mirroring pioneer** - faf_bi_sync automatically creates `.cursorrules` and all platform-native files from your universal `project.faf`. IANA-registered format, Google Chrome-approved, 12K+ downloads.

**project.faf is to AI context what package.json is to dependencies.**

Start every prompt with "Use FAF" to invoke MCP tools correctly.

## Why Cursor Users Need This

**Solves the "Use FAF" Discovery:**

When you type commands like "faf sync", Cursor runs shell commands. When you type "Use FAF to sync my project", Cursor invokes MCP tools correctly. This is the MCP standard.

**Platform-Aware Sync:**

Creates `.cursorrules` automatically from your universal `project.faf` file. Syncs the same context to Cline (.clinerules), Windsurf (.windsurfrules), and Claude Desktop (CLAUDE.md).

## Installation for Cursor

```bash
npm install -g faf-mcp
```

Add to `~/.cursor/mcp.json`:

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

Restart Cursor.

## Usage Pattern

**Always start with "Use FAF":**

```
Use FAF to initialize my project
Use FAF to sync my project.faf to all platforms
Use FAF to score my AI-readiness
Use FAF to enhance my project context
```

## Key Features

- **50 MCP Tools** - faf_quick, faf_enhance, faf_score, faf_bi_sync, and more
- **IANA Standard** - Official `application/vnd.faf+yaml` MIME type
- **16.2x Performance** - Bundled engine, no CLI dependencies
- **Platform Sync** - Creates .cursorrules, .clinerules, .windsurfrules, CLAUDE.md
- **AI-Readiness Scoring** - Objective 0-100% project context measurement

## Example Workflow

1. Start new project in Cursor
2. Type: "Use FAF to initialize my project"
3. MCP creates `project.faf` with detected stack
4. Type: "Use FAF to sync to all platforms"
5. MCP creates `.cursorrules` and other platform files
6. Persistent AI context across all IDEs

## Why "Use FAF" Works

- ✅ MCP standard for explicit tool invocation
- ✅ Prevents Cursor from running shell commands
- ✅ Consistent behavior across all platforms
- ✅ No more manual file creation

## Links

- Website: https://faf.one
- Documentation: https://wolfe-jam.github.io/claude-faf-mcp/
- GitHub: https://github.com/Wolfe-Jam/faf-mcp
- Discord: https://discord.com/invite/3pjzpKsP

## Tags

cursor, mcp, ai-context, cursorrules, project-dna, iana-format, universal-context, developer-tools, ai-assistant, typescript

---

**USE>FAF™ - The universal solution for AI context** 🏎️⚡
