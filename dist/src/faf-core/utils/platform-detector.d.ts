/**
 * FAF VIBE Platform Detector ⚡️😽
 * Detects no-code/low-code platforms for simplified $9 tier
 */
export interface PlatformInfo {
    platform: string;
    tier: 'vibe' | 'pro';
    detected: boolean;
    confidence: number;
    indicators: string[];
}
export declare class PlatformDetector {
    private readonly VIBE_PLATFORMS;
    /**
     * Detect if running on a FAF VIBE eligible platform
     */
    detectPlatform(projectPath?: string): Promise<PlatformInfo>;
    /**
     * Get pricing tier based on platform
     */
    getPricingTier(platform: PlatformInfo): {
        price: number;
        name: string;
        emoji: string;
    };
    /**
     * Get platform-specific messaging
     */
    getPlatformMessage(platform: PlatformInfo): string;
}
