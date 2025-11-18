"use strict";
/**
 * 🏎️ FAF Tool Visibility Configuration - v2.8.0
 * Controls which tools are visible (core vs all)
 * Championship-grade configuration management
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
exports.getVisibilityConfig = getVisibilityConfig;
exports.readConfigFile = readConfigFile;
exports.writeConfigFile = writeConfigFile;
exports.enableAdvancedTools = enableAdvancedTools;
exports.disableAdvancedTools = disableAdvancedTools;
exports.getVisibilityStatus = getVisibilityStatus;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const os = __importStar(require("os"));
/**
 * Get visibility configuration from multiple sources
 * Priority: ENV var > config file > default
 */
function getVisibilityConfig() {
    // 1. Check ENV: FAF_MCP_SHOW_ADVANCED=true
    if (process.env.FAF_MCP_SHOW_ADVANCED === 'true') {
        return { showAdvanced: true, source: 'env' };
    }
    // 2. Check config file: ~/.fafrc or .fafrc
    const configFile = readConfigFile();
    if (configFile?.showAdvanced === true) {
        return { showAdvanced: true, source: 'config' };
    }
    // 3. Default: core only (changed from "show all" to align with spec)
    // NOTE: For backward compatibility during transition, you may want to
    // temporarily set default to `true` and notify users to update config
    return { showAdvanced: false, source: 'default' };
}
/**
 * Read configuration from .fafrc file
 * Checks multiple locations:
 * 1. ~/.fafrc (home directory)
 * 2. ./.fafrc (current working directory)
 */
function readConfigFile() {
    const configPaths = [
        path.join(os.homedir(), '.fafrc'),
        path.join(process.cwd(), '.fafrc'),
    ];
    for (const configPath of configPaths) {
        try {
            if (fs.existsSync(configPath)) {
                const content = fs.readFileSync(configPath, 'utf-8');
                // Support both JSON and simple key=value format
                if (content.trim().startsWith('{')) {
                    // JSON format
                    return JSON.parse(content);
                }
                else {
                    // Simple key=value format
                    const config = {};
                    const lines = content.split('\n');
                    for (const line of lines) {
                        const trimmed = line.trim();
                        if (!trimmed || trimmed.startsWith('#'))
                            continue;
                        const [key, value] = trimmed.split('=').map((s) => s.trim());
                        if (key === 'showAdvanced' || key === 'FAF_SHOW_ADVANCED') {
                            config.showAdvanced = value === 'true';
                        }
                    }
                    return config;
                }
            }
        }
        catch (error) {
            // Silently ignore config file errors - graceful degradation
            // Config file is optional, errors are non-critical
        }
    }
    return null;
}
/**
 * Write configuration to ~/.fafrc file
 */
function writeConfigFile(config) {
    const configPath = path.join(os.homedir(), '.fafrc');
    try {
        const content = JSON.stringify(config, null, 2);
        fs.writeFileSync(configPath, content, 'utf-8');
        return true;
    }
    catch (error) {
        // Silent failure - config file write is optional
        return false;
    }
}
/**
 * Enable advanced tools
 */
function enableAdvancedTools() {
    const config = readConfigFile() || {};
    config.showAdvanced = true;
    return writeConfigFile(config);
}
/**
 * Disable advanced tools (show core only)
 */
function disableAdvancedTools() {
    const config = readConfigFile() || {};
    config.showAdvanced = false;
    return writeConfigFile(config);
}
/**
 * Get current tool visibility status (for logging)
 */
function getVisibilityStatus() {
    const config = getVisibilityConfig();
    const toolCount = config.showAdvanced ? '51 (ALL)' : '20 (CORE)';
    const sourceEmoji = {
        env: '🌍',
        flag: '🚩',
        config: '⚙️',
        default: '🏁',
    };
    return `${sourceEmoji[config.source]} ${toolCount} tools via ${config.source.toUpperCase()}`;
}
//# sourceMappingURL=visibility.js.map