<!-- faf: grok-faf-mcp | TypeScript | mcp | Persistent project context for xAI Grok. First MCP for Grok • First FAF MCP online • MCPaaS pattern origin. IANA-registered .faf + .fafm. Grok asked for MCP on a URL — this is it. -->
<!-- faf: claim=project.faf | family=FAF -->

# GROK.md — grok-faf-mcp

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
- **When:** Shipped 2026 — current v1.5.1 (URL hygiene patch — Vercel deprecated, CF 100% canonical; bundles post-1.5.0 maintenance: CI publish-doubling removed, Linux flake retry wrapper, docs auto-version-fetch, server.json CF URLs)
- **How:** bunx grok-faf-mcp (local stdio) or hosted on Cloudflare Workers (mcpaas.live/grok/mcp/v1) — 14 hosted (WASM-pure) + 59 local (bunx), Streamable HTTP transport, Mk4 WASM scoring kernel

---

*STATUS: BI-SYNC ACTIVE — 2026-06-01T10:51:04.000Z*
