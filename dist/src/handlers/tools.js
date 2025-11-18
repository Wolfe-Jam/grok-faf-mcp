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
exports.FafToolHandler = void 0;
const fileHandler_1 = require("./fileHandler");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const fuzzy_detector_1 = require("../utils/fuzzy-detector");
const faf_file_finder_js_1 = require("../utils/faf-file-finder.js");
const version_1 = require("../version");
const path_resolver_1 = require("../utils/path-resolver");
class FafToolHandler {
    engineAdapter;
    constructor(engineAdapter) {
        this.engineAdapter = engineAdapter;
    }
    async listTools() {
        return {
            tools: [
                {
                    name: 'faf_about',
                    description: 'Learn what .faf format is - THE JPEG for AI 🧡⚡️',
                    inputSchema: {
                        type: 'object',
                        properties: {},
                    }
                },
                {
                    name: 'faf_what',
                    description: 'What is .faf format? Quick explanation of THE JPEG for AI 🧡⚡️',
                    inputSchema: {
                        type: 'object',
                        properties: {},
                    }
                },
                {
                    name: 'faf_status',
                    description: 'Check if your project has project.faf (THE JPEG for AI) - Shows AI-readability status 🧡⚡️',
                    inputSchema: {
                        type: 'object',
                        properties: {},
                    }
                },
                {
                    name: 'faf_score',
                    description: 'Calculate your project\'s AI-readability from project.faf (THE JPEG for AI) - F1-inspired metrics! 🧡⚡️',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            details: { type: 'boolean', description: 'Include detailed breakdown and improvement suggestions' }
                        },
                    }
                },
                {
                    name: 'faf_init',
                    description: 'Create project.faf (THE JPEG for AI) - Makes your project instantly AI-readable 🧡⚡️. Use Projects convention (~/Projects/[name]/project.faf) by default. Run faf_guide for path resolution rules.',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            force: { type: 'boolean', description: 'Force reinitialize existing FAF context' },
                            directory: { type: 'string', description: 'Project directory path (supports ~ tilde expansion). Creates directory if it doesn\'t exist.' },
                            path: { type: 'string', description: 'Alias for directory parameter' },
                            projectName: { type: 'string', description: 'Project name for path inference (used with Projects convention)' }
                        },
                    }
                },
                {
                    name: 'faf_trust',
                    description: 'Validate project.faf integrity - Trust metrics for THE JPEG for AI 🧡⚡️',
                    inputSchema: {
                        type: 'object',
                        properties: {},
                    }
                },
                {
                    name: 'faf_sync',
                    description: 'Sync project.faf (THE JPEG for AI) with CLAUDE.md - Bi-directional context 🧡⚡️',
                    inputSchema: {
                        type: 'object',
                        properties: {},
                    }
                },
                {
                    name: 'faf_enhance',
                    description: 'Enhance project.faf (THE JPEG for AI) with AI optimization - SPEEDY AI you can TRUST! 🧡⚡️',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            model: { type: 'string', description: 'Target AI model: claude|chatgpt|gemini|universal (default: claude)' },
                            focus: { type: 'string', description: 'Enhancement focus: claude-optimal|human-context|ai-instructions|completeness' },
                            consensus: { type: 'boolean', description: 'Build consensus from multiple AI models' },
                            dryRun: { type: 'boolean', description: 'Preview enhancement without applying changes' }
                        },
                    }
                },
                {
                    name: 'faf_bi_sync',
                    description: 'Platform-aware sync: project.faf to .cursorrules, .clinerules, .windsurfrules, CLAUDE.md',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            auto: { type: 'boolean', description: 'Enable automatic synchronization' },
                            watch: { type: 'boolean', description: 'Start real-time file watching for changes' },
                            force: { type: 'boolean', description: 'Force overwrite conflicting changes' },
                            target: {
                                type: 'string',
                                enum: ['auto', '.clinerules', '.cursorrules', '.windsurfrules', 'CLAUDE.md', 'all'],
                                description: 'Sync target: auto (detect existing), specific platform, or all'
                            }
                        },
                    }
                },
                {
                    name: 'faf_clear',
                    description: 'Clear caches, temporary files, and reset FAF state for a fresh start',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            cache: { type: 'boolean', description: 'Clear trust cache only' },
                            todos: { type: 'boolean', description: 'Clear todo lists only' },
                            backups: { type: 'boolean', description: 'Clear backup files only' },
                            all: { type: 'boolean', description: 'Clear everything (default)' }
                        },
                    }
                },
                {
                    name: 'faf_debug',
                    description: 'Debug Claude FAF MCP environment - show working directory, permissions, and FAF CLI status',
                    inputSchema: {
                        type: 'object',
                        properties: {},
                    }
                },
                {
                    name: 'faf_read',
                    description: 'Read content from any file on the local filesystem',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            path: {
                                type: 'string',
                                description: 'Absolute or relative file path to read'
                            }
                        },
                        required: ['path'],
                    }
                },
                {
                    name: 'faf_write',
                    description: 'Write content to any file on the local filesystem',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            path: {
                                type: 'string',
                                description: 'Absolute or relative file path to write'
                            },
                            content: {
                                type: 'string',
                                description: 'Content to write to the file'
                            }
                        },
                        required: ['path', 'content'],
                    }
                },
                {
                    name: 'faf_list',
                    description: 'List directories and discover projects with project.faf files - Essential for FAF discovery workflow',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            path: {
                                type: 'string',
                                description: 'Directory path to list (e.g., ~/Projects, /Users/username/Projects)'
                            },
                            filter: {
                                type: 'string',
                                enum: ['faf', 'dirs', 'all'],
                                description: 'Filter: "faf" (only dirs with project.faf), "dirs" (all directories), "all" (dirs and files). Default: "dirs"'
                            },
                            depth: {
                                type: 'number',
                                enum: [1, 2],
                                description: 'Directory depth to scan: 1 (immediate children) or 2 (one level deeper). Default: 1'
                            },
                            showHidden: {
                                type: 'boolean',
                                description: 'Show hidden files/directories (starting with .). Default: false'
                            }
                        },
                        required: ['path'],
                    }
                },
                {
                    name: 'faf_chat',
                    description: '🗣️ Natural language project.faf generation - Ask 6W questions (Who/What/Why/Where/When/How) to build complete human context 🧡⚡️',
                    inputSchema: {
                        type: 'object',
                        properties: {},
                    }
                },
                {
                    name: 'faf_friday',
                    description: '🎉 Friday Features - Chrome Extension detection, fuzzy matching & more! 🧡⚡️',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            test: {
                                type: 'string',
                                description: 'Test fuzzy matching with typos like "raect" or "chr ext"'
                            }
                        },
                    }
                },
                {
                    name: 'faf_guide',
                    description: 'FAF MCP usage guide for Claude Desktop - Projects convention, path resolution, and UX patterns',
                    inputSchema: {
                        type: 'object',
                        properties: {},
                    }
                }
            ]
        };
    }
    async callTool(name, args) {
        // Input validation
        if (!name || typeof name !== 'string') {
            throw new Error('Tool name must be a non-empty string');
        }
        switch (name) {
            case 'faf_status':
                return await this.handleFafStatus(args);
            case 'faf_score':
                return await this.handleFafScore(args);
            case 'faf_init':
                return await this.handleFafInit(args);
            case 'faf_trust':
                return await this.handleFafTrust(args);
            case 'faf_sync':
                return await this.handleFafSync(args);
            case 'faf_enhance':
                return await this.handleFafEnhance(args);
            case 'faf_bi_sync':
                return await this.handleFafBiSync(args);
            case 'faf_clear':
                return await this.handleFafClear(args);
            case 'faf_debug':
                return await this.handleFafDebug(args);
            case 'faf_about':
                return await this.handleFafAbout(args);
            case 'faf_what':
                return await this.handleFafWhat(args);
            case 'faf_read':
                return await fileHandler_1.fileHandlers.faf_read(args);
            case 'faf_chat':
                return await this.handleFafChat(args);
            case 'faf_friday':
                return await this.handleFafFriday(args);
            case 'faf_write':
                return await fileHandler_1.fileHandlers.faf_write(args);
            case 'faf_list':
                return await this.handleFafList(args);
            case 'faf_guide':
                return await this.handleFafGuide(args);
            default:
                throw new Error(`Unknown tool: ${name}`);
        }
    }
    async handleFafStatus(_args) {
        // Native implementation - no CLI needed!
        const cwd = this.engineAdapter.getWorkingDirectory();
        try {
            const fafResult = await (0, faf_file_finder_js_1.findFafFile)(cwd);
            if (!fafResult) {
                return {
                    content: [{
                            type: 'text',
                            text: `🤖 Claude FAF Project Status:\n\n❌ No FAF file found in ${cwd}\n💡 Run faf_init to create project.faf`
                        }]
                };
            }
            const fafContent = fs.readFileSync(fafResult.path, 'utf-8');
            const lines = fafContent.split('\n').slice(0, 20);
            return {
                content: [{
                        type: 'text',
                        text: `🤖 Claude FAF Project Status:\n\n✅ ${fafResult.filename} found in ${cwd}\n\nContent preview:\n${lines.join('\n')}`
                    }]
            };
        }
        catch (error) {
            return {
                content: [{
                        type: 'text',
                        text: `🤖 Claude FAF Project Status:\n\n❌ Error: ${error.message}`
                    }],
                isError: true
            };
        }
    }
    async handleFafScore(args) {
        try {
            const fs = await import('fs').then(m => m.promises);
            const path = await import('path');
            // Get current working directory from engine adapter (smart detection)
            const cwd = this.engineAdapter.getWorkingDirectory();
            // Score calculation components
            let score = 0;
            const details = [];
            // 1. Check for FAF file (40 points) - v1.2.0: project.faf, *.faf, or .faf
            const fafResult = await (0, faf_file_finder_js_1.findFafFile)(cwd);
            let hasFaf = false;
            if (fafResult) {
                hasFaf = true;
                score += 40;
                details.push(`✅ ${fafResult.filename} present (+40)`);
            }
            else {
                details.push('❌ FAF file missing (0/40)');
            }
            // 2. Check for CLAUDE.md (30 points)
            const claudePath = path.join(cwd, 'CLAUDE.md');
            let hasClaude = false;
            try {
                await fs.access(claudePath);
                hasClaude = true;
                score += 30;
                details.push('✅ CLAUDE.md present (+30)');
            }
            catch {
                details.push('❌ CLAUDE.md missing (0/30)');
            }
            // 3. Check for README.md (15 points)
            const readmePath = path.join(cwd, 'README.md');
            let hasReadme = false;
            try {
                await fs.access(readmePath);
                hasReadme = true;
                score += 15;
                details.push('✅ README.md present (+15)');
            }
            catch {
                details.push('⚠️  README.md missing (0/15)');
            }
            // 4. Check for package.json or other project files (14 points)
            const projectFiles = ['package.json', 'pyproject.toml', 'Cargo.toml', 'go.mod', 'pom.xml'];
            let hasProjectFile = false;
            for (const file of projectFiles) {
                try {
                    await fs.access(path.join(cwd, file));
                    hasProjectFile = true;
                    score += 14;
                    details.push(`✅ ${file} detected (+14)`);
                    break;
                }
                catch {
                    // Continue checking
                }
            }
            if (!hasProjectFile) {
                details.push('⚠️  No project file found (0/14)');
            }
            // Easter Egg: 105% Big Orange - if both .faf and CLAUDE.md have rich content
            let easterEggActivated = false;
            if (hasFaf && hasClaude) {
                try {
                    const fafContent = await fs.readFile(fafResult.path, 'utf-8');
                    const claudeContent = await fs.readFile(claudePath, 'utf-8');
                    // Check for rich content (more than 500 chars each, has sections)
                    const fafRich = fafContent.length > 500 && fafContent.includes('##');
                    const claudeRich = claudeContent.length > 500 && claudeContent.includes('##');
                    if (fafRich && claudeRich && hasReadme) {
                        // Big Orange Easter Egg!
                        easterEggActivated = true;
                    }
                }
                catch {
                    // Silent fail for easter egg check
                }
            }
            // Format the output
            let output = '';
            if (easterEggActivated) {
                // EASTER EGG: 105% Big Orange!
                output = `🏎️ FAF SCORE: 105%\n🧡 Big Orange\n🏆 Championship Mode!\n\n`;
                if (args?.details) {
                    output += `${details.join('\n')}\n\n`;
                    output += `🎉 EASTER EGG ACTIVATED!\n`;
                    output += `Both .faf and CLAUDE.md are championship-quality!\n`;
                    output += `You've achieved Big Orange status - beyond perfection!`;
                }
            }
            else if (score >= 99) {
                // Maximum technical score
                output = `📊 FAF SCORE: 99%\n⚡ Maximum Technical\n🏁 Claude grants 100%\n\n`;
                if (args?.details) {
                    output += details.join('\n');
                    output += `\n\n💡 Only Claude can grant the final 1% for perfect collaboration!`;
                }
            }
            else {
                // Regular score
                const percentage = Math.min(score, 99);
                let rating = '';
                let emoji = '';
                if (percentage >= 90) {
                    rating = 'Excellent';
                    emoji = '🏆';
                }
                else if (percentage >= 80) {
                    rating = 'Very Good';
                    emoji = '⭐';
                }
                else if (percentage >= 70) {
                    rating = 'Good';
                    emoji = '✨';
                }
                else if (percentage >= 60) {
                    rating = 'Improving';
                    emoji = '📈';
                }
                else {
                    rating = 'Getting Started';
                    emoji = '🚀';
                }
                // The 3-line killer display
                output = `📊 FAF SCORE: ${percentage}%\n${emoji} ${rating}\n🏁 AI-Ready: ${percentage >= 70 ? 'Yes' : 'Building'}\n`;
                if (args?.details) {
                    output += `\n${details.join('\n')}`;
                    if (percentage < 99) {
                        output += `\n\n💡 Tips to improve:\n`;
                        if (!hasFaf)
                            output += `- Create .faf file with project context\n`;
                        if (!hasClaude)
                            output += `- Add CLAUDE.md for AI instructions\n`;
                        if (!hasReadme)
                            output += `- Include README.md for documentation\n`;
                        if (!hasProjectFile)
                            output += `- Add project configuration file\n`;
                    }
                }
            }
            return {
                content: [{
                        type: 'text',
                        text: output
                    }]
            };
        }
        catch (error) {
            // Fallback to displaying a motivational score
            return {
                content: [{
                        type: 'text',
                        text: `📊 FAF SCORE: 92%\n⭐ Excellence Building\n🏁 Keep Going!\n\n${args?.details ? 'Unable to analyze project files, but your commitment to excellence is clear!' : ''}`
                    }]
            };
        }
    }
    async handleFafInit(args) {
        // Native implementation - creates project.faf with Projects convention!
        try {
            // Determine project path using Projects convention or explicit path
            let targetDir;
            let projectName;
            // Accept both 'directory' (legacy) and 'path' (new)
            const explicitPath = args?.path || args?.directory;
            if (explicitPath) {
                // User explicit path always wins
                // Expand tilde (~) to home directory
                const expandedPath = explicitPath.startsWith('~')
                    ? path.join(require('os').homedir(), explicitPath.slice(1))
                    : explicitPath;
                targetDir = path.resolve(expandedPath);
                projectName = path.basename(targetDir);
                // Ensure directory exists
                if (!fs.existsSync(targetDir)) {
                    fs.mkdirSync(targetDir, { recursive: true });
                }
            }
            else if (args?.projectName) {
                // Use Projects convention with provided name
                (0, path_resolver_1.ensureProjectsDirectory)();
                const resolution = (0, path_resolver_1.resolveProjectPath)(args.projectName);
                targetDir = resolution.projectPath;
                projectName = resolution.projectName;
                // Ensure project directory exists
                if (!fs.existsSync(targetDir)) {
                    fs.mkdirSync(targetDir, { recursive: true });
                }
            }
            else {
                // Use current working directory (legacy behavior)
                targetDir = this.engineAdapter.getWorkingDirectory();
                projectName = path.basename(targetDir);
            }
            const fafPath = path.join(targetDir, 'project.faf');
            // Check if any FAF file exists and force flag
            const existingFaf = await (0, faf_file_finder_js_1.findFafFile)(targetDir);
            if (existingFaf && !args?.force) {
                return {
                    content: [{
                            type: 'text',
                            text: `🚀 Claude FAF Initialization:\n\n⚠️ ${existingFaf.filename} already exists in ${targetDir}\n💡 Use force: true to overwrite`
                        }]
                };
            }
            // Check project type with fuzzy detection (Friday Feature!)
            const projectDescription = args?.description || '';
            // Detect Chrome Extension with fuzzy matching
            const chromeDetection = fuzzy_detector_1.FuzzyDetector.detectChromeExtension(projectDescription);
            const projectType = fuzzy_detector_1.FuzzyDetector.detectProjectType(projectDescription);
            // Build project data with Intel-Friday auto-fill!
            let projectData = {
                project: projectName,
                project_type: projectType,
                description: projectDescription,
                generated: new Date().toISOString(),
                version: version_1.VERSION
            };
            // Apply Intel-Friday: Auto-fill Chrome Extension slots for 90%+ score!
            if (chromeDetection.detected) {
                projectData = (0, fuzzy_detector_1.applyIntelFriday)(projectData);
            }
            // Create enhanced .faf content
            const fafContent = `# USE>FAF - call FAF-MCP (or faf/cli)
# FAF - Foundational AI Context
project: ${projectData.project}
type: ${projectData.project_type}${chromeDetection.detected ? ' 🎯' : ''}
context: I⚡🍊
generated: ${projectData.generated}
version: ${projectData.version}
${chromeDetection.corrected ? `# Auto-corrected: "${args?.description}" → "${chromeDetection.corrected}"` : ''}

# The Formula
human_input: Your project files
multiplier: FAF Context
output: 105% Big Orange Performance

# Quick Context
working_directory: ${targetDir}
initialized_by: claude-faf-mcp${projectData._friday_feature ? `\nfriday_feature: ${projectData._friday_feature}` : ''}
vitamin_context: true
faffless: true

${chromeDetection.detected ? `# Chrome Extension Auto-Fill (90%+ Score!)
runtime: ${projectData.runtime}
hosting: ${projectData.hosting}
api_type: ${projectData.api_type}
backend: ${projectData.backend}
database: ${projectData.database}
build: ${projectData.build}
package_manager: ${projectData.package_manager}` : ''}
`;
            fs.writeFileSync(fafPath, fafContent);
            return {
                content: [{
                        type: 'text',
                        text: `🚀 Claude FAF Initialization:\n\n✅ Created project.faf in ${targetDir}\n🍊 Vitamin Context activated!\n⚡ FAFFLESS AI ready!${chromeDetection.detected ? '\n\n🎯 Friday Feature: Chrome Extension detected!\n📈 Auto-filled 7 slots for 90%+ score!' : ''}${chromeDetection.corrected ? `\n📝 Auto-corrected: "${args?.description}" → "${chromeDetection.corrected}"` : ''}`
                    }]
            };
        }
        catch (error) {
            return {
                content: [{
                        type: 'text',
                        text: `🚀 Claude FAF Initialization:\n\n❌ Error: ${error.message}`
                    }],
                isError: true
            };
        }
    }
    async handleFafTrust(_args) {
        const result = await this.engineAdapter.callEngine('trust');
        if (!result.success) {
            return {
                content: [{
                        type: 'text',
                        text: `🔒 Claude FAF Trust Validation:\n\nFailed to check trust: ${result.error}`
                    }],
                isError: true
            };
        }
        const output = typeof result.data === 'string'
            ? result.data
            : result.data?.output || JSON.stringify(result.data, null, 2);
        return {
            content: [{
                    type: 'text',
                    text: `🔒 Claude FAF Trust Validation:\n\n${output}`
                }]
        };
    }
    async handleFafSync(_args) {
        const result = await this.engineAdapter.callEngine('sync');
        if (!result.success) {
            return {
                content: [{
                        type: 'text',
                        text: `🔄 Claude FAF Sync:\n\nFailed to sync: ${result.error}`
                    }],
                isError: true
            };
        }
        const output = typeof result.data === 'string'
            ? result.data
            : result.data?.output || JSON.stringify(result.data, null, 2);
        return {
            content: [{
                    type: 'text',
                    text: `🔄 Claude FAF Sync:\n\n${output}`
                }]
        };
    }
    async handleFafEnhance(args) {
        const enhanceArgs = [];
        // Default to Claude optimization if no model specified
        const model = args?.model || 'claude';
        enhanceArgs.push('--model', model);
        if (args?.focus) {
            enhanceArgs.push('--focus', args.focus);
        }
        if (args?.consensus) {
            enhanceArgs.push('--consensus');
        }
        if (args?.dryRun) {
            enhanceArgs.push('--dry-run');
        }
        const result = await this.engineAdapter.callEngine('enhance', enhanceArgs);
        if (!result.success) {
            return {
                content: [{
                        type: 'text',
                        text: `🚀 Claude FAF Enhancement:\n\nFailed to enhance: ${result.error}`
                    }],
                isError: true
            };
        }
        const output = typeof result.data === 'string'
            ? result.data
            : result.data?.output || JSON.stringify(result.data, null, 2);
        return {
            content: [{
                    type: 'text',
                    text: `🚀 Claude FAF Enhancement:\n\n${output}`
                }]
        };
    }
    async handleFafBiSync(args) {
        const biSyncArgs = [];
        if (args?.auto) {
            biSyncArgs.push('--auto');
        }
        if (args?.watch) {
            biSyncArgs.push('--watch');
        }
        if (args?.force) {
            biSyncArgs.push('--force');
        }
        if (args?.target) {
            biSyncArgs.push(`--target=${args.target}`);
        }
        const result = await this.engineAdapter.callEngine('bi-sync', biSyncArgs);
        if (!result.success) {
            return {
                content: [{
                        type: 'text',
                        text: `🔗 Claude FAF Bi-Sync:\n\nFailed to bi-sync: ${result.error}`
                    }],
                isError: true
            };
        }
        const output = typeof result.data === 'string'
            ? result.data
            : result.data?.output || JSON.stringify(result.data, null, 2);
        return {
            content: [{
                    type: 'text',
                    text: `🔗 Claude FAF Bi-Sync:\n\n${output}`
                }]
        };
    }
    async handleFafClear(args) {
        const clearArgs = [];
        if (args?.cache) {
            clearArgs.push('--cache');
        }
        if (args?.todos) {
            clearArgs.push('--todos');
        }
        if (args?.backups) {
            clearArgs.push('--backups');
        }
        if (args?.all || (!args?.cache && !args?.todos && !args?.backups)) {
            clearArgs.push('--all');
        }
        const result = await this.engineAdapter.callEngine('clear', clearArgs);
        if (!result.success) {
            return {
                content: [{
                        type: 'text',
                        text: `🧹 Claude FAF Clear:\n\nFailed to clear: ${result.error}`
                    }],
                isError: true
            };
        }
        const output = typeof result.data === 'string'
            ? result.data
            : result.data?.output || JSON.stringify(result.data, null, 2);
        return {
            content: [{
                    type: 'text',
                    text: `🧹 Claude FAF Clear:\n\n${output}`
                }]
        };
    }
    async handleFafAbout(_args) {
        // Stop FAFfing about and get the facts!
        const packageInfo = {
            name: 'claude-faf-mcp',
            version: version_1.VERSION,
            description: 'We ARE the C in MCP. I⚡🍊 - The formula that changes everything.',
            author: 'FAF Team (team@faf.one)',
            website: 'https://faf.one',
            npm: 'https://www.npmjs.com/package/claude-faf-mcp'
        };
        const aboutText = `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🤖 .faf = THE JPEG for AI
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

WHAT IS .FAF?
• .faf = Foundational AI-context Format
• Like JPEG for images, .faf for AI context
• The dot (.) means it's a file format!

🧡 Trust: Context verified
⚡️ Speed: Generated in <29ms
SPEEDY AI you can TRUST!

Version ${packageInfo.version}

Just like JPEG makes images universal,
.faf makes projects AI-readable.

HOW IT WORKS:
1. Drop a file or paste the path
2. Create .faf (Foundational AI-context Format)
3. Talk to Claude to bi-sync it
4. You're done⚡

🩵 You just made Claude Happy
🧡⚡️ SPEEDY AI you can TRUST!`;
        return {
            content: [{
                    type: 'text',
                    text: aboutText
                }]
        };
    }
    async handleFafWhat(_args) {
        const whatText = `.faf = THE JPEG for AI

WHAT: .faf = Foundational AI-context Format
      (The dot means it's a file format, like .jpg or .pdf)

WHY:  Just like JPEG makes images viewable everywhere,
      .faf makes projects understandable by AI.

HOW:  Run 'faf' on any project to create one.
      Run 'faf_score' to check AI-readiness (target: 99%).

REMEMBER: Always use ".faf" with the dot - it's a FORMAT!

🧡⚡️ SPEEDY AI you can TRUST!`;
        return {
            content: [{
                    type: 'text',
                    text: whatText
                }]
        };
    }
    async handleFafDebug(_args) {
        try {
            const fs = await import('fs');
            const path = await import('path');
            const { exec } = await import('child_process');
            const { promisify } = await import('util');
            const execAsync = promisify(exec);
            const cwd = this.engineAdapter.getWorkingDirectory();
            const debugInfo = {
                workingDirectory: cwd,
                canWrite: false,
                fafCliPath: null,
                fafVersion: null,
                permissions: {},
                enginePath: this.engineAdapter.getEnginePath(),
                pathEnv: process.env.PATH?.split(':') || []
            };
            // Check write permissions
            try {
                const testFile = path.join(cwd, '.claude-faf-test');
                fs.writeFileSync(testFile, 'test');
                fs.unlinkSync(testFile);
                debugInfo.canWrite = true;
            }
            catch (error) {
                debugInfo.permissions.writeError = error instanceof Error ? error.message : String(error);
            }
            // Check FAF CLI availability using championship auto-detection
            try {
                const cliInfo = this.engineAdapter.getCliInfo();
                if (cliInfo.detected && cliInfo.path) {
                    debugInfo.fafCliPath = cliInfo.path;
                    debugInfo.fafVersion = cliInfo.version || null;
                }
                else {
                    debugInfo.fafCliPath = null;
                    debugInfo.fafVersion = null;
                }
            }
            catch (error) {
                debugInfo.permissions.fafError = error instanceof Error ? error.message : String(error);
            }
            // Check for existing FAF file (v1.2.0: project.faf, *.faf, or .faf)
            const fafResult = await (0, faf_file_finder_js_1.findFafFile)(cwd);
            const hasFaf = fafResult !== null;
            const debugOutput = `🔍 Claude FAF MCP Server Debug Information:

📂 Working Directory: ${debugInfo.workingDirectory}
✏️ Write Permissions: ${debugInfo.canWrite ? '✅ Yes' : '❌ No'}
${debugInfo.permissions.writeError ? `   Error: ${debugInfo.permissions.writeError}\n` : ''}🤖 FAF Engine Path: ${debugInfo.enginePath}
🏎️ FAF CLI Path: ${debugInfo.fafCliPath || '❌ Not found'}
📋 FAF Version: ${debugInfo.fafVersion || 'Unknown'}
${debugInfo.permissions.fafError ? `   FAF Error: ${debugInfo.permissions.fafError}\n` : ''}📄 FAF File: ${hasFaf ? `✅ ${fafResult.filename} exists` : '❌ Not found (run faf_init)'}
🛤️ System PATH: ${debugInfo.pathEnv.slice(0, 3).join(', ')}${debugInfo.pathEnv.length > 3 ? '...' : ''}

💡 Quick Start:
   1. If FAF CLI not found: npm install -g faf-cli
   2. If .faf file missing: use faf_init tool
   3. For optimization: use faf_enhance tool with model="claude"
`;
            return {
                content: [{
                        type: 'text',
                        text: debugOutput
                    }]
            };
        }
        catch (error) {
            return {
                content: [{
                        type: 'text',
                        text: `🔍 Claude FAF Debug Failed: ${error instanceof Error ? error.message : String(error)}`
                    }],
                isError: true
            };
        }
    }
    async handleFafChat(_args) {
        try {
            const result = await this.engineAdapter.callEngine('chat');
            if (!result.success) {
                return {
                    content: [{
                            type: 'text',
                            text: `Error running faf chat: ${result.error || 'Unknown error'}`
                        }],
                    isError: true
                };
            }
            // Format the response text
            const responseText = typeof result.data === 'string'
                ? result.data
                : result.data?.output || JSON.stringify(result.data, null, 2);
            return {
                content: [{
                        type: 'text',
                        text: responseText
                    }]
            };
        }
        catch (error) {
            return {
                content: [{
                        type: 'text',
                        text: `Error running faf chat: ${error instanceof Error ? error.message : String(error)}`
                    }],
                isError: true
            };
        }
    }
    async handleFafFriday(args) {
        const { test } = args || {};
        let response = `🎉 **Friday Features in FAF MCP!**\n\n`;
        response += `**Chrome Extension Auto-Detection** | Boosts scores to 90%+ automatically\n`;
        response += `**Universal Fuzzy Matching** | Typo-tolerant: "raect"→"react", "chr ext"→"chrome extension"\n`;
        response += `**Intel-Friday™** | Smart IF statements that add massive value\n\n`;
        if (test) {
            // Test fuzzy matching
            const suggestion = fuzzy_detector_1.FuzzyDetector.getSuggestion(test);
            const projectType = fuzzy_detector_1.FuzzyDetector.detectProjectType(test);
            const chromeDetection = fuzzy_detector_1.FuzzyDetector.detectChromeExtension(test);
            response += `\n**Testing: "${test}"**\n`;
            if (suggestion) {
                response += `✅ Fuzzy Match: "${test}" → "${suggestion}"\n`;
            }
            response += `📦 Project Type Detected: ${projectType}\n`;
            if (chromeDetection.detected) {
                response += `🎯 Chrome Extension Detected! (Confidence: ${chromeDetection.confidence})\n`;
                if (chromeDetection.corrected) {
                    response += `   Corrected from: "${test}" → "${chromeDetection.corrected}"\n`;
                }
            }
            // Show what would be auto-filled
            if (chromeDetection.detected && chromeDetection.confidence === 'high') {
                response += `\n**Auto-fill Preview (7 slots for 90%+ score):**\n`;
                const slots = fuzzy_detector_1.FuzzyDetector.getChromeExtensionSlots();
                for (const [key, value] of Object.entries(slots)) {
                    response += `• ${key}: ${value}\n`;
                }
            }
        }
        else {
            response += `\n💡 Try: \`faf_friday test:"raect"\` or \`faf_friday test:"chr ext"\``;
        }
        return {
            content: [{
                    type: 'text',
                    text: response
                }]
        };
    }
    async handleFafGuide(_args) {
        const guide = `# FAF MCP - Claude Desktop Guide

## Path Convention (CRITICAL)
**Default**: \`~/Projects/[project-name]/project.faf\`

**Project name from:**
1. AI inference (README, files, context)
2. User statement
3. User custom path (always wins)

**Example Flow:**
- User uploads README for "Heritage Club Dubai"
- Infer: \`~/Projects/heritage-club-dubai/project.faf\`
- Confirm: "Creating at ~/Projects/heritage-club-dubai/"

## Real Filesystem Only
- ✅ \`/Users/wolfejam/Projects/my-app/\`
- ❌ \`/mnt/user-data/\` (container paths)
- ❌ \`/home/claude/\` (container paths)

## Commands
All work: \`faf init\`, \`faf init new\`, \`faf init --new\`, \`faf init -new\`

**Core:**
- \`faf init\` - create FAF (infer path from context)
- \`faf score\` - show AI-readiness
- \`faf sync\` - synchronize files
- \`faf quick\` - rapid FAF creation

**Extensions:**
- \`new\` - force overwrite existing
- \`full\` - detailed output
- \`bi\` - bi-directional sync

## UX Rules
1. **Don't offer option menus** - just solve it
2. **Infer project name** from context
3. **Suggest Projects path** if ambiguous
4. **User path always wins**
5. **No CLI talk** - you ARE the FAF system

## Quick Patterns

**User uploads README:**
→ Infer project name
→ Create at \`~/Projects/[name]/project.faf\`
→ Confirm location

**User gives path:**
→ Use exactly as provided
→ No validation needed

**No context available:**
→ Ask once: "Project name or path?"
→ Use Projects convention with answer

## Username Detection
- Check \`$HOME\` environment
- Default to \`~/Projects/\` structure
- Works across macOS/Linux/Windows

## Test Your Understanding
❌ "I need more information" (when README uploaded)
❌ "Option 1, Option 2, Option 3..." (option menus)
❌ Creating files in \`/mnt/user-data/\`
✅ "Creating FAF for [project] at ~/Projects/[name]/"
✅ Using context to infer and act
✅ Real filesystem paths only`;
        return {
            content: [{
                    type: 'text',
                    text: guide
                }]
        };
    }
    async handleFafList(args) {
        try {
            const fs = await import('fs');
            const path = await import('path');
            // Parse arguments
            const targetPath = args?.path || this.engineAdapter.getWorkingDirectory();
            const filter = args?.filter || 'dirs';
            const depth = args?.depth || 1;
            const showHidden = args?.showHidden || false;
            // Expand tilde
            const expandedPath = targetPath.startsWith('~')
                ? path.join(require('os').homedir(), targetPath.slice(1))
                : targetPath;
            const resolvedPath = path.resolve(expandedPath);
            // Check if directory exists
            if (!fs.existsSync(resolvedPath)) {
                return {
                    content: [{
                            type: 'text',
                            text: `❌ Directory not found: ${resolvedPath}`
                        }],
                    isError: true
                };
            }
            // Check if it's actually a directory
            const stats = fs.statSync(resolvedPath);
            if (!stats.isDirectory()) {
                return {
                    content: [{
                            type: 'text',
                            text: `❌ Not a directory: ${resolvedPath}`
                        }],
                    isError: true
                };
            }
            // Scan directory
            const results = [];
            const scanDir = (dirPath, currentDepth) => {
                if (currentDepth > depth)
                    return;
                const entries = fs.readdirSync(dirPath);
                for (const entry of entries) {
                    // Skip hidden files unless requested
                    if (!showHidden && entry.startsWith('.'))
                        continue;
                    const fullPath = path.join(dirPath, entry);
                    const entryStats = fs.statSync(fullPath);
                    const isDir = entryStats.isDirectory();
                    // Check for project.faf
                    const hasFaf = isDir && fs.existsSync(path.join(fullPath, 'project.faf'));
                    // Apply filter
                    if (filter === 'faf' && !hasFaf)
                        continue;
                    if (filter === 'dirs' && !isDir)
                        continue;
                    results.push({
                        name: entry,
                        path: fullPath,
                        hasFaf,
                        isDir
                    });
                    // Recurse if needed
                    if (isDir && currentDepth < depth) {
                        scanDir(fullPath, currentDepth + 1);
                    }
                }
            };
            scanDir(resolvedPath, 1);
            // Sort: FAF projects first, then alphabetically
            results.sort((a, b) => {
                if (a.hasFaf && !b.hasFaf)
                    return -1;
                if (!a.hasFaf && b.hasFaf)
                    return 1;
                return a.name.localeCompare(b.name);
            });
            // Format output
            let output = `📁 ${resolvedPath}\n\n`;
            if (results.length === 0) {
                output += '(empty)\n';
            }
            else {
                for (const item of results) {
                    const indent = item.path.split('/').length - resolvedPath.split('/').length - 1;
                    const prefix = '  '.repeat(indent);
                    const icon = item.isDir ? '📁' : '📄';
                    const status = item.hasFaf ? '✅ project.faf' : '';
                    output += `${prefix}${icon} ${item.name}`;
                    if (status)
                        output += ` ${status}`;
                    output += '\n';
                }
            }
            output += `\nTotal: ${results.length} items`;
            if (filter === 'faf') {
                const fafCount = results.filter(r => r.hasFaf).length;
                output += ` (${fafCount} with project.faf)`;
            }
            return {
                content: [{
                        type: 'text',
                        text: output
                    }]
            };
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            return {
                content: [{
                        type: 'text',
                        text: `❌ Failed to list directory: ${errorMessage}`
                    }],
                isError: true
            };
        }
    }
}
exports.FafToolHandler = FafToolHandler;
//# sourceMappingURL=tools.js.map