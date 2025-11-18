/**
 * Project Types V1 - FAF Compiler Engine MK3
 * Championship-grade type definitions for intelligent project scoring
 */
export type ProjectType = 'browser-extension' | 'vibe-site' | 'spa' | 'full-stack' | 'api-backend' | 'library' | 'cli-tool' | 'mcp-server' | 'desktop-app' | 'mobile-app' | 'microservices' | 'serverless' | 'docs-site' | 'monorepo';
export interface TypeDetectionResult {
    type: ProjectType;
    confidence: number;
    slotignore: string[];
    relevantSlots: number;
    reasoning: string;
}
export interface ProjectSignature {
    files?: string[];
    dependencies?: string[];
    devDependencies?: string[];
    directories?: string[];
    packageJsonFields?: string[];
}
export declare const PROJECT_TYPE_SIGNATURES: Record<ProjectType, ProjectSignature>;
export declare const SLOT_IGNORE_BY_TYPE: Record<ProjectType, string[]>;
export declare const RELEVANT_SLOTS_BY_TYPE: Record<ProjectType, number>;
