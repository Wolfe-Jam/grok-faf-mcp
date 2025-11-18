"use strict";
/**
 * 🔄 faf migrate - Migrate legacy .faf to project.faf (Mk3 Bundled)
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
exports.migrateFafFile = migrateFafFile;
const fs_1 = require("fs");
const path = __importStar(require("path"));
const file_utils_1 = require("../utils/file-utils");
async function migrateFafFile(projectPath, options = {}) {
    try {
        const projectRoot = projectPath || process.cwd();
        const legacyPath = path.join(projectRoot, '.faf');
        const newPath = path.join(projectRoot, 'project.faf');
        // Check if legacy file exists
        if (!await (0, file_utils_1.fileExists)(legacyPath)) {
            return {
                success: true,
                migrated: false,
                message: 'No legacy .faf file found - nothing to migrate'
            };
        }
        // Check if new file already exists
        if (await (0, file_utils_1.fileExists)(newPath) && !options.force) {
            return {
                success: false,
                migrated: false,
                message: 'project.faf already exists. Use --force to overwrite.'
            };
        }
        // Read legacy file
        const content = await fs_1.promises.readFile(legacyPath, 'utf-8');
        // Write to new location
        await fs_1.promises.writeFile(newPath, content, 'utf-8');
        // Delete legacy file (optional - could keep as backup)
        // await fs.unlink(legacyPath);
        return {
            success: true,
            migrated: true,
            from: legacyPath,
            to: newPath,
            message: 'Successfully migrated .faf to project.faf'
        };
    }
    catch (error) {
        return {
            success: false,
            migrated: false,
            message: error instanceof Error ? error.message : 'Migration failed'
        };
    }
}
//# sourceMappingURL=migrate.js.map