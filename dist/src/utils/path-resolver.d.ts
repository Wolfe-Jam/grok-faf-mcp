/**
 * 🎯 Projects Convention Path Resolver
 *
 * Default: ~/Projects/[project-name]/project.faf
 *
 * Project name inference order:
 * 1. User explicit path (always wins)
 * 2. User project name statement
 * 3. AI inference from README, files, conversation context
 * 4. Fallback to 'unnamed-project'
 */
export interface ProjectContext {
    readme?: string;
    projectName?: string;
    uploadedFiles?: string[];
    conversationContext?: string;
}
export interface PathResolution {
    projectPath: string;
    fafFilePath: string;
    projectName: string;
    source: 'user-explicit' | 'user-name' | 'ai-inference' | 'fallback';
}
/**
 * Get user's home directory cross-platform
 */
export declare function getHomeDirectory(): string;
/**
 * Get default Projects directory
 */
export declare function getProjectsDirectory(): string;
/**
 * Resolve project path using Projects convention
 *
 * @param userInput - User-provided path or project name
 * @param context - Context for AI inference (README, files, etc.)
 * @returns Path resolution with project directory and .faf file path
 */
export declare function resolveProjectPath(userInput?: string, context?: ProjectContext): PathResolution;
/**
 * Ensure Projects directory exists
 */
export declare function ensureProjectsDirectory(): void;
/**
 * Validate that path is on real filesystem (not container)
 */
export declare function isRealFilesystemPath(inputPath: string): boolean;
/**
 * Format confirmation message for user
 */
export declare function formatPathConfirmation(resolution: PathResolution): string;
