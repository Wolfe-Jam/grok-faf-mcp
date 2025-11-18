/**
 * 🏎️ FAF Tool Visibility System - v2.8.0
 * Reduce cognitive load: 20 core tools + 31 advanced tools
 * Championship-grade organization
 */
export type ToolVisibility = 'core' | 'advanced';
export type ToolCategory = 'workflow' | 'quality' | 'intelligence' | 'sync' | 'ai' | 'help' | 'trust' | 'file' | 'utility' | 'display';
export interface ToolMetadata {
    name: string;
    visibility: ToolVisibility;
    category: ToolCategory;
    description: string;
    priority?: number;
}
/**
 * Complete tool registry with metadata
 */
export declare const TOOL_REGISTRY: Record<string, ToolMetadata>;
/**
 * Helper functions
 */
export declare function isCoreTool(toolName: string): boolean;
export declare function isAdvancedTool(toolName: string): boolean;
export declare function getCoreTools(): ToolMetadata[];
export declare function getAdvancedTools(): ToolMetadata[];
export declare function getAllTools(): ToolMetadata[];
export declare function getToolsByCategory(category: ToolCategory): ToolMetadata[];
export declare function getToolMetadata(toolName: string): ToolMetadata | undefined;
/**
 * Validate tool counts (for testing)
 */
export declare function validateToolCounts(): {
    core: number;
    advanced: number;
    total: number;
};
