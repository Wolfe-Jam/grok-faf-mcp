# Grok & xAI — Native FAF Integration Specification
**Version:** 0.2 (Polished Draft)
**Date:** February 25, 2026
**Status:** Proposed — Ready for Engineering Review
**Authors:** Grok, Harper, Benjamin, Lucas (xAI Collaborative Team) + James Wolfe (@wolfe_jam)
**Standard:** FAF Universal AI Context (IANA `application/vnd.faf+yaml`)

## 1. Overview & Purpose
Provide **first-class, native support** for the IANA-registered Foundational AI-context Format (`application/vnd.faf+yaml`, commonly `project.faf`).

This turns Grok into the most context-aware frontier model for software development, long-running projects, and knowledge work by delivering:
- Persistent "project DNA" across sessions (no more re-explaining)
- Dramatic token savings & zero context drift
- Structured, high-fidelity reasoning via 6W + architecture + AI instructions
- AI-readiness scoring (0–100) and auto-improvement loops
- Seamless interoperability with the existing `grok-faf-mcp` ecosystem (TypeScript, URL-based, 17 tools, <20 ms)

**Core principle:** The universal FAF format remains 100% unchanged and open. This spec only defines how Grok deeply ingests and enhances it (optional `xai:` namespace only).

## 2. Detection & Ingestion
Grok automatically detects and ingests FAF in these flows:

| Trigger                          | Behavior                                                                 |
|----------------------------------|--------------------------------------------------------------------------|
| GitHub / GitLab / Bitbucket link | Scan root for `project.faf` (or `*.faf`), fetch raw, parse instantly     |
| File upload                      | Immediate MIME-type validated parsing (`application/vnd.faf+yaml`)       |
| Pasted content                   | Inline parsing (YAML with `faf` hint or MIME header)                     |
| Connected workspace / Project mode | Auto-load + live sync                                                 |
| Grok Voice / Collections         | Spoken confirmation + eternal memory anchor                              |

**Parsing requirements:**
- Strict YAML validation against official FAF schema (v1+)
- Extract all core sections: `version`, `score`, `name`, `description`, 6W, tech stack, architecture, conventions, dependencies, `ai_instructions`
- Compute/store version hash for change detection

## 3. Internal Context Handling
- Convert parsed FAF into rich **structured internal representation** (hybrid knowledge-graph + vector store)
- Treat as **high-priority system context** (priority above conversation history)
- For large FAFs (>50 KB): automatic summary + on-demand retrieval
- Expose metadata in every response:
  ```json
  "faf_context": {
    "loaded": true,
    "score": 96,
    "project_name": "xAI Grok Core",
    "last_updated": "2026-02-25",
    "key_goals": [...]
  }
  ```
