// token-count.mjs — canonical FAF token counts via slash-tokens (the SAME engine
// src/frc/gate.ts:estimateTokens uses). Reads a JSON array of strings on stdin,
// writes a JSON array of token counts on stdout. Dev probe for the RAG receipt
// harness (rag_vs_faf_section.py) — NOT shipped in the package.
import { slash } from 'slash-tokens';

let raw = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', (d) => (raw += d));
process.stdin.on('end', () => {
  const texts = JSON.parse(raw);
  const counts = texts.map((t) => slash(String(t ?? '')));
  process.stdout.write(JSON.stringify(counts));
});
