/**
 * 🏆 faf formats - TURBO-CAT Format Discovery Command (Mk3 Bundled)
 * Lists all discovered formats in the project
 */
export interface FormatsOptions {
    export?: boolean;
    json?: boolean;
    category?: boolean;
}
export interface FormatsResult {
    success: boolean;
    totalFormats: number;
    stackSignature: string;
    intelligenceScore: number;
    formats: Array<{
        fileName: string;
        category: string;
        confidence: string;
    }>;
    message: string;
}
export declare function formatsCommand(projectPath?: string, options?: FormatsOptions): Promise<FormatsResult>;
