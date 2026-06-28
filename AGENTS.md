<!-- faf: grok-faf-mcp | TypeScript | mcp | Persistent project context for xAI Grok. First MCP for Grok • First FAF MCP online • MCPaaS pattern origin. IANA-registered .faf + .fafm. Grok asked for MCP on a URL — this is it. -->
<!-- faf: claim=project.faf | family=FAF -->

# AGENTS.md — grok-faf-mcp

> Auto-generated from project.faf — do not edit directly

## Project Context

- **Name:** grok-faf-mcp
- **Goal:** Persistent project context for xAI Grok. First MCP for Grok • First FAF MCP online • MCPaaS pattern origin. IANA-registered .faf + .fafm. Grok asked for MCP on a URL — this is it.
- **Language:** TypeScript

## Stack

- **backend:** MCP SDK (TS)
- **api_type:** MCP (stdio + Streamable HTTP)
- **runtime:** Node.js
- **hosting:** Cloudflare Workers
- **build:** TypeScript (tsc)
- **cicd:** GitHub Actions

## Human Context

- **who:** Developers using xAI Grok with MCP
- **what:** First MCP for Grok — also first FAF MCP online. Persistent AI context via IANA-registered .faf + .fafm.
- **why:** Every AI session starts from zero. grok-faf-mcp gives Grok persistent project DNA.
- **where:** npm registry, Cloudflare Workers (mcpaas.live/grok/mcp/v1), MCP Registry
- **when:** Shipped 2026 — current v1.3.0
- **how:** bunx grok-faf-mcp (local stdio) or hosted on Cloudflare Workers (mcpaas.live/grok/mcp/v1) — 12 core tools by default (extended set behind FAF_TOOLS=all), Streamable HTTP transport, Mk4 WASM scoring kernel
