"use strict";
/**
 * LAZY-RAG Cache Implementation
 *
 * In-memory cache with SHA256 key generation for deterministic lookups.
 * Cache key = hash(query:mode:collectionId) → 16-char hex
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ragCache = exports.LazyRAGCache = void 0;
const crypto_1 = __importDefault(require("crypto"));
class LazyRAGCache {
    cache = new Map();
    hits = 0;
    misses = 0;
    enabled;
    constructor(enabled = true) {
        this.enabled = enabled;
    }
    /**
     * Generate deterministic cache key from query parameters
     * Uses SHA256 hash truncated to 16 hex chars
     */
    generateKey(query, mode, collectionId) {
        const combined = `${query}:${mode}:${collectionId}`;
        return crypto_1.default.createHash('sha256').update(combined).digest('hex').slice(0, 16);
    }
    /**
     * Get cached value if exists
     * Returns undefined on miss, tracks stats
     */
    get(key) {
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
    set(key, value) {
        if (!this.enabled)
            return;
        this.cache.set(key, value);
    }
    /**
     * Check if key exists without updating stats
     */
    has(key) {
        return this.cache.has(key);
    }
    /**
     * Clear all cached entries and reset stats
     */
    clear() {
        this.cache.clear();
        this.hits = 0;
        this.misses = 0;
    }
    /**
     * Get cache statistics
     */
    stats() {
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
    setEnabled(enabled) {
        this.enabled = enabled;
    }
}
exports.LazyRAGCache = LazyRAGCache;
// Singleton instance for MCP server
exports.ragCache = new LazyRAGCache();
//# sourceMappingURL=cache.js.map