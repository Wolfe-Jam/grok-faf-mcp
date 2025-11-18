/**
 * Compiler Engine Scorer - FAF Compiler Engine MK3
 * Championship-grade scoring with context-aware metrics
 */
export interface ScoringResult {
    score: number;
    medal: 'trophy' | 'gold' | 'silver' | 'bronze' | 'red' | 'white';
    emoji: string;
    message: string;
    breakdown: {
        totalSlots: 21;
        relevantSlots: number;
        filledSlots: number;
        ignoredSlots: number;
    };
    nextMilestone: {
        targetScore: number;
        medal: string;
        emoji: string;
        slotsNeeded: number;
        message: string;
    } | null;
}
export declare class CompilerEngineScorer {
    /**
     * Calculate score with slotignore support
     */
    calculateScore(filledSlots: number, relevantSlots: number, slotignore: string[]): ScoringResult;
    /**
     * Determine medal from score
     */
    private getMedal;
    /**
     * Get medal emoji
     */
    private getMedalEmoji;
    /**
     * Generate contextual message
     */
    private getMessage;
    /**
     * Calculate next milestone
     */
    private getNextMilestone;
    /**
     * Format scoring result as human-readable text
     */
    formatResult(result: ScoringResult, projectType?: string): string;
    /**
     * Generate actionable suggestions based on score
     */
    generateSuggestions(score: number, _medal: string, _missingSlots: string[]): string[];
}
