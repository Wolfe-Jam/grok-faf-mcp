/**
 * 🎯 AI|HUMAN Balance Visualizer
 * Visual-only gamification that drives +144% human context completion
 * The 50/50 eternal truth: AI detects tech (50%), humans provide meaning (50%)
 */
export interface BalanceData {
    aiPercentage: number;
    humanPercentage: number;
    isBalanced: boolean;
}
export declare class BalanceVisualizer {
    private static readonly BAR_WIDTH;
    private static readonly CYAN;
    private static readonly ORANGE;
    private static readonly GREEN;
    /**
     * Calculate balance from FAF data
     * Matches fafdev.tools calculation - INDEPENDENT percentages
     * AI: How complete is technical context (0-100%)
     * HUMAN: How complete is human context (0-100%)
     * Perfect balance when both are high and similar
     */
    static calculateBalance(fafData: any): BalanceData;
    /**
     * Generate the visual balance bar
     * Matches fafdev.tools - single bar showing AI|HUMAN proportion
     */
    static generateBalanceBar(balance: BalanceData): string;
    /**
     * Generate a compact balance indicator for inline display
     */
    static generateCompactBalance(balance: BalanceData): string;
    /**
     * Get balance achievement message for gamification
     */
    static getAchievementMessage(balance: BalanceData): string | null;
}
