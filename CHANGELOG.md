# Changelog

All notable changes to faf-mcp will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
