<!-- faf: grok-faf-mcp | TypeScript | mcp-server | First MCP server for Grok — URL-based AI context, FAST⚡️AF -->
<!-- faf: doc=contributing | canonical=project.faf | family=FAF -->

# Contributing

Bug fixes, new MCP tools, performance improvements, doc polish — all welcome.

---

## TL;DR

```bash
git clone https://github.com/Wolfe-Jam/grok-faf-mcp
cd grok-faf-mcp
npm install
npm run build
npm test
```

Local dev: `npm run dev:http` (port 3001).

---

## PR conventions

| Type of change | Required |
|---|---|
| Bug fix | A regression test that fails on the bug, passes after the fix. |
| New MCP tool | Tool registration in `api/index.ts` + jest test for the tool's response shape. |
| Doc-only | No tests required. Build must still pass. |
| Cloudflare config change | Local `wrangler dev` must build cleanly + the deploy must serve. |
| Refactor | Existing tests must pass unchanged. No behavior changes without a CHANGELOG note. |

---

## Branch model

- `main` is always shippable. Tagged releases come from `main`.
- `main` deploys to Cloudflare Workers (grok.faf.one) via wrangler.
- Work on feature branches. PR → squash-merge into `main`.
- Don't open PRs against tagged commits. Tags are immutable; any fix lands on `main` and gets a new version if it's release-worthy.

---

## Commit messages

- Imperative mood: "fix: tool registration order" not "fixed".
- Conventional-commits prefix appreciated: `fix:` / `feat:` / `chore:` / `docs:` / `perf:` / `refactor:`.
- Body explains the **why** when non-obvious. The diff explains the what.

---

## Code style

- **Names over comments.** Well-named functions don't need explanation.
- **WHY-comments** welcome where the *why* isn't obvious.
- Type hints on all public exports. Internal helpers can be looser.
- TypeScript strict mode is non-negotiable.
- 19ms execution average is the performance budget.

---

## CI doctrine

1. **Red means real.** A failing test is a real, actionable failure. We don't tolerate flaky tests — if a test fails intermittently, that's a bug in the test.
2. **Lint is observability, not a gate.** Lint warnings show but don't block merges. Tests are the only gate.

If `main` goes red after a merge, the breaking change owns the fix — revert is on the table.

---

## Adding a new MCP tool

The hot contribution path. Each new tool:

- Registers in `api/index.ts` via the existing tool-list pattern
- Returns a `CallToolResult` shape that fastmcp / MCP SDK expects
- Ships with one jest test covering the success path + one error path
- Documents the tool's purpose in README's "MCP Tools" section
- Composes with existing tools, doesn't parallel them
- Doesn't break the 19ms execution budget

---

## Releases

Maintainer ships releases via the FAF `/pubpro` discipline. Contributors don't run publish commands — open a PR and the maintainer ships it.

---

## Architecture decisions

Firm design rules, not up for debate in PRs:

1. **URL-based deployment is the differentiator.** New features should preserve the zero-config URL path.
2. **`.faf` is the format.** Format alternatives are an IETF / IANA conversation, not a PR conversation.
3. **Cloudflare Workers is the production deploy target.** Self-hosted Express works (per the Dockerfile) but Cloudflare is canonical.
4. **`grok-faf-mcp` ships the `.faf` Foundational Context Layer.** Voice memory is a different layer — see Voice variant below.

---

## Voice variant — `grok-faf-voice` (VML)

For the voice-memory side of Grok, the sister package is [`grok-faf-voice`](https://github.com/Wolfe-Jam/grok-faf-voice) — the reference implementation of the Voice Memory Layer (VML), with its own `.fafm 🐘🎙️` family mark.

- **`grok-faf-mcp`** (this) — `.faf` Foundational Context Layer for Grok via MCP-on-a-URL. What the project IS.
- **`grok-faf-voice`** — `.fafm` Voice Memory Layer (VML) for Grok Voice via LiveKit + xAI realtime. What the agent REMEMBERS.

---

## Where to file issues

[github.com/Wolfe-Jam/grok-faf-mcp/issues](https://github.com/Wolfe-Jam/grok-faf-mcp/issues)

Security issues: don't open a public issue. Email **team@faf.one**.

---

## License

MIT — fork it, ship it, embed it, enjoy it.

**Don't copy FAF brand. Do your own.**

---

*Built for Grok. Built for Speed. Built Right.*
*FAST⚡️AF • First to Ship • Zero Friction*
