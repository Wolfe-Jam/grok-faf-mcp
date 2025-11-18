/**
 * 📦 faf update - Update project.faf metadata (Mk3 Bundled)
 */
export interface UpdateOptions {
    json?: boolean;
}
export interface UpdateResult {
    success: boolean;
    updated: boolean;
    message: string;
}
export declare function updateFafFile(projectPath?: string, options?: UpdateOptions): Promise<UpdateResult>;
