/**
 * 🏁 Championship Style Guide - Revolutionary AI-Context Infrastructure
 * Visual Identity System for FAF CLI v2.0.0
 *
 * Color Trinity: 🩵 AI Precision + 💚 Solution Bridge + 🧡 Human Energy
 */
export declare const FAF_COLORS: {
    cyan: string;
    white: string;
    orange: string;
    fafCyan: (text: string) => string;
    fafWhite: (text: string) => string;
    fafGreen: (text: string) => string;
    fafOrange: (text: string) => string;
    gradient: (text: string) => string;
};
/**
 * ⚡ FAF Icons & Emoji System
 *
 * ⛔ LOCKED STANDARDS - DO NOT MODIFY
 * These emojis are FINAL and IMMUTABLE as per EMOJI-STANDARDS.md
 * Any changes will be rejected in code review.
 *
 * 🚫 FORBIDDEN: Never use 🎯 (target) - explicitly rejected
 * ☑️ See EMOJI-STANDARDS.md for complete approved list
 */
export declare const FAF_ICONS: {
    lightning: string;
    rocket: string;
    precision: string;
    trophy: string;
    checkered_flag: string;
    robot: string;
    brain: string;
    crystal_ball: string;
    gem: string;
    magic_wand: string;
    heart_orange: string;
    green_heart: string;
    blue_heart: string;
    shield: string;
    star: string;
    chart_up: string;
    fire: string;
    zap: string;
    sparkles: string;
    party: string;
    balance: string;
    gear: string;
    magnify: string;
    file: string;
    folder: string;
    link: string;
    magnifying_glass: string;
    clipboard: string;
    broom: string;
    pencil: string;
    dna: string;
    turbo_cat: string;
};
export declare const STATUS_COLORS: {
    trust_excellent: string;
    trust_good: string;
    trust_medium: string;
    trust_low: string;
    fast: string;
    medium: string;
    slow: string;
    ai_happy: string;
    ai_neutral: string;
    ai_confused: string;
};
export declare const PERFORMANCE_STANDARDS: {
    status_command: number;
    trust_dashboard: number;
    stack_detection: number;
    context_generation: number;
    minimum_trust: number;
    target_trust: number;
    excellence_trust: number;
};
export declare const BRAND_MESSAGES: {
    primary: string;
    technical: string;
    performance: string;
    achievement: string;
    improvement: string;
    discovery: string;
    speed_result: string;
    magic_healing: string;
    breakthrough: string;
    podium_celebration: string;
    sharing: string;
    optimization: string;
    ecosystem: string;
};
/**
 * Generate simple help header (clean and focused)
 */
export declare function generateHelpHeader(): string;
/**
 * Generate static championship header (with optional scoreboard title)
 */
export declare function generateFAFHeader(scoreboardTitle?: string): string;
export declare const FAF_HEADER: string;
export declare function formatTrustLevel(trustScore: number): string;
export declare function formatPerformance(timeMs: number): string;
export declare function formatAIHappiness(score: number): string;
export declare function formatTechnicalCredit(credit: number): string;
