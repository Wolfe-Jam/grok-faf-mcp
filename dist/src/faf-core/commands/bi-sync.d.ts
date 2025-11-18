/**
 * 🔗 Bi-Sync Engine - Mk3 Bundled Edition
 * Revolutionary project.faf ↔ CLAUDE.md Synchronization
 */
export interface BiSyncOptions {
    auto?: boolean;
    watch?: boolean;
    force?: boolean;
    json?: boolean;
    target?: 'auto' | '.clinerules' | '.cursorrules' | '.windsurfrules' | 'CLAUDE.md' | 'all';
}
export interface BiSyncResult {
    success: boolean;
    direction: 'faf-to-claude' | 'claude-to-faf' | 'bidirectional' | 'none';
    filesChanged: string[];
    conflicts: string[];
    duration: number;
    message: string;
}
/**
 * 🔄 Convert project.faf YAML content to platform-specific format
 */
export declare function fafToPlatformFormat(fafContent: string, targetPlatform: string): string;
/**
 * 🔗 Main Bi-Sync function - Platform-Aware
 */
export declare function syncBiDirectional(projectPath?: string, options?: BiSyncOptions): Promise<BiSyncResult>;
