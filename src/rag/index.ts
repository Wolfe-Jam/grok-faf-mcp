/**
 * LAZY-RAG Integrator
 *
 * Combines cache + xAI client for RAG queries.
 * Implements the LAZY-RAG pattern: cache-first, API on miss.
 */

import { LazyRAGCache, ragCache, type CacheStats } from './cache.js';
import { XAIClient, type XAIClientConfig } from './xai-client.js';

export interface RAGQueryResult {
  answer: string;
  cached: boolean;
  elapsed: number;
  cacheKey?: string;
}

export interface RAGConfig {
  apiKey?: string;
  collectionId?: string;
  model?: string;
  enableCache?: boolean;
}

const DEFAULT_COLLECTION_ID = 'collection_becf059f-7896-4a32-bb3b-14b4dbec4b04';

export class RAGIntegrator {
  private client: XAIClient | null = null;
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

    const answer = await this.client.queryWithContext({ question });

    // Store in cache
    this.cache.set(cacheKey, answer);

    return {
      answer,
      cached: false,
      elapsed: (Date.now() - start) / 1000,
      cacheKey
    };
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
