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
exports.FafEngineAdapter = void 0;
const child_process_1 = require("child_process");
const util_1 = require("util");
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const type_guards_js_1 = require("../utils/type-guards.js"); // ✅ FIXED: Removed unused isDefined
const cli_detector_js_1 = require("../utils/cli-detector.js");
const score_js_1 = require("../faf-core/commands/score.js");
const init_js_1 = require("../faf-core/commands/init.js");
const auto_js_1 = require("../faf-core/commands/auto.js");
const sync_js_1 = require("../faf-core/commands/sync.js");
const bi_sync_js_1 = require("../faf-core/commands/bi-sync.js");
const formats_js_1 = require("../faf-core/commands/formats.js");
const doctor_js_1 = require("../faf-core/commands/doctor.js");
const validate_js_1 = require("../faf-core/commands/validate.js");
const audit_js_1 = require("../faf-core/commands/audit.js");
const update_js_1 = require("../faf-core/commands/update.js");
const migrate_js_1 = require("../faf-core/commands/migrate.js");
const innit_js_1 = require("../faf-core/commands/innit.js");
const quick_js_1 = require("../faf-core/commands/quick.js");
const enhance_js_1 = require("../faf-core/commands/enhance.js");
const execAsync = (0, util_1.promisify)(child_process_1.exec);
// Enhanced PATH for FAF CLI discovery
const getEnhancedEnv = () => ({
    ...process.env,
    PATH: [
        '/usr/local/bin',
        '/opt/homebrew/bin',
        process.env.HOME ? `${process.env.HOME}/.npm/bin` : undefined,
        process.env.HOME ? `${process.env.HOME}/.npm-global/bin` : undefined,
        '/usr/bin',
        '/bin',
        process.env.PATH
    ].filter(Boolean).join(':')
});
class FafEngineAdapter {
    enginePath;
    detectedCliPath = null;
    cliVersion;
    timeout;
    workingDirectory;
    constructor(enginePath = 'faf', timeout = 30000) {
        this.enginePath = enginePath;
        this.timeout = timeout;
        this.workingDirectory = this.findBestWorkingDirectory();
        // Auto-detect CLI on initialization
        this.detectCli();
    }
    detectCli() {
        const detection = (0, cli_detector_js_1.detectFafCli)();
        if (detection.found && detection.path) {
            this.detectedCliPath = detection.path;
            this.cliVersion = detection.version;
            // Validate version meets minimum requirement
            if (this.cliVersion && !(0, cli_detector_js_1.validateCliVersion)(this.cliVersion, '3.1.1')) {
                console.warn(`FAF CLI version ${this.cliVersion} is below minimum required version 3.1.1. Some features may not work correctly.`);
            }
            console.error(`✅ FAF CLI detected: ${this.detectedCliPath} (v${this.cliVersion || 'unknown'}) via ${detection.method}`);
        }
        else {
            console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.error('⚠️  FAF CLI NOT DETECTED');
            console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.error('');
            console.error('INSTALLATION ORDER REQUIRED:');
            console.error('  1️⃣  npm install -g faf-cli        (REQUIRED FIRST)');
            console.error('  2️⃣  npm install -g claude-faf-mcp  (THEN THIS)');
            console.error('');
            console.error('Most MCP tools require faf-cli to be installed.');
            console.error('Only basic file operations will work without it.');
            console.error('');
            console.error('After installing faf-cli, restart Claude Desktop.');
            console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        }
    }
    findBestWorkingDirectory() {
        // Priority 1: Environment variable for explicit control
        const fafWorkingDir = process.env.FAF_WORKING_DIR;
        if (fafWorkingDir && fs.existsSync(fafWorkingDir)) {
            return fafWorkingDir;
        }
        // Priority 2: MCP might pass a working directory hint
        const mcpWorkingDir = process.env.MCP_WORKING_DIR;
        if (mcpWorkingDir && fs.existsSync(mcpWorkingDir)) {
            return mcpWorkingDir;
        }
        // Priority 3: FORCE ~/Projects as universal default
        const homeDir = process.env.HOME ?? process.env.USERPROFILE;
        if (homeDir) {
            // Try capitalized Projects first (macOS/Windows convention)
            const projectsDir = path.join(homeDir, 'Projects');
            if (fs.existsSync(projectsDir)) {
                return projectsDir;
            }
            // Create ~/Projects if it doesn't exist
            try {
                fs.mkdirSync(projectsDir, { recursive: true });
                return projectsDir;
            }
            catch {
                // If we can't create Projects, try lowercase
                const projectsLower = path.join(homeDir, 'projects');
                if (fs.existsSync(projectsLower)) {
                    return projectsLower;
                }
                // Fall back to home
                return homeDir;
            }
        }
        // Priority 4: Current directory if not root
        const currentDir = process.cwd();
        if (currentDir !== '/' && currentDir !== '/root' && fs.existsSync(currentDir)) {
            return currentDir;
        }
        // Last resort: /tmp (should rarely happen)
        return '/tmp';
    }
    async callEngine(command, args = []) {
        const startTime = Date.now();
        // Input validation
        if (!command || typeof command !== 'string') {
            return {
                success: false,
                error: 'Command must be a non-empty string',
                duration: 0
            };
        }
        // ============================================================================
        // MK3 BUNDLED ENGINE - Direct function calls (no CLI dependency!)
        // ============================================================================
        // SCORE command - use bundled FafCompiler
        if (command === 'score') {
            try {
                const filePath = args[0] || this.workingDirectory;
                const result = await (0, score_js_1.scoreFafFile)(filePath, { json: true });
                const duration = Date.now() - startTime;
                return {
                    success: true,
                    data: result,
                    duration
                };
            }
            catch (error) {
                const duration = Date.now() - startTime;
                const errorMessage = (0, type_guards_js_1.isError)(error) ? error.message : 'Score command failed';
                return {
                    success: false,
                    error: errorMessage,
                    duration
                };
            }
        }
        // INIT command - use bundled init
        if (command === 'init') {
            try {
                // Filter out flags to get the actual path argument
                const pathArgs = args.filter(arg => !arg.startsWith('--') && !arg.startsWith('-'));
                const projectPath = pathArgs[0] || this.workingDirectory;
                const force = args.includes('--force');
                const result = await (0, init_js_1.initFafFile)(projectPath, { force });
                const duration = Date.now() - startTime;
                return {
                    success: result.success,
                    data: result,
                    duration
                };
            }
            catch (error) {
                const duration = Date.now() - startTime;
                const errorMessage = (0, type_guards_js_1.isError)(error) ? error.message : 'Init command failed';
                return {
                    success: false,
                    error: errorMessage,
                    duration
                };
            }
        }
        // AUTO command - use bundled auto (init + score)
        if (command === 'auto') {
            try {
                // Filter out flags to get the actual path argument
                const pathArgs = args.filter(arg => !arg.startsWith('--') && !arg.startsWith('-'));
                const directory = pathArgs[0] || this.workingDirectory;
                const force = args.includes('--force');
                const result = await (0, auto_js_1.autoCommand)(directory, { force });
                const duration = Date.now() - startTime;
                return {
                    success: result.success,
                    data: result,
                    duration
                };
            }
            catch (error) {
                const duration = Date.now() - startTime;
                const errorMessage = (0, type_guards_js_1.isError)(error) ? error.message : 'Auto command failed';
                return {
                    success: false,
                    error: errorMessage,
                    duration
                };
            }
        }
        // SYNC command - use bundled sync
        if (command === 'sync') {
            try {
                const pathArgs = args.filter(arg => !arg.startsWith('--') && !arg.startsWith('-'));
                const projectPath = pathArgs[0] || this.workingDirectory;
                const auto = args.includes('--auto');
                const result = await (0, sync_js_1.syncFafFile)(projectPath, { auto, json: true });
                const duration = Date.now() - startTime;
                return {
                    success: result.success,
                    data: result,
                    duration
                };
            }
            catch (error) {
                const duration = Date.now() - startTime;
                return {
                    success: false,
                    error: (0, type_guards_js_1.isError)(error) ? error.message : 'Sync command failed',
                    duration
                };
            }
        }
        // BI-SYNC command - use bundled bi-sync
        if (command === 'bi-sync' || command === 'bisync') {
            try {
                const pathArgs = args.filter(arg => !arg.startsWith('--') && !arg.startsWith('-'));
                const projectPath = pathArgs[0] || this.workingDirectory;
                // Parse --target= argument
                const targetArg = args.find(arg => arg.startsWith('--target='));
                const target = targetArg ? targetArg.split('=')[1] : undefined;
                const result = await (0, bi_sync_js_1.syncBiDirectional)(projectPath, { json: true, target });
                const duration = Date.now() - startTime;
                return {
                    success: result.success,
                    data: result,
                    duration
                };
            }
            catch (error) {
                const duration = Date.now() - startTime;
                return {
                    success: false,
                    error: (0, type_guards_js_1.isError)(error) ? error.message : 'Bi-sync command failed',
                    duration
                };
            }
        }
        // FORMATS command - use bundled formats
        if (command === 'formats') {
            try {
                const pathArgs = args.filter(arg => !arg.startsWith('--') && !arg.startsWith('-'));
                const projectPath = pathArgs[0] || this.workingDirectory;
                const result = await (0, formats_js_1.formatsCommand)(projectPath, { json: true });
                const duration = Date.now() - startTime;
                return {
                    success: result.success,
                    data: result,
                    duration
                };
            }
            catch (error) {
                const duration = Date.now() - startTime;
                return {
                    success: false,
                    error: (0, type_guards_js_1.isError)(error) ? error.message : 'Formats command failed',
                    duration
                };
            }
        }
        // DOCTOR command - use bundled doctor
        if (command === 'doctor') {
            try {
                const pathArgs = args.filter(arg => !arg.startsWith('--') && !arg.startsWith('-'));
                const projectPath = pathArgs[0] || this.workingDirectory;
                const result = await (0, doctor_js_1.doctorCommand)(projectPath);
                const duration = Date.now() - startTime;
                return {
                    success: result.success,
                    data: result,
                    duration
                };
            }
            catch (error) {
                const duration = Date.now() - startTime;
                return {
                    success: false,
                    error: (0, type_guards_js_1.isError)(error) ? error.message : 'Doctor command failed',
                    duration
                };
            }
        }
        // VALIDATE command - use bundled validate
        if (command === 'validate') {
            try {
                const pathArgs = args.filter(arg => !arg.startsWith('--') && !arg.startsWith('-'));
                const projectPath = pathArgs[0] || this.workingDirectory;
                const result = await (0, validate_js_1.validateFafFile)(projectPath, { json: true });
                const duration = Date.now() - startTime;
                return {
                    success: result.success,
                    data: result,
                    duration
                };
            }
            catch (error) {
                const duration = Date.now() - startTime;
                return {
                    success: false,
                    error: (0, type_guards_js_1.isError)(error) ? error.message : 'Validate command failed',
                    duration
                };
            }
        }
        // AUDIT command - use bundled audit
        if (command === 'audit') {
            try {
                const pathArgs = args.filter(arg => !arg.startsWith('--') && !arg.startsWith('-'));
                const projectPath = pathArgs[0] || this.workingDirectory;
                const result = await (0, audit_js_1.auditFafFile)(projectPath, { json: true });
                const duration = Date.now() - startTime;
                return {
                    success: result.success,
                    data: result,
                    duration
                };
            }
            catch (error) {
                const duration = Date.now() - startTime;
                return {
                    success: false,
                    error: (0, type_guards_js_1.isError)(error) ? error.message : 'Audit command failed',
                    duration
                };
            }
        }
        // UPDATE command - use bundled update
        if (command === 'update') {
            try {
                const pathArgs = args.filter(arg => !arg.startsWith('--') && !arg.startsWith('-'));
                const projectPath = pathArgs[0] || this.workingDirectory;
                const result = await (0, update_js_1.updateFafFile)(projectPath, { json: true });
                const duration = Date.now() - startTime;
                return {
                    success: result.success,
                    data: result,
                    duration
                };
            }
            catch (error) {
                const duration = Date.now() - startTime;
                return {
                    success: false,
                    error: (0, type_guards_js_1.isError)(error) ? error.message : 'Update command failed',
                    duration
                };
            }
        }
        // MIGRATE command - use bundled migrate
        if (command === 'migrate') {
            try {
                const pathArgs = args.filter(arg => !arg.startsWith('--') && !arg.startsWith('-'));
                const projectPath = pathArgs[0] || this.workingDirectory;
                const force = args.includes('--force');
                const result = await (0, migrate_js_1.migrateFafFile)(projectPath, { force, json: true });
                const duration = Date.now() - startTime;
                return {
                    success: result.success,
                    data: result,
                    duration
                };
            }
            catch (error) {
                const duration = Date.now() - startTime;
                return {
                    success: false,
                    error: (0, type_guards_js_1.isError)(error) ? error.message : 'Migrate command failed',
                    duration
                };
            }
        }
        // INNIT command - use bundled innit (British init)
        if (command === 'innit') {
            try {
                const pathArgs = args.filter(arg => !arg.startsWith('--') && !arg.startsWith('-'));
                const projectPath = pathArgs[0] || this.workingDirectory;
                const force = args.includes('--force');
                const result = await (0, innit_js_1.innitFafFile)(projectPath, { force });
                const duration = Date.now() - startTime;
                return {
                    success: result.success,
                    data: result,
                    duration
                };
            }
            catch (error) {
                const duration = Date.now() - startTime;
                return {
                    success: false,
                    error: (0, type_guards_js_1.isError)(error) ? error.message : 'Innit command failed',
                    duration
                };
            }
        }
        // QUICK command - use bundled quick
        if (command === 'quick') {
            try {
                const pathArgs = args.filter(arg => !arg.startsWith('--') && !arg.startsWith('-'));
                const projectPath = pathArgs[0] || this.workingDirectory;
                const input = pathArgs[1]; // optional input string
                const force = args.includes('--force');
                const json = args.includes('--json');
                const result = await (0, quick_js_1.quickCommand)(projectPath, input, { force, json });
                const duration = Date.now() - startTime;
                return {
                    success: result.success,
                    data: result,
                    duration
                };
            }
            catch (error) {
                const duration = Date.now() - startTime;
                return {
                    success: false,
                    error: (0, type_guards_js_1.isError)(error) ? error.message : 'Quick command failed',
                    duration
                };
            }
        }
        // ENHANCE command - use bundled enhance
        if (command === 'enhance') {
            try {
                const pathArgs = args.filter(arg => !arg.startsWith('--') && !arg.startsWith('-'));
                const projectPath = pathArgs[0] || this.workingDirectory;
                const autoFill = args.includes('--auto-fill');
                const interactive = args.includes('--interactive');
                const json = args.includes('--json');
                const result = await (0, enhance_js_1.enhanceCommand)(projectPath, { autoFill, interactive, json });
                const duration = Date.now() - startTime;
                return {
                    success: result.success,
                    data: result,
                    duration
                };
            }
            catch (error) {
                const duration = Date.now() - startTime;
                return {
                    success: false,
                    error: (0, type_guards_js_1.isError)(error) ? error.message : 'Enhance command failed',
                    duration
                };
            }
        }
        // ============================================================================
        // FALLBACK: Shell out to CLI for commands not yet bundled
        // ============================================================================
        // Check if CLI is available
        if (!this.detectedCliPath) {
            const duration = Date.now() - startTime;
            return {
                success: false,
                error: `FAF CLI not detected. Command '${command}' requires faf-cli.\n\nINSTALLATION ORDER:\n  1️⃣  npm install -g faf-cli\n  2️⃣  npm install -g claude-faf-mcp\n\nAfter installing faf-cli, restart Claude Desktop.`,
                duration
            };
        }
        // Sanitize arguments to prevent injection
        const sanitizedArgs = args.map(arg => typeof arg === 'string' ? arg.replace(/[;&|`$(){}[\]]/g, '') : '');
        try {
            // Use detected absolute path to CLI
            const fullCommand = `"${this.detectedCliPath}" ${command} ${sanitizedArgs.join(' ')}`;
            const { stdout, stderr } = await execAsync(fullCommand, {
                env: getEnhancedEnv(),
                timeout: this.timeout,
                maxBuffer: 1024 * 1024, // 1MB buffer limit
                cwd: this.workingDirectory
            });
            const duration = Date.now() - startTime;
            if (stderr?.trim()) {
                console.warn(`FAF CLI warning: ${stderr.trim()}`);
            }
            return {
                success: true,
                data: this.parseOutput(stdout),
                duration
            };
        }
        catch (error) {
            const duration = Date.now() - startTime;
            let errorMessage = 'Unknown error occurred';
            if ((0, type_guards_js_1.isError)(error)) {
                errorMessage = error.message;
                // Handle specific error codes
                if ('code' in error) {
                    if (error.code === 'ETIMEDOUT') {
                        errorMessage = `Command timed out after ${this.timeout}ms`;
                    }
                    else if (error.code === 'ENOENT') {
                        errorMessage = `FAF CLI not found at ${this.detectedCliPath}. Please reinstall: npm install -g faf-cli`;
                    }
                }
                // Handle signal termination
                if ('signal' in error && error.signal === 'SIGTERM') {
                    errorMessage = 'Command was terminated';
                }
            }
            console.error(`FAF CLI error: ${errorMessage}`);
            return {
                success: false,
                error: errorMessage,
                duration
            };
        }
    }
    parseOutput(output) {
        if (!output || output.trim() === '') {
            return { output: '' };
        }
        try {
            return JSON.parse(output);
        }
        catch {
            return { output: output.trim() };
        }
    }
    // Method to check if FAF CLI is available
    async checkHealth() {
        try {
            const result = await this.callEngine('--version');
            return result.success;
        }
        catch {
            return false;
        }
    }
    // Get the current working directory used by the adapter
    getWorkingDirectory() {
        return this.workingDirectory;
    }
    setWorkingDirectory(dir) {
        if (fs.existsSync(dir)) {
            this.workingDirectory = dir;
        }
    }
    // Auto-detect from file path (when file operations occur)
    updateWorkingDirectoryFromPath(filePath) {
        const dir = path.dirname(filePath);
        if (dir && dir !== '/' && fs.existsSync(dir)) {
            // Only update if it's a real project directory
            if (dir.includes('Users') || dir.includes('home') || dir.includes('projects')) {
                this.workingDirectory = dir;
            }
        }
    }
    // Get the engine path being used
    getEnginePath() {
        return this.enginePath;
    }
    // Get CLI detection info for debugging
    getCliInfo() {
        return {
            detected: this.detectedCliPath !== null,
            path: this.detectedCliPath || undefined,
            version: this.cliVersion
        };
    }
}
exports.FafEngineAdapter = FafEngineAdapter;
//# sourceMappingURL=engine-adapter.js.map