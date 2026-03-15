# grok-faf-mcp | FAST⚡️AF

<div align="center">
  <img src="https://www.faf.one/orange-smiley.svg" alt="FAF" width="80" />

  <h3>Grok asked for MCP on a URL. This is it.</h3>

  <p><strong>First MCP server built for Grok</strong></p>
  <p><code>URL-based • Zero config • Just works</code></p>

  [![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/Wolfe-Jam/grok-faf-mcp)

  [![CI](https://github.com/Wolfe-Jam/grok-faf-mcp/actions/workflows/ci.yml/badge.svg)](https://github.com/Wolfe-Jam/grok-faf-mcp/actions/workflows/ci.yml)
  [![NPM Downloads](https://img.shields.io/npm/dt/grok-faf-mcp?label=downloads&color=00CCFF)](https://www.npmjs.com/package/grok-faf-mcp)
  [![npm version](https://img.shields.io/npm/v/grok-faf-mcp?color=00CCFF)](https://www.npmjs.com/package/grok-faf-mcp)
  [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
  [![Vercel](https://img.shields.io/badge/Vercel-Live-black?logo=vercel)](https://grok-faf-mcp.vercel.app)
  [![project.faf](https://img.shields.io/badge/project.faf-inside-00D4D4)](https://github.com/Wolfe-Jam/faf)
</div>

---

## 📋 The 6 Ws - Quick Reference

Every README should answer these questions. Here's ours:

| Question | Answer |
|----------|--------|
| **👥 WHO** is this for? | Grok/xAI developers and teams building with URL-based MCP |
| **📦 WHAT** is it? | First MCP server built for Grok - URL-based AI context via IANA-registered .faf format |
| **🌍 WHERE** does it work? | Vercel (production) • Local dev • Any MCP client supporting HTTP-SSE |
| **🎯 WHY** do you need it? | Zero-config MCP on a URL - Grok asked for it, we built it first |
| **⏰ WHEN** should you use it? | Grok integration testing, xAI projects, URL-based MCP deployments |
| **🚀 HOW** does it work? | Point to `https://grok-faf-mcp.vercel.app/sse` - 21 tools instantly available |

**For AI:** Read the detailed sections below for full context.
**For humans:** Use this pattern in YOUR README. Answer these 6 questions clearly.

---

## The Problem

Every Grok session starts from zero. You re-explain your stack, your goals, your architecture. Every time.

`.faf` fixes that. One file, your project DNA, persistent across every session.

```
Without .faf  →  "I'm building a REST API in Rust with Axum and PostgreSQL..."
With .faf     →  Grok already knows. Every session. Forever.
```

---

## One Command, Done Forever

`faf_auto` detects your project, creates a `.faf`, and scores it — in one shot:

```
faf_auto
━━━━━━━━━━━━━━━━━
Score: 0% → 85% (+85) 🥉 Bronze
Steps:
  1. Created project.faf
  2. Detected stack from package.json
  3. Synced CLAUDE.md

Path: /home/user/my-project
```

What it produces:

```yaml
# project.faf — your project, machine-readable
faf_version: "3.3"
project:
  name: my-api
  goal: REST API for user management
  main_language: TypeScript
stack:
  backend: Express
  database: PostgreSQL
  testing: Jest
  runtime: Node.js
human_context:
  who: Backend developers
  what: User CRUD with auth
  why: Replace legacy PHP service
```

Every AI agent reads this once and knows exactly what you're building.

---

## ⚡ What You Get

```
URL:     https://grok-faf-mcp.vercel.app/
Format:  IANA-registered .faf (application/vnd.faf+yaml)
Tools:   21 core MCP tools (55 total with advanced)
Engine:  Mk4 WASM scoring (faf-scoring-kernel)
Speed:   19ms average execution
Tests:   179 passing (7 suites)
Status:  FAST⚡️AF
```

**MCP over HTTP-SSE.** Point your Grok integration at the URL. That's it.

---

## Scoring: From Blind to Optimized

| Tier | Score | What it means |
|------|-------|---------------|
| 🏆 **Trophy** | 100% | Gold Code — AI is optimized |
| 🥇 **Gold** | 99%+ | Near-perfect context |
| 🥈 **Silver** | 95%+ | Excellent |
| 🥉 **Bronze** | 85%+ | Production ready |
| 🟢 **Green** | 70%+ | Solid foundation |
| 🟡 **Yellow** | 55%+ | AI flipping coins |
| 🔴 **Red** | <55% | AI working blind |

At 55%, Grok guesses half the time. At 100%, Grok knows your project.

---

## 🚀 Three Ways to Deploy

### 1. Hosted (Instant)
```
https://grok-faf-mcp.vercel.app/sse
```
Point your MCP client to this endpoint. All 21 tools available instantly.

### 2. Self-Deploy (Your Own Vercel)
Click the **Deploy with Vercel** button above. Zero config — get your own instance in 30 seconds.

### 3. Local (npx)
```bash
npx grok-faf-mcp
```

**Or add to your MCP config:**

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

## 🛠️ MCP Tools (21 Core)

**Create & Detect**

| Tool | Purpose |
|------|---------|
| `faf_init` | Create project.faf from your project |
| `faf_auto` | Auto-detect stack and populate context |
| `faf_score` | AI-readiness score (0-100%) with breakdown |
| `faf_status` | Check current AI-readability |
| `faf_enhance` | Intelligent enhancement |

**Sync & Persist**

| Tool | Purpose |
|------|---------|
| `faf_sync` | Sync .faf → CLAUDE.md |
| `faf_bi_sync` | Bi-directional .faf ↔ platform context |
| `faf_trust` | Validate .faf integrity |

**Read & Write**

| Tool | Purpose |
|------|---------|
| `faf_read` | Read any file |
| `faf_write` | Write any file |
| `faf_list` | Discover projects with .faf files |

**RAG & Grok-Exclusive**

| Tool | Purpose |
|------|---------|
| `rag_query` | RAG-powered context retrieval |
| `rag_cache_stats` | RAG cache statistics |
| `rag_cache_clear` | Clear RAG cache |
| `grok_go_fast_af` | Auto-load .faf context for Grok |

Plus 34 advanced tools available with `FAF_SHOW_ADVANCED=true`.

---

## Performance

```
Execution:    19ms average
Fastest:      1ms (formats)
Speedup:      16.2x vs CLI
Memory:       Zero leaks
Transport:    HTTP-SSE (Vercel Edge)
```

---

## Architecture

```
grok-faf-mcp v1.2.0
├── api/index.ts              → Vercel serverless (Express + SSE transport)
├── src/
│   ├── server.ts             → MCP server (ClaudeFafMcpServer)
│   ├── handlers/
│   │   ├── championship-tools.ts  → 55 tool definitions
│   │   ├── tool-registry.ts       → Visibility filtering (core/advanced)
│   │   └── engine-adapter.ts      → FAF engine bridge
│   └── faf-core/
│       └── compiler/
│           └── faf-compiler.ts    → Mk4 WASM scoring + Mk3.1 fallback
├── smithery.yaml             → Smithery listing config
└── vercel.json               → Vercel routing
```

**Scoring pipeline:** TypeScript compiler parses `.faf` → detects project type → The Bouncer injects `slotignored` for inapplicable slots → `faf-scoring-kernel` (WASM) scores → falls back to Mk3.1 if kernel unavailable.

---

## Testing

179 tests across 7 suites:

```bash
npm test    # runs all 179
```

| Suite | Tests | Coverage |
|-------|-------|----------|
| Desktop-native validation | 10 | Core native functions, security, performance |
| MCP protocol | 28 | Tool registration, transport, error handling |
| Compiler scoring | 22 | Mk4 engine, type detection, slot counting |
| RAG system | 19 | Query, caching, context retrieval |
| Engine adapter | 35 | CLI detection, fallback behavior |
| Integration | 40 | End-to-end tool execution |
| WJTTC certification | 25 | Championship-grade compliance |

---

## 🔗 Endpoints

| Endpoint | URL |
|----------|-----|
| Root | `https://grok-faf-mcp.vercel.app/` |
| SSE | `https://grok-faf-mcp.vercel.app/sse` |
| Health | `https://grok-faf-mcp.vercel.app/health` |
| Info | `https://grok-faf-mcp.vercel.app/info` |

---

## 📦 Ecosystem

One format, every AI platform.

| Package | Platform | Registry |
|---------|----------|----------|
| **grok-faf-mcp** (this) | **xAI Grok** | **npm** |
| [claude-faf-mcp](https://npmjs.com/package/claude-faf-mcp) | Anthropic | npm + MCP #2759 |
| [gemini-faf-mcp](https://pypi.org/project/gemini-faf-mcp/) | Google | PyPI |
| [rust-faf-mcp](https://crates.io/crates/rust-faf-mcp) | Rust | crates.io |
| [faf-mcp](https://npmjs.com/package/faf-mcp) | Universal (Cursor, Windsurf, Cline) | npm |
| [faf-cli](https://npmjs.com/package/faf-cli) | Terminal CLI | npm + Homebrew |

Same `project.faf`. Same scoring. Same result. Different execution layer.

---

## 📄 License

MIT — Free and open source

---

<div align="center">
  <p><strong>Built for Grok. Built for Speed. Built Right.</strong></p>
  <p>FAST⚡️AF • First to Ship • Zero Friction</p>
  <p><strong>Zero drift. Eternal sync. AI optimized.</strong> 🏆</p>
</div>
