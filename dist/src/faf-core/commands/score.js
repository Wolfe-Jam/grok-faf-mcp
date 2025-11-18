"use strict";
/**
 * faf score - Programmatic API (MCP-ready)
 * No console output, returns structured data
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.scoreFafFile = scoreFafFile;
const faf_compiler_js_1 = require("../compiler/faf-compiler.js");
const file_utils_js_1 = require("../utils/file-utils.js");
/**
 * Score a .faf file - programmatic API
 * Returns structured data, no console output
 */
async function scoreFafFile(file, options = {}) {
    // Find .faf file
    const fafPath = file || await (0, file_utils_js_1.findFafFile)(process.cwd());
    if (!fafPath) {
        throw new Error('No .faf file found');
    }
    // Create compiler
    const compiler = new faf_compiler_js_1.FafCompiler();
    // Compile with or without trace
    const result = options.trace
        ? await compiler.compileWithTrace(fafPath)
        : await compiler.compile(fafPath);
    // Verify checksum if provided
    if (options.checksum && result.checksum !== options.checksum) {
        throw new Error(`Checksum mismatch: expected ${options.checksum}, got ${result.checksum}`);
    }
    // Return structured data
    const scoreResult = {
        score: result.score,
        filled: result.filled,
        total: result.total,
        breakdown: result.breakdown,
    };
    // Add optional fields
    if (options.trace) {
        scoreResult.trace = result.trace;
    }
    if (options.breakdown && result.diagnostics.length > 0) {
        scoreResult.diagnostics = result.diagnostics;
    }
    if (options.checksum || options.verify) {
        scoreResult.checksum = result.checksum;
    }
    return scoreResult;
}
//# sourceMappingURL=score.js.map