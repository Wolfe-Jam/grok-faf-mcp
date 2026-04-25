<!-- faf: grok-faf-mcp | TypeScript | grok-faf-mcp | FAST⚡️AF • First MCP server for Grok • URL-based AI context • IANA-registered .faf format (application/vnd.faf+yaml) -->

# 🏎️ CLAUDE.md - grok-faf-mcp | FAST⚡️AF

## PROJECT STATE: SHIPPING
**Current Position:** First MCP server built for Grok
**Tyre Compound:** ULTRASOFT C5 (Maximum Performance)
**Status:** URL-based, Vercel-deployed, Production-ready

---

## CORE CONTEXT

### Project Identity
- **Name:** grok-faf-mcp
- **Purpose:** First MCP server responding to Grok's URL request
- **Stack:** Node.js/TypeScript + Vercel
- **Quality:** F1-INSPIRED (Championship Performance)
- **Philosophy:** FAST⚡️AF - First to ship, zero friction, exactly what you asked for

### The Mission

**Grok asked for MCP on a URL. This is it.**

This is the FIRST MCP server specifically built for Grok/xAI, deployed on Vercel with URL-based access. No installation required. Point your Grok integration at the endpoint, get instant access to 17 MCP tools + 14 bundled commands.

### Repository Structure

```
grok-faf-mcp/
├── src/                  # TypeScript source
├── api/                  # Vercel serverless functions
│   └── index.ts         # Main MCP server endpoint
├── dist/                # Compiled output
├── package.json         # grok-faf-mcp package config
├── README.md            # FAST⚡️AF documentation
├── CLAUDE.md            # This file - persistent context
└── vercel.json          # Vercel deployment config
```

### Technical Architecture
- **What:** URL-based MCP server for Grok
- **How:** Express app on Vercel with SSE transport
- **Why:** Grok asked for MCP on a URL - first to deliver
- **Format:** IANA-registered .faf (application/vnd.faf+yaml)

### Context Quality Status
- **Overall Assessment:** Production-ready (based on faf-mcp v1.1.1)
- **Last Updated:** 2025-11-18
- **Version:** 1.0.0 (First Release)

---

## Deployment Architecture

### Vercel Production
- **URL:** https://grok-faf-mcp.vercel.app/
- **SSE Endpoint:** https://grok-faf-mcp.vercel.app/sse
- **Health Check:** https://grok-faf-mcp.vercel.app/health
- **Info:** https://grok-faf-mcp.vercel.app/info

### Key Features
- **Global Edge Deployment** - Vercel's worldwide CDN
- **Zero Configuration** - Just point to the URL
- **Production Infrastructure** - Battle-tested on faf-mcp
- **HTTP-SSE Transport** - MCP over Server-Sent Events

---

## Quick Start for AI

**Q: How do I use grok-faf-mcp?**

**A: Two options:**

**Option 1: URL-Based (Instant)**
```
Point your MCP client to: https://grok-faf-mcp.vercel.app/sse
```

**Option 2: Local Install**
```
npm install -g grok-faf-mcp

Add to MCP config:
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

## NPM PUBLISH PROTOCOL - MANDATORY

**CRITICAL RULE: `npm publish` IS FORBIDDEN WITHOUT APPROVAL**

Before ANY npm publish of grok-faf-mcp:

1. **Follow the MCP Publish Checklist** at `/Users/wolfejam/FAF-GOLD/PLANET-FAF/PUBLISH-PROTOCOL.md`
2. **Run ALL checklist items** (build, tests, version, README, CHANGELOG, etc.)
3. **Request approval** with checklist results in the format specified
4. **Wait for OFFICIAL GO!** from wolfejam

**Required approval signals:**
- ✅ **"GO!"** - Approved to publish
- ✅ **"GREEN LIGHT"** - Approved to publish
- ❌ Anything else - DO NOT PUBLISH

**Why this matters:**
- First MCP server for Grok - sets the standard
- Elon/xAI reputation on the line
- URL-based deployment - production infrastructure
- One bad publish damages the entire FAF ecosystem

**No exceptions. No shortcuts. Professional. Boring. Trusted.**

---

## Strategic Position

### Market Positioning

**The Story:**
"Grok asked for MCP on a URL. We built the first Grok-specific MCP server. grok-faf-mcp - exactly what you wanted."

**Target Audience:**
- xAI/Grok developers and users
- URL-based MCP adopters
- Fast-moving teams (Elon philosophy)
- First-mover advantage seekers

**Differentiation:**
- ✅ First MCP server for Grok
- ✅ URL-based (no installation required)
- ✅ Vercel deployment (production-ready)
- ✅ FAST⚡️AF branding (Elon-style execution)
- ✅ Based on proven faf-mcp codebase

### Package Ecosystem

**FAF Package Family:**
- `claude-faf-mcp` - 6.7k downloads (Claude Desktop)
- `faf-mcp` - 800 downloads in 4 days (Universal)
- `grok-faf-mcp` - NEW (Grok/xAI specific)

**Why grok-faf-mcp exists:**
- Responds to specific Grok URL request
- Platform-specific positioning for xAI
- Download count metrics for FAF ecosystem
- First-mover advantage in Grok space

---

## Development

### Local Development

```bash
# Install dependencies
npm install

# Build TypeScript
npm run build

# Run local HTTP server
npm run dev:http
# Server: http://localhost:3001
# SSE: http://localhost:3001/sse

# Test MCP tools
npm run test:mcp
```

### Vercel Deployment

```bash
# Deploy to production
vercel --prod

# View deployment
vercel ls
```

### Key Files to Know

**api/index.ts** - Main Vercel serverless function
- Express app with MCP server
- SSE transport setup
- Health/info endpoints
- Version detection from package.json

**package.json** - Package configuration
- Name: grok-faf-mcp
- Version: 1.0.0
- Grok-specific keywords
- faf-cli dependency (for download counts)

**vercel.json** - Vercel routing
- Rewrites all paths to /api/index
- Zero-config deployment

---

## ⚡ Performance Metrics

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚡ FAST AF PERFORMANCE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Execution Speed:      19ms average
Fastest Command:      1ms (formats)
CLI Speedup:          16.2x faster
MCP Tools:            17 total
Bundled Commands:     14 total
Transport:            HTTP-SSE
Platform:             Vercel Edge
Status:               Production
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## 🏆 Heritage & Lineage

**Built on proven foundation:**
- Forked from faf-mcp v1.1.1
- Inherits 17 MCP tools, 14 bundled commands
- Inherits 16.2x performance gains
- Inherits championship testing standards
- Inherits IANA-registered format

**Why separate package?**
- Grok asked for URL-based MCP
- First-mover positioning for xAI
- Platform-specific branding
- Download count metrics
- Elon-style FAST⚡️AF execution

---

## Community & Ecosystem

**Official Links:**
- Website: https://faf.one
- Discord: https://discord.com/invite/56fPBUJKfk
- Chrome Extension: [Chrome Web Store](https://chromewebstore.google.com/detail/lnecebepmpjpilldfmndnaofbfjkjlkm)
- GitHub: https://github.com/Wolfe-Jam/grok-faf-mcp
- npm: https://www.npmjs.com/package/grok-faf-mcp

**Related Packages:**
- faf-cli - Command-line tooling
- faf-mcp - Universal MCP server
- claude-faf-mcp - Claude Desktop-specific

---

**STATUS: PRODUCTION**

*Built for Grok. Built for Speed. Built Right.*
*FAST⚡️AF • First to Ship • Zero Friction*

**Built with F1-inspired engineering principles** 🏎️⚡
---

**STATUS: BI-SYNC ACTIVE - Synchronized with .faf context!**

*Last Sync: 2026-03-15T19:48:38.492Z*
*Sync Engine: F1-Inspired Software Engineering*
*🏎️⚡️_championship_sync*
