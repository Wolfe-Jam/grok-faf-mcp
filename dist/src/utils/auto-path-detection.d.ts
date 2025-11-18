/**
 * 🎯 Auto-Path Detection from Dropped Files
 * Solves the "drop and done" workflow problem
 *
 * When files land in /mnt/user-data/uploads/, extract identifiers
 * and perform case-insensitive filesystem search to find real project path.
 */
export interface PathDetectionResult {
    found: boolean;
    path?: string;
    identifier?: string;
    error?: string;
}
/**
 * Extract project identifier from dropped file
 */
export declare function extractIdentifier(filePath: string): string | null;
/**
 * Find project path on user's filesystem (case-insensitive)
 */
export declare function findProjectPath(identifier: string): string | null;
/**
 * Auto-detect real project path from container upload path
 * Main entry point for all FAF commands
 */
export declare function autoDetectPath(inputPath: string): PathDetectionResult;
