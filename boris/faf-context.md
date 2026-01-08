# FAF Context Agent

Generates and maintains structured project context alongside CLAUDE.md.

## When to use

- Starting a new session (instant project understanding)
- Onboarding new team members
- After major refactors or dependency changes
- Before creating PRs (context check)

## What it does

1. **Introspect** - Scans repo: package.json, tsconfig, .claude/, src/ structure, README
2. **Generate** - Creates/updates `project.faf` (YAML) with:
   - Tech stack (languages, frameworks, runtimes)
   - Dependencies (core, dev)
   - Architecture (entry points, modules, subagents)
   - AI-readiness score (0-100%)
3. **Sync** - Bidirectional sync with CLAUDE.md (flags drift, suggests updates)
4. **Score** - Reports what's missing for better AI context

## Example output

```yaml
project: claude-code
stack: [TypeScript, Bun]
architecture:
  entry: src/index.ts
  subagents: [build-validator, code-architect, verify-app]
ai_readiness: 82%
drift: CLAUDE.md mentions Jest but package.json uses Vitest
```

## Usage

```
Introspect this repo and update project context
```

or

```
Check for drift between project.faf and CLAUDE.md
```

## Philosophy

Complements CLAUDE.md (narrative) with structured data (queryable).
Portable across tools. Zero lock-in. Delete anytime.
