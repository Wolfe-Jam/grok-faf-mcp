"use strict";
/**
 * LAZY-RAG Integrator
 *
 * Combines cache + xAI client for RAG queries.
 * Implements the LAZY-RAG pattern: cache-first, API on miss.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.XAIClient = exports.RAGIntegrator = void 0;
exports.getRAGIntegrator = getRAGIntegrator;
exports.initRAG = initRAG;
const cache_js_1 = require("./cache.js");
const xai_client_js_1 = require("./xai-client.js");
const DEFAULT_COLLECTION_ID = 'collection_becf059f-7896-4a32-bb3b-14b4dbec4b04';
class RAGIntegrator {
    client = null;
    cache;
    collectionId;
    configured = false;
    constructor(config = {}) {
        this.collectionId = config.collectionId || process.env.XAI_COLLECTION_ID || DEFAULT_COLLECTION_ID;
        this.cache = cache_js_1.ragCache;
        if (config.enableCache !== undefined) {
            this.cache.setEnabled(config.enableCache);
        }
        const apiKey = config.apiKey || process.env.XAI_API_KEY;
        if (apiKey) {
            this.client = new xai_client_js_1.XAIClient({
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
    async query(question) {
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
    getCacheStats() {
        return this.cache.stats();
    }
    /**
     * Clear cache
     */
    clearCache() {
        const previousSize = this.cache.stats().size;
        this.cache.clear();
        return { cleared: true, previousSize };
    }
    /**
     * Check if RAG is configured
     */
    isConfigured() {
        return this.configured && this.client !== null;
    }
    /**
     * Get collection ID
     */
    getCollectionId() {
        return this.collectionId;
    }
}
exports.RAGIntegrator = RAGIntegrator;
// Singleton instance
let ragInstance = null;
function getRAGIntegrator() {
    if (!ragInstance) {
        ragInstance = new RAGIntegrator();
    }
    return ragInstance;
}
function initRAG(config) {
    ragInstance = new RAGIntegrator(config);
    return ragInstance;
}
var xai_client_js_2 = require("./xai-client.js");
Object.defineProperty(exports, "XAIClient", { enumerable: true, get: function () { return xai_client_js_2.XAIClient; } });
//# sourceMappingURL=index.js.map