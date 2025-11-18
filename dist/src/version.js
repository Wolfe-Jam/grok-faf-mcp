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
        // __dirname in compiled code is dist/src, so we need to go up two levels to reach package.json
        const packageJsonPath = (0, path_1.join)(__dirname, '..', '..', 'package.json');
        const packageJson = JSON.parse((0, fs_1.readFileSync)(packageJsonPath, 'utf-8'));
        cachedVersion = packageJson.version;
        return cachedVersion;
    }
    catch (error) {
        // Fallback if package.json read fails (should never happen in production)
        console.error('Failed to read version from package.json:', error);
        return 'unknown';
    }
}
/**
 * Version constant for convenience
 */
exports.VERSION = getVersion();
//# sourceMappingURL=version.js.map