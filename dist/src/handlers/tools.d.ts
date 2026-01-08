import { CallToolResult, Tool } from '@modelcontextprotocol/sdk/types.js';
import { FafEngineAdapter } from './engine-adapter';
export declare class FafToolHandler {
    private engineAdapter;
    constructor(engineAdapter: FafEngineAdapter);
    listTools(): Promise<{
        tools: Tool[];
    }>;
    callTool(name: string, args: any): Promise<CallToolResult>;
    private handleFafStatus;
    private handleFafScore;
    private handleFafInit;
    private handleFafTrust;
    private handleFafSync;
    private handleFafEnhance;
    private handleFafBiSync;
    private handleFafClear;
    private handleFafAbout;
    private handleFafWhat;
    private handleFafDebug;
    private handleFafChat;
    private handleFafFriday;
    private handleFafGuide;
    private handleFafList;
    private handleRagQuery;
    private handleRagCacheStats;
    private handleRagCacheClear;
}
