"use strict";
/**
 * 🏎️ FAF MCP Tool Registry with Visibility Support - v2.8.0
 * Central registry for all MCP tools with metadata
 * Championship-grade organization
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.shouldShowTool = shouldShowTool;
exports.enrichToolWithMetadata = enrichToolWithMetadata;
exports.filterTools = filterTools;
exports.getToolCountSummary = getToolCountSummary;
const tool_visibility_js_1 = require("../types/tool-visibility.js");
/**
 * Check if a tool should be visible based on configuration
 */
function shouldShowTool(toolName, showAdvanced) {
    const metadata = (0, tool_visibility_js_1.getToolMetadata)(toolName);
    // If no metadata found, show by default for backward compatibility
    if (!metadata) {
        return true;
    }
    // If showAdvanced is true, show all tools
    if (showAdvanced) {
        return true;
    }
    // Otherwise, only show core tools
    return metadata.visibility === 'core';
}
/**
 * Add metadata to a tool definition
 */
function enrichToolWithMetadata(tool) {
    const metadata = (0, tool_visibility_js_1.getToolMetadata)(tool.name);
    if (!metadata) {
        // Return tool as-is if no metadata found
        return tool;
    }
    return {
        ...tool,
        metadata: {
            visibility: metadata.visibility,
            category: metadata.category,
            priority: metadata.priority,
        },
    };
}
/**
 * Filter tools based on visibility configuration
 */
function filterTools(tools, showAdvanced) {
    return tools
        .filter((tool) => shouldShowTool(tool.name, showAdvanced))
        .map((tool) => enrichToolWithMetadata(tool));
}
/**
 * Get tool count summary
 */
function getToolCountSummary(showAdvanced) {
    const coreCount = Object.values(tool_visibility_js_1.TOOL_REGISTRY).filter((t) => t.visibility === 'core').length;
    const totalCount = Object.values(tool_visibility_js_1.TOOL_REGISTRY).length;
    if (showAdvanced) {
        return `${totalCount} tools (${coreCount} core + ${totalCount - coreCount} advanced)`;
    }
    else {
        return `${coreCount} core tools`;
    }
}
//# sourceMappingURL=tool-registry.js.map