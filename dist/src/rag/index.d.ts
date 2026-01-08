/**
 * LAZY-RAG Integrator
 *
 * Combines cache + xAI client for RAG queries.
 * Implements the LAZY-RAG pattern: cache-first, API on miss.
 */
import { type CacheStats } from './cache.js';
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
export declare class RAGIntegrator {
    private client;
    private cache;
    private collectionId;
    private configured;
    constructor(config?: RAGConfig);
    /**
     * Query with LAZY-RAG pattern
     * 1. Check cache
     * 2. On miss, call xAI API
     * 3. Cache result
     */
    query(question: string): Promise<RAGQueryResult>;
    /**
     * Get cache statistics
     */
    getCacheStats(): CacheStats;
    /**
     * Clear cache
     */
    clearCache(): {
        cleared: boolean;
        previousSize: number;
    };
    /**
     * Check if RAG is configured
     */
    isConfigured(): boolean;
    /**
     * Get collection ID
     */
    getCollectionId(): string;
}
export declare function getRAGIntegrator(): RAGIntegrator;
export declare function initRAG(config?: RAGConfig): RAGIntegrator;
export type { CacheStats } from './cache.js';
export { XAIClient } from './xai-client.js';
export type { ChatMessage, ChatResponse } from './xai-client.js';
