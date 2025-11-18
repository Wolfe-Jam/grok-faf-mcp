"use strict";
/**
 * 🏎️ Type Guards - Championship Type Safety
 * Stage 2: strictNullChecks enabled
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.isError = isError;
exports.isString = isString;
exports.isNumber = isNumber;
exports.isDefined = isDefined;
exports.hasProperty = hasProperty;
function isError(value) {
    return value instanceof Error;
}
function isString(value) {
    return typeof value === 'string';
}
function isNumber(value) {
    return typeof value === 'number';
}
function isDefined(value) {
    return value !== undefined && value !== null;
}
function hasProperty(obj, key) {
    return typeof obj === 'object' && obj !== null && key in obj;
}
//# sourceMappingURL=type-guards.js.map