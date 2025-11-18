"use strict";
/**
 * 🔥 YAML FIX-ONCE ABSTRACTION
 *
 * ROCK SOLID YAML PARSING - FIX ONCE, DONE FOREVER
 *
 * This module handles ALL YAML edge cases:
 * ✅ Empty files
 * ✅ Null/undefined content
 * ✅ Invalid YAML syntax
 * ✅ Type validation
 * ✅ Corrupted files
 * ✅ Clear error messages
 * ✅ Primitive vs Object validation
 *
 * NEVER touch raw YAML parsing outside this file.
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
exports.YAML = exports.Document = exports.parseDocument = void 0;
exports.parse = parse;
exports.stringify = stringify;
const yaml = __importStar(require("yaml"));
const colors_1 = require("./colors");
/**
 * Safe YAML parse - handles ALL edge cases
 * ROCK SOLID - FIX ONCE, DONE FOREVER
 */
function parse(content, options) {
    const filepath = options?.filepath || 'unknown file';
    // Edge case 1: Null/undefined (CHECK FIRST before any operations)
    if (content === null || content === undefined) {
        throw new Error(`${colors_1.chalk.red('Empty content passed to YAML parser')}\n` +
            `File: ${filepath}\n` +
            `Fix: Ensure file exists and has content before parsing`);
    }
    // Edge case 2: Not a string (CHECK BEFORE calling string methods)
    if (typeof content !== 'string') {
        throw new Error(`${colors_1.chalk.red('Invalid content type passed to YAML parser')}\n` +
            `Expected: string\n` +
            `Got: ${typeof content}\n` +
            `File: ${filepath}`);
    }
    // Edge case 3: Empty string or whitespace only
    if (content.trim() === '') {
        throw new Error(`${colors_1.chalk.red('Empty .faf file detected')}\n` +
            `File: ${filepath}\n` +
            `Fix: Run ${colors_1.chalk.cyan('faf init')} to recreate the file`);
    }
    // Edge case 4: Parse YAML and handle syntax errors
    let result;
    try {
        result = yaml.parse(content);
    }
    catch (error) {
        // Wrap yaml parsing errors with helpful context
        throw new Error(`${colors_1.chalk.red('Invalid YAML syntax')}\n` +
            `File: ${filepath}\n` +
            `Error: ${error.message}\n` +
            `Fix: Check file syntax or run ${colors_1.chalk.cyan('faf init --force')} to recreate`);
    }
    // Edge case 5: Parsed successfully but result is null/undefined
    // (valid YAML like "null" or "~" or empty documents)
    if (result === null || result === undefined) {
        throw new Error(`${colors_1.chalk.red('YAML file parsed but contains no data')}\n` +
            `File: ${filepath}\n` +
            `Fix: Ensure file has valid YAML content or run ${colors_1.chalk.cyan('faf init')}`);
    }
    // Edge case 6: Parsed to primitive (not an object)
    // .faf files must be YAML objects, not scalars
    if (typeof result !== 'object' || Array.isArray(result)) {
        throw new Error(`${colors_1.chalk.red('Invalid .faf structure - must be a YAML object')}\n` +
            `File: ${filepath}\n` +
            `Got: ${Array.isArray(result) ? 'array' : typeof result}\n` +
            `Fix: .faf files must contain key-value pairs, not ${Array.isArray(result) ? 'lists' : 'simple values'}`);
    }
    return result;
}
/**
 * Safe YAML stringify - handles edge cases
 * ROCK SOLID - FIX ONCE, DONE FOREVER
 */
function stringify(data, options) {
    // Edge case 1: Null/undefined data
    if (data === null || data === undefined) {
        throw new Error(`${colors_1.chalk.red('Cannot stringify null/undefined data to YAML')}\n` +
            `Fix: Provide valid data object`);
    }
    // Edge case 2: Not an object (primitives should not be stringified for .faf)
    if (typeof data !== 'object' || Array.isArray(data)) {
        throw new Error(`${colors_1.chalk.red('Invalid data for .faf stringify')}\n` +
            `Expected: object\n` +
            `Got: ${Array.isArray(data) ? 'array' : typeof data}\n` +
            `Fix: .faf files must be objects with key-value pairs`);
    }
    // Edge case 3: Stringify and catch any errors
    try {
        const result = yaml.stringify(data, options);
        // Edge case 4: Empty result
        if (!result || result.trim() === '') {
            throw new Error('Stringify produced empty output');
        }
        return result;
    }
    catch (error) {
        throw new Error(`${colors_1.chalk.red('Failed to convert data to YAML')}\n` +
            `Error: ${error.message}`);
    }
}
// Export raw versions for advanced usage (use with caution)
exports.parseDocument = yaml.parseDocument;
exports.Document = yaml.Document;
// Re-export as default for compatibility
exports.default = {
    parse,
    stringify,
    Document: exports.Document,
    parseDocument: exports.parseDocument
};
// Also export as YAML for compatibility
exports.YAML = {
    parse,
    stringify,
    Document: exports.Document,
    parseDocument: exports.parseDocument
};
/**
 * 🔥 ROCK SOLID STATUS: ACHIEVED
 *
 * All edge cases handled:
 * ✅ Null/undefined → Clear error
 * ✅ Empty files → Clear error
 * ✅ Wrong types → Clear error
 * ✅ Invalid YAML → Wrapped error with context
 * ✅ Primitives → Clear error (.faf must be objects)
 * ✅ Arrays → Clear error (.faf must be objects)
 *
 * FIX ONCE, DONE FOREVER
 */
//# sourceMappingURL=yaml.js.map