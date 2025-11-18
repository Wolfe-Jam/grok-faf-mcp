"use strict";
/**
 * 🏆 faf formats - TURBO-CAT Format Discovery Command (Mk3 Bundled)
 * Lists all discovered formats in the project
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
exports.formatsCommand = formatsCommand;
const path = __importStar(require("path"));
const file_utils_1 = require("../utils/file-utils");
async function formatsCommand(projectPath, options = {}) {
    try {
        const projectRoot = projectPath || process.cwd();
        const startTime = Date.now();
        // Simple format detection - check for common files
        const commonFormats = [
            'package.json',
            'tsconfig.json',
            'README.md',
            '.gitignore',
            'vite.config.ts',
            'svelte.config.js',
            'tailwind.config.js',
            'Dockerfile',
            '.env',
            'project.faf',
            '.faf'
        ];
        const foundFormats = [];
        for (const format of commonFormats) {
            const filePath = path.join(projectRoot, format);
            if (await (0, file_utils_1.fileExists)(filePath)) {
                foundFormats.push({
                    fileName: format,
                    category: categorizeFormat(format),
                    confidence: 'confirmed'
                });
            }
        }
        const elapsedTime = Date.now() - startTime;
        return {
            success: true,
            totalFormats: foundFormats.length,
            stackSignature: 'Detected',
            intelligenceScore: foundFormats.length * 5,
            formats: foundFormats,
            message: `Found ${foundFormats.length} formats in ${elapsedTime}ms`
        };
    }
    catch (error) {
        return {
            success: false,
            totalFormats: 0,
            stackSignature: 'Unknown',
            intelligenceScore: 0,
            formats: [],
            message: error instanceof Error ? error.message : 'Format discovery failed'
        };
    }
}
function categorizeFormat(fileName) {
    if (fileName.includes('json') || fileName.includes('yaml') || fileName.includes('toml')) {
        return 'Config';
    }
    else if (fileName.includes('.ts') || fileName.includes('.js') || fileName.includes('.py')) {
        return 'Code';
    }
    else if (fileName.includes('.md') || fileName.includes('README')) {
        return 'Documentation';
    }
    else if (fileName.includes('test') || fileName.includes('spec')) {
        return 'Testing';
    }
    else if (fileName.includes('workflow') || fileName.includes('jenkins')) {
        return 'CI/CD';
    }
    else if (fileName.includes('docker') || fileName.includes('compose')) {
        return 'Container';
    }
    else if (fileName.includes('.sql') || fileName.includes('migration')) {
        return 'Database';
    }
    return 'Other';
}
//# sourceMappingURL=formats.js.map