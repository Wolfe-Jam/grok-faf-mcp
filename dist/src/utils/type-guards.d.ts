/**
 * 🏎️ Type Guards - Championship Type Safety
 * Stage 2: strictNullChecks enabled
 */
export declare function isError(value: unknown): value is Error;
export declare function isString(value: unknown): value is string;
export declare function isNumber(value: unknown): value is number;
export declare function isDefined<T>(value: T | undefined | null): value is T;
export declare function hasProperty<K extends string>(obj: unknown, key: K): obj is Record<K, unknown>;
