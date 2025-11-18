/**
 * 🏎️ RelentlessContextExtractor - F1-Inspired Context Hunting System
 * NEVER gives up on finding context. Fights for every bit of information.
 * Three-tier confidence system: CERTAIN | PROBABLE | INFERRED
 *
 * This is the AERO PACKAGE - Makes the Power Unit sing!
 */
export type ConfidenceLevel = 'CERTAIN' | 'PROBABLE' | 'INFERRED' | 'DEFAULT' | 'MISSING';
export type Priority = 'CRITICAL' | 'IMPORTANT' | 'Key' | 'Important' | 'CRUCIAL';
export interface ExtractedContext {
    value: string;
    confidence: ConfidenceLevel;
    source?: string;
    needsUserInput: boolean;
}
export interface ContextTodo {
    field: string;
    priority: Priority;
    currentValue: string;
    confidence: ConfidenceLevel;
    prompt: string;
    examples: string[];
    scoreboost: number;
}
export interface HumanContext {
    who: ExtractedContext;
    what: ExtractedContext;
    why: ExtractedContext;
    where: ExtractedContext;
    when: ExtractedContext;
    how: ExtractedContext;
    todos: ContextTodo[];
}
export declare class RelentlessContextExtractor {
    private techStack;
    private fileContent;
    private packageJson;
    private readmeContent;
    private projectPath;
    /**
     * 🏁 Main extraction entry point - RELENTLESS pursuit of context!
     */
    extractFromProject(projectPath: string): Promise<HumanContext>;
    /**
     * Load all project files for context extraction
     */
    private loadProjectFiles;
    /**
     * 🎯 RELENTLESS WHO EXTRACTION - Fight for user context!
     */
    private extractWHO;
    /**
     * 🎯 RELENTLESS WHAT EXTRACTION - Core problem/purpose
     */
    private extractWHAT;
    /**
     * 🎯 RELENTLESS WHY EXTRACTION - Mission/purpose
     */
    private extractWHY;
    /**
     * 🎯 RELENTLESS WHERE EXTRACTION - Deployment/market
     */
    private extractWHERE;
    /**
     * 🎯 RELENTLESS WHEN EXTRACTION - Timeline/schedule
     */
    private extractWHEN;
    /**
     * 🎯 RELENTLESS HOW EXTRACTION - Approach/methodology
     */
    private extractHOW;
    /**
     * Generate TODOs for missing or low-confidence context
     */
    private generateContextTodos;
    /**
     * Helper: Infer audience from tech stack
     */
    private inferAudienceFromTech;
    /**
     * Helper: Infer purpose from project name
     */
    private inferPurposeFromName;
    /**
     * Helper: Infer approach from tech stack
     */
    private inferApproachFromTech;
    /**
     * Helper: Clean extracted text
     */
    private cleanExtractedText;
    /**
     * Helper: Create context object
     */
    private createContext;
}
/**
 * Export singleton instance
 */
export declare const relentlessExtractor: RelentlessContextExtractor;
