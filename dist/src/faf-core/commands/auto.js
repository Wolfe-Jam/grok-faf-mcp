"use strict";
/**
 * faf auto - Programmatic API (MCP-ready)
 * Simplified version without interactive prompts
 * No console output, returns structured data
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.autoCommand = autoCommand;
const file_utils_js_1 = require("../utils/file-utils.js");
const init_js_1 = require("./init.js");
const score_js_1 = require("./score.js");
/**
 * Auto command - programmatic API
 * Initializes if needed, then scores the file
 * Returns structured data, no console output
 */
async function autoCommand(directory, options = {}) {
    const startTime = Date.now();
    try {
        const targetDir = directory || process.cwd();
        const homeDir = require('os').homedir();
        // CRITICAL: Prevent running in home or root directory
        if (!directory && (targetDir === homeDir || targetDir === '/')) {
            return {
                success: false,
                phase: 'init',
                error: 'Cannot run in home or root directory for safety',
                duration: Date.now() - startTime
            };
        }
        // Step 1: Check if .faf file exists
        const existingFaf = await (0, file_utils_js_1.findFafFile)(targetDir);
        let initResult;
        let fafPath;
        if (!existingFaf || options.force) {
            // Initialize new .faf file
            initResult = await (0, init_js_1.initFafFile)(targetDir, { force: options.force });
            if (!initResult.success || !initResult.outputPath) {
                return {
                    success: false,
                    phase: 'init',
                    initResult,
                    error: initResult.error || 'Init failed',
                    duration: Date.now() - startTime
                };
            }
            fafPath = initResult.outputPath;
        }
        else {
            fafPath = existingFaf;
        }
        // Step 2: Score the file
        const scoreResult = await (0, score_js_1.scoreFafFile)(fafPath, { json: true });
        const duration = Date.now() - startTime;
        return {
            success: true,
            phase: 'complete',
            initResult,
            scoreResult,
            duration
        };
    }
    catch (error) {
        const duration = Date.now() - startTime;
        const errorMessage = error instanceof Error ? error.message : 'Auto command failed';
        return {
            success: false,
            phase: 'init',
            error: errorMessage,
            duration
        };
    }
}
//# sourceMappingURL=auto.js.map