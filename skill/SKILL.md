---
name: faf-expert
description: Expert in .faf (Foundational AI-context Format), the IANA-registered YAML file (application/vnd.faf+yaml) that holds a project's facts, and in grok-faf-mcp, the MCP server for xAI Grok. Use when creating, scoring or re-grounding on project.faf, writing CLAUDE.md and other context files from it, or choosing between the hosted and local grok-faf-mcp servers.
---

# FAF Expert for Grok

## What .faf is

`project.faf` is a small YAML file of a project's facts: name, goal, language, app type, stack, and the six W's (who, what, why, where, when, how). It sits beside `package.json`, is committed with the code, and is IANA-registered as `application/vnd.faf+yaml`. Memory lives beside it in `.fafm` (`application/vnd.fafm+yaml`).

```yaml
faf_version: "3.0"
project:
  name: orders-api
  goal: Track customer orders through a REST API
  main_language: TypeScript
  type: backend
stack:
  backend: Express
  runtime: Node.js
  database: slotignored   # not required for this app type
human_context:
  who: Backend developers on the orders team
```

## Two servers: hosted and local

| | Hosted | Local (stdio) |
|---|---|---|
| Where | `https://mcpaas.live/grok/mcp/v1` | `bunx grok-faf-mcp` (or `npx`) |
| Does | Scores, validates, re-grounds `.faf` content | Everything, including reading and writing files |
| Tools | live list at `https://mcpaas.live/grok/mcp/v1/info` | a core set by default; `FAF_TOOLS=all` adds file utilities |

Grok config for the hosted server (`~/.grok/config.toml`):

```toml
[mcp_servers.grok-faf-mcp]
url = "https://mcpaas.live/grok/mcp/v1"
```

Local server in an MCP config:

```json
{ "mcpServers": { "grok-faf": { "command": "bunx", "args": ["grok-faf-mcp"] } } }
```

## Local tools

| Tool | What it does |
|------|--------------|
| `faf_init` | Create `project.faf` from the project's files, and score it |
| `faf_score` | The 0–100% score and the empty slots |
| `refresh_faf` | Re-read and re-score the live `.faf`, report drift |
| `refresh_fafm` | Re-ground on `.fafm` memory: what changed since last time |
| `refresh_blend` | `refresh_faf` and `refresh_fafm` together |
| `faf_orchestrate_recommendation` | Advises whether to re-ground now; never acts on its own |
| `faf_get_orchestration_policy` | The orchestration tier in force, without running it |
| `faf_sync` | Write CLAUDE.md and the other context files from `project.faf` (one way) |
| `faf_trust` | Validate `project.faf` |
| `rag_query`, `rag_cache_stats`, `rag_cache_clear` | Context retrieval and its cache |

With `FAF_TOOLS=all`: `faf_read`, `faf_write`, `faf_list`, `faf_clear`, `faf_debug`.

## The usual order

1. `faf_init` — create `project.faf`.
2. `faf_score` — see which slots are empty.
3. Fill the goal and six W's with what the user confirms. Never invent them.
4. `faf_sync` — write CLAUDE.md and the other context files.
5. `refresh_faf` — re-ground when the project changes.

## Scoring

```
score = populated / active × 100        active = 33 − slotignored
```

The app type (`project.type`) decides which slots count; the rest are `slotignored`. A placeholder such as `TBD` or `None` counts as empty.

| Tier | Score |
|------|-------|
| ✪ Trophy | 100% |
| ★ Gold | 99% |
| ◆ Silver | 95% |
| ◇ Bronze | 85% |
| ● Green | 70% |
| ● Yellow | 55% |
| ○ Red | 1% |
| ♡ White | 0% |

The score is deterministic: the same file gets the same number from faf-cli, the hosted server and every FAF server.

## More

- The format: [github.com/Wolfe-Jam/faf](https://github.com/Wolfe-Jam/faf)
- The CLI: `npx faf-cli init`, every command in [faf-cli docs/COMMANDS.md](https://github.com/Wolfe-Jam/faf-cli/blob/main/docs/COMMANDS.md)
