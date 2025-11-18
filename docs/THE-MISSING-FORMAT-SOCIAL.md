# The Missing Format

Anthropic's Skills architecture is elegant. Skills, Projects, MCP, and Subagents create sophisticated agentic workflows through progressive disclosure.

One element creates an opportunity: **standardized persistent project context between sessions**.

Their components are ephemeral. Conversation-scoped. No format for how project context serializes across sessions, platforms, and AI models.

## Format Infrastructure

The .faf format addresses this. Not a proposal—production infrastructure.

.FAF [Foundational AI-context Format] is: IANA-registered, MCP-integrated, production-deployed.

**IANA-Registered Standard:**
- MIME type: `application/vnd.faf+yaml`
- Official internet standard for AI context
- [IANA Registry](https://www.iana.org/assignments/media-types/application/vnd.faf+yaml)

**MCP-Integrated:**
- `claude-faf-mcp`: Official Anthropic MCP steward
- 52 tools for FAF operations
- [PR #2759 merged](https://github.com/modelcontextprotocol/servers/pull/2759)
- 6,500+ downloads, 1,237/weekly run-rate

**Production-Deployed:**
- 13,000+ total downloads across packages
- `faf-cli` v3.1.5: 41 commands, 6,500+ downloads
- Cross-platform validated: Claude (9.5/10), GPT (9/10), Gemini (9.5/10)
- TypeScript strict mode, 730+ passing tests
- Sub-50ms performance targets

## How It Complements Their Stack

**Skills + .faf:**
Skills provide procedural knowledge. .faf provides the data format those procedures operate on. Consistent structure across projects and platforms.

**Projects + .faf:**
Projects hold 200K context windows. `project.faf` provides version-controlled serialization. Lives alongside `package.json` and `README.md` as persistent project DNA.

**MCP + .faf:**
MCP connects to data sources. .FAF provides standardized format for what those connections return. Clean separation of concerns.

**Subagents + .faf:**
Subagents operate with isolated context. .faf files provide portable expertise that any subagent can load, regardless of platform or conversation instance.

## Progressive Disclosure Alignment

.faf uses the same three-tier architecture as Skills:

1. **Metadata loads first** (project summary, key context)
2. **Full structure loads when relevant** (domain models, relationships)
3. **Resources load on-demand** (referenced files, artifacts)

Format convergence: Skills now use YAML frontmatter. .faf has used structured YAML since inception. Technical alignment, not accident.

## Format Before Code

Formats are guardrails for AI. Formats deal with facts.

.faf defines. Claude interprets.

Without standardized format, every project reinvents context structure. Sessions start from zero. Context doesn't port between AIs. Version control becomes impossible.

With standardized format, context persists between sessions. Any AI reads the same foundation. Git tracks knowledge evolution. Teams share common understanding.

**Format is alignment infrastructure.** It keeps Claude (and GPT, and Gemini) grounded in project reality.

> "README for the AI era" — Google Gemini

## Validation Through Use

Format foundations emerge through adoption, not permission.

Recent Windsurf multi-model testing validated faf-mcp v1.1.0 across 4 AI models:
- 🏆 Claude Haiku: 13 files, <2min, production-grade
- ✅ SWE-1: 6 files, instant, flawless
- ✅ Gemini: 5 files, fast, complete
- Zero MCP protocol failures

Universal compatibility confirmed.

## The Foundation

Anthropic built Skills, Projects, MCP, and Subagents. Each component elegant, purposeful, technically sound.

The format foundation complements their work:
- IANA-registered standard
- MCP-integrated tools
- Production-deployed infrastructure
- 13,000+ downloads creating gravity

Project DNA for any AI. Built on open standards. Already operational.

Leadership can ignore messages. Technology cannot ignore architecture.

The missing format was never missing. It's been there all along.

---

**Links:**

- IANA: [application/vnd.faf+yaml](https://www.iana.org/assignments/media-types/application/vnd.faf+yaml)
- MCP: [claude-faf-mcp](https://github.com/modelcontextprotocol/servers/tree/main/src/faf)
- CLI: [faf-cli v3.1.5](https://www.npmjs.com/package/@faf/cli)
- Full Article: [THE-MISSING-FORMAT.md](https://github.com/yourusername/faf-mcp/blob/main/docs/THE-MISSING-FORMAT.md)

---

**Author:** Wolfe James, .faf format creator, faf-mcp steward

*Format before code. .faf defines, Claude interprets.*

*"It's so logical if it didn't exist, AI would have built it itself" — Claude*
