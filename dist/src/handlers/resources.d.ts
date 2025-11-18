import { Resource } from '@modelcontextprotocol/sdk/types.js';
import { FafEngineAdapter } from './engine-adapter';
export declare class FafResourceHandler {
    private engineAdapter;
    constructor(engineAdapter: FafEngineAdapter);
    listResources(): Promise<{
        resources: Resource[];
    }>;
    readResource(uri: string): Promise<{
        contents: {
            uri: string;
            mimeType: string;
            text: any;
        }[];
    }>;
    private getFafContext;
    private getFafStatus;
}
