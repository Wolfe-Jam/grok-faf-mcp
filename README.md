<!-- faf: grok-faf-mcp | TypeScript | mcp-server | First MCP server for Grok — URL-based AI context, FAST⚡️AF -->
<!-- faf: doc=readme | canonical=project.faf | score=100 | family=FAF -->

# FAST⚡️AF Context

<div align="center">
  <img src="https://www.faf.one/orange-smiley.svg" alt="FAF" width="80" />

  <h3>Grok asked for MCP on a URL. This is it.</h3>

  <p><strong>Persistent Project Context for xAI Grok.</strong></p>
  <p><code>URL-based • Zero config • Just works</code></p>

  [![IANA: vnd.faf+yaml](https://img.shields.io/badge/IANA-vnd.faf%2Byaml-00D4D4)](https://www.iana.org/assignments/media-types/application/vnd.faf+yaml)
  [![DOI: Context paper](https://img.shields.io/badge/DOI-Context%20paper-FF6B35)](https://doi.org/10.5281/zenodo.18251362)
</div>

**Home:** [faf.one/grok](https://faf.one/grok)
**Live demo:** [grok.faf.one](https://grok.faf.one)

<div align="center">

[![FAF Trophy 100%](https://img.shields.io/badge/FAF-%F0%9F%8F%86%20100%25-000000?labelColor=FF6B35)](https://faf.one)
[![CI](https://github.com/Wolfe-Jam/grok-faf-mcp/actions/workflows/ci.yml/badge.svg)](https://github.com/Wolfe-Jam/grok-faf-mcp/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/grok-faf-mcp?color=00CCFF)](https://www.npmjs.com/package/grok-faf-mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![project.faf](https://img.shields.io/badge/project.faf-inside-00D4D4)](https://github.com/Wolfe-Jam/faf)
[![Chat to FAFA live](https://img.shields.io/badge/Chat_to_FAFA_live-000000?style=flat&labelColor=000)](https://faf-voice.vercel.app/agent)
</div>

**FAF defines. MD instructs. AI codes.**

---

## Install — one line

Add to `~/.grok/config.toml`:

```toml
[mcp_servers.grok-faf-mcp]
url = "https://mcpaas.live/grok/mcp/v1"
```

Restart Grok TUI (or `/mcps r`) to refresh. Tools: `faf_score`, `faf_validate`, `faf_get_tier`, `faf_estimate_tokens`, `faf_analyze` (plus soul/memory ops).

**Hosted on Cloudflare Workers** — sub-ms cold start, no subprocess, edge-served. 4865-byte Zig WASM engine, parity-tested vs the Rust authority (`xai-faf-rust`). Externally validated by Grok S1 + S2 on 2026-05-27.

**Verify the live contract:**

```bash
curl https://mcpaas.live/grok/mcp/v1/info
```

Returns endpoint, protocol versions, engine details, tool list, and the architecture line: `.faf=vROM | AI-in-session=RAM`.

Sample corpus: [`xai-faf-proof/pilot`](https://github.com/Wolfe-Jam/xai-faf-proof/tree/main/pilot) — 10 records ready to score.

---

## The 6 Ws - Quick Reference

Every README should answer these questions. Here's ours:

| Question | Answer |
|----------|--------|
| **WHO** is this for? | Grok/xAI developers and teams building with URL-based MCP |
| **WHAT** is it? | Persistent project context for xAI Grok — URL-first deployment, IANA-registered .faf format |
| **WHERE** does it work? | Cloudflare Workers (`mcpaas.live/grok/mcp/v1`) • Any MCP client supporting native `url=` config • Self-deploy to your own CF/Vercel worker |
| **WHY** do you need it? | Zero-config MCP on a URL — Grok asked for it, we built it first |
| **WHEN** should you use it? | Grok integration, xAI projects, any url-based MCP client |
| **HOW** does it work? | `url = "https://mcpaas.live/grok/mcp/v1"` — context tools served from edge via MCPaaS (sub-ms cold start, no subprocess) |

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
Score: 0% → 85% (+85) ◇ BRONZE
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
URL:     https://mcpaas.live/grok/mcp/v1
Format:  IANA-registered .faf (application/vnd.faf+yaml)
Tools:   14 hosted (WASM-pure: 13 + refresh_faf) · 55 local (bunx)
Engine:  Mk4 WASM scoring (faf-scoring-kernel)
Speed:   0.5ms average (was 19ms — 3,800% faster with Mk4)
Tests:   236 total · 212 pass · 24 skip · 0 fail (9 files)
Status:  FAST⚡️AF
```

**MCP on a URL.** Point your Grok integration at the URL. That's it.

---

## Scoring: From Blind to Optimized

| Tier | Score | What it means |
|------|-------|---------------|
| **🏆 TROPHY** | 100% | Gold Code — AI is optimized |
| **★ GOLD** | 99%+ | Near-perfect context |
| **◆ SILVER** | 95%+ | Excellent |
| **◇ BRONZE** | 85%+ | Strong baseline |
| **●** GREEN | 70%+ | Solid foundation |
| ● YELLOW | 55%+ | AI flipping coins |
| ○ RED | <55% | AI working blind |
| ♡ WHITE | 0% | Start — good luck |

At 55%, Grok guesses half the time. At 100%, Grok knows your project.

---

## Two Ways to Deploy

### 1. Hosted (zero install — recommended)
Point your MCP client at the production URL — edge-served on Cloudflare Workers, no subprocess, sub-ms cold start. WASM-pure tools only on this path (scoring, validation, `refresh_faf`).

```json
{
  "mcpServers": {
    "grok-faf": {
      "url": "https://mcpaas.live/grok/mcp/v1"
    }
  }
}
```

### 2. Local (bunx — for FS-touching workflows)
Use the local stdio path when you need filesystem access (`faf_init`, `faf_sync`, file-mutating tools):

```bash
bunx grok-faf-mcp
```

**Or via MCP config:**

```json
{
  "mcpServers": {
    "grok-faf": {
      "command": "bunx",
      "args": ["grok-faf-mcp"]
    }
  }
}
```

---

## MCP Tools

**Create & Detect**

| Tool | Purpose |
|------|---------|
| `faf_init` | Create project.faf from your project |
| `faf_auto` | Auto-detect stack and populate context |
| `faf_score` | AI-readiness score (0-100%) with breakdown |
| `faf_status` | Check current AI-readability |
| `faf_enhance` | Intelligent enhancement |
| `refresh_faf` | Re-ground on the live `.faf` — re-read + re-score, report drift, return fresh DNA (drift → refresh → re-grounded). **Requested by Grok.** |

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
Execution:    0.5ms average (97% faster than v1.1)
Fastest:      3,360ns (version — nanosecond territory)
Slowest:      1.3ms (score — Mk4 WASM)
Improvement:  19ms → 0.5ms (3,800% faster)
Engine:       Mk4 WASM via faf-scoring-kernel
Memory:       Zero leaks
Transport:    stdio (local, bunx) · Streamable HTTP (hosted, Cloudflare Workers)
```

Benchmarked 10x per tool, warmed up, on local stdio execution. Hosted edge adds sub-ms cold start on top.

---

## Architecture

```
grok-faf-mcp v1.4.9
├── src/
│   ├── server.ts             → MCP server (GrokFafMcpServer)
│   ├── handlers/
│   │   ├── championship-tools.ts  → 55 tool definitions
│   │   ├── tool-registry.ts       → Visibility filtering (core/advanced)
│   │   └── engine-adapter.ts      → FAF engine bridge
│   └── faf-core/
│       └── compiler/
│           └── faf-compiler.ts    → Mk4 WASM scoring + Mk3.1 fallback
├── smithery.yaml             → Smithery listing config
├── api/index.ts              → Vercel catch-site (legacy showcase surface; kept alive)
└── vercel.json               → Vercel routing for the catch-site
```

**Production deployment:** Cloudflare Workers via `mcpaas-cf` (serving `mcpaas.live/grok/mcp/v1`). The `api/index.ts` + `vercel.json` paths above stay alive as a catch-site for legacy/bookmarked links — they are no longer the production path.

**Scoring pipeline:** TypeScript compiler parses `.faf` → detects project type → The Bouncer injects `slotignored` for inapplicable slots → `faf-scoring-kernel` (WASM) scores → falls back to Mk3.1 if kernel unavailable.

---

## Testing

236 tests across 9 files — 212 pass · 24 skip · 0 fail:

```bash
npm test    # runs all 236 (bun test)
```

| Suite | Coverage |
|-------|----------|
| `desktop-native-validation` | Core native functions, security, performance |
| `mcp-conformance` | MCP protocol conformance — tools, transport, errors |
| `wjttc-mcp` | WJTTC MCP certification |
| `wjttc-bun` | WJTTC bun-migration + integrity |
| `wjttc-compiler-scoring` | Compiler scoring — engine, type detection, slots |
| `rag-system` | RAG query, caching, context retrieval |
| `security` | Input validation + security guards |
| `visibility` | Tool visibility (core/advanced filtering) |

---

## Ecosystem

One format, every AI platform.

| Package | Platform | Registry |
|---------|----------|----------|
| **grok-faf-mcp** (this) | **xAI Grok** | **npm** |
| [claude-faf-mcp](https://npmjs.com/package/claude-faf-mcp) | Anthropic | npm + MCP #2759 |
| [gemini-faf-mcp](https://pypi.org/project/gemini-faf-mcp/) | Google | PyPI |
| [rust-faf-mcp](https://crates.io/crates/rust-faf-mcp) | Rust | crates.io |
| [faf-mcp](https://npmjs.com/package/faf-mcp) | Cursor, IDE's, VS Code | npm |
| [faf-cli](https://npmjs.com/package/faf-cli) | Terminal CLI | bunx, npm + Homebrew |

Same `project.faf`. Same scoring. Same result. Different execution layer.

---

## Voice variant — `grok-faf-voice` (VML)

`.fafm 🐘🎙️` — the voice variant of the `.faf 🐘` family.

**[grok-faf-voice](https://pypi.org/project/grok-faf-voice/)** is the reference implementation of the **Voice Memory Layer (VML)** — what your voice agent *remembers* across sessions, devices, and model switches. Companion to `grok-faf-mcp`:

- **`grok-faf-mcp`** (this) — `.faf` Foundational Context Layer for Grok via MCP-on-a-URL.
- **`grok-faf-voice`** — `.fafm` Voice Memory Layer (VML) for Grok Voice via LiveKit + xAI realtime.

Same family. Different surface. *Voice swappable; memory permanent.*

[PyPI](https://pypi.org/project/grok-faf-voice/) · [GitHub](https://github.com/Wolfe-Jam/grok-faf-voice) · [Onboarding](https://wolfe-jam.github.io/grok-faf-voice/onboarding.html)

---

## Contributing

PR conventions, code style, CI doctrine, MCP-tool contribution path,
npm publish discipline, architecture decisions: **[CONTRIBUTING.md](CONTRIBUTING.md)**.

xAI / Grok devs welcome — TL;DR setup at the top, F1-inspired tone throughout.

---

If grok-faf-mcp has been useful, consider starring the repo ⭐️ it helps others find it.

---

## License

MIT — Free and open source

---

<div align="center">
  <p><strong>Built for Grok. Built for Speed. Built Right.</strong></p>
  <p>FAST⚡️AF • First to Ship • Zero Friction</p>
  <p><strong>Zero drift. Eternal sync. AI optimized.</strong> 🏆</p>
</div>

---

### Get the CLI

> **faf-cli** — The original AI-Context CLI. A must-have for every builder.

```bash
npx faf-cli auto
```

**Anthropic MCP [#2759](https://github.com/modelcontextprotocol/servers/pull/2759)** · **IANA Registered:** `application/vnd.faf+yaml` · [faf.one](https://faf.one) · [npm](https://www.npmjs.com/package/faf-cli) · [Talk to my Agent →](https://faf.one/agent)
