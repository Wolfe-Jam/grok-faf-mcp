/**
 * 🎨 FIX-ONCE Color System - NATIVE ANSI EDITION
 * Single source of truth for all colors in FAF CLI
 *
 * CHALK HAS BEEN CHALKED OFF! ✅
 * Using native ANSI escape codes - ZERO dependencies
 * Fix once = Works FOREVER
 */
/**
 * Universal color system - CHALK FREE! 🎉
 * Never import chalk again - this is all we need
 */
export declare const colors: {
    primary: (text: string) => string;
    secondary: (text: string) => string;
    success: (text: string) => string;
    error: (text: string) => string;
    warning: (text: string) => string;
    info: (text: string) => string;
    muted: (text: string) => string;
    bright: (text: string) => string;
    dim: (text: string) => string;
    highlight: (text: string) => string;
    bold: (text: string) => string;
    italic: (text: string) => string;
    underline: (text: string) => string;
    fafCyan: (text: string) => string;
    fafOrange: (text: string) => string;
    fafGreen: (text: string) => string;
    fafWhite: (text: string) => string;
    championship: (text: string) => string;
    trust: (text: string) => string;
    score: (text: string) => string;
    cyan: (text: string) => string;
    green: (text: string) => string;
    yellow: (text: string) => string;
    red: (text: string) => string;
    blue: (text: string) => string;
    gray: (text: string) => string;
    orange: (text: string) => string;
    black: (text: string) => string;
    white: (text: string) => string;
    magenta: (text: string) => string;
    bgRed: (text: string) => string;
    bgGreen: (text: string) => string;
    bgYellow: (text: string) => string;
    bgBlue: (text: string) => string;
    bgMagenta: (text: string) => string;
    bgCyan: (text: string) => string;
    bgWhite: (text: string) => string;
    strip: (text: string) => string;
};
/**
 * Color bars for visualizations
 * Used by AI|HUMAN balance and other displays
 */
export declare const bars: {
    filled: string;
    empty: string;
    cyan: (length: number) => string;
    orange: (length: number) => string;
    green: (length: number) => string;
    balanced: (length: number, isBalanced: boolean) => string;
};
/**
 * Get color based on score/percentage
 * Centralizes all score-based coloring logic
 */
export declare function getScoreColor(score: number): (text: string) => string;
/**
 * Format score with appropriate color
 * Single place for all score formatting
 */
export declare function formatScore(score: number, prefix?: string): string;
/**
 * Trust level formatting
 * Centralizes trust dashboard colors
 */
export declare function getTrustColor(trustLevel: number): (text: string) => string;
/**
 * Trust emoji based on level
 * Single source for trust indicators
 */
export declare function getTrustEmoji(trustLevel: number): string;
export default colors;
export declare const chalk: any;
export declare const cyan: (text: string) => string, green: (text: string) => string, yellow: (text: string) => string, red: (text: string) => string, blue: (text: string) => string, gray: (text: string) => string, orange: (text: string) => string, bold: (text: string) => string, dim: (text: string) => string, bgBlue: (text: string) => string, black: (text: string) => string, white: (text: string) => string, magenta: (text: string) => string;
/**
 * CASCADE EFFECTS OF CHALKING OFF CHALK:
 *
 * 1. NO MORE PINK SURPRISES! Colors work correctly
 * 2. ZERO dependency on chalk - one less thing to break
 * 3. Faster startup - no chalk loading
 * 4. Smaller package size - no chalk bloat
 * 5. Works in ALL environments - just ANSI codes
 * 6. NO_COLOR still supported for accessibility
 * 7. Future proof - ANSI codes are eternal
 *
 * MAINTENANCE: This file should NEVER import from other modules
 * It should be the LOWEST level dependency
 *
 * CHALK STATUS: ❌ CHALKED OFF!
 * DC STATUS: 1/3 dependencies eliminated! 🏁
 */ 
