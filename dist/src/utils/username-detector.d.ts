/**
 * 🔍 Username & Home Directory Detection
 *
 * Cross-platform detection of current user and home directory
 * for Projects convention path resolution.
 */
export interface UserInfo {
    username: string;
    homeDir: string;
    platform: 'darwin' | 'linux' | 'win32' | 'unknown';
}
/**
 * Detect current user information
 */
export declare function detectUser(): UserInfo;
/**
 * Get platform-specific home directory notation
 */
export declare function getHomeDirNotation(): string;
/**
 * Expand ~ to full home directory path
 */
export declare function expandTilde(inputPath: string): string;
/**
 * Contract full home directory path to ~
 */
export declare function contractToTilde(fullPath: string): string;
