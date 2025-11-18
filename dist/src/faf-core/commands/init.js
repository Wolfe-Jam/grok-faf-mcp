"use strict";
/**
 * faf init - Programmatic API (MCP-ready)
 * No console output, returns structured data
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
exports.initFafFile = initFafFile;
const fs_1 = require("fs");
const path = __importStar(require("path"));
const file_utils_js_1 = require("../utils/file-utils.js");
const faf_generator_championship_js_1 = require("../generators/faf-generator-championship.js");
const fafignore_parser_js_1 = require("../utils/fafignore-parser.js");
const faf_compiler_js_1 = require("../compiler/faf-compiler.js");
/**
 * Initialize .faf file - programmatic API
 * Returns structured data, no console output
 */
async function initFafFile(projectPath, options = {}) {
    const startTime = Date.now();
    try {
        const projectRoot = projectPath || process.cwd();
        const homeDir = require('os').homedir();
        // CRITICAL: Prevent running in home or root directory
        if (!projectPath && (projectRoot === homeDir || projectRoot === '/')) {
            return {
                success: false,
                error: 'Cannot run in home or root directory for safety',
                duration: Date.now() - startTime
            };
        }
        // v3.0.0: ONLY supports project.faf (no legacy .faf)
        const outputPath = options.output || `${projectRoot}/project.faf`;
        // Check if project.faf file already exists
        if ((await (0, file_utils_js_1.fileExists)(outputPath)) && !options.force && !options.new && !options.choose) {
            return {
                success: true,
                alreadyExists: true,
                outputPath,
                duration: Date.now() - startTime
            };
        }
        // Check for .fafignore
        const fafIgnorePath = path.join(projectRoot, '.fafignore');
        if (!(await (0, file_utils_js_1.fileExists)(fafIgnorePath))) {
            await (0, fafignore_parser_js_1.createDefaultFafIgnore)(projectRoot);
        }
        // Detect project structure
        const projectType = options.template === 'auto'
            ? await (0, file_utils_js_1.detectProjectType)(projectRoot)
            : options.template || (await (0, file_utils_js_1.detectProjectType)(projectRoot));
        // Generate .faf content
        const fafContent = await (0, faf_generator_championship_js_1.generateFafFromProject)({
            projectType,
            outputPath,
            projectRoot: projectRoot,
        });
        // Write .faf file
        await fs_1.promises.writeFile(outputPath, fafContent, 'utf-8');
        // Score the newly created file
        const compiler = new faf_compiler_js_1.FafCompiler();
        const scoreResult = await compiler.compile(outputPath);
        const duration = Date.now() - startTime;
        return {
            success: true,
            outputPath,
            projectType,
            score: scoreResult.score,
            duration
        };
    }
    catch (error) {
        const duration = Date.now() - startTime;
        const errorMessage = error instanceof Error ? error.message : 'Init failed';
        return {
            success: false,
            error: errorMessage,
            duration
        };
    }
}
//# sourceMappingURL=init.js.map