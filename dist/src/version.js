"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VERSION = void 0;
exports.getVersion = getVersion;
/**
 * Version information - Single source of truth
 * Imports from package.json to avoid hardcoding
 */
const fs_1 = require("fs");
const path_1 = require("path");
let cachedVersion = '';
/**
 * Get the current version from package.json
 * Caches the result for performance
 */
function getVersion() {
    if (cachedVersion) {
        return cachedVersion;
    }
    try {
        // Try multiple paths to find package.json (handles both compiled and test environments)
        const possiblePaths = [
            (0, path_1.join)(__dirname, '..', '..', 'package.json'), // dist/src -> root
            (0, path_1.join)(__dirname, '..', 'package.json'), // src -> root (ts-jest)
            (0, path_1.join)(process.cwd(), 'package.json'), // cwd fallback
        ];
        for (const packageJsonPath of possiblePaths) {
            try {
                const packageJson = JSON.parse((0, fs_1.readFileSync)(packageJsonPath, 'utf-8'));
                if (packageJson.name === 'grok-faf-mcp') {
                    cachedVersion = packageJson.version;
                    return cachedVersion;
                }
            }
            catch {
                // Try next path
            }
        }
        return '1.0.0'; // Fallback version
    }
    catch (error) {
        return '1.0.0';
    }
}
/**
 * Version constant for convenience
 */
exports.VERSION = getVersion();
//# sourceMappingURL=version.js.map