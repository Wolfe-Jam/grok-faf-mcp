"use strict";
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
exports.detectFafCli = detectFafCli;
exports.validateCliVersion = validateCliVersion;
const child_process_1 = require("child_process");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const os = __importStar(require("os"));
/**
 * Get common CLI installation paths based on platform and package manager
 */
function getCommonCliPaths() {
    const homeDir = os.homedir();
    const platform = os.platform();
    const paths = [];
    // Homebrew paths (macOS/Linux)
    if (platform === 'darwin') {
        paths.push('/opt/homebrew/bin/faf'); // Apple Silicon
        paths.push('/usr/local/bin/faf'); // Intel
        paths.push('/usr/local/Cellar/node@20/20.19.4/bin/faf'); // Node 20
        paths.push('/usr/local/Cellar/node/*/bin/faf'); // Any Node version
    }
    else {
        paths.push('/usr/local/bin/faf');
    }
    // npm global paths
    paths.push(path.join(homeDir, '.npm-global/bin/faf'));
    paths.push(path.join(homeDir, '.nvm/versions/node/*/bin/faf'));
    // Standard Unix paths
    paths.push('/usr/bin/faf');
    // Windows paths
    if (platform === 'win32') {
        const appData = process.env.APPDATA || path.join(homeDir, 'AppData', 'Roaming');
        paths.push(path.join(appData, 'npm/faf.cmd'));
        paths.push(path.join(appData, 'npm/faf'));
        paths.push('C:\\Program Files\\nodejs\\faf.cmd');
    }
    return paths;
}
/**
 * Expand glob patterns in paths
 * Example: /usr/local/Cellar/node/wildcard/bin/faf
 */
function expandGlobPath(globPath) {
    if (!globPath.includes('*')) {
        return globPath;
    }
    try {
        const parts = globPath.split('/');
        const globIndex = parts.findIndex(p => p.includes('*'));
        if (globIndex === -1)
            return globPath;
        const basePath = parts.slice(0, globIndex).join('/');
        const pattern = parts[globIndex];
        const restPath = parts.slice(globIndex + 1).join('/');
        if (!fs.existsSync(basePath))
            return null;
        const entries = fs.readdirSync(basePath);
        const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
        const matches = entries.filter(e => regex.test(e));
        if (matches.length === 0)
            return null;
        // Return first match
        const expanded = path.join(basePath, matches[0], restPath);
        return fs.existsSync(expanded) ? expanded : null;
    }
    catch {
        return null;
    }
}
/**
 * Try to detect CLI using 'which' command (works if PATH is set)
 */
function detectViaWhich() {
    try {
        const result = (0, child_process_1.execSync)('which faf', { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] });
        const cliPath = result.trim();
        if (cliPath && fs.existsSync(cliPath)) {
            return cliPath;
        }
    }
    catch {
        // which failed, PATH not set or faf not in PATH
    }
    return null;
}
/**
 * Try to detect CLI using 'command -v' (POSIX alternative to which)
 */
function detectViaCommand() {
    try {
        const result = (0, child_process_1.execSync)('command -v faf', {
            encoding: 'utf8',
            stdio: ['pipe', 'pipe', 'ignore'],
            shell: '/bin/sh'
        });
        const cliPath = result.trim();
        if (cliPath && fs.existsSync(cliPath)) {
            return cliPath;
        }
    }
    catch {
        // command -v failed
    }
    return null;
}
/**
 * Get CLI version from path
 */
function getCliVersion(cliPath) {
    try {
        const result = (0, child_process_1.execSync)(`"${cliPath}" --version`, {
            encoding: 'utf8',
            stdio: ['pipe', 'pipe', 'ignore']
        });
        return result.trim();
    }
    catch {
        return undefined;
    }
}
/**
 * Detect faf CLI location with multiple fallback strategies
 */
function detectFafCli() {
    // 1. Check environment variable override
    if (process.env.FAF_CLI_PATH) {
        const envPath = process.env.FAF_CLI_PATH;
        if (fs.existsSync(envPath)) {
            return {
                found: true,
                path: envPath,
                version: getCliVersion(envPath),
                method: 'env:FAF_CLI_PATH'
            };
        }
    }
    // 2. Try 'which' command (works if PATH is set)
    const whichPath = detectViaWhich();
    if (whichPath) {
        return {
            found: true,
            path: whichPath,
            version: getCliVersion(whichPath),
            method: 'which'
        };
    }
    // 3. Try 'command -v' (POSIX)
    const commandPath = detectViaCommand();
    if (commandPath) {
        return {
            found: true,
            path: commandPath,
            version: getCliVersion(commandPath),
            method: 'command'
        };
    }
    // 4. Check common installation paths
    const commonPaths = getCommonCliPaths();
    for (const cliPath of commonPaths) {
        const expanded = expandGlobPath(cliPath);
        if (expanded && fs.existsSync(expanded)) {
            return {
                found: true,
                path: expanded,
                version: getCliVersion(expanded),
                method: 'common-path'
            };
        }
    }
    // 5. Not found
    return {
        found: false,
        method: 'none'
    };
}
/**
 * Validate CLI meets minimum version requirement
 */
function validateCliVersion(version, minVersion = '3.1.1') {
    try {
        const parse = (v) => v.split('.').map(Number);
        const current = parse(version);
        const required = parse(minVersion);
        for (let i = 0; i < 3; i++) {
            if (current[i] > required[i])
                return true;
            if (current[i] < required[i])
                return false;
        }
        return true; // Equal versions
    }
    catch {
        return false;
    }
}
//# sourceMappingURL=cli-detector.js.map