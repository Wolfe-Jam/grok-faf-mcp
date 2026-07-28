# CI security & quality policy

## Why we used to fail "for no reason"

Championship CI ran:

```bash
npm audit --audit-level=high
```

That audits **the entire install tree**, including **devDependencies** (eslint, typescript-eslint, minimatch, brace-expansion, …). Those packages ship advisories constantly. The **runtime / shipped** MCP server was often clean while CI went red.

Lint was softer: `continue-on-error: true`, but **format:check** called `prettier` without listing it as a dep → **exit 127** noise.

## Policy (current)

| Gate | Command / job | Blocks ship? |
|------|----------------|--------------|
| **Production audit** | `npm audit --omit=dev --audit-level=high` | **Yes** |
| **Full-tree audit** | `npm audit --audit-level=high` | **No** (warning annotation) |
| **Secrets** | TruffleHog | **Yes** (job fails) |
| **Tests / Node smoke / Build** | CI jobs | **Yes** |
| **Lint / type / format** | quality job | **No** (informational; many `any` rules still `warn`) |

**Ship bar = production vulnerabilities + tests + build.**  
Dev-toolchain advisories are tracked but do not fail the championship badge.

## When production audit fails

1. Read `npm audit --omit=dev`.
2. Prefer real upgrades of **dependencies** (or MCP SDK).
3. Use `package.json` `overrides` only for transitive pins with a clear advisory (same as hono / fast-uri / brace-expansion).
4. Do **not** use `npm audit fix --force` on main without reading the major bumps.

## When full-tree still complains

Usually eslint@8 chain. Options:

1. Leave it — production gate is green; weekly workflow reports it.
2. Pin with `overrides` (e.g. `"brace-expansion": ">=5.0.8"`).
3. Longer-term: move to ESLint 9 flat config + current `@typescript-eslint` (separate PR).

## Weekly automation

`.github/workflows/audit-fix.yml` — Mondays:

- `npm audit fix` (non-breaking)
- Assert production audit still clean
- Commit lockfile if changed

## Lint / format

- `npm run lint` — ESLint; unsafe-`any` rules are **warn** until a type-safety pass.
- `npm run format:check` — needs **prettier** in devDependencies.
- Quality job does not block merge; clean annotations are still the goal.

## Championship Status job

Reports real `needs.*.result` values and **exits 1** if security, test, node-smoke, or build failed. It no longer prints "all passed" after a red security job.
