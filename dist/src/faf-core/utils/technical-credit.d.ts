/**
 * 💎 Technical Credit System - Revolutionary credit generation instead of debt
 * Transform developer psychology from anxiety to confidence
 */
export interface TechnicalCredit {
    current: number;
    earned: CreditSource[];
    impact: string[];
    trending: 'up' | 'down' | 'stable';
    lastUpdated: Date;
}
export interface CreditSource {
    action: string;
    points: number;
    timestamp: Date;
    impact: string;
    category: CreditCategory;
}
export type CreditCategory = 'context_improvement' | 'ai_compatibility' | 'performance' | 'completeness' | 'sync_harmony' | 'stack_discovery' | 'trust_building';
/**
 * Load current technical credit status
 */
export declare function loadTechnicalCredit(fafPath?: string): Promise<TechnicalCredit>;
/**
 * Award technical credit for specific actions
 */
export declare function awardCredit(action: string, category: CreditCategory, impact: string, fafPath?: string): Promise<number>;
/**
 * Display technical credit dashboard
 */
export declare function displayCreditDashboard(fafPath?: string): Promise<void>;
/**
 * Auto-award credit for common actions
 */
export declare function autoAwardCredit(trigger: 'init_success' | 'score_improved' | 'sync_success' | 'validation_passed' | 'ai_happy', fafPath?: string): Promise<void>;
