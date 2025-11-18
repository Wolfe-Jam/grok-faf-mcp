/**
 * 🏎️ FAF MCP Tool Registry with Visibility Support - v2.8.0
 * Central registry for all MCP tools with metadata
 * Championship-grade organization
 */
import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { FafMcpTool } from '../types/mcp-tools.js';
/**
 * Check if a tool should be visible based on configuration
 */
export declare function shouldShowTool(toolName: string, showAdvanced: boolean): boolean;
/**
 * Add metadata to a tool definition
 */
export declare function enrichToolWithMetadata(tool: Tool): FafMcpTool;
/**
 * Filter tools based on visibility configuration
 */
export declare function filterTools(tools: Tool[], showAdvanced: boolean): FafMcpTool[];
/**
 * Get tool count summary
 */
export declare function getToolCountSummary(showAdvanced: boolean): string;
