"use strict";
/**
 * 🏎️ MCP Tool Type Extensions - v2.8.0
 * Extended tool schema with visibility metadata
 * Championship-grade type safety
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.hasFafMetadata = hasFafMetadata;
exports.isCoreMcpTool = isCoreMcpTool;
exports.isAdvancedMcpTool = isAdvancedMcpTool;
exports.filterToolsByVisibility = filterToolsByVisibility;
exports.sortTools = sortTools;
/**
 * Type guard to check if a tool has FAF metadata
 */
function hasFafMetadata(tool) {
    return 'metadata' in tool && typeof tool.metadata === 'object' && tool.metadata !== null;
}
/**
 * Type guard to check if a tool is a core tool
 */
function isCoreMcpTool(tool) {
    if (!hasFafMetadata(tool))
        return false;
    return tool.metadata?.visibility === 'core';
}
/**
 * Type guard to check if a tool is an advanced tool
 */
function isAdvancedMcpTool(tool) {
    if (!hasFafMetadata(tool))
        return false;
    return tool.metadata?.visibility === 'advanced';
}
/**
 * Filter tools by visibility level
 */
function filterToolsByVisibility(tools, showAdvanced) {
    if (showAdvanced) {
        return tools;
    }
    return tools.filter((tool) => {
        if (!hasFafMetadata(tool))
            return true; // Include tools without metadata for backward compatibility
        return tool.metadata?.visibility === 'core';
    });
}
/**
 * Sort tools by category and priority
 */
function sortTools(tools) {
    return tools.sort((a, b) => {
        // First sort by category
        const categoryOrder = {
            workflow: 1,
            quality: 2,
            intelligence: 3,
            sync: 4,
            ai: 5,
            help: 6,
            trust: 7,
            file: 8,
            utility: 9,
            display: 10,
        };
        const aCat = a.metadata?.category || 'utility';
        const bCat = b.metadata?.category || 'utility';
        const catDiff = categoryOrder[aCat] - categoryOrder[bCat];
        if (catDiff !== 0)
            return catDiff;
        // Then sort by priority within category
        const aPriority = a.metadata?.priority || 999;
        const bPriority = b.metadata?.priority || 999;
        return aPriority - bPriority;
    });
}
//# sourceMappingURL=mcp-tools.js.map