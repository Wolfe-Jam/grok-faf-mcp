"use strict";
/**
 * ⚡ FAF Quick - Lightning-fast .faf creation (Mk3 Bundled)
 * One-liner format for instant context generation
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
exports.quickCommand = quickCommand;
const fs_1 = require("fs");
const path = __importStar(require("path"));
const yaml_1 = require("../fix-once/yaml");
const file_utils_1 = require("../utils/file-utils");
/**
 * Quick format parser - accepts simple comma-separated values
 * Format: "project name, what it does, main language, framework, where deployed"
 */
function parseQuickInput(input) {
    if (!input) {
        return {
            projectName: 'my-project',
            projectGoal: 'Build amazing software',
            mainLanguage: 'TypeScript',
            framework: 'none',
            hosting: 'cloud',
            slotBasedPercentage: 50,
            fafScore: 50
        };
    }
    const parts = input.split(',').map(s => s.trim());
    return {
        projectName: parts[0] || 'my-project',
        projectGoal: parts[1] || 'Build amazing software',
        mainLanguage: parts[2] || 'TypeScript',
        framework: parts[3] || 'none',
        hosting: parts[4] || 'cloud',
        slotBasedPercentage: 60,
        fafScore: 60
    };
}
async function quickCommand(projectPath, input, options = {}) {
    try {
        const fafPath = path.join(projectPath, 'project.faf');
        // Check if file exists
        if (await (0, file_utils_1.fileExists)(fafPath) && !options.force) {
            return {
                success: false,
                created: false,
                message: 'project.faf already exists. Use --force to overwrite.'
            };
        }
        // Parse input
        const parsed = parseQuickInput(input);
        // Generate quick .faf file
        const fafData = {
            faf_version: '2.5.0',
            ai_scoring_system: '2025-09-20',
            ai_score: `${parsed.fafScore}%`,
            ai_confidence: 'MEDIUM',
            ai_value: '30_seconds_replaces_20_minutes_of_questions',
            ai_tldr: {
                project: `${parsed.projectName} - ${parsed.projectGoal}`,
                stack: `${parsed.mainLanguage}/${parsed.framework}`,
                quality_bar: 'ZERO_ERRORS_F1_STANDARDS',
                current_focus: 'Quick start - ready to build',
                your_role: 'Build features with context'
            },
            instant_context: {
                what_building: parsed.projectGoal,
                tech_stack: `${parsed.mainLanguage}/${parsed.framework}`,
                main_language: parsed.mainLanguage,
                deployment: parsed.hosting,
                key_files: ['package.json', 'README.md']
            },
            context_quality: {
                slots_filled: '12/21 (57%)',
                ai_confidence: 'MEDIUM',
                handoff_ready: true,
                missing_context: ['CI/CD pipeline', 'Database', 'Testing strategy']
            },
            project: {
                name: parsed.projectName,
                goal: parsed.projectGoal,
                main_language: parsed.mainLanguage,
                generated: new Date().toISOString(),
                mission: '🚀 Make Your AI Happy! 🧡 Trust-Driven 🤖',
                revolution: '30 seconds replaces 20 minutes of questions',
                brand: 'F1-Inspired Software Engineering - Championship AI Context',
                version: '1.0.0',
                type: parsed.framework.toLowerCase()
            },
            stack: {
                frontend: parsed.framework !== 'none' ? parsed.framework : 'None',
                css_framework: 'None',
                ui_library: 'None',
                state_management: 'None',
                backend: 'Node.js',
                runtime: 'Node.js',
                database: 'None',
                build: 'Vite',
                package_manager: 'npm',
                api_type: 'REST',
                hosting: parsed.hosting,
                cicd: 'None',
                testing: 'None',
                language: parsed.mainLanguage
            },
            preferences: {
                quality_bar: 'zero_errors',
                commit_style: 'conventional_emoji',
                response_style: 'concise_code_first',
                explanation_level: 'minimal',
                communication: 'direct',
                testing: 'required',
                documentation: 'as_needed'
            },
            state: {
                phase: 'development',
                version: '1.0.0',
                focus: 'quick_start',
                status: 'green_flag',
                next_milestone: 'first_feature',
                blockers: null
            },
            tags: {
                auto_generated: [parsed.projectName.toLowerCase(), parsed.mainLanguage.toLowerCase()],
                smart_defaults: ['.faf', 'ai-ready', '2025', 'quick-start'],
                user_defined: null
            },
            meta: {
                last_enhanced: new Date().toISOString(),
                enhanced_by: 'faf-quick-command'
            }
        };
        // Write file
        const yamlContent = (0, yaml_1.stringify)(fafData);
        await fs_1.promises.writeFile(fafPath, yamlContent, 'utf-8');
        return {
            success: true,
            created: true,
            filePath: fafPath,
            message: `⚡ Created project.faf at ${fafPath} - Score: ${parsed.fafScore}%`
        };
    }
    catch (error) {
        return {
            success: false,
            created: false,
            message: error instanceof Error ? error.message : 'Quick command failed'
        };
    }
}
//# sourceMappingURL=quick.js.map