/**
 * 🎯 Chrome Extension Fuzzy Detection - Google-style intelligence
 * "Did you mean Chrome Extension?"
 */
interface DetectionResult {
    detected: boolean;
    confidence: 'high' | 'medium' | 'low' | 'none';
    suggestion?: string;
    needsConfirmation: boolean;
}
/**
 * Google-style fuzzy matching for Chrome Extension detection
 * Handles typos, abbreviations, and variations
 */
export declare class ChromeExtensionDetector {
    private static readonly HIGH_CONFIDENCE;
    private static readonly MEDIUM_CONFIDENCE;
    private static readonly LOW_CONFIDENCE;
    private static readonly TYPO_CORRECTIONS;
    /**
     * Detect if text refers to a Chrome Extension with Google-style intelligence
     */
    static detect(text: string): DetectionResult;
    /**
     * Correct common typos
     */
    private static correctTypos;
    /**
     * Fuzzy match with Levenshtein distance
     */
    private static fuzzyMatch;
    /**
     * Calculate Levenshtein distance between two strings
     */
    private static levenshteinDistance;
    /**
     * Check for extension-related context
     */
    private static hasExtensionContext;
    /**
     * Check for spaced patterns like "c e" or "ch ext"
     */
    private static hasSpacedPattern;
    /**
     * Get user-friendly confirmation message
     */
    static getConfirmationMessage(result: DetectionResult): string | null;
    /**
     * Check if project has Chrome Extension files (for validation)
     */
    static hasExtensionFiles(files: string[]): boolean;
}
export {};
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
