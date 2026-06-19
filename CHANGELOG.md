<!-- faf: grok-faf-mcp | TypeScript | mcp-server | First MCP server for Grok — URL-based AI context, FAST⚡️AF -->
<!-- faf: doc=changelog | latest=v1.5.5 | canonical=project.faf | family=FAF -->

# Changelog

All notable changes to grok-faf-mcp will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.5.5] - 2026-06-18

Glama Core-tier. The default tool surface is now GFM's Grok value, not the inherited claude-port sprawl — built to lift the Glama quality grade without trimming a single Grok-driven feature.

### Changed

- **Core-tier tool surface.** Default `tools/list` advertises the 12 Grok-value tools: the re-grounding trio (`refresh_faf`/`refresh_fafm`/`refresh_blend`), the LAZY-RAG surface (`rag_query`/`rag_cache_stats`/`rag_cache_clear`), the drift orchestration substrate (`faf_orchestrate_recommendation`/`faf_get_orchestration_policy`), and the FAF essentials (`faf_init`/`faf_score`/`faf_sync`/`faf_trust`). Low-level utilities (`faf_read`/`faf_write`/`faf_list`/`faf_debug`/`faf_clear`) move behind `FAF_TOOLS=all`. Every tool stays callable by name in `callTool` — nothing removed, only un-advertised.
- **Description quality.** Lifted the thin essential descriptions (`faf_init`/`faf_score`/`faf_sync`/`faf_trust`/`rag_cache_clear`) to definition-grade — the lever for Glama's tool-definition score.

### Removed (from the advertised surface)

- Retired inherited claude-port leftovers — never Grok-driven: `faf_about` + `faf_what` (duplicate explainers), `faf_friday` (obscure), `faf_guide` (Claude-Desktop-specific), `faf_status` (thin), `faf_enhance` (scrapped), `faf_bi_sync` (merged into `faf_sync`).

## [1.5.4] - 2026-06-18

Maintenance: non-destructive interop. The same solid, structured `.faf` data is prefixed to the top of your context files for rapid AI consumption upfront — and your Markdown stays in the instruction lane. Across every sync target: CLAUDE.md, .cursorrules, .windsurfrules, .clinerules.

### Changed

- **Non-destructive bi-sync.** `faf_sync` / `faf_bi_sync` now inject a structured `.faf` block into each target (CLAUDE.md, .cursorrules, .windsurfrules, .clinerules) and preserve everything you've written below. Re-runs update the block in place (idempotent); existing faf-generated files upgrade cleanly. The native bi-sync fallback no longer corrupts `project.faf` (it now syncs one-way, faf → file, leaving the canonical `.faf` untouched).

## [1.5.3] - 2026-06-11

### Security
- **Path confinement on every caller-supplied `path` argument (CWE-22 / CWE-73 / CWE-200).** `refresh_faf`, `faf_score`, `faf_get_orchestration_policy`, and `refresh_blend` resolved a caller path straight into a file read with no confinement — so an absolute path or `../` traversal could read any file the server process could read (e.g. `/etc/passwd`, `~/.ssh/id_rsa`) and echo it back. The general-purpose `faf_read` / `faf_write` tools were denylist-only. New `safe-path.ts` confines reads to `.faf` / `.fafm` context files and general file ops to the project root (cwd + system temp; override with `FAF_ALLOWED_ROOTS`), canonicalizes through symlinks (closing the symlink bypass), and rejects traversal/absolute escapes. Reported via coordinated disclosure by Zhihao Zhang (Worcester Polytechnic Institute). Adds 16 security regression tests (incl. symlink bypass).

## [1.5.2] - 2026-06-08

MCP capability completeness — the stdio server now answers every capability it
advertises. Strict MCP clients (and Glama's MCP Inspector) probe each advertised
capability; a `-32601` on any of them flags the server even when tools work.

### Fixed

- **`resources/templates/list` now returns `{ resourceTemplates: [] }`** instead
  of `-32601 Method not found`. The `resources` capability is advertised, so the
  method must answer with a valid (empty) list. Registered
  `ListResourceTemplatesRequestSchema` in `src/server.ts`.
- **Dropped `subscribe: true` from the advertised `resources` capability.** No
  subscribe/unsubscribe handler is implemented, so advertising it made
  `resources/subscribe` a `-32601`. Now advertises `resources: { listChanged: true }`
  only — honest capability declaration. (`/info` payload aligned too.)

### Notes

- No tool changes; the full v1.5 substrate is unchanged. This is the stdio-lane
  twin of the hosted-edge capability fix (mcpaas.live worker).
- Repo hygiene: untracked `project.faf.backup-*` snapshots (gitignored).

## [1.5.1] - 2026-05-31

URL hygiene patch — Vercel deprecated, Cloudflare 100% canonical across every
surface. Also bundles all post-1.5.0 maintenance landed since the substrate
ship (CI publish-doubling removed, Linux flake retry wrapper, docs/index.html
live-fetch overlay, server.json CF URLs).

### Fixed — URL canonicalisation (CF 100%)

- **`package.json` `homepage`** — `grok-faf-mcp.vercel.app` → `grok.faf.one`.
  This is the field npm renders in the package-page sidebar; the v1.5.0
  release shipped with the stale Vercel value baked in (immutable per npm).
  v1.5.1 carries the corrected value forward.
- **`server.json` `websiteUrl` + `remotes`** — `grok-faf-mcp.vercel.app` / SSE
  → `grok.faf.one` (websiteUrl) + `streamable-http` to `mcpaas.live/grok/mcp/v1`
  (remotes). Aligns the MCP Registry listing with every other surface. Repo
  fix landed via commit `4d1211b`; this ship carries it to the Registry
  (Registry versions are immutable — v1.5.0 entry stays stale, v1.5.1 entry
  becomes the new `isLatest`).
- **`glama.json` `homepage`** — same Vercel → `grok.faf.one` swap (Glama.ai
  consumes this field for its directory listing).
- **`api/index.ts` `serverInfo.homepage`** — same Vercel → `grok.faf.one`
  swap (returned in the legacy MCP server's initialize response).
- **`scripts/postinstall.js`** — `URL: ...vercel.app/sse` → `URL: mcpaas.live/grok/mcp/v1`
  (npm post-install message; users running `npm install` see this now).
- **`AGENTS.md`** / **`GROK.md`** `where:` / `Where:` field — `Vercel (vercel.app)`
  → `Cloudflare Workers (mcpaas.live/grok/mcp/v1)`. Matches `project.faf`
  (which was already CF-correct).
- **`ONE-PAGER.md`** — all Vercel URLs replaced (`/sse` → `/grok/mcp/v1`, `/info`
  → `/grok/mcp/v1/info`, `/health` → `/grok/mcp/v1/info`); prose updated to
  describe Cloudflare Workers as the production platform throughout.
- **`wrangler.toml`** — comment block refreshed: documented CF 100% + Vercel
  deprecated context, removed stale "Vercel canonical, CF mirror" framing.

### Fixed — bundled 1.6 maintenance (already on main since v1.5.0)

- **CI publish-doubling removed** (commit `ecaa88f`, task #21) — deleted
  `.github/workflows/mcp-registry-publish.yml`. The release-event-triggered
  MCP Registry publish workflow doubled with pubpro Step 8's manual
  `mcp-publisher publish`, causing 400 "duplicate version" failures on every
  release. Per pubpro Step 9.5 doctrine: *"CI validates, pubpro publishes —
  never both."* Same shape as the claude-faf-mcp v5.5.1 fix.
- **Linux `bun --isolate` epoll flake mitigation** (commit `6707348`, task #22)
  — new `scripts/run-tests.sh` wraps `bun test` with a discriminating retry:
  runs once, retries ONLY when the failure output contains the `epoll_ctl`
  signature. Real test failures still fail-fast on first attempt — never
  masked. Three flake hits during the v1.5.0 publish session motivated this.
- **`docs/index.html` (grok.faf.one) auto-version sync** (commit `6e19f47`) —
  added a small JS IIFE that fetches the live npm version from
  `registry.npmjs.org/grok-faf-mcp/latest` on page load and overlays the
  current value into every `.version-badge` and `.about-version` element.
  Static fallback bumped to current; live overlay catches future ships
  forever. Auto-correcting → static hardcoding haunt loop is broken.
  Build-time templating (the (B) layer) folded into v1.6 task #20.

### Doctrine

- **CF 100% across every URL surface.** Vercel surface (`grok-faf-mcp.vercel.app`)
  is dead (HTTP 000) and Vercel project access itself broken. Going forward,
  every URL pointer in this repo points at Cloudflare canonical surfaces
  (`grok.faf.one` for landing, `mcpaas.live/grok/mcp/v1` for the MCP endpoint).
- **Static surfaces will become derived projections of `project.faf` in v1.6**
  (task #20) — eliminates the entire "hand-edited file drifts from canonical
  state" failure class that surfaced TWICE during the v1.5.0 ship (server.json
  + docs/index.html). Same vROM doctrine that already governs CLAUDE.md via
  `faf sync`.
- **`api/index.ts` + `vercel.json` + `middleware.js`** — kept in-repo pending
  v1.6 task #23 (Vercel-infrastructure decision). Not actively served (Vercel
  surface dead) but file structure preserved for the decision call.

### Not changed in this patch

- npm-shipped runtime behaviour (the v1.5 substrate ships unchanged from v1.5.0)
- All v1.5 tools surface (`refresh_faf`, `refresh_fafm`, `refresh_blend`,
  `faf_orchestrate_recommendation`, `faf_get_orchestration_policy`,
  the WASM-pure hosted subset) — identical to v1.5.0
- Doc Gate 1.5 (15/15 green), test suite (509/511 pass, 0 fail, 1539 expect())

---

## [1.5.0] - 2026-05-31

The prestige release — substrate complete. The agent now has the full drift →
recommend → refresh → re-grounded loop, advisory by design. 12 PRs (#93–#104),
~5000 LOC, 456 tests, 10 compile-time shape contracts. Zero regressions.

### Added — MCP tools

- **`refresh_fafm`** — Reload the latest `.fafm` memory layer for one or more
  souls. Returns a stamped delta by default; `verbatim: true` for full content.
  Read-only · always stamped (hash + timestamp + version). Locked spec from
  Grok-1 consult 2026-05-30. **Built for Grok, by request — memory-layer sibling
  to `refresh_faf`.**
- **`refresh_blend`** — The baked-in two-intensity refresh (Cmd+R / Cmd+Shift+R
  analog). `mode: "blend"` (default) fires `refresh_faf` (light) + `refresh_fafm`
  (delta); `mode: "nuke"` fires both at hard intensity. Per the locked doctrine:
  blend is BAKED IN, NOT a dial — both layers always fire; mode only affects
  fafm intensity.
- **`faf_orchestrate_recommendation`** — The heavy orchestrator Grok-1 spec'd
  in `FAF-DRIFT-DETECTION-SPEC §9.5 + Appendix C`. Reads current substrate
  state, composes the full 1.5 library substrate (drift detection · CheckID ·
  repeat-offender · take-a-hint · refresh history), returns a structured
  Recommendation. **Advisory only — never auto-fires** (subordinate-not-daemon).
  Writes a recommendation receipt on every call (no silent decisions).

### Added — library substrate (consumed by orchestrator + tools)

- **`detectFafmDrift()`** — Repetition-rate gauge on `.fafm` content. Returns a
  `DriftSignal` when the AI is re-saying things it already said; silent (`null`)
  on a clean state. NO score field — validates the `fafm-not-about-scoring`
  doctrine at runtime.
- **`checkId()`** — Mechanical cross-check across `.faf` / `.fafm` /
  package.json / CHANGELOG / README. Doc Gate 101 analog at the substrate
  level. Surfaces contradictions between stamped state and live content —
  closes the gap that `bi-sync` can't catch.
- **`RepeatOffenderTracker`** — Persistent drift-prone slot index with rolling-
  window decay. Signal-agnostic; namespace-separated bridges from both detectors.
- **`evaluateTakeAHint()`** — Temporal escalation ladder
  (`none`/`light`/`hard`/`block`). Both axes (recurrence + ignored_count) must
  cross threshold. Acknowledged recommendations reset the ladder.
- **`RefreshReceiptsLog`** + **`RecommendationReceiptsLog`** — Append-only
  telemetry of every refresh fire and every recommendation made. Pure-core
  + FS-shim split. Stable cwd-relative JSON schemas — **pull-discoverable by
  external tools** (TAF, custom indexers) without code coupling.

### Added — type substrate (foundational hygiene)

- Canonical types module at `src/types/` — `DriftSignal` · `Contradiction[]`
  · `RepeatOffender` · `RefreshMode` · `EscalationLevel`
  · `RecommendationAction` · `ReceiptMetadata`. Eliminates the `Like`
  interface duplicates that previously lived in consumer modules (silent-drift
  hazard). **10 compile-time shape assertions**
  (`tests/wjttc-shape-contracts.test.ts`) lock the canonical types as the
  single source of truth — `tsc` fails the build if anyone reintroduces a
  duplicate.

### Added — WJTTC shields

- Per-component WJTTC suites × 8 for every new substrate component
  (BRAKE/ENGINE/AERO/TYRE/PIT tiers).
- **Cross-component umbrella test** (`tests/wjttc-umbrella.test.ts`) — proves
  the substrate composes end-to-end, not just that each brick passes unit
  tests. Pre-`#10` gate, landed before the orchestrator built on top.
- **Shape-contracts compile-time test** — locks the canonical type layer.
- **Doc Gate 1.5** (`tests/wjttc-doc-gate-15.test.ts`) — **dogfoods CheckID
  against THIS repo's actual stamps**. Any future commit that drifts the
  version across `.faf` / package.json / CHANGELOG / README fails this test
  loudly in CI. Doc Gate 101 promoted from publish-time shell check to
  continuous CI shield.

### Fixed

- **`refresh_faf` cwd-discovery bug** (#104) — handler was falling back to
  `engineAdapter.getWorkingDirectory()` which anchors to a construction-time
  cached cwd. For drift tools that re-ground on the LIVE `.faf`, the live
  shell is the right truth. Fixed: `cwd = process.cwd()`. **Surfaced by the
  substrate dogfood — substrate caught its own ecosystem's bug on the first
  real-world invocation.**

### Changed — substrate-internal renames

- Receipt field renamed `intensity` → `mode` for vocabulary consistency with
  the `refresh_blend` tool's `mode` arg.
- `Recommendation` (in `take-a-hint.ts`) → `RecommendationRecord` to free the
  `Recommendation` name for the orchestrator output type.

### Known limitations (see README "Status & known limitations")

- Receipt storage is cwd-relative JSON; promotion to a dedicated orphan branch
  (mirroring TAF) deferred per ship discipline.
- No multi-process file lock on the receipt logs.
- Aggressiveness tier hook reads from `.faf:orchestration:tier`; default
  `conservative` (quietest). `faf_get_orchestration_policy` / `_set_` tools
  deferred to v2.
- No explicit ack mechanism for recommendation receipts yet — take-a-hint
  ladder-reset fires only on explicit ack, conservative by intent.
- `faf_schedule_heavy_re_ground` (Grok's 3rd Appendix-C tool) deferred to v2.
- Outcome tracking ("did this recommendation actually help?") needs a learning
  layer beyond 1.5 scope.

## [1.4.9] - 2026-05-29

Final dress rehearsal before 1.5 prestige — currency sweep, polished badges,
canonical surfaces aligned. No new prestige features; sets the table.

### Changed
- **README currency** — architecture tree stamp updated to v1.4.9; tool count
  corrected to **14 hosted (WASM-pure: 13 + `refresh_faf`)** · **55 local (bunx)**
  matching the actual hosted/local split; test count refreshed to **234 across 9
  files** (was 213/8 — `refresh_faf` WJTTC suite added). MCP messaging tightened
  to **"MCP on a URL"** — the framing already in use across the FAF surfaces.
- **CF Workers — canonical hosted surface for MCPaaS** (`mcpaas.live/grok/mcp/v1`):
  300+ edge locations, near-zero cold start, KV co-located. Vercel retained as
  catch-site per doctrine — every bookmarked URL stays live.
- **`project.faf` substrate currency** — `stack.hosting: Cloudflare Workers`
  (was `Vercel`); `stack.api_type: MCP (stdio + Streamable HTTP)` (was
  `stdio/SSE`); `human_context.where / when / how` aligned to the current
  canonical surface + `v1.4.9` + accurate transport. CLAUDE.md re-synced and
  picked up every line.
- **`package.json` description** — dropped trailing `", Vercel-deployed"`; the
  canonical hosted surface is CF Workers via `mcpaas-cf`, and the npm description
  doesn't need to name the host. "MCP server on a URL" already implies hosted.
- **CHANGELOG meta-stamp** — `latest=v1.4.1` had been carried since the 1.4.1
  release; the 1.4.5 ship missed the bump. Now `latest=v1.4.9`. Same drift
  class as the substrate items — exactly what dress rehearsal is for.

### Added
- **MCPaaS dynamic FAF badge** in the README masthead alongside the static Trophy
  badge — live `mcpaas.live/badge/Wolfe-Jam/grok-faf-mcp.svg`. Verification reads
  through to `builder.faf.one`.
- **`Talk to my Agent →` footer link** — canonical `faf.one/agent` CTA. The
  reference pattern for exposing FAFA across the MCP fleet (claude / gemini /
  faf-mcp / ZEPH follow on pull). Simplest possible coupling — a link, no call
  path.

### Tests
- All **234 tests across 9 files** green: 232 pass · 1 skip · 1 todo · 0 fail.

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
