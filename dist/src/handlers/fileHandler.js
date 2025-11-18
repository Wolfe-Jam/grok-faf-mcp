"use strict";
// claude-faf-mcp/src/handlers/fileHandler.ts
// 🏎️ FAF File Operations - Production Ready Implementation
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.fileHandlers = exports.fafWriteTool = exports.fafReadTool = exports.PathValidator = void 0;
exports.handleFafRead = handleFafRead;
exports.handleFafWrite = handleFafWrite;
const fs = __importStar(require("fs/promises"));
const path = __importStar(require("path"));
/**
 * Security validator for file paths
 */
class PathValidator {
    static FORBIDDEN_PATHS = ['/etc', '/sys', '/proc', '/private/etc'];
    static MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
    static validate(filePath) {
        // Normalize and resolve path
        const normalized = path.normalize(filePath);
        const resolved = path.resolve(filePath);
        // Check for path traversal
        if (normalized.includes('..')) {
            return { valid: false, error: 'Path traversal detected' };
        }
        // Check forbidden paths
        for (const forbidden of this.FORBIDDEN_PATHS) {
            if (resolved.startsWith(forbidden)) {
                return { valid: false, error: `Access to ${forbidden} is forbidden` };
            }
        }
        return { valid: true };
    }
    static async checkFileSize(filePath) {
        try {
            const stats = await fs.stat(filePath);
            if (stats.size > this.MAX_FILE_SIZE) {
                return {
                    valid: false,
                    error: `File too large: ${(stats.size / 1024 / 1024).toFixed(2)}MB (max: 50MB)`
                };
            }
            return { valid: true };
        }
        catch (_error) {
            // File doesn't exist yet (for write operations)
            return { valid: true };
        }
    }
}
exports.PathValidator = PathValidator;
/**
 * FAF Read Tool Definition
 */
exports.fafReadTool = {
    name: 'faf_read',
    description: 'Read content from any file on the local filesystem',
    inputSchema: {
        type: 'object',
        properties: {
            path: {
                type: 'string',
                description: 'Absolute or relative file path to read'
            }
        },
        required: ['path']
    }
};
/**
 * FAF Write Tool Definition
 */
exports.fafWriteTool = {
    name: 'faf_write',
    description: 'Write content to any file on the local filesystem',
    inputSchema: {
        type: 'object',
        properties: {
            path: {
                type: 'string',
                description: 'Absolute or relative file path to write'
            },
            content: {
                type: 'string',
                description: 'Content to write to the file'
            }
        },
        required: ['path', 'content']
    }
};
/**
 * Handle faf_read tool execution
 */
async function handleFafRead(args) {
    const startTime = Date.now();
    try {
        const { path: filePath } = args;
        // Validate path
        const pathValidation = PathValidator.validate(filePath);
        if (!pathValidation.valid) {
            return {
                content: [{
                        type: 'text',
                        text: `❌ Security error: ${pathValidation.error}`
                    }],
                isError: true
            };
        }
        // Check file size
        const sizeValidation = await PathValidator.checkFileSize(filePath);
        if (!sizeValidation.valid) {
            return {
                content: [{
                        type: 'text',
                        text: `❌ ${sizeValidation.error}`
                    }],
                isError: true
            };
        }
        // Read file with timeout
        const content = await Promise.race([
            fs.readFile(filePath, 'utf8'),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Read timeout (30s)')), 30000))
        ]);
        const duration = Date.now() - startTime;
        const stats = await fs.stat(filePath);
        return {
            content: [{
                    type: 'text',
                    text: content
                }],
            metadata: {
                duration_ms: duration,
                file_size: stats.size,
                file_path: path.resolve(filePath),
                message: `✅ Read ${stats.size} bytes in ${duration}ms`
            }
        };
    }
    catch (error) {
        return {
            content: [{
                    type: 'text',
                    text: `❌ Failed to read file: ${error.message}`
                }],
            isError: true
        };
    }
}
/**
 * Handle faf_write tool execution
 */
async function handleFafWrite(args) {
    const startTime = Date.now();
    try {
        const { path: filePath, content } = args;
        // Validate path
        const pathValidation = PathValidator.validate(filePath);
        if (!pathValidation.valid) {
            return {
                content: [{
                        type: 'text',
                        text: `❌ Security error: ${pathValidation.error}`
                    }],
                isError: true
            };
        }
        // Check content size
        const contentSize = Buffer.byteLength(content, 'utf8');
        if (contentSize > 50 * 1024 * 1024) {
            return {
                content: [{
                        type: 'text',
                        text: `❌ Content too large: ${(contentSize / 1024 / 1024).toFixed(2)}MB (max: 50MB)`
                    }],
                isError: true
            };
        }
        // Create directory if needed
        const dir = path.dirname(filePath);
        await fs.mkdir(dir, { recursive: true });
        // Write file with timeout
        await Promise.race([
            fs.writeFile(filePath, content, 'utf8'),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Write timeout (30s)')), 30000))
        ]);
        const duration = Date.now() - startTime;
        return {
            content: [{
                    type: 'text',
                    text: `✅ Successfully wrote ${contentSize} bytes to ${path.resolve(filePath)}`
                }],
            metadata: {
                duration_ms: duration,
                bytes_written: contentSize,
                file_path: path.resolve(filePath),
                message: `✅ Write completed in ${duration}ms`
            }
        };
    }
    catch (error) {
        return {
            content: [{
                    type: 'text',
                    text: `❌ Failed to write file: ${error.message}`
                }],
            isError: true
        };
    }
}
// Export handlers
exports.fileHandlers = {
    faf_read: handleFafRead,
    faf_write: handleFafWrite
};
//# sourceMappingURL=fileHandler.js.map