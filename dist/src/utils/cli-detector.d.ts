/**
 * CLI Path Detection for Claude Desktop Sandbox
 *
 * Claude Desktop MCP runs in a sandboxed environment with limited PATH.
 * This utility detects the faf CLI using absolute paths.
 */
export interface CliDetectionResult {
    found: boolean;
    path?: string;
    version?: string;
    method?: string;
}
/**
 * Detect faf CLI location with multiple fallback strategies
 */
export declare function detectFafCli(): CliDetectionResult;
/**
 * Validate CLI meets minimum version requirement
 */
export declare function validateCliVersion(version: string, minVersion?: string): boolean;
