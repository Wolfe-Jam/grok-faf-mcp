// Copy the cards faf writes (repo root) into docs/cards/, which grok.faf.one
// serves. The Worker maps the well-known paths onto these copies:
//   /.well-known/fafa             -> /cards/agent.fafa
//   /.well-known/ai-catalog.json  -> /cards/ai-catalog.json
//   /.well-known/ard.json         -> /cards/ard.json
// Regenerate with `npm run cards`; tests/cards-served.test.ts fails on drift.
import { copyFileSync, mkdirSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

export const SERVED = [
  ['agent.fafa', 'docs/cards/agent.fafa'],
  ['.well-known/ai-catalog.json', 'docs/cards/ai-catalog.json'],
  ['.well-known/ard.json', 'docs/cards/ard.json'],
];

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  mkdirSync('docs/cards', { recursive: true });
  for (const [from, to] of SERVED) {
    copyFileSync(from, to);
    console.log(`${from} -> ${to}`);
  }
}
