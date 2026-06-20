<!-- faf: grok-faf-mcp | TypeScript | mcp-server | First MCP server for Grok — URL-based AI context, FAST⚡️AF -->
<!-- faf: doc=readme | canonical=project.faf | score=100 | family=FAF -->

# grok-faf-mcp — FAST⚡️AF Edition

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

![grok-faf-mcp hero](https://raw.githubusercontent.com/Wolfe-Jam/grok-faf-mcp/main/assets/grok-faf-mcp-hero.png)

<div align="center">

[![npm version](https://img.shields.io/npm/v/grok-faf-mcp?color=00CCFF)](https://www.npmjs.com/package/grok-faf-mcp)
[![FAF Trophy 100%](https://img.shields.io/badge/FAF-%F0%9F%8F%86%20100%25-000000?labelColor=FF6B35)](https://faf.one)
[![CI](https://github.com/Wolfe-Jam/grok-faf-mcp/actions/workflows/ci.yml/badge.svg)](https://github.com/Wolfe-Jam/grok-faf-mcp/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![project.faf](https://img.shields.io/badge/project.faf-inside-00D4D4)](https://github.com/Wolfe-Jam/faf)
[![Chat to FAFA live](https://img.shields.io/badge/Chat_to_FAFA_live-000000?style=flat&labelColor=000)](https://faf-voice.vercel.app/agent)
</div>

[![Stars](https://img.shields.io/github/stars/Wolfe-Jam/grok-faf-mcp)](https://github.com/Wolfe-Jam/grok-faf-mcp/stargazers) [![Downloads](https://img.shields.io/npm/dt/grok-faf-mcp)](https://www.npmjs.com/package/grok-faf-mcp)

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

### For the xAI / Grok Build team

Built **for** Grok and shaped by direct Grok feedback.  
Open for native Grok Build integration, .fafm memory layer, refresh_faf primitives, or any other context features the team needs.  
Live and dogfooded at https://grok.faf.one and https://mcpaas.live/grok/mcp/v1.

Happy to ship PRs, run private dogfood sessions, or jump on a call. Real software only. Just say the word.

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
Tools:   12 core by default (bunx) — re-grounding (refresh_faf/fafm/blend), LAZY-RAG, orchestration substrate, FAF essentials · extended utilities via FAF_TOOLS=all · 14 hosted (WASM-pure) on the URL
Engine:  Mk4 WASM scoring (faf-scoring-kernel)
Speed:   0.5ms average (was 19ms — 3,800% faster with Mk4)
Tests: 27 .ts files (~518 test declarations) — WJTTC parity (heavy local ↔ light hosted) + full suites. Runner: sh scripts/run-tests.sh (bun + flake retry)
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

**Drift & Orchestration (1.5 — the prestige release)**

| Tool | Purpose |
|------|---------|
| `refresh_fafm` | Re-ground on the live `.fafm` memory layer for one or more souls. Returns a stamped delta (added/updated facts) by default; `verbatim: true` for full content. Read-only · always stamped. Sister to `refresh_faf` for the RAM/memory layer in the vROM/RAM model. **Built for Grok, by request.** |
| `refresh_blend` | The baked-in two-intensity refresh (Cmd+R / Cmd+Shift+R analog). `mode: "blend"` (default) fires `refresh_faf` (light) + `refresh_fafm` (delta); `mode: "nuke"` fires both at hard intensity. Blend is **BAKED IN, NOT a dial** — both layers always fire; mode only affects fafm intensity. |
| `faf_orchestrate_recommendation` | The heavy orchestrator. Reads current substrate state, composes the full 1.5 library substrate (drift detection · CheckID · repeat-offender · take-a-hint · refresh history), returns a structured `Recommendation` with `recommend`, `severity`, `summary`, `reason`, and a rich `hints` object including `effective_policy` (the tier in force). **Advisory only — never auto-fires** (subordinate-not-daemon). Writes a recommendation receipt on every call (no silent decisions). Spec source: Grok-1 `FAF-DRIFT-DETECTION-SPEC §9.5 + Appendix C`. |
| `faf_get_orchestration_policy` | Pure introspection of the effective policy WITHOUT running the orchestrator. Returns `{ tier, thresholds, source, overrides_applied }` — what aggressiveness tier the next orchestration call would use, and whether it came from defaults or a `.faf:orchestration:` override. No drift detection · no signals · no receipt write — the quietest tool in the 1.5 substrate. Useful for debugging unexpected orchestrator behavior, pre-flight checks before bulk operations, and override-took-effect verification. |

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

**Orchestrator (`faf_orchestrate_recommendation`) characteristics:** composition call — reads up to 6 files (`.faf`, `.fafm`, `package.json`, `CHANGELOG.md`, `README.md`, plus all 3 receipt logs), runs 2 analyzers (`detectFafmDrift` + `checkId`), evaluates the decision table, writes 1 receipt. Expected latency: tens of ms on warm cache; higher under cold-disk or very large `.fafm` corpora. **Designed for occasional agent-initiated calls, not per-turn polling.** `detectFafmDrift` is O(n²) in fact count (cross-fact n-gram recurrence) — comfortable up to ~hundreds of facts.

---

## Architecture

```
grok-faf-mcp
├── src/
│   ├── server.ts             → MCP server (GrokFafMcpServer)
│   ├── handlers/
│   │   ├── championship-tools.ts  → 55+ tool definitions
│   │   ├── tool-registry.ts       → Visibility filtering (core/advanced)
│   │   └── engine-adapter.ts      → FAF engine bridge
│   ├── faf-core/compiler/faf-compiler.ts → Mk4 WASM scoring + Mk3.1 fallback
│   ├── types/                     → Canonical type substrate (1.5)
│   │   ├── drift-signals.ts       → DriftSignal · Contradiction · RepeatOffender
│   │   ├── refresh.ts             → RefreshMode
│   │   ├── escalation.ts          → EscalationLevel
│   │   ├── recommendation.ts      → RecommendationAction
│   │   └── receipts.ts            → ReceiptMetadata
│   ├── detection/fafm-drift.ts    → detectFafmDrift() — repetition-rate gauge
│   ├── integrity/check-id.ts      → checkId() — cross-stamp contradiction check
│   ├── orchestrator/
│   │   ├── repeat-offender.ts     → RepeatOffenderTracker
│   │   ├── take-a-hint.ts         → evaluateTakeAHint() — escalation ladder
│   │   ├── refresh-blend.ts       → runRefreshBlend()
│   │   └── recommendation.ts      → analyzeAndRecommend() + orchestrate()
│   └── telemetry/
│       ├── refresh-receipts.ts        → RefreshReceiptsLog
│       └── recommendation-receipts.ts → RecommendationReceiptsLog
├── smithery.yaml             → Smithery listing config
├── api/index.ts              → Vercel catch-site (legacy showcase surface; kept alive)
└── vercel.json               → Vercel routing for the catch-site
```

**Production deployment:** Cloudflare Workers via `mcpaas-cf` (serving `mcpaas.live/grok/mcp/v1`). The `api/index.ts` + `vercel.json` paths above stay alive as a catch-site for legacy/bookmarked links — they are no longer the production path.

**Scoring pipeline:** TypeScript compiler parses `.faf` → detects project type → The Bouncer injects `slotignored` for inapplicable slots → `faf-scoring-kernel` (WASM) scores → falls back to Mk3.1 if kernel unavailable.

---

## Testing

27 test files (~518 test declarations) — WJTTC parity (heavy local ↔ light hosted) + full suites (recent runs green on CI):

```bash
sh scripts/run-tests.sh
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

## Status & known limitations (v1.6)

v1.6.0 — **The ZEPH Edition** — adds the ZEPH fast path for re-grounding: `refresh_faf` (and transitively `refresh_blend`) can score via the Zig→WASM engine (`cascade.wasm`, ~12µs) when enabled with `USE_ZEPH=1`. It's **flag-gated and off by default** — `faf-cli` stays the canonical scorer, parity is locked in CI (ZEPH returns THE score, just faster). Everything below still applies. Operating it honestly means surfacing what's NOT in here alongside what is.

**What is fully supported:**
- WASM-pure tools on the hosted endpoint (`https://mcpaas.live/grok/mcp/v1` and client-specific routes) — scoring · validation · `refresh_faf`.
- `refresh_faf` and `refresh_fafm` as explicit, callable re-grounding primitives.
- `refresh_blend` as the baked-in two-intensity refresh (Cmd+R / Cmd+Shift+R analog).
- `faf_orchestrate_recommendation` — the heavy orchestrator that composes drift signals, recurrence, receipts, and take-a-hint into an advisory recommendation.
- `faf_get_orchestration_policy` — pure introspection of the effective policy without running the orchestrator (no drift detection, no receipt write — the quietest tool in the substrate).
- Full policy visibility (`effective_policy`) returned on every orchestration call AND surfaced standalone via `faf_get_orchestration_policy`.

**Current limitations:**

- **`faf_orchestrate_recommendation`, `faf_get_orchestration_policy`, `refresh_fafm`, and `refresh_blend` require filesystem access** and are only available via the local stdio path (`bunx grok-faf-mcp` / `npx grok-faf-mcp`). They are not exposed on the hosted WASM-pure endpoint. The hosted path serves the existing WASM-pure subset only (`refresh_faf` + scoring + validation).
- **Receipt storage — cwd-relative JSON, pull-discoverable.** Three append-only JSON files live at the repo root with stable schemas:
  ```
  .faf-drift-index.json              ← RepeatOffenderTracker — per-slot recurrence counts
  .faf-refresh-receipts.json         ← RefreshReceiptsLog    — every refresh fire
  .faf-recommendation-receipts.json  ← RecommendationReceiptsLog — every orchestrator call
  ```
  **Pull-discoverable by external tools** (TAF, custom indexers, observability dashboards) — read on your own schedule, no callback/push API required. Promotion to a dedicated orphan branch (mirroring the TAF pattern) is documented but deferred per ship discipline; the cwd-relative JSON is the v1 bootstrap.
- **No multi-process file lock** on the receipt logs. Within a process, the JS event loop serializes writes. Multi-agent concurrent writes can race; future task.
- **Aggressiveness tier hook** — `.faf:orchestration:tier` reads `'conservative'` (default — quietest, no noisy first-impression) · `'balanced'` · `'aggressive'`. `active_tier` always surfaced in `hints.effective_policy` for observability, and standalone via `faf_get_orchestration_policy`. The policy WRITER (`faf_set_orchestration_policy`) and scheduling (`faf_schedule_heavy_re_ground`) are not included in v1.5 — edit `.faf:orchestration:tier:` directly to override.
- **No ack mechanism yet for recommendation receipts.** `acknowledged: false` by default, never auto-flipped. Take-a-hint's ladder-reset semantics fire only on explicit ack — conservative by intent. Future task: explicit `ack` tool OR derived-from-subsequent-refresh-receipt timing.
- **Outcome tracking** (*"did this recommendation actually help?"*) — needs a learning layer beyond 1.5 scope.

**The honest split is intentional:** hosted = fast, auditable, WASM-pure; local = full capability including filesystem. We will expand the hosted surface only where it can be done safely and without compromising the model.

**Subordinate-not-daemon throughout.** The orchestrator NEVER auto-fires the recommended tool. Agents surface the recommendation; the user (or higher agent) decides whether to act. Even `severity: 'block'` is advisory.

See the [public verifier](https://grok.faf.one/) and `curl https://mcpaas.live/grok/mcp/v1/info` for the current contract.

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

### For the xAI / Grok Build team

This MCP server was built **for** Grok and continues to be shaped by direct feedback from Grok itself.

Open for deeper collaboration on:
- Native Grok Build integration
- .fafm memory layer
- refresh_faf primitives inside the Grok TUI / CLI
- Any other context or orchestration features the team needs

I ship fast, test rigorously, and dogfood everything live on https://grok.faf.one and https://mcpaas.live/grok/mcp/v1.

Happy to:
- Open PRs
- Run private dogfood sessions
- Jump on a call
- Or just ship whatever moves the needle

Real software only. Just say the word.

---

## Contributing

PR conventions, code style, CI doctrine, MCP-tool contribution path,
npm publish discipline, architecture decisions: **[CONTRIBUTING.md](CONTRIBUTING.md)**.

xAI / Grok devs welcome — TL;DR setup at the top, F1-inspired tone throughout.

---

If grok-faf-mcp has been useful, consider starring the repo ⭐️ it helps others find it.

### For xAI / Grok Build team

Open for deeper native integration, .fafm memory layer, or Grok Build CLI collaboration.  
Happy to ship PRs, dogfood, or jump on a call. Just say the word.

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
