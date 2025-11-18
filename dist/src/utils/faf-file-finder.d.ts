/**
 * FAF File Discovery Utility
 * v3.0.0 Specification: Prioritizes project.faf, supports legacy .faf with warnings
 *
 * READS both formats (with migration suggestion for .faf)
 * WRITES only project.faf (new files always use standard)
 */
export interface FafFileResult {
    /** Full path to the discovered FAF file */
    path: string;
    /** Filename (e.g., "project.faf", ".faf") */
    filename: string;
    /** Always true for project.faf, false for legacy .faf */
    isStandard: boolean;
    /** True if this is legacy .faf and should be migrated */
    needsMigration: boolean;
}
/**
 * Find FAF file in directory (v3.0.0)
 *
 * Priority:
 * 1. project.faf (standard - no warning)
 * 2. .faf (legacy - shows migration suggestion)
 *
 * @param directory - Directory to search (defaults to cwd)
 * @returns FafFileResult if found, null if no FAF file exists
 *
 * @example
 * const result = await findFafFile('/path/to/project');
 * if (result) {
 *   console.log(`Found: ${result.filename}`);
 *   if (result.needsMigration) {
 *     console.log('💡 Run "faf migrate" to upgrade to project.faf');
 *   }
 * }
 */
export declare function findFafFile(directory?: string): Promise<FafFileResult | null>;
/**
 * Get the path where a new FAF file should be created
 * v3.0.0: ALWAYS returns project.faf (never creates .faf)
 *
 * @param directory - Directory where FAF file will be created
 * @returns Full path to project.faf
 */
export declare function getNewFafFilePath(directory?: string): string;
/**
 * Check if a FAF file exists (either format)
 *
 * @param directory - Directory to check
 * @returns True if any FAF file exists
 */
export declare function hasFafFile(directory?: string): Promise<boolean>;
/**
 * Get migration suggestion message if needed
 *
 * @param result - Result from findFafFile()
 * @returns Migration message if applicable, null otherwise
 */
export declare function getMigrationSuggestion(result: FafFileResult | null): string | null;
