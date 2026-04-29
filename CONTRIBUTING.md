# Contributing

Contributions are welcome. Bug fixes, new MCP tools, performance
improvements, doc polish — all useful.

This file describes **how to land a change cleanly**.

---

## TL;DR for xAI devs

```bash
git clone https://github.com/Wolfe-Jam/grok-faf-mcp
cd grok-faf-mcp
npm install
npm run build
npm test
```

Open a PR. Tests must pass. Vercel preview deploy must build. Done.

The hosted endpoint is `https://grok-faf-mcp.vercel.app/sse` —
point any MCP client at it and the 21 tools are instantly available.
Local development uses `npm run dev:http` on port 3001.

---

## PR conventions

| Type of change | Required |
|---|---|
| Bug fix | A regression test that fails on the bug, passes after the fix. |
| New MCP tool | Tool registration in `api/index.ts` + jest test for the tool's response shape. |
| Doc-only | No tests required. Build must still pass. |
| Vercel config change | Local `vercel dev` must build cleanly + the PR's preview deploy must serve. |
| Refactor | Existing tests must pass unchanged. No behavior changes without a CHANGELOG note. |

---

## Branch model

- `main` is always shippable. Tagged releases come from `main`.
- Vercel auto-deploys `main` to the production URL.
- Work on feature branches. PR → squash-merge into `main`.
- Don't open PRs against tagged commits. Tags are immutable; any
  fix lands on `main` and gets a new version if it's release-worthy.

---

## Commit messages

- Imperative mood: "fix: tool registration order" not "fixed".
- Conventional-commits prefix appreciated: `fix:` / `feat:` / `chore:` / `docs:` / `perf:` / `refactor:`.
- Body explains the **why** when non-obvious. The diff explains the what.
- No marketing prose in commit subjects. Technical, not promotional.

---

## Code style

- **Names over comments.** Well-named functions don't need comments
  explaining what they do.
- **WHY-comments** are welcome where the *why* isn't obvious — a
  hidden constraint, a subtle invariant, a workaround for a specific
  edge case.
- Type hints on all public exports. Internal helpers can be looser.
- TypeScript strict mode is non-negotiable.
- 19ms execution average is the performance budget — new tools
  shouldn't degrade that without justification.

---

## CI doctrine

Two rules:

1. **Red means real.** A failing test is a real, actionable failure.
   We don't tolerate flaky tests — if a test fails intermittently,
   that's a bug in the test, fix it before merging anything else.
2. **Lint is observability, not a gate.** Lint warnings show but
   don't block merges. Cleanup PRs welcome but never urgent. Tests
   are the only gate.

If `main` goes red after a merge, the breaking change owns the
fix — revert is on the table, no shame.

---

## Adding a new MCP tool

The hot contribution path. Each new tool:

- Registers in `api/index.ts` via the existing tool-list pattern
- Returns a `CallToolResult` shape that fastmcp / MCP SDK expects
- Ships with one jest test covering the success path + one error path
- Documents the tool's purpose in README's "MCP Tools" section
- Doesn't break the 19ms execution budget

The repo's lineage from `faf-mcp` v1.1.1 means the architecture is
proven — new tools should compose with existing ones, not parallel
them.

---

## NPM publish protocol

**`npm publish` is gated.** Per the FAF publish discipline:

1. README, CHANGELOG, package.json version all current
2. Tests pass on the exact tag/SHA being published
3. `npm publish --dry-run` reviewed before the real publish
4. `GO!` (or `GREEN LIGHT`) from a maintainer
5. Then publish

Don't publish without these. The npm page is permanent metadata
for every install — versions are not unpublishable after 72 hours.

---

## Architecture decisions

The SDK has firm design rules that aren't up for debate in PRs:

1. **URL-based deployment is the differentiator.** PRs that require
   a complex local-only setup go against the "Grok asked for MCP on
   a URL" thesis. New features should preserve the zero-config URL
   path.
2. **`.faf` is the format. Don't propose alternatives** in this repo —
   that's an IETF / IANA-track conversation, not a PR conversation.
3. **Vercel is the production deploy target.** Self-hosted Express
   works (per the Dockerfile) but Vercel is the canonical path.
4. **`grok-faf-mcp` ships the `.faf` Foundational Context Layer.**
   Voice memory is a different layer (VML / `.fafm`) — see the Voice
   variant section below.

---

## Voice variant — `grok-faf-voice` (VML)

For the **voice-memory** side of Grok, the sister package is
[`grok-faf-voice`](https://github.com/Wolfe-Jam/grok-faf-voice) —
the reference implementation of the Voice Memory Layer (VML), with
its own `.fafm 🐘🎙️` family mark.

- **`grok-faf-mcp`** (this) — `.faf` Foundational Context Layer for
  Grok via MCP-on-a-URL. What the project IS.
- **`grok-faf-voice`** — `.fafm` Voice Memory Layer (VML) for Grok
  Voice via LiveKit + xAI realtime. What the agent REMEMBERS.

Different surface, same family. PRs that touch voice persistence
should target `grok-faf-voice`, not this repo.

---

## Where to file issues

[github.com/Wolfe-Jam/grok-faf-mcp/issues](https://github.com/Wolfe-Jam/grok-faf-mcp/issues)

For security issues: don't open a public issue. Email
**team@faf.one** with details.

---

## License

MIT — fork it, ship it, embed it, enjoy it.

**Don't copy FAF brand. Do your own.**

---

*Built for Grok. Built for Speed. Built Right.*
*FAST⚡️AF • First to Ship • Zero Friction*
