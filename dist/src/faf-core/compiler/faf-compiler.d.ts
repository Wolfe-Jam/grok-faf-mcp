/**
 * 🏎️ FAF Scoring Compiler
 * Deterministic, multi-pass compiler for .faf scoring
 *
 * Philosophy: Like Svelte, we compile away the complexity
 * Result: Pure, traceable, reproducible scores
 */
export interface CompilationResult {
    score: number;
    filled: number;
    total: number;
    breakdown: SectionBreakdown;
    trace: CompilationTrace;
    diagnostics: Diagnostic[];
    ir: IntermediateRepresentation;
    checksum: string;
}
interface SectionBreakdown {
    project: SlotSection;
    stack: SlotSection;
    human: SlotSection;
    discovery: SlotSection;
}
interface SlotSection {
    filled: number;
    total: number;
    percentage: number;
    slots: SlotInfo[];
}
interface SlotInfo {
    id: string;
    value: any;
    filled: boolean;
    source: 'original' | 'discovered' | 'default';
    points: number;
}
interface CompilationTrace {
    version: string;
    timestamp: string;
    inputHash: string;
    passes: PassResult[];
}
interface PassResult {
    name: string;
    duration: number;
    input: any;
    output: any;
    changes: string[];
}
interface Diagnostic {
    severity: 'error' | 'warning' | 'info';
    message: string;
    location?: {
        line: number;
        column: number;
        field: string;
    };
    suggestion?: string;
}
interface IntermediateRepresentation {
    version: string;
    slots: IRSlot[];
    metadata: Record<string, any>;
}
interface IRSlot {
    id: string;
    path: string;
    value: any;
    type: string;
    source: 'original' | 'discovered';
    weight: number;
    filled: boolean;
}
export declare class FafCompiler {
    private static readonly VERSION;
    private diagnostics;
    private trace;
    private ir;
    constructor();
    /**
     * Main compilation pipeline
     */
    compile(fafPath: string): Promise<CompilationResult>;
    private readSource;
    private parse;
    private analyze;
    private validateTypes;
    private optimize;
    private discover;
    private removeDefaults;
    private generate;
    private buildIR;
    private addSlot;
    private isSlotFilled;
    private hasValue;
    private detectProjectTypeFromContext;
    private requiresFrontendStack;
    private requiresBackendStack;
    private calculateSlots;
    private calculateScore;
    private calculateChecksum;
    private recordPass;
    private sanitize;
    private addDiagnostic;
    /**
     * Compile with trace output
     */
    compileWithTrace(fafPath: string): Promise<CompilationResult>;
    /**
     * Verify a checksum
     */
    verify(fafPath: string, checksum: string): Promise<boolean>;
    /**
     * Get intermediate representation
     */
    getIR(fafPath: string): Promise<IntermediateRepresentation>;
    /**
     * Print diagnostic report
     */
    printDiagnostics(): void;
    /**
     * Print compilation trace
     */
    private printTrace;
}
/**
 * Compile a .faf file
 */
export declare function compile(fafPath: string): Promise<CompilationResult>;
/**
 * Compile with trace output
 */
export declare function compileWithTrace(fafPath: string): Promise<CompilationResult>;
/**
 * Verify a checksum
 */
export declare function verify(fafPath: string, checksum: string): Promise<boolean>;
export {};
