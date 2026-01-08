# grok-faf-mcp: First MCP Server for Grok
**v1.0.0 | FAST⚡️AF - Zero Friction, Instant Access**

---

## What It Is

The **first MCP (Model Context Protocol) server built specifically for Grok/xAI**, deployed on Vercel with URL-based access. No installation required—point your Grok integration at the endpoint and get instant access to 17 MCP tools + 14 bundled commands for universal AI context via IANA-registered .faf format.

**Production URLs:**
- **SSE Endpoint:** https://grok-faf-mcp.vercel.app/sse
- **Health Check:** https://grok-faf-mcp.vercel.app/health
- **Info:** https://grok-faf-mcp.vercel.app/info

**Core Capabilities:**
- 17 MCP tools (score, init, sync, validate, formats, etc.)
- 14 bundled CLI commands (bi-directional sync, drift detection, framework discovery)
- HTTP-SSE transport (Server-Sent Events)
- Global Edge deployment via Vercel CDN
- IANA-registered format support (application/vnd.faf+yaml)

---

## Why It Exists

**The Origin Story:**
Grok asked for MCP on a URL. This is the answer—delivered with Elon-style execution velocity.

While `claude-faf-mcp` (6.7k downloads) and `faf-mcp` (universal MCP) serve the broader ecosystem through local installation, xAI's Grok integration demanded a different approach:

**The Requirements:**
1. **URL-based access** - No `npm install`, no local runtime, no configuration files
2. **Production infrastructure** - Not a demo, not a prototype—battle-tested from day one
3. **Global availability** - Vercel Edge = worldwide CDN, sub-50ms latency globally
4. **Zero friction** - Add URL to config, start using tools immediately

**The xAI Context:**
When Grok needs to understand project context, it shouldn't require users to install dependencies, configure environments, or debug local servers. It should just **work**—instantly, everywhere, every time.

grok-faf-mcp is that infrastructure.

---

## Killer Feature

**Zero-Installation MCP Integration**

Traditional MCP workflow (local install):
```json
// 1. Install package
npm install -g some-mcp-server

// 2. Configure MCP client
{
  "mcpServers": {
    "server": {
      "command": "npx",
      "args": ["-y", "some-mcp-server"]
    }
  }
}

// 3. Debug Node.js runtime issues
// 4. Update when versions change
```

**grok-faf-mcp workflow (URL-based):**
```
Point to: https://grok-faf-mcp.vercel.app/sse

Done.
```

**What this eliminates:**
- ❌ No `npm install` required
- ❌ No Node.js version conflicts
- ❌ No local server management
- ❌ No "works on my machine" debugging
- ❌ No update cycles (Vercel deploys transparently)

**What this enables:**
- ✅ Instant access from any MCP client
- ✅ Works in sandboxed/restricted environments
- ✅ Always running latest version
- ✅ Global CDN = sub-50ms latency worldwide
- ✅ Zero maintenance for end users

---

## Value to xAI / AI Era

### For xAI Teams:
- **First-Mover Advantage** - grok-faf-mcp is the first MCP server built specifically for Grok (not adapted, not ported—**built for**)
- **Production-Ready** - Forked from faf-mcp v1.1.1, inherits championship testing standards and 19ms average execution speed
- **FAST⚡️AF Branding** - Aligns with Elon's execution philosophy: ship fast, ship right, no bureaucracy
- **xAI Strategic Positioning** - When Grok asks for MCP, this is the reference implementation

### For the AI Era:
- **Infrastructure Precedent** - Demonstrates that AI tooling can be **URL-native**, not just installable packages
- **Ecosystem Velocity** - Developers ship Grok integrations in minutes (not hours debugging local setups)
- **Standards Alignment** - Built on IANA-registered .faf format + Anthropic MCP spec = interoperable foundation
- **Global Accessibility** - Vercel Edge deployment means MCP tools work in 300+ edge locations worldwide

### Strategic Position:

**The Bigger Picture:**
AI context formats (like .faf) only matter if AI agents can **access** them. grok-faf-mcp proves that access can be:
1. **Instant** - No installation, no configuration
2. **Global** - Works everywhere via CDN
3. **Reliable** - Production Vercel infrastructure
4. **Standard** - MCP protocol + IANA format

This combination transforms .faf from "interesting spec" to **production infrastructure**.

**The xAI Narrative:**
When Grok evaluates project context, it needs three things:
1. **Format** - IANA-registered .faf (application/vnd.faf+yaml)
2. **Protocol** - MCP (Model Context Protocol)
3. **Infrastructure** - grok-faf-mcp (URL-based server)

Together, these create the **first complete stack** for AI-native context evaluation built specifically for Grok.

---

## Performance & Heritage

**Performance Metrics:**
```
Execution Speed:      19ms average
Fastest Command:      1ms (formats)
CLI Speedup:          16.2x faster
MCP Tools:            17 total
Bundled Commands:     14 total
Transport:            HTTP-SSE
Platform:             Vercel Edge
Status:               Production
```

**Built on Proven Foundation:**
- Forked from faf-mcp v1.1.1
- Inherits 17 MCP tools, 14 bundled commands
- Inherits 16.2x performance gains over previous versions
- Inherits championship testing standards
- Inherits IANA-registered format support

**Why Separate Package?**
- Grok asked for URL-based MCP (not local install)
- First-mover positioning for xAI ecosystem
- Platform-specific branding (FAST⚡️AF)
- Download count metrics for FAF ecosystem growth
- Elon-style execution (ship what was asked for, ship it fast)

---

## Quick Start

**Option 1: URL-Based (Instant)**
```
Add to MCP client config:
SSE Endpoint: https://grok-faf-mcp.vercel.app/sse
```

**Option 2: Local Install (Optional)**
```bash
npm install -g grok-faf-mcp

# Add to MCP config:
{
  "mcpServers": {
    "grok-faf": {
      "command": "npx",
      "args": ["-y", "grok-faf-mcp"]
    }
  }
}
```

**Then start every prompt with "Use FAF":**
```
Use FAF to initialize my project
Use FAF to score my AI-readiness
Use FAF to sync project context
```

---

## Technical Architecture

**Deployment Stack:**
- **Platform:** Vercel Serverless Functions
- **Runtime:** Node.js 18+
- **Transport:** HTTP Server-Sent Events (SSE)
- **Protocol:** MCP via @modelcontextprotocol/sdk
- **Format:** IANA-registered application/vnd.faf+yaml

**Key Files:**
- `api/index.ts` - Vercel serverless function (Express + MCP server)
- `vercel.json` - Zero-config routing (all paths → /api/index)
- `package.json` - grok-faf-mcp package config (inherits faf-cli tools)

**Why Vercel?**
- Global Edge network (300+ locations)
- Zero-config deployments
- Automatic HTTPS
- Built-in monitoring
- Transparent updates (users always run latest version)

---

## Community & Ecosystem

**Official Links:**
- **Website:** https://faf.one
- **Production:** https://grok-faf-mcp.vercel.app/
- **Discord:** https://discord.com/invite/56fPBUJKfk
- **npm:** https://www.npmjs.com/package/grok-faf-mcp
- **GitHub:** https://github.com/Wolfe-Jam/grok-faf-mcp

**FAF Package Family:**
- `claude-faf-mcp` - 6.7k downloads (Claude Desktop-specific)
- `faf-mcp` - 800+ downloads (Universal MCP server)
- `grok-faf-mcp` - NEW (Grok/xAI-specific, URL-based)

**Related Tools:**
- `faf-cli` - Command-line interface for FAF operations
- `xai-faf-zig` - Native Zig CLI (10,000 scores/second)
- `xai-mcp-server` - Rust MCP server (300/300 tests passing)

---

## The Bottom Line

**Grok asked for MCP on a URL.**

Not a package. Not a binary. A **URL**.

grok-faf-mcp delivered—first to ship, zero friction, production-ready from day one.

**This is championship engineering:**
- Standards that work (IANA + MCP)
- Code that ships (Vercel production)
- Experiences that resonate (instant access, no setup)

**Built for Grok. Built for Speed. Built Right.**

---

**Built with:** Node.js 18+ | Vercel Edge | MCP Protocol | IANA Format
**Status:** Production (https://grok-faf-mcp.vercel.app/)
**Philosophy:** FAST⚡️AF - First to Ship, Zero Friction
**Repository:** https://github.com/Wolfe-Jam/grok-faf-mcp
