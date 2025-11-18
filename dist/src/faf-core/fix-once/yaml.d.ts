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
import * as yaml from 'yaml';
/**
 * Safe YAML parse - handles ALL edge cases
 * ROCK SOLID - FIX ONCE, DONE FOREVER
 */
export declare function parse(content: string | null | undefined, options?: {
    filepath?: string;
}): any;
/**
 * Safe YAML stringify - handles edge cases
 * ROCK SOLID - FIX ONCE, DONE FOREVER
 */
export declare function stringify(data: any, options?: any): string;
export declare const parseDocument: typeof yaml.parseDocument;
export declare const Document: typeof yaml.Document;
declare const _default: {
    parse: typeof parse;
    stringify: typeof stringify;
    Document: typeof yaml.Document;
    parseDocument: typeof yaml.parseDocument;
};
export default _default;
export declare const YAML: {
    parse: typeof parse;
    stringify: typeof stringify;
    Document: typeof yaml.Document;
    parseDocument: typeof yaml.parseDocument;
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
