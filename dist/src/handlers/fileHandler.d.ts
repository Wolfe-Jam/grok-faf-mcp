import { Tool, CallToolResult } from '@modelcontextprotocol/sdk/types.js';
/**
 * Security validator for file paths
 */
export declare class PathValidator {
    private static readonly FORBIDDEN_PATHS;
    private static readonly MAX_FILE_SIZE;
    static validate(filePath: string): {
        valid: boolean;
        error?: string;
    };
    static checkFileSize(filePath: string): Promise<{
        valid: boolean;
        error?: string;
    }>;
}
/**
 * FAF Read Tool Definition
 */
export declare const fafReadTool: Tool;
/**
 * FAF Write Tool Definition
 */
export declare const fafWriteTool: Tool;
/**
 * Handle faf_read tool execution
 */
export declare function handleFafRead(args: any): Promise<CallToolResult>;
/**
 * Handle faf_write tool execution
 */
export declare function handleFafWrite(args: any): Promise<CallToolResult>;
export declare const fileHandlers: {
    faf_read: typeof handleFafRead;
    faf_write: typeof handleFafWrite;
};
