"use strict";
/**
 * xAI REST API Client
 *
 * Wrapper for xAI chat completions API.
 * Uses grok-3-fast model for fast responses.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.XAIClient = void 0;
const DEFAULT_MODEL = 'grok-3-fast';
const DEFAULT_MAX_TOKENS = 500;
const XAI_API_URL = 'https://api.x.ai/v1/chat/completions';
class XAIClient {
    apiKey;
    model;
    maxTokens;
    constructor(config) {
        this.apiKey = config.apiKey;
        this.model = config.model || DEFAULT_MODEL;
        this.maxTokens = config.maxTokens || DEFAULT_MAX_TOKENS;
    }
    /**
     * Send chat completion request to xAI API
     */
    async chat(messages) {
        const response = await fetch(XAI_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${this.apiKey}`
            },
            body: JSON.stringify({
                model: this.model,
                messages,
                max_tokens: this.maxTokens
            })
        });
        if (!response.ok) {
            const error = await response.text();
            throw new Error(`xAI API error (${response.status}): ${error}`);
        }
        const data = await response.json();
        const content = data.choices?.[0]?.message?.content || '';
        return {
            content,
            model: data.model || this.model,
            usage: data.usage
        };
    }
    /**
     * Query with RAG context
     * System prompt provides project context from collection
     */
    async queryWithContext(params) {
        const systemContent = params.systemPrompt || this.getDefaultSystemPrompt(params.context);
        const messages = [
            { role: 'system', content: systemContent },
            { role: 'user', content: params.question }
        ];
        const response = await this.chat(messages);
        return response.content;
    }
    /**
     * Default system prompt with FAF project context
     */
    getDefaultSystemPrompt(additionalContext) {
        let prompt = `You are a helpful assistant with access to FAF (Foundational AI-context Format) project context.

FAF Project Context:
- Project: xai-faf-rag
- Birth Certificate ID: FAF-2026-XAIFAFRA-WXGD
- FAF Version: 2.5.0
- Purpose: Cache-first RAG using Grok Collections
- Tech Stack: Python + Rust, xai-sdk, LAZY-RAG cache layer
- Collection: FAF Elite Palace
- Key Features: LAZY-RAG caching (0.003ms hits), Collections search, .faf file sync

Answer questions accurately based on this context. Be concise.`;
        if (additionalContext) {
            prompt += `\n\nAdditional Context:\n${additionalContext}`;
        }
        return prompt;
    }
    /**
     * Check if API key is configured
     */
    isConfigured() {
        return !!this.apiKey && this.apiKey.length > 0;
    }
}
exports.XAIClient = XAIClient;
//# sourceMappingURL=xai-client.js.map