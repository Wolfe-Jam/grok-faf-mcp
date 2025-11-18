/**
 * 🧡🩵 BIG ORANGE + CYAN Visual Style for FAF MCP
 * 3 Lines, 3 Words, 1 Emoji with Bar
 * Orange emojis with cyan text for championship look!
 */
export interface DisplayStyle {
    line1: string;
    line2: string;
    line3: string;
}
/**
 * Create an orange-themed progress bar
 * Uses orange blocks for filled, gray for empty
 */
export declare function createProgressBar(percentage: number, width?: number): string;
/**
 * Alternative ASCII bar when emojis aren't suitable
 */
export declare function createASCIIBar(percentage: number, width?: number): string;
/**
 * Get championship medal emoji and status based on score
 */
export declare function getScoreMedal(score: number): {
    medal: string;
    status: string;
};
/**
 * Format score display with Championship Medal System
 */
export declare function formatScore(score: number): DisplayStyle;
/**
 * Format file operations with style
 */
export declare function formatFileOp(operation: string, count: number, total?: number): DisplayStyle;
/**
 * Format sync operations
 */
export declare function formatSync(synced: number, total: number): DisplayStyle;
/**
 * Format directory tree with orange accents
 */
export declare function formatTree(tree: string): string;
/**
 * Format project detection
 */
export declare function formatDetection(projectType: string, confidence: number): DisplayStyle;
/**
 * Format generic success message
 */
export declare function formatSuccess(action: string, detail?: string): DisplayStyle;
/**
 * Format error message (still styled but clear)
 */
export declare function formatError(action: string, error: string): DisplayStyle;
/**
 * The main formatter - always returns 3 lines
 */
export declare function format3Lines(style: DisplayStyle): string;
/**
 * Special Big Orange celebration for perfect scores
 */
export declare function formatBigOrange(): DisplayStyle;
