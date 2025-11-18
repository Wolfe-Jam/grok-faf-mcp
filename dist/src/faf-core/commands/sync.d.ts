/**
 * 🔄 faf sync - Sync Command (Mk3 Bundled)
 * Sync project.faf file with project changes (package.json, git, etc.)
 */
export interface SyncOptions {
    auto?: boolean;
    dryRun?: boolean;
    json?: boolean;
}
export interface SyncResult {
    success: boolean;
    changesDetected: number;
    changesApplied: number;
    message: string;
}
export declare function syncFafFile(projectPath?: string, options?: SyncOptions): Promise<SyncResult>;
