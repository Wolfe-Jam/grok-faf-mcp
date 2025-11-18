/**
 * Project Type Detector - FAF Compiler Engine MK3
 * Championship-grade type detection with intelligent confidence scoring
 */
import { TypeDetectionResult } from '../types/project-types';
export declare class ProjectTypeDetector {
    private projectPath;
    private packageJson;
    constructor(projectPath: string);
    /**
     * Detect project type from file system analysis
     */
    detect(): Promise<TypeDetectionResult>;
    /**
     * Check for explicit file markers
     */
    private detectExplicitMarkers;
    /**
     * Detect framework signatures from dependencies
     */
    private detectFrameworkSignatures;
    /**
     * Analyze project structure
     */
    private analyzeStructure;
    /**
     * Analyze package.json for library/CLI patterns
     */
    private analyzePackageJson;
    /**
     * Create TypeDetectionResult from detected type
     */
    private createResult;
    /**
     * Helper: Check if file exists
     */
    private hasFile;
    /**
     * Helper: Check if directory exists
     */
    private hasDirectory;
    /**
     * Helper: Load package.json
     */
    private loadPackageJson;
    /**
     * Helper: Check if has frontend framework
     */
    private hasFrontendFramework;
    /**
     * Helper: Check if has backend framework
     */
    private hasBackendFramework;
    /**
     * Helper: Check if has database dependency
     */
    private hasDatabaseDependency;
    /**
     * Helper: Check if static-only site
     */
    private isStaticOnly;
}
