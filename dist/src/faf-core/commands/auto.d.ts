/**
 * faf auto - Programmatic API (MCP-ready)
 * Simplified version without interactive prompts
 * No console output, returns structured data
 */
import { InitResult } from './init.js';
import { ScoreResult } from './score.js';
export interface AutoOptions {
    force?: boolean;
    skipAI?: boolean;
}
export interface AutoResult {
    success: boolean;
    phase: 'init' | 'score' | 'complete';
    initResult?: InitResult;
    scoreResult?: ScoreResult;
    duration?: number;
    error?: string;
}
/**
 * Auto command - programmatic API
 * Initializes if needed, then scores the file
 * Returns structured data, no console output
 */
export declare function autoCommand(directory?: string, options?: AutoOptions): Promise<AutoResult>;
