<!-- faf:start -->
<!-- faf: grok-faf-mcp | TypeScript | mcp | Persistent project context for xAI Grok. First MCP for Grok • First FAF MCP online • MCPaaS pattern origin. IANA-registered .faf + .fafm. Grok asked for MCP on a URL — this is it. -->
<!-- faf: claim=project.faf | family=FAF -->

# CLAUDE.md — grok-faf-mcp

## What This Is

Persistent project context for xAI Grok. First MCP for Grok • First FAF MCP online • MCPaaS pattern origin. IANA-registered .faf + .fafm. Grok asked for MCP on a URL — this is it.

## Stack

- **Language:** TypeScript
- **Backend:** MCP SDK (TS)
- **Api Type:** MCP (stdio + Streamable HTTP)
- **Runtime:** Node.js
- **Hosting:** Cloudflare Workers
- **Build:** TypeScript (tsc)
- **Cicd:** GitHub Actions

## Context

- **Who:** Developers using xAI Grok with MCP
- **What:** First MCP for Grok — also first FAF MCP online. Persistent AI context via IANA-registered .faf + .fafm.
- **Why:** Every AI session starts from zero. grok-faf-mcp gives Grok persistent project DNA.
- **Where:** npm registry, Cloudflare Workers (mcpaas.live/grok/mcp/v1), MCP Registry
- **When:** Shipped 2026 — current v1.6.0 (The ZEPH Edition: ZEPH fast path for re-grounding — Zig→WASM scoring via cascade.wasm (~12µs), flag-gated USE_ZEPH off by default, faf-cli the canonical fallback, parity locked in CI. v1.5.5 Glama Core-tier; v1.5.4 non-destructive interop; v1.5.3 path confinement.)
- **How:** bunx grok-faf-mcp (local stdio) or hosted on Cloudflare Workers (mcpaas.live/grok/mcp/v1) — 12 core tools by default (extended set behind FAF_TOOLS=all), Streamable HTTP transport, Mk4 WASM scoring kernel

---

*STATUS: BI-SYNC ACTIVE — 2026-06-20T04:21:08.648Z*
<!-- faf:end -->
