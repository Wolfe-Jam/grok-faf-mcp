# 🏎️ faf-mcp - Marketplace Submission Guide

## USE>FAF™ - Universal MCP Server for All Platforms

**Package:** `faf-mcp`
**Version:** 1.0.6
**NPM:** https://www.npmjs.com/package/faf-mcp
**GitHub:** https://github.com/Wolfe-Jam/faf-mcp

---

## 🎯 Quick Description (280 chars)

USE>FAF™ - Creators of the .FAF format. First & only Persistent Project Context MCP approved by Anthropic. Context-Mirroring (bi-sync) for all platforms. "README for AI era" - Google Gemini. IANA-registered. 12K+ downloads. 50 tools. Start with "Use FAF".

---

## 🎨 Long Description

### USE>FAF™ - Universal AI Context for All Platforms

**The MCP server that works everywhere.** One installation, every platform.

#### 💡 Quick Start

```
Use FAF to initialize your project
```

That's it! Start every prompt with **"Use FAF"** and the MCP tools handle the rest.

#### 🏅 Championship Credentials

- **Creators of the Format** - We designed .FAF (IANA-registered `application/vnd.faf+yaml`)
- **First & Only** - Persistent Project Context MCP Server approved by Anthropic
- **Creators of Context-Mirroring** - faf_bi_sync creates native files (.cursorrules, .clinerules, .windsurfrules, CLAUDE.md) for all platforms
- **Google Chrome-Approved** - Published Chrome Extension
- **12K+ npm Downloads** - Proven adoption across the ecosystem

> **"README for the AI era"** — Google Gemini

#### 🏁 Why "Use FAF" Works Everywhere

**Claude Desktop:**
- ✅ Calls MCP tool instead of searching web
- ✅ No void container issues
- ✅ Direct tool invocation

**Claude.ai (Web):**
- ✅ Stops web search addiction immediately
- ✅ Forces MCP tool usage
- ✅ No more guessing

**Cursor / Windsurf / Cline / VS Code:**
- ✅ MCP standard compliance
- ✅ Tool invocation (not manual file creation)
- ✅ Consistent behavior

#### 🛠️ Core Features

**50 MCP Tools (100% Standalone)**
- `faf_quick` - Lightning-fast project.faf creation (3ms avg)
- `faf_enhance` - Intelligent enhancement with auto-detection
- `faf_read` - Parse and validate FAF files
- `faf_write` - Create/update FAF with validation
- `faf_score` - AI-readiness scoring engine (0-100%)
- `faf_bi_sync` - Platform-aware sync to .cursorrules, .clinerules, .windsurfrules, CLAUDE.md
- **14 bundled commands** - Zero CLI dependencies, 16.2x faster

**IANA-Registered Standard**
- Official MIME type: `application/vnd.faf+yaml`
- W3C-compliant structured format
- Universal AI context protocol
- Cross-platform compatibility

**Championship Performance**
- **16.2x faster** than CLI versions (direct function calls vs process spawning)
- **19ms average** execution across all bundled commands
- **Fastest: 1ms** (formats command)
- **Zero memory leaks** with F1-grade engineering

#### 🎯 What is FAF?

**.FAF Position in the MCP Ecosystem:**

```
  Platform      Context          Protocol
  ────────      ───────          ────────
  Claude    →   .faf        →    MCP
  Cursor    →   .faf        →    MCP
  Windsurf  →   .faf        →    MCP
  VS Code   →   .faf        →    MCP
  Any IDE   →   IANA Format →    Open Protocol
```

**.FAF is the foundational, universal base layer** for any platform using the Model Context Protocol. It provides the standardized Context that makes MCP work for everyone.

#### 🏆 AI-Readiness Scorecard

**The closer you get to 100% the better AI can assist you.**

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🏎️  FAF AI-READINESS SCORE: 100/100 — PODIUM EDITION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 CORE INTELLIGENCE                    🎯 CONTEXT DELIVERY
├─ Project DNA            [██████] 100%  ├─ MCP Protocol      [██████] 100%
├─ Architecture Map       [██████] 100%  ├─ 50 Native Tools   [██████] 100%
├─ Domain Model          [██████] 100%  ├─ IANA Format       [██████] 100%
└─ Version Tracking      [██████] 100%  └─ Universal Context [██████] 100%

🚀 PERFORMANCE                          ⚡ STANDALONE OPERATION
├─ 16.2x CLI Speedup     [██████] 100%  ├─ Zero Dependencies [██████] 100%
├─ 19ms Avg Execution    [██████] 100%  ├─ Bundled Engine    [██████] 100%
├─ 50/50 Tools Active    [██████] 100%  ├─ Direct Function   [██████] 100%
└─ Zero Memory Leaks     [██████] 100%  └─ 14 Bundled Cmds   [██████] 100%

🏆 project.faf score: podium
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## 🔧 Installation & Setup

### One-Line Install

```bash
npm install -g faf-mcp
```

### Platform-Specific Setup

#### Claude Desktop

Add to `claude_desktop_config.json`:

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

**Config location:** `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS)

#### Cursor IDE

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

#### Windsurf Editor

Add to `~/.codeium/windsurf/mcp_config.json`:

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

#### VS Code

1. Install MCP extension
2. Add server config to settings

---

## 📊 Keywords & Tags

**Primary Keywords:**
- mcp
- mcp-server
- model-context-protocol
- faf
- .faf
- dot-faf
- ai-context
- project-dna
- ai-readiness

**Platform Keywords:**
- claude
- claude-desktop
- cursor
- cursor-ide
- windsurf
- windsurf-editor
- gemini
- vscode
- anthropic

**Feature Keywords:**
- context-management
- persistent-project-context
- universal-context
- iana-format
- project-intelligence
- codebase-understanding
- ai-assistant
- ai-tools
- llm-tools
- developer-tools

---

## 🎨 Assets

**Logo/Icon:** `./assets/icons/faf-icon-256.png` (Orange Smiley)

**Screenshots:**
- AI-Readiness Scorecard visualization
- project.faf file positioning diagram
- Platform sync demonstration
- USE>FAF prompt examples

---

## 🔗 Links

- **Website:** https://faf.one
- **Documentation:** https://wolfe-jam.github.io/claude-faf-mcp/
- **GitHub:** https://github.com/Wolfe-Jam/faf-mcp
- **npm Package:** https://www.npmjs.com/package/faf-mcp
- **Discord Community:** https://discord.com/invite/3pjzpKsP
- **Chrome Extension:** https://chromewebstore.google.com/detail/lnecebepmpjpilldfmndnaofbfjkjlkm
- **Changelog:** https://github.com/Wolfe-Jam/faf-mcp/blob/main/CHANGELOG.md
- **FAF Spec:** https://github.com/Wolfe-Jam/faf

---

## 📝 Sample Usage Examples

### Initialize New Project

```
Use FAF to initialize my project
```

### Sync to All Platforms

```
Use FAF to sync my project.faf to all platforms
```

### Check AI-Readiness Score

```
Use FAF to score my AI-readiness
```

### Enhance Project Context

```
Use FAF to enhance my project context
```

### Create Platform-Specific Files

```
Use FAF to create platform sync files
```

---

## 🏆 Unique Selling Points

1. **Universal Compatibility** - One server, all platforms
2. **"Use FAF" Pattern** - Solves MCP tool invocation issues across all platforms
3. **IANA-Registered Format** - Official standard (application/vnd.faf+yaml)
4. **Championship Performance** - 16.2x faster than CLI alternatives
5. **Zero Dependencies** - 100% standalone with bundled engine
6. **Platform-Aware Sync** - Automatically creates .cursorrules, .clinerules, .windsurfrules, CLAUDE.md
7. **AI-Readiness Scoring** - Objective 0-100% measurement
8. **F1-Inspired Engineering** - Zero errors, maximum performance

---

## 🎯 Target Audience

- AI-assisted developers using Claude Desktop, Cursor, Windsurf, VS Code
- Teams wanting persistent AI context across platforms
- Projects needing standardized AI-readiness measurement
- Developers frustrated with platform-specific context setup
- Anyone wanting championship-grade AI tooling

---

## 📄 License

MIT License - Free and open source

---

## 🚀 Submission Checklist

### Cline MCP Marketplace (GitHub Issue)
- [ ] Create issue with package info
- [ ] Include installation instructions
- [ ] Link to documentation
- [ ] Provide npm package link

### Smithery.ai
- [ ] Submit package URL
- [ ] Add description and tags
- [ ] Upload icon/logo
- [ ] Verify npm installation works

### Cursor.directory
- [ ] Create marketplace listing
- [ ] Provide Cursor-specific setup
- [ ] Highlight .cursorrules sync feature
- [ ] Include usage examples

### LobeHub
- [ ] Submit MCP server info
- [ ] Add comprehensive description
- [ ] Include all platform compatibility
- [ ] Link ecosystem resources

### MCPServers.org
- [ ] Register package
- [ ] Complete metadata
- [ ] Add tool documentation
- [ ] Verify universal compatibility

---

**Built with F1-inspired engineering principles** 🏎️⚡

**USE>FAF™ - The universal solution for AI context across all platforms**
