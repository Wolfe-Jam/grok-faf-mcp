"use strict";
/**
 * 🎨 FIX-ONCE Color System - NATIVE ANSI EDITION
 * Single source of truth for all colors in FAF CLI
 *
 * CHALK HAS BEEN CHALKED OFF! ✅
 * Using native ANSI escape codes - ZERO dependencies
 * Fix once = Works FOREVER
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.magenta = exports.white = exports.black = exports.bgBlue = exports.dim = exports.bold = exports.orange = exports.gray = exports.blue = exports.red = exports.yellow = exports.green = exports.cyan = exports.chalk = exports.bars = exports.colors = void 0;
exports.getScoreColor = getScoreColor;
exports.formatScore = formatScore;
exports.getTrustColor = getTrustColor;
exports.getTrustEmoji = getTrustEmoji;
/**
 * ANSI Escape Codes Reference
 * No more pink surprises, no more chalk bugs!
 */
const ANSI = {
    // Reset
    reset: '\x1b[0m',
    // Styles
    bold: '\x1b[1m',
    dim: '\x1b[2m',
    italic: '\x1b[3m',
    underline: '\x1b[4m',
    // Colors
    black: '\x1b[30m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    white: '\x1b[37m',
    gray: '\x1b[90m',
    // Bright colors
    brightRed: '\x1b[91m',
    brightGreen: '\x1b[92m',
    brightYellow: '\x1b[93m',
    brightBlue: '\x1b[94m',
    brightMagenta: '\x1b[95m',
    brightCyan: '\x1b[96m',
    brightWhite: '\x1b[97m',
    // 256 color mode for orange (closest to #FF6B35)
    orange: '\x1b[38;5;208m', // Orange in 256 color mode
    // Background colors
    bgRed: '\x1b[41m',
    bgGreen: '\x1b[42m',
    bgYellow: '\x1b[43m',
    bgBlue: '\x1b[44m',
    bgMagenta: '\x1b[45m',
    bgCyan: '\x1b[46m',
    bgWhite: '\x1b[47m',
};
/**
 * Helper to wrap text in ANSI codes
 */
function ansi(text, ...codes) {
    // NO_COLOR environment variable support
    if (process.env.NO_COLOR) {
        return text;
    }
    return `${codes.join('')}${text}${ANSI.reset}`;
}
/**
 * Universal color system - CHALK FREE! 🎉
 * Never import chalk again - this is all we need
 */
exports.colors = {
    // Primary brand colors
    primary: (text) => ansi(text, ANSI.cyan),
    secondary: (text) => ansi(text, ANSI.yellow),
    success: (text) => ansi(text, ANSI.green),
    error: (text) => ansi(text, ANSI.red),
    warning: (text) => ansi(text, ANSI.yellow),
    // Semantic colors
    info: (text) => ansi(text, ANSI.blue),
    muted: (text) => ansi(text, ANSI.gray),
    bright: (text) => ansi(text, ANSI.white),
    dim: (text) => ansi(text, ANSI.dim),
    highlight: (text) => ansi(text, ANSI.yellow, ANSI.bold),
    // Style modifiers
    bold: (text) => ansi(text, ANSI.bold),
    italic: (text) => ansi(text, ANSI.italic),
    underline: (text) => ansi(text, ANSI.underline),
    // FAF specific colors (Championship theme)
    fafCyan: (text) => ansi(text, ANSI.cyan),
    fafOrange: (text) => ansi(text, ANSI.orange), // True FAF Orange (256 color)
    fafGreen: (text) => ansi(text, ANSI.green),
    fafWhite: (text) => ansi(text, ANSI.white),
    // Special effects
    championship: (text) => ansi(text, ANSI.bold, ANSI.cyan),
    trust: (text) => ansi(text, ANSI.bold, ANSI.green),
    score: (text) => {
        const match = text.match(/(\d+)%/);
        if (match) {
            const score = parseInt(match[1]);
            if (score >= 85)
                return ansi(text, ANSI.green);
            if (score >= 70)
                return ansi(text, ANSI.yellow);
            return ansi(text, ANSI.red);
        }
        return text;
    },
    // Additional colors for chalk compatibility
    cyan: (text) => ansi(text, ANSI.cyan),
    green: (text) => ansi(text, ANSI.green),
    yellow: (text) => ansi(text, ANSI.yellow),
    red: (text) => ansi(text, ANSI.red),
    blue: (text) => ansi(text, ANSI.blue),
    gray: (text) => ansi(text, ANSI.gray),
    orange: (text) => ansi(text, ANSI.orange),
    black: (text) => ansi(text, ANSI.black),
    white: (text) => ansi(text, ANSI.white),
    magenta: (text) => ansi(text, ANSI.magenta),
    bgRed: (text) => ansi(text, ANSI.bgRed),
    bgGreen: (text) => ansi(text, ANSI.bgGreen),
    bgYellow: (text) => ansi(text, ANSI.bgYellow),
    bgBlue: (text) => ansi(text, ANSI.bgBlue),
    bgMagenta: (text) => ansi(text, ANSI.bgMagenta),
    bgCyan: (text) => ansi(text, ANSI.bgCyan),
    bgWhite: (text) => ansi(text, ANSI.bgWhite),
    // NO_COLOR support (accessibility)
    strip: (text) => {
        return text.replace(/\x1b\[[0-9;]*m/g, '');
    }
};
/**
 * Color bars for visualizations
 * Used by AI|HUMAN balance and other displays
 */
exports.bars = {
    filled: '█',
    empty: '░',
    cyan: (length) => exports.colors.fafCyan(exports.bars.filled.repeat(length)),
    orange: (length) => exports.colors.fafOrange(exports.bars.filled.repeat(length)),
    green: (length) => exports.colors.success(exports.bars.filled.repeat(length)),
    // Balanced bar (green when perfect)
    balanced: (length, isBalanced) => {
        const bar = exports.bars.filled.repeat(length);
        return isBalanced ? exports.colors.success(bar) : exports.colors.primary(bar);
    }
};
/**
 * Get color based on score/percentage
 * Centralizes all score-based coloring logic
 */
function getScoreColor(score) {
    if (score >= 85)
        return exports.colors.success;
    if (score >= 70)
        return exports.colors.warning;
    if (score >= 50)
        return exports.colors.secondary;
    return exports.colors.error;
}
/**
 * Format score with appropriate color
 * Single place for all score formatting
 */
function formatScore(score, prefix = 'Score') {
    const color = getScoreColor(score);
    return color(`${prefix}: ${score}%`);
}
/**
 * Trust level formatting
 * Centralizes trust dashboard colors
 */
function getTrustColor(trustLevel) {
    if (trustLevel >= 85)
        return exports.colors.trust;
    if (trustLevel >= 70)
        return exports.colors.warning;
    if (trustLevel >= 50)
        return exports.colors.secondary;
    return exports.colors.error;
}
/**
 * Trust emoji based on level
 * Single source for trust indicators
 */
function getTrustEmoji(trustLevel) {
    if (trustLevel >= 85)
        return '🧡';
    if (trustLevel >= 70)
        return '🟡';
    if (trustLevel >= 50)
        return '🟠';
    return '🔴';
}
// Export default for convenience
exports.default = exports.colors;
// Create chainable chalk replacement
const createChainableColor = () => {
    const chainable = {};
    // Add all color methods
    Object.keys(exports.colors).forEach(key => {
        if (typeof exports.colors[key] === 'function') {
            chainable[key] = exports.colors[key];
            // Make each color chainable
            Object.keys(exports.colors).forEach(innerKey => {
                if (typeof exports.colors[innerKey] === 'function') {
                    chainable[key][innerKey] = (text) => {
                        return exports.colors[key](exports.colors[innerKey](text));
                    };
                }
            });
        }
    });
    return chainable;
};
// Export chalk alias for compatibility with chaining support
exports.chalk = createChainableColor();
// Individual exports for compatibility (destructure from colors)
exports.cyan = exports.colors.cyan, exports.green = exports.colors.green, exports.yellow = exports.colors.yellow, exports.red = exports.colors.red, exports.blue = exports.colors.blue, exports.gray = exports.colors.gray, exports.orange = exports.colors.orange, exports.bold = exports.colors.bold, exports.dim = exports.colors.dim, exports.bgBlue = exports.colors.bgBlue, exports.black = exports.colors.black, exports.white = exports.colors.white, exports.magenta = exports.colors.magenta;
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
//# sourceMappingURL=colors.js.map