/**
 * LAZY-RAG Cache Implementation
 *
 * In-memory cache with SHA256 key generation for deterministic lookups.
 * Cache key = hash(query:mode:collectionId) → 16-char hex
 */
export interface CacheStats {
    size: number;
    hits: number;
    misses: number;
    hitRate: number;
    enabled: boolean;
}
export declare class LazyRAGCache {
    private cache;
    private hits;
    private misses;
    private enabled;
    constructor(enabled?: boolean);
    /**
     * Generate deterministic cache key from query parameters
     * Uses SHA256 hash truncated to 16 hex chars
     */
    generateKey(query: string, mode: string, collectionId: string): string;
    /**
     * Get cached value if exists
     * Returns undefined on miss, tracks stats
     */
    get(key: string): string | undefined;
    /**
     * Store value in cache
     */
    set(key: string, value: string): void;
    /**
     * Check if key exists without updating stats
     */
    has(key: string): boolean;
    /**
     * Clear all cached entries and reset stats
     */
    clear(): void;
    /**
     * Get cache statistics
     */
    stats(): CacheStats;
    /**
     * Enable/disable caching
     */
    setEnabled(enabled: boolean): void;
}
export declare const ragCache: LazyRAGCache;
