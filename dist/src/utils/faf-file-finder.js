"use strict";
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
exports.findFafFile = findFafFile;
exports.getNewFafFilePath = getNewFafFilePath;
exports.hasFafFile = hasFafFile;
exports.getMigrationSuggestion = getMigrationSuggestion;
const fs = __importStar(require("fs/promises"));
const path = __importStar(require("path"));
/**
 * Find FAF file in directory (v3.0.0)
 *
 * Priority:
 * 1. project.faf (standard - no warning)
 * 2. .faf (legacy - shows migration suggestion)
 *
 * @param directory - Directory to search (defaults to cwd)
 * @returns FafFileResult if found, null if no FAF file exists
 *
 * @example
 * const result = await findFafFile('/path/to/project');
 * if (result) {
 *   console.log(`Found: ${result.filename}`);
 *   if (result.needsMigration) {
 *     console.log('💡 Run "faf migrate" to upgrade to project.faf');
 *   }
 * }
 */
async function findFafFile(directory) {
    const dir = directory || process.cwd();
    try {
        // Priority 1: project.faf (standard)
        const projectFafPath = path.join(dir, 'project.faf');
        try {
            await fs.access(projectFafPath);
            const stats = await fs.stat(projectFafPath);
            if (stats.isFile()) {
                return {
                    path: projectFafPath,
                    filename: 'project.faf',
                    isStandard: true,
                    needsMigration: false
                };
            }
        }
        catch {
            // Not found - check for legacy .faf
        }
        // Priority 2: .faf (legacy - still readable, but suggest migration)
        const legacyFafPath = path.join(dir, '.faf');
        try {
            await fs.access(legacyFafPath);
            const stats = await fs.stat(legacyFafPath);
            if (stats.isFile()) {
                return {
                    path: legacyFafPath,
                    filename: '.faf',
                    isStandard: false,
                    needsMigration: true
                };
            }
        }
        catch {
            // Not found
        }
        // No FAF file found
        return null;
    }
    catch {
        // Directory doesn't exist or permission error
        return null;
    }
}
/**
 * Get the path where a new FAF file should be created
 * v3.0.0: ALWAYS returns project.faf (never creates .faf)
 *
 * @param directory - Directory where FAF file will be created
 * @returns Full path to project.faf
 */
function getNewFafFilePath(directory) {
    const dir = directory || process.cwd();
    return path.join(dir, 'project.faf');
}
/**
 * Check if a FAF file exists (either format)
 *
 * @param directory - Directory to check
 * @returns True if any FAF file exists
 */
async function hasFafFile(directory) {
    const result = await findFafFile(directory);
    return result !== null;
}
/**
 * Get migration suggestion message if needed
 *
 * @param result - Result from findFafFile()
 * @returns Migration message if applicable, null otherwise
 */
function getMigrationSuggestion(result) {
    if (!result || !result.needsMigration) {
        return null;
    }
    return '\n💡 Using legacy .faf file. Run "faf migrate" to upgrade to project.faf (<1 second)\n';
}
//# sourceMappingURL=faf-file-finder.js.map