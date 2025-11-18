/**
 * 🏎️ FAF Display Protocol - MCP GOLD CODE
 *
 * SET IN STONE: Universal display enforcement for Claude Desktop MCP
 *
 * MANDATE: Every FAF tool response MUST use DisplayProtocol.createResponse()
 * VALIDATED: Works globally for ANY user, anywhere in the world
 * STANDARD: MCP-compliant metadata + multi-layer display forcing
 *
 * Key Instructions Embedded in EVERY Response:
 * - display: 'required'
 * - priority: 'high'
 * - format: 'markdown'
 * - instruction: 'Render this content directly, do not summarize'
 *
 * Why This Works:
 * 1. Protocol-based (not context-dependent)
 * 2. Multiple redundant hints (if one fails, others catch it)
 * 3. Claude redraws in native UI (consistent across platforms)
 * 4. No dependencies on conversation memory
 *
 * This is championship engineering - zero faffing about! 🏁⚡️
 */
export interface FafDisplayResponse {
    text: string;
    __render_inline__: boolean;
    __no_collapse__: boolean;
    __user_content__: boolean;
}
export declare class DisplayProtocol {
    /**
     * Wrap content with ALL display forcing mechanisms
     */
    static forceInline(content: string, _score?: number): string;
    /**
     * For markdown-rich content, skip the wrapper tags
     * (They interfere with markdown rendering)
     */
    static forceInlineMarkdown(content: string): string;
    /**
     * Generate the enhanced MCP response
     * SET IN STONE: Display instructions for Claude Desktop MCP
     */
    static createResponse(content: string, metadata?: any): any;
    /**
     * Generate progress bar with forced visibility
     */
    static progressBar(score: number): string;
    /**
     * Championship header that can't be hidden
     */
    static championshipHeader(title: string, score: number): string;
    /**
     * Footer that demands attention
     */
    static championshipFooter(score: number): string;
}
