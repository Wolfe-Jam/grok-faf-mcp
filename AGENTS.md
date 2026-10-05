<!-- faf:start -->
<!-- faf: grok-faf-mcp | TypeScript | mcp | Persistent project context for xAI Grok. The first MCP for Grok — Grok asked for MCP on a URL. -->
<!-- faf: claim=project.faf | family=FAF -->

# AGENTS.md — grok-faf-mcp

Persistent project context for xAI Grok. The first MCP for Grok — Grok asked for MCP on a URL. — TypeScript · type: mcp · v2.1.0

> Authored by faf — do not edit the managed block; refresh with `faf export --agents`. Hand-written content outside the managed block is preserved.

## Setup & build

```bash
npm run build    # build
npm run dev    # dev
npm run start    # start
```

## Run the tests

```bash
npm run test
npm run lint
```

## Where things live

- `package.json`
- `src/index.ts`
- `src/index.js`
- `src/cli.ts`
- `README.md`
- `tsconfig.json`
- `wrangler.toml`
- `vercel.json`

## Conventions

- TypeScript strict mode (tsconfig.json)
- Style enforced by ESLint · Prettier — obey the configs

## Guardrails

- **Always OK:** read the tree · run the tests (`npm run test`) · build the project · `npm run lint`.
- **Ask first:** dependency installs, deletions, migrations, schema changes, publish/release.
- **Never:** force-push · push straight to `main` (branch and open a PR) · commit secrets.

## Definition of Done

Done when: `npm run lint` exits 0 · `npm run test` passes · changes committed with a conventional message.

## When stuck

Ask a clarifying question, propose a short plan, or open a draft PR with notes — do not push large speculative changes to `main`.

## Security & secrets

- Secrets live in `.env`. Never read or commit them.

## Commit & PR

- Conventional Commits preferred (`feat:`, `fix:`, `chore:`, …).
- Branch off `main` and open a PR — never commit to `main` directly.
- If build/test scripts or layout change, refresh this file in the **same PR** (`faf export --agents`).

## Stack

- **Backend:** MCP SDK (TS)
- **API:** MCP (stdio + Streamable HTTP)
- **Runtime:** Node.js
- **Hosting:** Cloudflare Workers
- **Build:** TypeScript (tsc)
- **CI/CD:** GitHub Actions
<!-- faf:end -->
