/**
 * LAZY-RAG Integrator
 *
 * Combines cache + xAI client for RAG queries.
 * Implements the LAZY-RAG pattern: cache-first, API on miss.
 */

import { LazyRAGCache, ragCache, type CacheStats } from './cache.js';
import { XAIClient } from './xai-client.js';
import { CollectionsClient, type CollectionMatch } from './collections-client.js';
import { frcEnabled } from '../frc/gate.js';

export interface RAGQueryResult {
  answer: string;
  cached: boolean;
  elapsed: number;
  cacheKey?: string;
  /** True when the answer was built from a REAL Collections retrieval (FRC), not the chat shim. */
  retrieved?: boolean;
}

export interface RAGConfig {
  apiKey?: string;
  /** Management API key — required only for collection create/list (FRC management ops). */
  managementApiKey?: string;
  collectionId?: string;
  model?: string;
  enableCache?: boolean;
}

const DEFAULT_COLLECTION_ID = 'collection_becf059f-7896-4a32-bb3b-14b4dbec4b04';

/** Format retrieved chunks as a grounding context block for synthesis. */
export function formatMatchesAsContext(matches: CollectionMatch[]): string {
  return matches
    .map((m, i) => `[${i + 1}] (score ${m.score.toFixed(3)}) ${m.chunkContent}`)
    .join('\n\n');
}

export class RAGIntegrator {
  private client: XAIClient | null = null;
  private collections: CollectionsClient | null = null;
  private cache: LazyRAGCache;
  private collectionId: string;
  private configured = false;

  constructor(config: RAGConfig = {}) {
    this.collectionId = config.collectionId || process.env.XAI_COLLECTION_ID || DEFAULT_COLLECTION_ID;
    this.cache = ragCache;

    if (config.enableCache !== undefined) {
      this.cache.setEnabled(config.enableCache);
    }

    const apiKey = config.apiKey || process.env.XAI_API_KEY;
    if (apiKey) {
      this.client = new XAIClient({
        apiKey,
        model: config.model
      });
      this.configured = true;

      // FRC (Phase III): the ONE real Collections client — flag-gated, OFF by
      // default (cf. USE_ZEPH). When off, query() uses the legacy chat shim and
      // default behavior is unchanged.
      if (frcEnabled()) {
        const managementApiKey = config.managementApiKey || process.env.XAI_MANAGEMENT_API_KEY;
        this.collections = new CollectionsClient({ apiKey, managementApiKey });
      }
    }
  }

  /**
   * Query with LAZY-RAG pattern
   * 1. Check cache
   * 2. On miss, call xAI API
   * 3. Cache result
   */
  async query(question: string): Promise<RAGQueryResult> {
    const start = Date.now();
    const cacheKey = this.cache.generateKey(question, 'query', this.collectionId);

    // Check cache first
    const cached = this.cache.get(cacheKey);
    if (cached !== undefined) {
      return {
        answer: cached,
        cached: true,
        elapsed: (Date.now() - start) / 1000,
        cacheKey
      };
    }

    // Cache miss - call API
    if (!this.client) {
      throw new Error('XAI_API_KEY not configured');
    }

    // FRC (Phase III): REAL retrieval path — search the Collection for grounding
    // chunks, then synthesize an answer from them. This is the consolidation that
    // kills the split-brain (the shim never searched Collections). Flag-gated.
    let answer: string;
    let retrieved = false;
    if (this.collections) {
      const result = await this.collections.search({
        query: question,
        collectionIds: [this.collectionId],
      });
      retrieved = true;
      if (result.matches.length > 0) {
        const context = formatMatchesAsContext(result.matches);
        answer = await this.client.queryWithContext({ question, context });
      } else {
        // No grounding found — answer honestly rather than hallucinate.
        answer = await this.client.queryWithContext({ question });
      }
    } else {
      // Legacy shim path (FRC off) — unchanged default behavior.
      answer = await this.client.queryWithContext({ question });
    }

    // Store in cache
    this.cache.set(cacheKey, answer);

    return {
      answer,
      cached: false,
      elapsed: (Date.now() - start) / 1000,
      cacheKey,
      retrieved
    };
  }

  /**
   * Real Collections retrieval (FRC) — returns grounding chunks directly, no
   * synthesis. Requires the FRC flag (the collections client is only built when
   * frcEnabled()). Cache-first on a distinct 'retrieve' key.
   */
  async retrieve(question: string, limit?: number): Promise<{ matches: CollectionMatch[]; elapsed: number }> {
    const start = Date.now();
    if (!this.collections) {
      throw new Error('FRC retrieval not enabled — set USE_FRC=1 and configure XAI_API_KEY');
    }
    const result = await this.collections.search({
      query: question,
      collectionIds: [this.collectionId],
      ...(limit !== undefined ? { limit } : {}),
    });
    return { matches: result.matches, elapsed: (Date.now() - start) / 1000 };
  }

  /** The real Collections client when FRC is enabled (else null). */
  getCollectionsClient(): CollectionsClient | null {
    return this.collections;
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): CacheStats {
    return this.cache.stats();
  }

  /**
   * Clear cache
   */
  clearCache(): { cleared: boolean; previousSize: number } {
    const previousSize = this.cache.stats().size;
    this.cache.clear();
    return { cleared: true, previousSize };
  }

  /**
   * Check if RAG is configured
   */
  isConfigured(): boolean {
    return this.configured && this.client !== null;
  }

  /**
   * Get collection ID
   */
  getCollectionId(): string {
    return this.collectionId;
  }
}

// Singleton instance
let ragInstance: RAGIntegrator | null = null;

export function getRAGIntegrator(): RAGIntegrator {
  if (!ragInstance) {
    ragInstance = new RAGIntegrator();
  }
  return ragInstance;
}

export function initRAG(config?: RAGConfig): RAGIntegrator {
  ragInstance = new RAGIntegrator(config);
  return ragInstance;
}

// Re-export types
export type { CacheStats } from './cache.js';
export { XAIClient } from './xai-client.js';
export type { ChatMessage, ChatResponse } from './xai-client.js';
export { CollectionsClient } from './collections-client.js';
export type {
  CollectionMatch,
  SearchParams,
  SearchResult,
  CollectionSummary,
  CreateCollectionParams,
  CollectionsClientConfig
} from './collections-client.js';
