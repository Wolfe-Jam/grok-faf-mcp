/**
 * 🏎️ FAF Tool Visibility Configuration - v2.8.0
 * Controls which tools are visible (core vs all)
 * Championship-grade configuration management
 */
export interface VisibilityConfig {
    showAdvanced: boolean;
    source: 'env' | 'flag' | 'config' | 'default';
}
export interface FafConfig {
    showAdvanced?: boolean;
    [key: string]: unknown;
}
/**
 * Get visibility configuration from multiple sources
 * Priority: ENV var > config file > default
 */
export declare function getVisibilityConfig(): VisibilityConfig;
/**
 * Read configuration from .fafrc file
 * Checks multiple locations:
 * 1. ~/.fafrc (home directory)
 * 2. ./.fafrc (current working directory)
 */
export declare function readConfigFile(): FafConfig | null;
/**
 * Write configuration to ~/.fafrc file
 */
export declare function writeConfigFile(config: FafConfig): boolean;
/**
 * Enable advanced tools
 */
export declare function enableAdvancedTools(): boolean;
/**
 * Disable advanced tools (show core only)
 */
export declare function disableAdvancedTools(): boolean;
/**
 * Get current tool visibility status (for logging)
 */
export declare function getVisibilityStatus(): string;
