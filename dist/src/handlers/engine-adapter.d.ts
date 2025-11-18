export interface FafEngineResult {
    success: boolean;
    data?: any;
    error?: string;
    duration?: number;
}
export declare class FafEngineAdapter {
    private enginePath;
    private detectedCliPath;
    private cliVersion;
    private timeout;
    private workingDirectory;
    constructor(enginePath?: string, timeout?: number);
    private detectCli;
    private findBestWorkingDirectory;
    callEngine(command: string, args?: string[]): Promise<FafEngineResult>;
    private parseOutput;
    checkHealth(): Promise<boolean>;
    getWorkingDirectory(): string;
    setWorkingDirectory(dir: string): void;
    updateWorkingDirectoryFromPath(filePath: string): void;
    getEnginePath(): string;
    getCliInfo(): {
        detected: boolean;
        path?: string;
        version?: string;
    };
}
