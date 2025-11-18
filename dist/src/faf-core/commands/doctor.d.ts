/**
 * 🏥 FAF Doctor - Diagnose and fix common issues (Mk3 Bundled)
 * Health check for your project.faf setup
 */
interface DiagnosticResult {
    status: 'ok' | 'warning' | 'error';
    message: string;
    fix?: string;
}
export interface DoctorResult {
    success: boolean;
    health: 'perfect' | 'good' | 'issues';
    diagnostics: DiagnosticResult[];
    message: string;
}
export declare function doctorCommand(projectPath?: string): Promise<DoctorResult>;
export {};
