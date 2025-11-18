"use strict";
/**
 * 🔍 Username & Home Directory Detection
 *
 * Cross-platform detection of current user and home directory
 * for Projects convention path resolution.
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
exports.detectUser = detectUser;
exports.getHomeDirNotation = getHomeDirNotation;
exports.expandTilde = expandTilde;
exports.contractToTilde = contractToTilde;
const os = __importStar(require("os"));
/**
 * Detect current user information
 */
function detectUser() {
    const userInfo = os.userInfo();
    const platform = os.platform();
    return {
        username: userInfo.username,
        homeDir: os.homedir(),
        platform: platform === 'darwin' ? 'darwin' :
            platform === 'linux' ? 'linux' :
                platform === 'win32' ? 'win32' : 'unknown'
    };
}
/**
 * Get platform-specific home directory notation
 */
function getHomeDirNotation() {
    const platform = os.platform();
    if (platform === 'win32') {
        return process.env.USERPROFILE || os.homedir();
    }
    return '~'; // Unix-like systems
}
/**
 * Expand ~ to full home directory path
 */
function expandTilde(inputPath) {
    if (inputPath.startsWith('~')) {
        return inputPath.replace('~', os.homedir());
    }
    return inputPath;
}
/**
 * Contract full home directory path to ~
 */
function contractToTilde(fullPath) {
    const homeDir = os.homedir();
    if (fullPath.startsWith(homeDir)) {
        return fullPath.replace(homeDir, '~');
    }
    return fullPath;
}
//# sourceMappingURL=username-detector.js.map