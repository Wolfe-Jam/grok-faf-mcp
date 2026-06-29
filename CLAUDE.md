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
- **When:** Shipped 2026 — current v1.9.0 (ZEPH default-ON — the Zig→WASM fast scoring path behind refresh_faf is now the default; same score, cheaper to compute; kill switch USE_ZEPH=0). v1.8.1 patch: symmetric .fafm refresh receipts (refresh_fafm writes .fafm-refresh-receipts.json). v1.8.0 The Closed-Loop Edition (observability write-paths + canonical token engine + FRC flag-gate contract); v1.7.0 The Grounded Memory Edition (ZEPH + FRC over Grok Collections); v1.6.0 ZEPH Edition; v1.5.5 Glama Core-tier.
- **How:** bunx grok-faf-mcp (local stdio) or hosted on Cloudflare Workers (mcpaas.live/grok/mcp/v1) — 12 core tools by default (extended set behind FAF_TOOLS=all), Streamable HTTP transport, Mk4 WASM scoring kernel

---

*STATUS: BI-SYNC ACTIVE — 2026-06-24T15:50:25.585Z*
<!-- faf:end -->
