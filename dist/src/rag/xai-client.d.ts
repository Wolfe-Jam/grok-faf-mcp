/**
 * xAI REST API Client
 *
 * Wrapper for xAI chat completions API.
 * Uses grok-3-fast model for fast responses.
 */
export interface ChatMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
}
export interface ChatResponse {
    content: string;
    model: string;
    usage?: {
        prompt_tokens: number;
        completion_tokens: number;
        total_tokens: number;
    };
}
export interface XAIClientConfig {
    apiKey: string;
    model?: string;
    maxTokens?: number;
}
export declare class XAIClient {
    private apiKey;
    private model;
    private maxTokens;
    constructor(config: XAIClientConfig);
    /**
     * Send chat completion request to xAI API
     */
    chat(messages: ChatMessage[]): Promise<ChatResponse>;
    /**
     * Query with RAG context
     * System prompt provides project context from collection
     */
    queryWithContext(params: {
        question: string;
        systemPrompt?: string;
        context?: string;
    }): Promise<string>;
    /**
     * Default system prompt with FAF project context
     */
    private getDefaultSystemPrompt;
    /**
     * Check if API key is configured
     */
    isConfigured(): boolean;
}
