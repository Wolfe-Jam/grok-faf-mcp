/**
 * 🔍 faf audit - Comprehensive Quality Audit (Mk3 Bundled)
 * Audit project.faf quality and completeness
 */
export interface AuditOptions {
    json?: boolean;
    verbose?: boolean;
}
export interface AuditResult {
    success: boolean;
    score: number;
    grade: string;
    issues: Array<{
        severity: 'high' | 'medium' | 'low';
        message: string;
        fix?: string;
    }>;
    strengths: string[];
    message: string;
}
export declare function auditFafFile(projectPath?: string, options?: AuditOptions): Promise<AuditResult>;
