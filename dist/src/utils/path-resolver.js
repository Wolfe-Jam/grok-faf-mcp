"use strict";
/**
 * 🎯 Projects Convention Path Resolver
 *
 * Default: ~/Projects/[project-name]/project.faf
 *
 * Project name inference order:
 * 1. User explicit path (always wins)
 * 2. User project name statement
 * 3. AI inference from README, files, conversation context
 * 4. Fallback to 'unnamed-project'
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
exports.getHomeDirectory = getHomeDirectory;
exports.getProjectsDirectory = getProjectsDirectory;
exports.resolveProjectPath = resolveProjectPath;
exports.ensureProjectsDirectory = ensureProjectsDirectory;
exports.isRealFilesystemPath = isRealFilesystemPath;
exports.formatPathConfirmation = formatPathConfirmation;
const path = __importStar(require("path"));
const os = __importStar(require("os"));
const fs = __importStar(require("fs"));
/**
 * Slugify project name for filesystem
 */
function slugify(name) {
    return name
        .toLowerCase()
        .replace(/[^\w\s-]/g, '') // Remove emojis/special chars
        .trim()
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-'); // Collapse multiple dashes
}
/**
 * Infer project name from context
 */
function inferFromContext(context) {
    if (!context)
        return null;
    // Try README title
    if (context.readme) {
        const titleMatch = context.readme.match(/^#\s+(.+)/m);
        if (titleMatch) {
            return slugify(titleMatch[1]);
        }
    }
    // Try explicit project name
    if (context.projectName) {
        return slugify(context.projectName);
    }
    // Try uploaded files (package.json name, etc.)
    if (context.uploadedFiles && context.uploadedFiles.length > 0) {
        for (const file of context.uploadedFiles) {
            try {
                const basename = path.basename(file);
                // package.json
                if (basename === 'package.json' && fs.existsSync(file)) {
                    const content = fs.readFileSync(file, 'utf8');
                    const pkg = JSON.parse(content);
                    if (pkg.name) {
                        // Handle scoped packages: @org/name → name
                        return slugify(pkg.name.replace(/^@[\w-]+\//, ''));
                    }
                }
            }
            catch {
                continue;
            }
        }
    }
    return null;
}
/**
 * Get user's home directory cross-platform
 */
function getHomeDirectory() {
    return os.homedir();
}
/**
 * Get default Projects directory
 */
function getProjectsDirectory() {
    const home = getHomeDirectory();
    return path.join(home, 'Projects');
}
/**
 * Resolve project path using Projects convention
 *
 * @param userInput - User-provided path or project name
 * @param context - Context for AI inference (README, files, etc.)
 * @returns Path resolution with project directory and .faf file path
 */
function resolveProjectPath(userInput, context) {
    // USER EXPLICIT PATH ALWAYS WINS
    if (userInput && (userInput.includes('/') || userInput.includes('\\'))) {
        const normalized = path.resolve(userInput);
        const projectName = path.basename(normalized);
        const fafFilePath = path.join(normalized, 'project.faf');
        return {
            projectPath: normalized,
            fafFilePath,
            projectName,
            source: 'user-explicit'
        };
    }
    // USER PROVIDED NAME (not path)
    if (userInput) {
        const projectName = slugify(userInput);
        const projectPath = path.join(getProjectsDirectory(), projectName);
        const fafFilePath = path.join(projectPath, 'project.faf');
        return {
            projectPath,
            fafFilePath,
            projectName,
            source: 'user-name'
        };
    }
    // AI INFERENCE FROM CONTEXT
    const inferredName = inferFromContext(context);
    if (inferredName) {
        const projectPath = path.join(getProjectsDirectory(), inferredName);
        const fafFilePath = path.join(projectPath, 'project.faf');
        return {
            projectPath,
            fafFilePath,
            projectName: inferredName,
            source: 'ai-inference'
        };
    }
    // FALLBACK
    const projectName = 'unnamed-project';
    const projectPath = path.join(getProjectsDirectory(), projectName);
    const fafFilePath = path.join(projectPath, 'project.faf');
    return {
        projectPath,
        fafFilePath,
        projectName,
        source: 'fallback'
    };
}
/**
 * Ensure Projects directory exists
 */
function ensureProjectsDirectory() {
    const projectsDir = getProjectsDirectory();
    if (!fs.existsSync(projectsDir)) {
        fs.mkdirSync(projectsDir, { recursive: true });
    }
}
/**
 * Validate that path is on real filesystem (not container)
 */
function isRealFilesystemPath(inputPath) {
    // Container paths to reject
    const containerPaths = [
        '/mnt/user-data/',
        '/home/claude/',
        '/tmp/uploads/'
    ];
    return !containerPaths.some(cp => inputPath.startsWith(cp));
}
/**
 * Format confirmation message for user
 */
function formatPathConfirmation(resolution) {
    const sourceEmoji = {
        'user-explicit': '✓',
        'user-name': '✓',
        'ai-inference': '🤖',
        'fallback': '⚠️'
    };
    const emoji = sourceEmoji[resolution.source];
    if (resolution.source === 'ai-inference') {
        return `${emoji} Inferred project: "${resolution.projectName}"\nCreating at: ${resolution.projectPath}/`;
    }
    if (resolution.source === 'fallback') {
        return `${emoji} Using fallback name: "${resolution.projectName}"\nCreating at: ${resolution.projectPath}/\n(Tip: Provide project name or upload README for auto-detection)`;
    }
    return `${emoji} Creating at: ${resolution.projectPath}/`;
}
//# sourceMappingURL=path-resolver.js.map