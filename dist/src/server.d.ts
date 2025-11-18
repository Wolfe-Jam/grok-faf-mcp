export interface ClaudeFafMcpServerConfig {
    transport: 'stdio' | 'http-sse';
    port?: number;
    fafEnginePath: string;
    debug?: boolean;
    cors?: boolean;
    host?: string;
}
export declare class ClaudeFafMcpServer {
    private server;
    private resourceHandler;
    private toolHandler;
    private config;
    private httpServer?;
    constructor(config: ClaudeFafMcpServerConfig);
    private setupHandlers;
    private createHttpApp;
    start(): Promise<void>;
    stop(): Promise<void>;
    getServerInfo(): {
        name: string;
        version: string;
        transport: "stdio" | "http-sse";
        port: number | undefined;
        host: string | undefined;
        championship: string;
    };
}
