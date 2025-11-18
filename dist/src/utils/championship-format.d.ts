/**
 * FAF Championship Output Formatter
 * The RAILS for proper FAF output! 🏎️⚡
 */
export interface AchievementStatus {
    speed: number;
    score: number;
    files: number;
    isDotFaffed: boolean;
}
export declare class ChampionshipFormatter {
    /**
     * Format FAF output with Championship wrapper
     * SHOW FIRST - ENHANCE AFTER!
     */
    static formatOutput(rawOutput: string, status?: AchievementStatus): string;
    /**
     * Check if user is DOT FAFFED
     */
    static isDotFaffed(score: number): boolean;
    /**
     * Get achievement level based on score
     */
    static getAchievementLevel(score: number): string;
    /**
     * Get speed achievement
     */
    static getSpeedAchievement(ms: number): string;
}
export default ChampionshipFormatter;
