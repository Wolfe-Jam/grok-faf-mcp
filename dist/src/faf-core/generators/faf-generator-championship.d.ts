/**
 * 🏎️ Championship .faf Generator
 * Uses FAB-FORMATS Power Unit for 86%+ context extraction
 */
export interface GenerateOptions {
    projectType?: string;
    outputPath: string;
    projectRoot: string;
    projectName?: string;
    projectGoal?: string;
    mainLanguage?: string;
    framework?: string;
    hosting?: string;
    [key: string]: any;
}
export declare function generateFafFromProject(options: GenerateOptions): Promise<string>;
