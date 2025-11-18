/**
 * 🔍 faf validate - Validation Command (Mk3 Bundled)
 * Validates project.faf files with detailed feedback
 */
export interface ValidateOptions {
    verbose?: boolean;
    json?: boolean;
}
export interface ValidationError {
    message: string;
    path?: string;
    severity: 'error' | 'warning';
}
export interface ValidateResult {
    success: boolean;
    valid: boolean;
    errors: ValidationError[];
    warnings: ValidationError[];
    message: string;
}
export declare function validateFafFile(projectPath?: string, options?: ValidateOptions): Promise<ValidateResult>;
