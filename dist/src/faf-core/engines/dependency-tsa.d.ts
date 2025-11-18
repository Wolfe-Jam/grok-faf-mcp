/**
 * 🛂 FAF TSA - Dependency Intelligence
 * Context enrichment through dependency analysis
 *
 * "We're INSPECTORS, not trash collectors"
 * We ignore the trash and focus on the important stuff
 * Understanding your project's story through its dependencies
 * NEVER delete - just provide intelligence about what matters
 */
export interface DependencyInspection {
    package: string;
    version: string;
    status: 'CORE' | 'ACTIVE' | 'DORMANT' | 'LEGACY';
    usage: {
        importCount: number;
        fileCount: number;
        locations: string[];
    };
    intelligence: {
        category?: string;
        purpose?: string;
        alternatives?: string[];
        bloatScore?: number;
        pattern?: string;
    };
    insight: string;
}
export interface TSAReport {
    totalPackages: number;
    core: number;
    active: number;
    dormant: number;
    legacy: number;
    patterns: Record<string, string[]>;
    contextScore: number;
    insights: string[];
    inspections: DependencyInspection[];
}
export declare class DependencyTSA {
    private projectRoot;
    private packageJson;
    private inspectionResults;
    constructor(projectRoot?: string);
    /**
     * 🔍 Full TSA Inspection
     */
    inspect(): Promise<TSAReport>;
    /**
     * 🔎 Inspect individual package
     */
    private inspectPackage;
    /**
     * 📊 Analyze actual usage in codebase
     */
    private analyzeUsage;
    /**
     * 🕵️ Gather intelligence about package
     */
    private gatherIntelligence;
    /**
     * 🔍 Detect duplicate functionality
     */
    private detectDuplicates;
    /**
     * 💡 Find known alternatives
     */
    private findAlternatives;
    /**
     * 🔍 Check if package is duplicate
     */
    private isDuplicate;
    /**
     * 📊 Get usage pattern description
     */
    private getUsagePattern;
    /**
     * 🏷️ Get package category
     */
    private getPackageCategory;
    /**
     * 📋 Generate final TSA report
     */
    private generateReport;
    /**
     * 📊 Display TSA Report
     */
    static displayReport(report: TSAReport): void;
}
