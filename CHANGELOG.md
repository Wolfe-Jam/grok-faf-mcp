<!-- faf: grok-faf-mcp | TypeScript | mcp-server | First MCP server for Grok — URL-based AI context, FAST⚡️AF -->
<!-- faf: doc=changelog | latest=v1.4.1 | canonical=project.faf | family=FAF -->

# Changelog

All notable changes to grok-faf-mcp will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.4.5] - 2026-05-29

### Added
- **`refresh_faf`** — the explicit re-grounding primitive **Grok asked for**:
  re-read the live `.faf`, re-score via the single-source faf-cli scorer, report
  drift vs an optional baseline, and return the fresh DNA. *drift → refresh →
  re-grounded* (Grok's phrasing) — for long sessions where the project moves
  mid-stream. (Grok-surface name; faf-cli mirrors the same capability as
  `faf_refresh`.)
- **`demo/refresh-demo.ts`** — reproducible live demo (`bun demo/refresh-demo.ts`):
  thin context re-grounds on a live edit (score moves +70), proving refresh
  re-reads live state, not a cache.

### Changed
- **grok.faf.one landing de-drifted for the CF era** — version current, CF
  endpoints as real links (`mcpaas.live/grok/mcp/v1` + `/v1/info`), dead Vercel
  self-deploy removed. README documents `refresh_faf`.

### Tests
- **WJTTC `refresh_faf`** — 20-test championship suite: live-edit drift (the
  score moves on a live edit), exact drift math, cross-fixture single-source
  parity, concurrency. 1 honest skip banks v2 content-drift (slot-diff).
- MCP conformance blesses `refresh_faf` as the documented cross-surface name.

## [1.4.1] - 2026-05-26

### Fixed
- **`faf_score`** — now calls faf-cli's `scoreFafYaml` (the IANA-spec
  scorer) directly. Replaces the legacy scorer that grok-faf-mcp had
  inherited. Output reformatted to the canonical tier card
  (`FAF SCORE: <n>/100 (<n>%) <tier-glyph> <TIER>`), with progress
  bar and next-tier hint. Same single-source path faf-mcp 2.1.1 and
  claude-faf-mcp 5.6.1 already use.
- **Invalid/unreadable `.faf` paths** — honest `0/100 (0%)` with a
  diagnostic. No fake numbers, no crashes.

### Tests
- **WJTTC AERO Phase 2** — score-parity assertion tightened to TRUE
  parity: MCP `faf_score` numeric == faf-cli `scoreFafYaml(...).score`.

## [1.4.0] - 2026-05-23

🏆 **FAF-binary scoring lands in Grok.**

The real FAF engine — faf-cli's WASM scoring kernel — now powers every
score in grok-faf-mcp. What you see is the exact, deterministic score
your AI and `faf score` read. One engine, one number, across the whole
FAF family.

### What's new

- **Real-engine scoring, everywhere** — `faf_score`, `faf_show`,
  `faf_status` and the footer all run on faf-cli's binary scorer.
  Deterministic: identical every time.
- **`faf_display` renders the genuine `project.html`** — straight from
  faf-cli's renderer, byte-identical to `faf show`. The exact view your
  whole team sees.
- **Canonical tiers, live in Grok** — the official
  🏆 ★ ◆ ◇ ● ○ ♡ ladder.

### Under the hood

- **faf-cli ^6.7.1** — built on faf-cli's typed public API: the real
  scorer + the project.html renderer, as the single source of truth.

## [1.3.1] - 2026-05-18

Maintenance patch. No new MCP tools, no API change — backward-compatible.

### Changed
- README: FAFA cyan badge added to the badge-row + "Chat to FAFA live →"
  link (faf-voice.vercel.app/agent). The page now surfaces FAFA across
  every surface that reads grok-faf-mcp.
- Tier descriptors: dropped "Production ready" from Bronze (a fitness
  call that isn't ours to make); WHITE tier wording "Empty" → "Start".

### Fixed
- Dependencies: automated npm audit fix.

## [1.3.0] - 2026-05-14

The hallmark-online-MCP release. Identity restored, receipts measured,
doctrine aligned, four origin credentials surfaced through the wire +
page + .faf.

### Added
- **`bench/score.bench.js`** — reproducible Mk4 WASM scoring kernel
  bench (`npm run bench:score`). Captures hardware + runtime + per-batch
  stats (min/p50/p95/p99/max/mean) as JSON receipt at
  `bench/results-2026-05-14.json`. Measured: **137 µs/score · 7,279
  ops/sec (p50, 3 batches × 1,000 iterations)**.
- **`/.well-known/mcp/server-card.json`** enriched: `protocolVersion`
  (`2025-06-18`), `capabilities` block, `instructions` field carrying
  the canonical credentials, `transport`, plus `serverInfo` expanded
  with `description` / `homepage` / `repository`. Endpoint now
  advertised in `/info.endpoints` for MCP-client discovery.
- **`GROK.md`** — frontier-vendor MD generated from `project.faf` via
  `faf sync`. Replaces the prior `CLAUDE.md` (wrong-vendor for the
  Grok MCP). `AGENTS.md` remains as the separate vendor-neutral file.

### Changed
- **Stdio path identity restored.** MCP `initialize` handshake now
  declares `name: 'grok-faf-mcp'` (was incorrectly `'claude-faf-mcp'`
  due to incomplete fork from `claude-faf-mcp`). Class renamed
  `ClaudeFafMcpServer` → `GrokFafMcpServer`. Identity rename touched
  22+ sites across `src/server.ts`, `src/index.ts`, `src/cli.ts`,
  `src/handlers/`, `src/test-all-functions.ts`.
- **Comparison framing scrubbed from wire + page.** Removed
  `x-grok-wins: true` HTTP header middleware. Cleared "#1 model on
  Earth" framing from `/health.dedication`, `/info.description`,
  `/info.dedication`, HTML dedication div, and `grok_go_fast_af`
  tool description. `@elonmusk` tribute preserved (shortened).
- **`grok_go_fast_af`** description now reads *"Auto-loads .faf
  project context — first MCP for Grok"*.
- **`/info.description`** now reads *"grok-faf-mcp — the first MCP
  for Grok. Persistent project context for xAI/Grok"*.
- **About modal "Speed" line** replaced *"3,800% faster than v1.1.1"*
  with *"137 µs/score · 7,279 ops/sec (Mk4 WASM, p50)"* — real
  measurement, methodology disclosed in `bench/results-2026-05-14.json`.
- **Stats hero "Avg Response"** now `0.2ms` (down from `0.5ms`,
  conservative undersell — measured p50 is `137µs`; the about-modal
  carries the literal number).
- **`project.faf`** refreshed with all four origin credentials in
  goal/what/how: *first MCP for Grok · first FAF MCP online · MCPaaS
  pattern origin · IANA `.faf + .fafm`*. Re-scored 🏆 Trophy 100%
  (15/15 slots).
- **`AGENTS.md`** regenerated from refreshed `.faf`.

### Fixed
- **Install instructions** in `src/handlers/engine-adapter.ts` now
  point at `grok-faf-mcp` (was misdirecting users to install
  `claude-faf-mcp`).
- **SKILL.md resolution paths** in
  `src/handlers/championship-tools.ts` (3 sites) now resolve
  `grok-faf-mcp` paths.
- **`.faf` files initialized by grok-faf-mcp** now tag
  `initialized_by: grok-faf-mcp` (was incorrectly `claude-faf-mcp`).
- **All `Claude Desktop`-specific user-facing strings** generalized
  to `your MCP host` for broader MCP-client applicability.

### Notes
- 169 / 169 tests pass across 6 suites. TSC clean throughout.
- Sibling-project filter at `src/handlers/championship-tools.ts:2909`
  preserved intact — `p.name === 'claude-faf-mcp'` is a legitimate
  cross-reference to the family member, not fork residue.
- Bench at `bench/score.bench.js` is reproducible — run on any
  machine for fresh numbers. Modern hardware will likely measure
  faster than 137µs.

## [1.2.2] - 2026-04-30

### Added
- **`CONTRIBUTING.md`** — TL;DR for xAI devs, PR conventions, branch
  model, code style, CI doctrine, MCP-tool contribution path, npm
  publish discipline, architecture decisions (`.faf` here / `.fafm`
  in the Voice variant). Tight (~170 lines), F1-inspired tone.
  Direct line for high-signal contributors landing on the repo.
- **Voice variant cross-link** in README — points readers at
  [`grok-faf-voice`](https://pypi.org/project/grok-faf-voice/), the
  reference implementation of the **Voice Memory Layer (VML)**.
  Same family (`.faf 🐘` for context / `.fafm 🐘🎙️` for voice
  memory), different surface. Routes existing grok-faf-mcp traffic
  to the new voice-side product.

### Changed
- **README H1 simplified** — `# grok-faf-mcp | FAST⚡️AF` →
  `# FAST⚡️AF Context`. npm/PyPI both render the package name
  above the README, so the prefix doubled up. New H1 is pure
  positioning and pairs with `grok-faf-voice`'s "Fast⚡️AF memory
  setup" as sibling FAST⚡️AF taglines (`.faf` = Context,
  `.fafm` = memory).
- **Tier ladder canonical alignment** — README scoring table now
  matches `faf-cli/src/core/tiers.ts` exactly: 🏆 ★ ◆ ◇ ● ● ○ ♡.
  Top 4 tiers (TROPHY → BRONZE) bolded to mirror the CLI's
  orange/cyan emphasis; GREEN's symbol bolded to mirror
  `bold('●')`; YELLOW/RED/WHITE plain to mirror `dim()`. Adds the
  WHITE 0% row that was previously missing.
- README test count corrected: 179 → 169 (actual passing count).
  Honest pass for v1.2.2.

### Notes
- Docs-only patch — no behavior changes, no MCP protocol changes,
  no new dependencies. Safe upgrade for all consumers.
- Companion to `grok-faf-voice` v0.1.3 launch (PyPI live as of
  2026-04-30); the cross-link routes existing grok-faf-mcp traffic
  to the new Voice surface.

## [1.2.1] - 2026-03-28

### Changed
- Bump @modelcontextprotocol/sdk from 1.20.1 to 1.27.1 (parity with claude-faf-mcp and faf-mcp)
- Includes auth/pre-registration conformance, transport fixes, discovery caching
- README: added star prompt and faf-cli cross-reference

## [1.2.0] - 2026-03-15

### Added
- Mk4 WASM scoring engine via `faf-scoring-kernel`
  - Type-aware slot detection (The Bouncer)
  - `slotignored` for inapplicable slots
  - Graceful fallback to Mk3.1 TypeScript if kernel unavailable
- Smithery integration (server-card discovery, sandbox support)
- About box on landing page — shows on load, click v1.2.0 badge to reopen
- New test suites: compiler scoring, MCP protocol, RAG system

### Changed
- Landing page version badge now clickable (opens about box)
- Tool descriptions cleaned up ("project DNA for AI")
- 179/179 tests passing

## [1.1.1] - 2026-03-04

### Fixed
- Landing page and OG meta tags: 17 → 21 tools
- README deploy section: 17 → 21 tools
- Trimmed npm tarball from 874KB to ~306KB (65% smaller)
- Removed thumbnail.png from npm package (GitHub-only, for OG tags)
- Removed discord-sync scripts from npm package (dev tooling, not user-facing)
- Removed oversized icons (400px, 512px) from npm package

## [1.1.0] - 2026-03-04

### Added
- Premium black/gold landing page with IANA provenance stamp
- Deploy with Vercel button in README
- Three Ways to Deploy section (Hosted / Self-Deploy / Local)
- OG meta tags for social sharing with thumbnail
- Vercel template thumbnail (black/white/gold)

### Changed
- MCP SDK bumped to 1.27.1 (from 1.26.0)
- faf-cli bumped to 5.0.1 (from 4.5.0)
- README tool table now lists all 21 tools (was 7)
- CI actions updated (setup-node v6, artifacts v7/v8)

### Fixed
- ESM import crash on Vercel (hardcoded VERSION, removed import assert)
- Added express and cors to production dependencies
- Regenerated lockfile to match express@4

## [1.0.4] - 2026-02-15

### Fixed

- **Remove 105% scoring system** - Align with official FAF tier system (0-100%)
  - Remove Easter egg logic that awarded 105% for rich .faf + CLAUDE.md
  - Update to Trophy (100%) as perfect score
  - 🍊 Big Orange is now a BADGE awarded separately, not a calculated score
  - Update tests and documentation to reflect correct tier system
  - Fixes alignment with FAF standard where scores range 0-100%

### Changed

- Updated faf-cli dependency to v4.4.0

## [1.0.3] - 2026-02-09

### Fixed
- Fixed npm install hang that prompted for user input
- Postinstall script now uses /dev/tty for direct terminal output
- Install completes smoothly without user interaction required

## [1.1.1] - 2025-11-16

### Changed
- Updated Discord community invite link to working URL
- Added Anthropic-approved heritage statement to README
- Updated package.json description with new branding

### Fixed
- Discord invite link now uses permanent invite (never expires)

## [1.0.0] - 2025-11-12

### Added
- **Universal MCP Package** - Platform-agnostic MCP server for all MCP-compatible platforms
  - Works with Claude Desktop, Cursor, Windsurf, VS Code, and any MCP client
  - 50 MCP tools for FAF context management
  - Auto-installs faf-cli as dependency
  - Orange smiley icon included in package
- **Platform-Specific Documentation** - Setup guides for each major platform
  - Claude Desktop config instructions
  - Cursor IDE integration steps
  - Windsurf Editor setup
  - VS Code MCP extension guide

### Technical
- Based on claude-faf-mcp v3.3.0 codebase
- 100% standalone operation (bundled FAF engine)
- 16.2x faster than CLI versions
- 19ms average execution time
- Zero external dependencies

### Ecosystem
This is the universal package for FAF MCP integration. Platform-specific packages (cursor-faf-mcp, windsurf-faf-mcp, etc.) may follow based on demand.

---

*For claude-faf-mcp changelog history, see: https://github.com/Wolfe-Jam/claude-faf-mcp/blob/main/CHANGELOG.md*
