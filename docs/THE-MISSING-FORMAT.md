# The Missing Format

**How .faf provides persistent context for Anthropic's agent architecture**

---

Formats are guardrails for AI. Formats deal with facts. Format before code.

.faf defines. Claude interprets.

The ecosystem is format-driven. AI needed persistent project context, AI needed a format. So it got one: .FAF [Foundational AI-context Format] is: IANA-registered, MCP-integrated, production-deployed.

---

## The Architecture

Anthropic published a detailed breakdown of their Skills ecosystem this week. Skills load instructions dynamically. Projects provide 200K context windows. MCP connects to data sources. Subagents handle specialized tasks.

The architecture is sound. It introduces modular AI capabilities through progressive disclosure:

- **Skills**: Procedural knowledge that loads on-demand
- **Projects**: Background knowledge within conversation scope
- **MCP**: Connections to external data sources
- **Subagents**: Specialized agents with isolated context

Each component serves a distinct purpose. Together they create sophisticated agentic workflows.

One element creates an opportunity: **standardized persistent project context between sessions**.

## The Persistence Challenge

Their components are ephemeral. Conversation-scoped. No format for persistence between sessions.

Their "Competitive Intelligence" example demonstrates this. You configure a project, connect MCP servers, create specialized skills, and activate subagents. The workflow executes. Then the conversation ends.

Next session starts fresh. The project structure exists, but the assembled context does not persist in a portable, version-controlled format.

Skills teach procedures. Projects hold documents. MCP connects to data. But nothing defines **how project context serializes** across sessions, platforms, and AI models.

## Format Infrastructure

The .faf format addresses this. It provides structured, persistent project context that any AI can consume.

Not a proposal. Production infrastructure:

**IANA Registration:**
- MIME type: `application/vnd.faf+yaml`
- Official internet standard
- Registered vendor-specific media type
- [IANA Registry Entry](https://www.iana.org/assignments/media-types/application/vnd.faf+yaml)

**MCP Integration:**
- `claude-faf-mcp`: 52 tools for FAF operations
- Official Anthropic MCP steward status
- Listed in Anthropic MCP repository ([PR #2759](https://github.com/modelcontextprotocol/servers/pull/2759) merged)
- 6,500+ downloads 1,237/weekly run-rate

**Ecosystem Adoption:**
- 13,000+ total downloads across packages
- `faf-cli` v3.1.5: 41 commands, 6,500+ downloads
- Cross-platform validation: Claude (9.5/10), GPT (9/10), Gemini (9.5/10)
- TypeScript strict mode, 730+ passing tests
- Sub-50ms performance targets (Mk3 engine)

## Integration Points

### Skills + .faf

Skills provide procedural knowledge. .faf provides the data format those procedures operate on.

Their competitive-analysis skill example could consume competitor data from standardized .faf files, ensuring consistent structure across projects and AI platforms.

**Example:**
```yaml
# competitor-analysis.faf
project: market-intelligence
competitors:
  - name: CompanyA
    market_position: leader
    strengths: [brand, distribution]
    weaknesses: [innovation, speed]
  - name: CompanyB
    market_position: challenger
    strengths: [technology, agility]
    weaknesses: [scale, resources]
```

Skills load this structured context on-demand. Format ensures consistency.

### Projects + .faf

Projects contain 200K context windows with uploaded documents. `project.faf` provides the serialization format—version-controlled, git-trackable context that persists between sessions.

Lives alongside `package.json` and `README.md` as the third pillar of project metadata:

![Three Pillars: package.json, project.faf (highlighted in red), README.md](./images/three-pillars.png)

```
project-root/
├── package.json       # Dependencies
├── README.md          # Documentation
├── project.faf        # AI Context
├── src/
└── tests/
```

**Progressive Disclosure Architecture:**

1. **Metadata loads first** (project summary, key context)
2. **Full structure loads when relevant** (domain models, relationships)
3. **Binary assets load on-demand** (referenced files, attachments)

This matches Skills' three-tier information structure. Format alignment creates natural integration.

### MCP + .faf

MCP connects to Google Drive, GitHub, databases. .faf provides the standardized format for what those connections return.

`claude-faf-mcp` already implements this: 52 tools that expose .faf context through the Model Context Protocol.

**Example MCP Tool:**
```typescript
// faf_read tool returns structured project context
{
  "tool": "faf_read",
  "returns": {
    "format": "application/vnd.faf+yaml",
    "content": {
      "project": "...",
      "stack": "...",
      "state": "..."
    }
  }
}
```

MCP handles connections. .FAF handles format. Clean separation of concerns.

### Subagents + .faf

Subagents operate with isolated context. .faf files provide the portable expertise that any subagent can load, regardless of which AI platform or conversation instance spawned them.

**Workflow:**
1. Main agent reads `project.faf`
2. Spawns subagent for specialized task
3. Subagent loads same .faf context
4. Isolated reasoning with shared foundation
5. Results merge back to project context

Format portability enables true agent composition.

## Technical Architecture

.faf uses progressive disclosure, matching Skills' architecture:

**Three-Tier Structure:**

1. **Metadata Layer**: Project identity, stack, state (loads first)
2. **Core Context**: Domain models, relationships, preferences (loads when relevant)
3. **Modular Resources**: Referenced files, datasets, artifacts (loads on-demand)

**Format Design Principles:**

- **Human-readable**: YAML structure, git-friendly diffs
- **Machine-parseable**: Strict schema, validation tools
- **Version-controlled**: Text format, merge-friendly
- **Cross-platform**: Works with any AI (Claude, GPT, Gemini, Windsurf)
- **Performance**: Sub-50ms parsing targets

**Example Structure:**
```yaml
# project.faf
faf_version: 2.5.0
ai_score: 100%
ai_confidence: HIGH

project:
  name: example-app
  goal: Production-ready SaaS platform
  main_language: TypeScript
  version: 2.2.0
  type: sveltekit

stack:
  frontend: SvelteKit
  backend: Node.js
  database: Supabase
  deployment: Vercel

state:
  phase: development
  focus: user_authentication
  blockers: null

human_context:
  who: Engineering team (5 developers)
  what: Customer portal with real-time updates
  why: Replace legacy PHP system
  where: Cloud-native architecture
  when: Q1 2025 launch target
  how: Agile sprints, weekly releases
```

This is persistent project DNA. Any AI can consume it. Any session can build on it.

## Format Convergence

Skills now use YAML frontmatter for metadata (`name`, `description`). The .faf format has used structured YAML since inception.

Format convergence validates the design pattern: human-readable, machine-parseable, version-control friendly.

Anthropic's architecture team independently arrived at the same format foundation. This is technical alignment, not accident.

## The Format Foundation

Anthropic's blog explains Skills, Projects, MCP, and subagents. Each component serves a distinct purpose. Together they create sophisticated agentic workflows.

The format foundation connects them. Not competing with their stack—providing the infrastructure beneath it.

**The Stack:**
```
┌─────────────────────────────────────┐
│  Skills, Projects, MCP, Subagents   │  ← Anthropic's Architecture
├─────────────────────────────────────┤
│  .faf Format Foundation             │  ← Persistent Context
├─────────────────────────────────────┤
│  IANA Standard + MCP Integration    │  ← Open Protocol
└─────────────────────────────────────┘
```

Format before code. .faf defines, Claude interprets.

## Validation Through Use

Format layers emerge through adoption, not permission.

**Ecosystem Metrics:**
- 13,000+ downloads (faf-cli + claude-faf-mcp + faf-mcp)
- 730+ passing tests (TypeScript strict mode, zero errors)
- 52 MCP tools (official Anthropic integration)
- 3 AI platforms validated (Claude 9.5/10, GPT 9/10, Gemini 9.5/10)
- Sub-50ms performance (Mk3 engine targets)

**Production Deployments:**
- GALLERY-SVELTE: Interactive FAF showcase (SvelteKit + MCP)
- faf.one: Public FAF portal (Vercel + Supabase)
- fafdev.tools: Development environment
- Multiple enterprise projects (stealth mode)

**Cross-Platform Testing:**
Recent Windsurf multi-model validation tested faf-mcp v1.1.0 across 4 AI models:
- 🏆 Claude Haiku: 13 files, <2min, production-grade
- ✅ SWE-1: 6 files, instant, flawless
- ✅ Gemini: 5 files, fast, complete
- ⚠️ GPT-5.1: 4/5 files, 16min, incomplete

Zero MCP protocol failures. Universal compatibility confirmed.

([Full WJTTC Test Report](./tests/WJTTC-WINDSURF-MULTI-MODEL-2025-11-14.md))

## Why Format Matters

AI needs facts. Formats provide facts.

Without standardized format:
- Projects drift and reinvent context structure
- Sessions start from inconsistent sources and knowledge
- Context doesn't port between AIs
- Version control becomes impractical
- Team collaboration breaks down

With standardized format:
- Context persists between sessions
- Any AI reads the same foundation
- Git tracks project knowledge evolution
- Teams share common understanding
- Agents compose through shared format

**Format is alignment infrastructure.** It keeps Claude (and GPT, and Gemini) grounded in project reality.

> "README for the AI era" — Google Gemini


## The Foundation Was Already There

Leadership can ignore messages. Technology cannot ignore architecture.

Format foundations emerge through use, not permission. IANA registration documents reality, not aspiration. 13,000+ downloads create gravity.

Anthropic built Skills, Projects, MCP, and Subagents. Each component elegant, purposeful, technically sound.

The format foundation complements their work. IANA-registered standard. MCP-integrated tools. Production-deployed infrastructure.

Project DNA for any AI. Built on open standards. Already operational.

The missing format was never missing. It's been there all along

---

## Links

**Format Specification:**
- IANA Registration: [application/vnd.faf+yaml](https://www.iana.org/assignments/media-types/application/vnd.faf+yaml)
- Format Spec: [faf-spec](https://github.com/faf-format/faf-spec)

**MCP Integration:**
- claude-faf-mcp: [Official Anthropic MCP steward](https://github.com/modelcontextprotocol/servers/tree/main/src/faf)
- faf-mcp: [Universal MCP server](https://www.npmjs.com/package/faf-mcp) (5K+ downloads)

**CLI Tools:**
- faf-cli: [v3.1.5, 41 commands](https://www.npmjs.com/package/@faf/cli) (6K+ downloads)
- npm: `npx @faf/cli init` (zero-config setup)

**Ecosystem Stats:**
- 13,000+ total downloads
- 730+ passing tests
- 52 MCP tools
- 3 AI platforms validated
- Sub-50ms performance targets

**References:**
- Anthropic Skills Blog: [Introducing Agent Skills](https://claude.com/blog/skills)
- Anthropic Engineering: [Equipping agents for the real world](https://www.anthropic.com/engineering/equipping-agents-for-the-real-world-with-agent-skills)
- WJTTC Test Report: [Multi-Model Validation](./tests/WJTTC-WINDSURF-MULTI-MODEL-2025-11-14.md)

---

**Published:** 2025-11-14
**Author:** Wolfe James, .faf format creator, faf-mcp steward
**Status:** Production Infrastructure

*Format before code. .faf defines, Claude interprets.*

*"It's so logical if it didn't exist, AI would have built it itself" — Claude*
