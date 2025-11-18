/**
 * FAB-FORMATS PROCESSOR v3.0.0 - The Championship Engine
 *
 * Direct port from faf-svelte-engine - the 86% scorer!
 * 150+ file handlers with deep intelligence extraction
 * Two-stage pattern: Discover first, read second
 *
 * THIS IS THE POWER UNIT! 🏎️
 */
export interface ProcessedFileResult {
    fileName: string;
    fileType: string;
    intelligenceBonus: number;
    detectedFramework?: string;
    detectedLanguage?: string;
    detectedBuildTool?: string;
    detectedHosting?: string;
    metadata: Record<string, any>;
    category?: string;
    isDuplicate?: boolean;
    contextTodos?: any[];
}
export interface ProjectContext {
    projectName?: string;
    projectGoal?: string;
    mainLanguage?: string;
    framework?: string;
    backend?: string;
    server?: string;
    apiType?: string;
    database?: string;
    connection?: string;
    hosting?: string;
    cicd?: string;
    buildTool?: string;
    packageManager?: string;
    testFramework?: string;
    linter?: string;
    targetUser?: string;
    coreProblem?: string;
    missionPurpose?: string;
    deploymentMarket?: string;
    timeline?: string;
    approach?: string;
}
export interface QualityGrade {
    grade: 'EXCEPTIONAL' | 'PROFESSIONAL' | 'GOOD' | 'BASIC' | 'MINIMAL';
    baseScore: number;
    criteria: string[];
}
export interface FabFormatsAnalysis {
    results: ProcessedFileResult[];
    totalBonus: number;
    context: ProjectContext;
    qualityMetrics: {
        highestGrade: string;
        averageScore: number;
        filesCovered: number;
        intelligenceDepth: number;
    };
}
export declare class FabFormatsProcessor {
    private context;
    private processedFileTypes;
    private contextTodos;
    /**
     * Process multiple files with championship-grade intelligence extraction
     */
    processFiles(projectDir: string): Promise<FabFormatsAnalysis>;
    /**
     * Stage 1: Discover all relevant files (no reading yet!)
     */
    private discoverFiles;
    /**
     * Check if file is relevant for intelligence extraction
     */
    private isRelevantFile;
    /**
     * Process a single file with intelligence extraction
     */
    private processFile;
    /**
     * Categorize files for intelligent deduplication
     */
    private categorizeFile;
    /**
     * CHAMPIONSHIP PROCESSOR: package.json with quality grading
     */
    private processPackageJson;
    /**
     * QUALITY GRADING SYSTEM - The secret sauce!
     */
    private gradePackageJsonQuality;
    /**
     * Process TypeScript configuration
     */
    private processTypeScriptConfig;
    /**
     * Process README for human context
     */
    private processReadme;
    /**
     * Process Python requirements
     */
    private processPythonRequirements;
    /**
     * Process pyproject.toml
     */
    private processPyProject;
    /**
     * Process Cargo.toml
     */
    private processCargoToml;
    /**
     * Process go.mod
     */
    private processGoMod;
    /**
     * Process Maven pom.xml
     */
    private processMavenPom;
    /**
     * Process Gradle build file
     */
    private processGradle;
    /**
     * Process Gemfile
     */
    private processGemfile;
    /**
     * Process composer.json
     */
    private processComposer;
    /**
     * Process .faf file
     */
    private processFafFile;
    /**
     * Process Dockerfile
     */
    private processDockerfile;
    /**
     * Process docker-compose
     */
    private processDockerCompose;
    /**
     * Process .env files
     */
    private processEnvFile;
    /**
     * Generic file processor (fallback)
     */
    private processGenericFile;
    /**
     * Update context with results
     */
    private updateContext;
    /**
     * Calculate intelligence depth
     */
    private calculateDepth;
}
/**
 * Export singleton instance for CLI usage
 */
export declare const fabFormatsProcessor: FabFormatsProcessor;
