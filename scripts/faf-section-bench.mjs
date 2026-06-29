// faf-section-bench.mjs — time the REAL shipped faf_section path: parseFaf(raw) +
// getSection(faf, path), the exact functions src/handlers/tools.ts calls. Reads the
// raw .faf on stdin, argv[2] = dotted path. Prints {micros, yaml, tokens} (best of N,
// warmed). Tokens via the canonical slash-tokens engine. Dev probe — not shipped.
import { slash } from 'slash-tokens';

const mod = await import('../dist/src/frc/retrieve.js');
const parseFaf = mod.parseFaf ?? mod.default?.parseFaf;
const getSection = mod.getSection ?? mod.default?.getSection;
if (typeof parseFaf !== 'function' || typeof getSection !== 'function') {
  process.stderr.write('could not load parseFaf/getSection from dist — run `npm run build` first\n');
  process.exit(1);
}

let raw = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', (d) => (raw += d));
process.stdin.on('end', () => {
  const path = process.argv[2] || 'sections.section_003';
  for (let i = 0; i < 10; i++) { getSection(parseFaf(raw), path); }   // warm
  let best = Infinity, out = '';
  for (let i = 0; i < 50; i++) {
    const t = process.hrtime.bigint();
    const r = getSection(parseFaf(raw), path);
    const us = Number(process.hrtime.bigint() - t) / 1000;
    if (us < best) { best = us; out = r.yaml; }
  }
  process.stdout.write(JSON.stringify({ micros: best, yaml: out, tokens: slash(out) }));
});
