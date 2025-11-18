# grok-faf-mcp | FAST⚡️AF

<div align="center">
  <img src="https://raw.githubusercontent.com/Wolfe-Jam/faf/main/assets/logos/orange-smiley.svg" alt="FAF" width="80" />

  <h3>Grok asked for MCP on a URL. This is it.</h3>

  <p><strong>First MCP server built for Grok</strong></p>
  <p><code>URL-based • Zero config • Just works</code></p>

  [![NPM Downloads](https://img.shields.io/npm/dt/grok-faf-mcp?label=downloads&color=00CCFF)](https://www.npmjs.com/package/grok-faf-mcp)
  [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
  [![Vercel](https://img.shields.io/badge/Vercel-Live-black?logo=vercel)](https://grok-faf-mcp.vercel.app)
</div>

---

## ⚡ What You Get

```
URL:     https://grok-faf-mcp.vercel.app/
Format:  IANA-registered .faf (application/vnd.faf+yaml)
Tools:   17 MCP tools + 14 bundled commands
Speed:   19ms average execution
Status:  FAST⚡️AF
```

**MCP over HTTP-SSE.** Point your Grok integration at the URL. That's it.

---

## 🚀 Quick Start

### Option 1: URL-Based (Vercel)

```
https://grok-faf-mcp.vercel.app/sse
```

Point your MCP client to this endpoint. All tools available instantly.

### Option 2: Local Install

```bash
npm install -g grok-faf-mcp
```

**Add to your MCP config:**

```json
{
  "mcpServers": {
    "grok-faf": {
      "command": "npx",
      "args": ["-y", "grok-faf-mcp"]
    }
  }
}
```

---

## 🎯 Use Cases

**AI Context Intelligence**
```
Use FAF to initialize my project
Use FAF to score my AI-readiness
Use FAF to sync project context
```

**Project DNA Management**
- Persistent context in `project.faf`
- Cross-platform compatibility
- Human and AI readable
- IANA-registered standard

**URL-Based MCP**
- No installation required
- Instant access via Vercel
- Production-ready infrastructure
- Global edge deployment

---

## 🛠️ MCP Tools

### Core Tools (17 Total)
- `faf_quick` - Lightning-fast project.faf creation (3ms)
- `faf_enhance` - Intelligent enhancement with auto-detection
- `faf_read` - Parse and validate FAF files
- `faf_write` - Create/update FAF with validation
- `faf_score` - AI-readiness scoring (0-100%)
- `faf_sync` - Bi-directional CLAUDE.md sync
- `faf_status` - Health check and diagnostics
- `faf_init` - Initialize new FAF project
- `faf_trust` - Verify integrity
- `faf_bi_sync` - Platform context mirroring
- `faf_clear` - Reset and cleanup
- `faf_debug` - Verbose diagnostics
- `faf_list` - Show all available tools
- `faf_chat` - Interactive assistance
- `faf_friday` - Project summaries
- `faf_guide` - Documentation access
- `faf_about` - Server information

### Bundled Commands (14 Total)
Direct TypeScript function calls - 16.2x faster than CLI subprocess spawning:

- `audit` - Security and quality checks
- `auto` - Automated workflows
- `bi-sync` - Bidirectional synchronization
- `doctor` - Diagnostic and repair
- `enhance` - Context enhancement
- `formats` - Format detection
- `init` - Project initialization
- `innit` - Quick initialization
- `migrate` - Version migration
- `quick` - Fast operations
- `score` - AI-readiness scoring
- `sync` - Context synchronization
- `update` - Version updates
- `validate` - Validation checks

---

## 📊 Performance

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚡ FAST AF PERFORMANCE METRICS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Execution Speed:      19ms average
Fastest Command:      1ms (formats)
CLI Speedup:          16.2x faster
Memory Footprint:     Zero leaks
Bundled Operations:   14 commands
Transport:            HTTP-SSE (Vercel)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**Why Fast?**
- Direct function calls (no subprocess spawning)
- TypeScript strict mode
- Zero external dependencies for core operations
- Global edge deployment via Vercel

---

## 🏆 Why grok-faf-mcp?

**Built for Grok**
- First MCP server responding to Grok's URL request
- Optimized for xAI integration
- Production-ready Vercel deployment
- FAST⚡️AF execution philosophy

**IANA-Registered Format**
- Official MIME type: `application/vnd.faf+yaml`
- W3C-compliant structured format
- Universal AI context protocol
- Cross-platform compatibility

**Championship Engineering**
- F1-inspired performance standards
- TypeScript strict mode
- Zero runtime errors
- Battle-tested in production

**FREE FOREVER**
- MIT License
- Open source
- No subscription
- No strings attached

---

## 🔗 Endpoints

**Production (Vercel):**
- Root: `https://grok-faf-mcp.vercel.app/`
- Health: `https://grok-faf-mcp.vercel.app/health`
- Info: `https://grok-faf-mcp.vercel.app/info`
- SSE: `https://grok-faf-mcp.vercel.app/sse`

**Local Development:**
```bash
npm run dev:http
# Server: http://localhost:3001
# SSE: http://localhost:3001/sse
```

---

## 📦 Ecosystem

Built on the FAF (Foundational AI-context Format) ecosystem:

- **[FAF Format Spec](https://github.com/Wolfe-Jam/faf)** - Official IANA specification
- **[FAF CLI](https://github.com/Wolfe-Jam/faf-cli)** - Command-line tooling
- **[faf-mcp](https://github.com/Wolfe-Jam/faf-mcp)** - Universal MCP server
- **[claude-faf-mcp](https://github.com/Wolfe-Jam/claude-faf-mcp)** - Claude Desktop-specific
- **[faf.one](https://faf.one)** - Official website

---

## 💬 Community

- **[Discord](https://discord.com/invite/56fPBUJKfk)** - Join the conversation
- **[GitHub Issues](https://github.com/Wolfe-Jam/grok-faf-mcp/issues)** - Report bugs, request features
- **[Chrome Extension](https://chromewebstore.google.com/detail/lnecebepmpjpilldfmndnaofbfjkjlkm)** - Browser integration

---

## 📄 License

MIT License - Free and open source

---

<div align="center">
  <p><strong>Built for Grok. Built for Speed. Built Right.</strong></p>
  <p>FAST⚡️AF • First to Ship • Zero Friction</p>
  <p><em>URL-based MCP. Exactly what you asked for.</em></p>
</div>

**Built with F1-inspired engineering principles** 🏎️⚡
