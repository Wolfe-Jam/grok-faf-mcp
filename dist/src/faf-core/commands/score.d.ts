/**
 * faf score - Programmatic API (MCP-ready)
 * No console output, returns structured data
 */
import { CompilationResult } from '../compiler/faf-compiler.js';
export interface ScoreOptions {
    json?: boolean;
    trace?: boolean;
    verify?: boolean;
    breakdown?: boolean;
    checksum?: string;
}
export interface ScoreResult {
    score: number;
    filled: number;
    total: number;
    breakdown: {
        project: {
            filled: number;
            total: number;
            percentage: number;
        };
        stack: {
            filled: number;
            total: number;
            percentage: number;
        };
        human: {
            filled: number;
            total: number;
            percentage: number;
        };
        discovery: {
            filled: number;
            total: number;
            percentage: number;
        };
    };
    trace?: CompilationResult['trace'];
    diagnostics?: CompilationResult['diagnostics'];
    checksum?: string;
}
/**
 * Score a .faf file - programmatic API
 * Returns structured data, no console output
 */
export declare function scoreFafFile(file?: string, options?: ScoreOptions): Promise<ScoreResult>;
