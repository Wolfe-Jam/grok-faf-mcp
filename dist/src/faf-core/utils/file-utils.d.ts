/**
 * 📁 File Utilities
 * Helper functions for finding and working with .faf files
 */
/**
 * Find project.faf file in current directory or parent directories
 *
 * v3.0.0: ONLY supports project.faf (no legacy .faf support)
 */
export declare function findFafFile(startDir?: string): Promise<string | null>;
/**
 * Check if file exists and is readable
 */
export declare function fileExists(filePath: string): Promise<boolean>;
/**
 * Get file modification time
 */
export declare function getFileModTime(filePath: string): Promise<Date | null>;
/**
 * Find package.json in project
 */
export declare function findPackageJson(startDir?: string): Promise<string | null>;
/**
 * Find pyproject.toml in project (Python Poetry/PEP 518)
 */
export declare function findPyprojectToml(startDir?: string): Promise<string | null>;
/**
 * Find requirements.txt in project (Python pip)
 */
export declare function findRequirementsTxt(startDir?: string): Promise<string | null>;
/**
 * Find tsconfig.json in project (TypeScript)
 */
export declare function findTsConfig(startDir?: string): Promise<string | null>;
/**
 * Analyze tsconfig.json for F1-Inspired TypeScript intelligence
 */
export declare function analyzeTsConfig(filePath: string): Promise<TypeScriptContext | null>;
export interface TypeScriptContext {
    target: string;
    module: string;
    moduleResolution: string;
    strict: boolean;
    strictnessLevel: "basic" | "strict" | "ultra_strict" | "f1_inspired";
    frameworkIntegration: string;
    performanceOptimizations: string[];
    includes: string[];
    excludes: string[];
    engineeringQuality: "standard" | "professional" | "f1_inspired";
}
/**
 * Detect n8n workflow files in directory
 */
export declare function findN8nWorkflows(projectDir?: string): Promise<string[]>;
/**
 * Find Make.com scenario files in a project directory
 *
 * Detects Make.com blueprint JSON files by checking for:
 * - name string (scenario name)
 * - flow array (modules/steps)
 * - metadata object (scenario metadata)
 *
 * @param projectDir - Directory to search (defaults to cwd)
 * @returns Array of Make.com scenario file names
 */
export declare function findMakeScenarios(projectDir?: string): Promise<string[]>;
/**
 * Find Google Opal mini-app files in a project directory
 *
 * Detects Opal mini-app JSON files by checking for:
 * - steps array (mini-app steps)
 * - model string (AI model used)
 *
 * @param projectDir - Directory to search (defaults to cwd)
 * @returns Array of Opal mini-app file names
 */
export declare function findOpalMiniApps(projectDir?: string): Promise<string[]>;
/**
 * Find OpenAI Assistant files in a project directory
 *
 * Detects OpenAI Assistant JSON files (OpenAPI 3.x schemas) by checking for:
 * - openapi string (OpenAPI version)
 * - paths object (API endpoints/actions)
 *
 * @param projectDir - Directory to search (defaults to cwd)
 * @returns Array of OpenAI Assistant file names
 */
export declare function findOpenAIAssistants(projectDir?: string): Promise<string[]>;
/**
 * Detect project type from files and structure
 *
 * CHAMPIONSHIP DETECTION STRATEGY:
 * 1. 😽 TURBO-CAT: Format discovery (finds config files)
 * 2. 🛂 TSA: Dependency intelligence (analyzes actual usage)
 * 3. Cross-reference both engines for definitive answer
 * 4. Fallback to file patterns if engines unavailable
 *
 * Goal: Championship-grade detection using existing engines
 */
export declare function detectProjectType(projectDir?: string): Promise<string>;
/**
 * Calculate days since file was modified
 */
export declare function daysSinceModified(date: Date): number;
/**
 * Detect Python project type using dependency files (Option A)
 */
export declare function detectPythonProjectType(projectDir: string): Promise<string>;
/**
 * Detect Python frameworks using code patterns (Option B)
 */
export declare function detectPythonPatterns(projectDir: string, pythonFiles: string[]): Promise<string>;
