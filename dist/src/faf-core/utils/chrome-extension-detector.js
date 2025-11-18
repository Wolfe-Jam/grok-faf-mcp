"use strict";
/**
 * 🎯 Chrome Extension Fuzzy Detection - Google-style intelligence
 * "Did you mean Chrome Extension?"
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChromeExtensionDetector = void 0;
/**
 * Google-style fuzzy matching for Chrome Extension detection
 * Handles typos, abbreviations, and variations
 */
class ChromeExtensionDetector {
    // High confidence patterns (exact matches)
    static HIGH_CONFIDENCE = [
        'chrome extension',
        'browser extension',
        'chrome addon',
        'chrome plugin',
        'web extension',
        'manifest v3',
        'manifest v2'
    ];
    // Medium confidence patterns (close matches, abbreviations)
    static MEDIUM_CONFIDENCE = [
        'chrome ext',
        'chr ext',
        'chrome-ext',
        'chr extension',
        'extension for chrome',
        'chrome browser extension',
        'google chrome extension',
        'chromium extension',
        'edge extension', // Edge uses same APIs
        'browser addon',
        'browser plug-in'
    ];
    // Low confidence patterns (needs confirmation)
    static LOW_CONFIDENCE = [
        'extension',
        'ext',
        'addon',
        'plugin',
        'chrome',
        'browser',
        'popup',
        'content script',
        'background script',
        'browser action',
        'page action'
    ];
    // Common typos and their corrections
    static TYPO_CORRECTIONS = {
        'chrom extension': 'chrome extension',
        'chrome extention': 'chrome extension',
        'chrome exension': 'chrome extension',
        'chrome extenstion': 'chrome extension',
        'crome extension': 'chrome extension',
        'chrome extnsion': 'chrome extension',
        'chorme extension': 'chrome extension',
        'chrome etension': 'chrome extension',
        'chormeextension': 'chrome extension',
        'chromeext': 'chrome extension',
        'c-ext': 'chrome extension',
        'c.ext': 'chrome extension',
        'ch ext': 'chrome extension',
        'chr-ext': 'chrome extension',
        'chrome-extension': 'chrome extension',
        'chrome_extension': 'chrome extension'
    };
    /**
     * Detect if text refers to a Chrome Extension with Google-style intelligence
     */
    static detect(text) {
        if (!text) {
            return { detected: false, confidence: 'none', needsConfirmation: false };
        }
        const normalized = text.toLowerCase().trim();
        // Step 1: Check for typos and auto-correct
        const corrected = this.correctTypos(normalized);
        if (corrected !== normalized) {
            // We auto-corrected a typo
            return {
                detected: true,
                confidence: 'medium',
                suggestion: `Chrome Extension (auto-corrected from "${text}")`,
                needsConfirmation: false
            };
        }
        // Step 2: Check high confidence patterns
        for (const pattern of this.HIGH_CONFIDENCE) {
            if (normalized.includes(pattern)) {
                return {
                    detected: true,
                    confidence: 'high',
                    needsConfirmation: false
                };
            }
        }
        // Step 3: Check medium confidence patterns
        for (const pattern of this.MEDIUM_CONFIDENCE) {
            if (normalized.includes(pattern) ||
                this.fuzzyMatch(normalized, pattern)) {
                return {
                    detected: true,
                    confidence: 'medium',
                    suggestion: 'Chrome Extension',
                    needsConfirmation: true // "Did you mean Chrome Extension?"
                };
            }
        }
        // Step 4: Check low confidence patterns
        for (const pattern of this.LOW_CONFIDENCE) {
            if (normalized.includes(pattern)) {
                // Only suggest if there's additional context
                if (this.hasExtensionContext(normalized)) {
                    return {
                        detected: false,
                        confidence: 'low',
                        suggestion: 'Chrome Extension',
                        needsConfirmation: true
                    };
                }
            }
        }
        // Step 5: Check for split/spaced variations
        if (this.hasSpacedPattern(normalized)) {
            return {
                detected: true,
                confidence: 'medium',
                suggestion: 'Chrome Extension',
                needsConfirmation: true
            };
        }
        return { detected: false, confidence: 'none', needsConfirmation: false };
    }
    /**
     * Correct common typos
     */
    static correctTypos(text) {
        // Direct typo lookup
        if (this.TYPO_CORRECTIONS[text]) {
            return this.TYPO_CORRECTIONS[text];
        }
        // Check if any typo pattern is in the text
        for (const [typo, correction] of Object.entries(this.TYPO_CORRECTIONS)) {
            if (text.includes(typo)) {
                return text.replace(typo, correction);
            }
        }
        return text;
    }
    /**
     * Fuzzy match with Levenshtein distance
     */
    static fuzzyMatch(text, pattern, threshold = 3) {
        // Check if text contains something close to pattern
        const words = text.split(/\s+/);
        for (const word of words) {
            if (this.levenshteinDistance(word, pattern) <= threshold) {
                return true;
            }
        }
        // Check the whole phrase
        return this.levenshteinDistance(text, pattern) <= threshold;
    }
    /**
     * Calculate Levenshtein distance between two strings
     */
    static levenshteinDistance(a, b) {
        const matrix = [];
        for (let i = 0; i <= b.length; i++) {
            matrix[i] = [i];
        }
        for (let j = 0; j <= a.length; j++) {
            matrix[0][j] = j;
        }
        for (let i = 1; i <= b.length; i++) {
            for (let j = 1; j <= a.length; j++) {
                if (b.charAt(i - 1) === a.charAt(j - 1)) {
                    matrix[i][j] = matrix[i - 1][j - 1];
                }
                else {
                    matrix[i][j] = Math.min(matrix[i - 1][j - 1] + 1, // substitution
                    matrix[i][j - 1] + 1, // insertion
                    matrix[i - 1][j] + 1 // deletion
                    );
                }
            }
        }
        return matrix[b.length][a.length];
    }
    /**
     * Check for extension-related context
     */
    static hasExtensionContext(text) {
        const contextWords = [
            'tab', 'popup', 'browser', 'chrome', 'manifest',
            'content', 'background', 'inject', 'page', 'action',
            'storage', 'permissions', 'google', 'store'
        ];
        return contextWords.some(word => text.includes(word));
    }
    /**
     * Check for spaced patterns like "c e" or "ch ext"
     */
    static hasSpacedPattern(text) {
        const spacedPatterns = [
            /c\s+e\s+x?\s*t/, // c e, c e x t
            /ch\s+ext/, // ch ext
            /chr\s+ext/, // chr ext
            /ext\s+for\s+chr/, // ext for chr
            /chrome\s+ex\b/ // chrome ex
        ];
        return spacedPatterns.some(pattern => pattern.test(text));
    }
    /**
     * Get user-friendly confirmation message
     */
    static getConfirmationMessage(result) {
        if (!result.needsConfirmation) {
            return null;
        }
        if (result.confidence === 'medium') {
            return `Did you mean: Chrome Extension? (detected "${result.suggestion}")`;
        }
        if (result.confidence === 'low') {
            return `Possible Chrome Extension detected. Did you mean to create a Chrome Extension?`;
        }
        return null;
    }
    /**
     * Check if project has Chrome Extension files (for validation)
     */
    static hasExtensionFiles(files) {
        const extensionFiles = [
            'manifest.json',
            'popup.html',
            'popup.js',
            'background.js',
            'content.js',
            'options.html',
            'service-worker.js'
        ];
        return files.some(file => extensionFiles.some(extFile => file.endsWith(extFile)));
    }
}
exports.ChromeExtensionDetector = ChromeExtensionDetector;
/**
 * Examples of detection:
 *
 * HIGH confidence (auto-accept):
 * - "chrome extension" → ✅
 * - "browser extension" → ✅
 *
 * MEDIUM confidence (needs confirmation):
 * - "chr ext" → "Did you mean Chrome Extension?"
 * - "c ext" → "Did you mean Chrome Extension?"
 * - "CE" → "Did you mean Chrome Extension?"
 *
 * TYPO correction (auto-fix):
 * - "chrom extention" → ✅ (corrected)
 * - "chrome extnsion" → ✅ (corrected)
 *
 * LOW confidence (suggest if context):
 * - "extension for managing tabs" → "Possible Chrome Extension?"
 * - "popup manager" → "Possible Chrome Extension?"
 */ 
//# sourceMappingURL=chrome-extension-detector.js.map