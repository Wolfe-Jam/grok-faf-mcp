/**
 * FRC §4.1 — LIVE Collections smoke (GO-gated, operator keys).
 *
 * Proves the real CollectionsClient round-trips against a live Grok Collection:
 *   list (if mgmt key) → pick a collection → real search → print matches.
 *
 * Keys come from ENV ONLY and are NEVER printed:
 *   XAI_API_KEY             (required — search)
 *   XAI_MANAGEMENT_API_KEY  (optional — enables list)
 *   XAI_COLLECTION_ID       (optional — else first listed / built-in default)
 *   FRC_SMOKE_QUERY         (optional — the search query)
 *
 * Run:  XAI_API_KEY=... [XAI_MANAGEMENT_API_KEY=...] bun scripts/frc-smoke.ts
 */
import { CollectionsClient } from '../src/rag/collections-client.js';

const apiKey = process.env.XAI_API_KEY;
const managementApiKey = process.env.XAI_MANAGEMENT_API_KEY;
const envCollection = process.env.XAI_COLLECTION_ID;
const query = process.env.FRC_SMOKE_QUERY || 'What is the tech stack and purpose of this project?';

if (!apiKey) {
  console.error('❌ XAI_API_KEY not set (search key required). Aborting — no live call made.');
  process.exit(1);
}

// Never log key values — only presence.
console.log('🔑 keys present:', {
  XAI_API_KEY: true,
  XAI_MANAGEMENT_API_KEY: !!managementApiKey,
});

const client = new CollectionsClient({ apiKey, managementApiKey });

function trunc(s: string, n = 160): string {
  const flat = s.replace(/\s+/g, ' ').trim();
  return flat.length > n ? flat.slice(0, n) + '…' : flat;
}

async function main() {
  let collectionId = envCollection;

  // 1) List (only if a management key is present)
  if (client.canManage()) {
    console.log('\n📚 listCollections() …');
    try {
      const cols = await client.listCollections();
      console.log(`   found ${cols.length} collection(s):`);
      for (const c of cols.slice(0, 20)) {
        console.log(`   - ${c.collectionId}  "${c.collectionName}"  docs=${c.documentsCount ?? '?'}`);
      }
      if (!collectionId && cols.length > 0) collectionId = cols[0].collectionId;
    } catch (e) {
      console.log(`   ⚠️  list failed: ${(e as Error).message}`);
    }
  } else {
    console.log('\n📚 (no management key → skipping list; using env/default collection)');
  }

  if (!collectionId) {
    console.error('\n❌ No collection id (set XAI_COLLECTION_ID or provide a management key to list). Aborting before search.');
    process.exit(1);
  }

  // 2) Real search — the deterministic retrieval the shim never did
  console.log(`\n🔎 search(collection=${collectionId})`);
  console.log(`   query: "${query}"`);
  const start = Date.now();
  try {
    const res = await client.search({ query, collectionIds: [collectionId], limit: 5 });
    const ms = Date.now() - start;
    console.log(`   ✅ ${res.matches.length} match(es) in ${ms}ms`);
    res.matches.forEach((m, i) => {
      console.log(`   [${i + 1}] score=${m.score.toFixed(4)} file=${m.fileId} chunk=${m.chunkId}`);
      console.log(`        ${trunc(m.chunkContent)}`);
    });
    if (res.matches.length === 0) {
      console.log('   (0 matches — collection may be empty or the query found no grounding)');
    }
    console.log('\n🏁 FRC §4.1 live smoke: search round-tripped against a live Collection.');
  } catch (e) {
    console.error(`   ❌ search failed: ${(e as Error).message}`);
    process.exit(1);
  }
}

main();
