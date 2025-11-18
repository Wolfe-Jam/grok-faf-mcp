/**
 * ⚡ FAF Enhance - MCP-native interactive enhancement
 * Combines auto-detection with intelligent MCP questionnaire
 */
export interface EnhanceOptions {
    autoFill?: boolean;
    targetScore?: number;
    interactive?: boolean;
    json?: boolean;
}
export interface EnhanceResult {
    success: boolean;
    initialScore: number;
    finalScore: number;
    improvements: string[];
    questionsNeeded?: Question[];
    message: string;
}
export interface Question {
    id: string;
    question: string;
    header: string;
    description: string;
    defaultValue?: string;
    required: boolean;
}
export interface EnhanceAnswers {
    who?: string;
    what?: string;
    why?: string;
    where?: string;
    when?: string;
    how?: string;
    frontend?: string;
    backend?: string;
    database?: string;
    hosting?: string;
}
/**
 * Main enhance command - auto-detect mode
 */
export declare function enhanceCommand(projectPath: string, options?: EnhanceOptions): Promise<EnhanceResult>;
/**
 * Apply interactive answers and finalize enhancement
 */
export declare function enhanceWithAnswers(projectPath: string, answers: EnhanceAnswers): Promise<EnhanceResult>;
