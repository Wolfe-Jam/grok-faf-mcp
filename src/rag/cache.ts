/**
 * LAZY-RAG Cache Implementation
 *
 * In-memory cache with SHA256 key generation for deterministic lookups.
 * Cache key = hash(query:mode:collectionId) → 16-char hex
 */

import crypto from 'crypto';

export interface CacheStats {
  size: number;
  hits: number;
  misses: number;
  hitRate: number;
  enabled: boolean;
}

export class LazyRAGCache {
  private cache = new Map<string, string>();
  private hits = 0;
  private misses = 0;
  private enabled: boolean;

  constructor(enabled = true) {
    this.enabled = enabled;
  }

  /**
   * Generate deterministic cache key from query parameters
   * Uses SHA256 hash truncated to 16 hex chars
   */
  generateKey(query: string, mode: string, collectionId: string): string {
    const combined = `${query}:${mode}:${collectionId}`;
    return crypto.createHash('sha256').update(combined).digest('hex').slice(0, 16);
  }

  /**
   * Get cached value if exists
   * Returns undefined on miss, tracks stats
   */
  get(key: string): string | undefined {
    if (!this.enabled) {
      this.misses++;
      return undefined;
    }

    const value = this.cache.get(key);
    if (value !== undefined) {
      this.hits++;
      return value;
    }
    this.misses++;
    return undefined;
  }

  /**
   * Store value in cache
   */
  set(key: string, value: string): void {
    if (!this.enabled) return;
    this.cache.set(key, value);
  }

  /**
   * Check if key exists without updating stats
   */
  has(key: string): boolean {
    return this.cache.has(key);
  }

  /**
   * Clear all cached entries and reset stats
   */
  clear(): void {
    this.cache.clear();
    this.hits = 0;
    this.misses = 0;
  }

  /**
   * Get cache statistics
   */
  stats(): CacheStats {
    const total = this.hits + this.misses;
    return {
      size: this.cache.size,
      hits: this.hits,
      misses: this.misses,
      hitRate: total > 0 ? this.hits / total : 0,
      enabled: this.enabled
    };
  }

  /**
   * Enable/disable caching
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }
}

// Singleton instance for MCP server
export const ragCache = new LazyRAGCache();
