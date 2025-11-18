/**
 * faf init - Programmatic API (MCP-ready)
 * No console output, returns structured data
 */
export interface InitOptions {
    force?: boolean;
    new?: boolean;
    choose?: boolean;
    template?: string;
    output?: string;
    quiet?: boolean;
}
export interface InitResult {
    success: boolean;
    outputPath?: string;
    projectType?: string;
    score?: number;
    duration?: number;
    error?: string;
    alreadyExists?: boolean;
}
/**
 * Initialize .faf file - programmatic API
 * Returns structured data, no console output
 */
export declare function initFafFile(projectPath?: string, options?: InitOptions): Promise<InitResult>;
