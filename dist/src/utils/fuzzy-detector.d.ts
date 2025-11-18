/**
 * 🎯 MCP Fuzzy Detector - Friday Features Edition!
 * Google-style "close enough is good enough" matching
 * Ported from CLI v2.3.5 for MCP users
 */
interface FuzzyMatch {
    detected: boolean;
    type: string;
    confidence: 'high' | 'medium' | 'low';
    corrected?: string;
}
export declare class FuzzyDetector {
    /**
     * Common typos that MCP users make
     */
    private static readonly TYPO_CORRECTIONS;
    /**
     * Detect Chrome Extension with fuzzy matching
     */
    static detectChromeExtension(text: string): FuzzyMatch;
    /**
     * Detect project type with fuzzy matching
     */
    static detectProjectType(text: string): string;
    /**
     * Correct common typos
     */
    private static correctTypos;
    /**
     * Get auto-fill slots for Chrome Extensions (90%+ scores!)
     */
    static getChromeExtensionSlots(): {
        runtime: string;
        hosting: string;
        api_type: string;
        backend: string;
        database: string;
        build: string;
        package_manager: string;
    };
    /**
     * Smart suggestions for typos
     */
    static getSuggestion(input: string): string | null;
}
export declare function applyIntelFriday(projectData: any): any;
export {};
/**
 * Friday Features for MCP! 🎉
 *
 * Usage:
 * 1. Import in your MCP handler
 * 2. Use FuzzyDetector.detectProjectType() on user input
 * 3. Apply applyIntelFriday() before scoring
 * 4. Watch scores jump to 90%+!
 */ 
