"use strict";
/**
 * 🎯 Auto-Path Detection from Dropped Files
 * Solves the "drop and done" workflow problem
 *
 * When files land in /mnt/user-data/uploads/, extract identifiers
 * and perform case-insensitive filesystem search to find real project path.
 */
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
exports.extractIdentifier = extractIdentifier;
exports.findProjectPath = findProjectPath;
exports.autoDetectPath = autoDetectPath;
const fs = __importStar(require("fs"));
const os = __importStar(require("os"));
const path = __importStar(require("path"));
const child_process_1 = require("child_process");
/**
 * Extract project identifier from dropped file
 */
function extractIdentifier(filePath) {
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        const basename = path.basename(filePath);
        // package.json - use package name
        if (basename === 'package.json') {
            try {
                const pkg = JSON.parse(content);
                if (pkg.name) {
                    return pkg.name; // "@blackhole/universe" or "hextra-api"
                }
            }
            catch {
                // Invalid JSON, continue to next strategy
            }
        }
        // README.md - extract from first heading
        if (basename === 'README.md') {
            const match = content.match(/^#\s+(.+)$/m);
            if (match) {
                // "💫 Black Hole Universe" → "black-hole-universe"
                return match[1]
                    .replace(/[^\w\s-]/g, '') // Remove emojis/special chars
                    .trim()
                    .toLowerCase()
                    .replace(/\s+/g, '-');
            }
        }
        // project.faf or .faf - extract name field
        if (basename === 'project.faf' || basename === '.faf') {
            const match = content.match(/^\s*name:\s*"?([^"\n]+)"?/m);
            if (match) {
                return match[1].trim();
            }
        }
        return null;
    }
    catch (error) {
        return null;
    }
}
/**
 * Find project path on user's filesystem (case-insensitive)
 */
function findProjectPath(identifier) {
    try {
        const username = os.userInfo().username;
        // Search roots in order of preference
        const searchRoots = [
            `/Users/${username}`, // macOS
            `/home/${username}`, // Linux
            `C:\\Users\\${username}` // Windows
        ].filter(p => fs.existsSync(p));
        if (searchRoots.length === 0) {
            return null;
        }
        // Normalize identifier for search
        // Remove scope: @blackhole/universe → universe
        let searchTerm = identifier.replace(/^@[\w-]+\//, '').toLowerCase();
        // Try exact match first, then partial match
        for (const exact of [true, false]) {
            for (const root of searchRoots) {
                const pattern = exact ? searchTerm : `*${searchTerm}*`;
                // Case-insensitive find with exclusions
                const cmd = process.platform === 'win32'
                    ? `dir /s /b /a:d "${root}\\${pattern}" 2>nul`
                    : `find "${root}" -maxdepth 5 -type d -iname "${pattern}" \
             ! -path "*/node_modules/*" \
             ! -path "*/.git/*" \
             ! -path "*/dist/*" \
             ! -path "*/build/*" \
             ! -path "*/.next/*" \
             ! -path "*/coverage/*" \
             ! -path "*/.cache/*" \
             ! -path "*/venv/*" \
             ! -path "*/.venv/*" \
             2>/dev/null`;
                try {
                    const result = (0, child_process_1.execSync)(cmd, {
                        encoding: 'utf8',
                        timeout: 10000,
                        maxBuffer: 1024 * 1024 // 1MB buffer
                    });
                    const matches = result.split('\n').filter(Boolean);
                    if (matches.length > 0) {
                        // Rank matches: exact basename > partial, shorter > longer
                        const ranked = matches.sort((a, b) => {
                            const aBase = path.basename(a).toLowerCase();
                            const bBase = path.basename(b).toLowerCase();
                            const aExact = aBase === searchTerm;
                            const bExact = bBase === searchTerm;
                            if (aExact && !bExact)
                                return -1;
                            if (!aExact && bExact)
                                return 1;
                            return a.length - b.length; // Prefer shorter paths
                        });
                        return ranked[0];
                    }
                }
                catch (error) {
                    // Timeout or command failed, try next root
                    continue;
                }
            }
        }
        return null;
    }
    catch (error) {
        return null;
    }
}
/**
 * Auto-detect real project path from container upload path
 * Main entry point for all FAF commands
 */
function autoDetectPath(inputPath) {
    // Check if this is a container upload path
    if (!inputPath.startsWith('/mnt/user-data/uploads/')) {
        return { found: false, path: inputPath };
    }
    // Extract identifier from dropped file
    const identifier = extractIdentifier(inputPath);
    if (!identifier) {
        return {
            found: false,
            error: 'Could not extract project identifier from dropped file. Please provide full path manually.'
        };
    }
    // Search filesystem for matching project
    const realPath = findProjectPath(identifier);
    if (!realPath) {
        return {
            found: false,
            identifier,
            error: `Project "${identifier}" not found on filesystem. Please provide full path manually.`
        };
    }
    // Success!
    return {
        found: true,
        path: realPath,
        identifier
    };
}
//# sourceMappingURL=auto-path-detection.js.map