/**
 * Version information - Single source of truth
 * Imports from package.json to avoid hardcoding
 */
import { readFileSync } from 'fs';
import { join } from 'path';

let cachedVersion: string = '';

/**
 * Get the current version from package.json
 * Caches the result for performance
 */
export function getVersion(): string {
  if (cachedVersion) {
    return cachedVersion;
  }

  try {
    // Try multiple paths to find package.json (handles both compiled and test environments)
    const possiblePaths = [
      join(__dirname, '..', '..', 'package.json'),  // dist/src -> root
      join(__dirname, '..', 'package.json'),        // src -> root (ts-jest)
      join(process.cwd(), 'package.json'),          // cwd fallback
    ];

    for (const packageJsonPath of possiblePaths) {
      try {
        const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
        if (packageJson.name === 'grok-faf-mcp') {
          cachedVersion = packageJson.version;
          return cachedVersion;
        }
      } catch {
        // Try next path
      }
    }

    return '1.0.0'; // Fallback version
  } catch (error) {
    return '1.0.0';
  }
}

/**
 * Version constant for convenience
 */
export const VERSION = getVersion();
