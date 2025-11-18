/**
 * ⚡ FAF Quick - Lightning-fast .faf creation (Mk3 Bundled)
 * One-liner format for instant context generation
 */
interface QuickOptions {
    force?: boolean;
    json?: boolean;
}
export interface QuickResult {
    success: boolean;
    created: boolean;
    filePath?: string;
    message: string;
}
export declare function quickCommand(projectPath: string, input?: string, options?: QuickOptions): Promise<QuickResult>;
export {};
