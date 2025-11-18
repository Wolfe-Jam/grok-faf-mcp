/**
 * 🔄 faf migrate - Migrate legacy .faf to project.faf (Mk3 Bundled)
 */
export interface MigrateOptions {
    force?: boolean;
    json?: boolean;
}
export interface MigrateResult {
    success: boolean;
    migrated: boolean;
    from?: string;
    to?: string;
    message: string;
}
export declare function migrateFafFile(projectPath?: string, options?: MigrateOptions): Promise<MigrateResult>;
