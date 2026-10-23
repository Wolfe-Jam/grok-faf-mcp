/**
 * InitializeResult.instructions: how the tools fit together, for the model.
 * Relationships and rules only; each tool's own description covers what it does.
 * Keep it under 1,000 characters: tests/server-instructions.test.ts checks the
 * length and that every tool named here is on the tool list.
 */
export const SERVER_INSTRUCTIONS = [
  "Two jobs: the project's context (project.faf) and its memory (.fafm).",
  'Context: faf_score shows what is missing; faf_trust checks it is well-formed; faf_init creates one; faf_sync writes CLAUDE.md, AGENTS.md, .cursorrules and GEMINI.md from it, one way.',
  'Memory: refresh_faf re-reads project.faf and reports drift since the last load; refresh_fafm reloads named souls; refresh_blend does both.',
  'faf_get_orchestration_policy shows the policy without running faf_orchestrate_recommendation.',
  'rag_query needs an xAI Collection: XAI_API_KEY set (XAI_COLLECTION_ID picks the collection). Without the key, use the faf_ tools.',
].join('\n');
