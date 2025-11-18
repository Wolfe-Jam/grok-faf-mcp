/**
 * FAF DNA - The Lifecycle of AI Context
 *
 * Revolutionary Context Authentication & Versioning System
 * Every .faf has:
 * - Birth Certificate (Authentication)
 * - Birth DNA (Initial score from CLAUDE.md)
 * - Growth Record (Version history)
 * - Life Events (Log of all changes)
 * - Immortality (Disaster recovery through bi-sync)
 */
export interface BirthCertificate {
    born: Date;
    birthDNA: number;
    birthDNASource: 'CLAUDE.md' | 'legacy';
    projectDNA: string;
    authenticated: boolean;
    certificate: string;
    authDate?: Date;
}
export interface VersionEntry {
    version: string;
    timestamp: Date;
    score: number;
    changes: string[];
    approved?: boolean;
    growth?: number;
    growthRate?: number;
}
export interface Milestone {
    type: 'birth' | 'first_save' | 'doubled' | 'championship' | 'elite' | 'peak' | 'perfect' | 'current';
    score: number;
    date: Date;
    version: string;
    label?: string;
    emoji?: string;
}
export interface CurrentState {
    version: string;
    score: number;
    approved: boolean;
    lastApproved?: string;
    lastSync: Date;
}
export interface RecoveryInfo {
    claudeMD: string;
    lastBackup: Date;
    syncStatus: 'active' | 'pending' | 'failed';
    autoRecover: boolean;
}
export interface GrowthAnalytics {
    totalGrowth: number;
    daysActive: number;
    averageDailyGrowth: number;
    bestDay: {
        date: Date;
        growth: number;
    };
    bestWeek: {
        start: Date;
        growth: number;
    };
    milestones: Milestone[];
}
export interface FafDNA {
    birthCertificate: BirthCertificate;
    versions: VersionEntry[];
    current: CurrentState;
    recovery: RecoveryInfo;
    growth: GrowthAnalytics;
    lastModified: Date;
    format: 'faf-dna-v1';
}
export declare class FafDNAManager {
    private dnaPath;
    private projectPath;
    private dna;
    constructor(projectPath: string);
    /**
     * Initialize DNA (Birth)
     */
    birth(birthDNA: number, fromClaudeMD?: boolean): Promise<FafDNA>;
    /**
     * Authenticate the DNA (Birth Certificate)
     */
    authenticate(): Promise<string>;
    /**
     * Record growth (Auto Evolution)
     */
    recordGrowth(newScore: number, changes: string[]): Promise<VersionEntry>;
    /**
     * Approve current version (User satisfaction)
     */
    approve(): Promise<void>;
    /**
     * Get journey display (for UI)
     */
    getJourney(format?: 'compact' | 'detailed'): string | Milestone[];
    /**
     * Get Birth DNA display (always show origin)
     */
    getBirthDNADisplay(): {
        current: number;
        birthDNA: number;
        growth: number;
        birthDate: Date;
    };
    /**
     * Get version log (Complete history)
     */
    getLog(): string[];
    /**
     * Load existing DNA
     */
    load(): Promise<FafDNA | null>;
    /**
     * Save DNA to disk
     */
    private save;
    /**
     * Generate unique project DNA hash
     */
    private generateProjectDNA;
    /**
     * Generate certificate number
     */
    private generateCertificate;
    /**
     * Increment version number
     */
    private incrementVersion;
    /**
     * Update milestones based on score
     */
    private updateMilestones;
    /**
     * Update growth analytics
     */
    private updateAnalytics;
    /**
     * Calculate days since date
     */
    private getDaysSince;
    /**
     * Calculate growth rate
     */
    private calculateGrowthRate;
    /**
     * Format date for display
     */
    private formatDate;
}
/**
 * Display helper for Birth DNA in all score outputs
 */
export declare function displayScoreWithBirthDNA(current: number, birthDNA: number, birthDate: Date, options?: {
    showGrowth?: boolean;
    showJourney?: boolean;
}): void;
