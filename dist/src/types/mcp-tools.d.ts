/**
 * 🏎️ MCP Tool Type Extensions - v2.8.0
 * Extended tool schema with visibility metadata
 * Championship-grade type safety
 */
import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { ToolVisibility, ToolCategory } from './tool-visibility.js';
/**
 * Extended MCP tool with FAF visibility metadata
 */
export interface FafMcpTool extends Tool {
    /**
     * Optional metadata for tool categorization and filtering
     */
    metadata?: {
        /**
         * Tool visibility level
         */
        visibility: ToolVisibility;
        /**
         * Tool category for organization
         */
        category: ToolCategory;
        /**
         * Priority for sorting within category
         */
        priority?: number;
        /**
         * Additional custom metadata
         */
        [key: string]: unknown;
    };
}
/**
 * Type guard to check if a tool has FAF metadata
 */
export declare function hasFafMetadata(tool: Tool): tool is FafMcpTool;
/**
 * Type guard to check if a tool is a core tool
 */
export declare function isCoreMcpTool(tool: Tool): boolean;
/**
 * Type guard to check if a tool is an advanced tool
 */
export declare function isAdvancedMcpTool(tool: Tool): boolean;
/**
 * Filter tools by visibility level
 */
export declare function filterToolsByVisibility(tools: FafMcpTool[], showAdvanced: boolean): FafMcpTool[];
/**
 * Sort tools by category and priority
 */
export declare function sortTools(tools: FafMcpTool[]): FafMcpTool[];
