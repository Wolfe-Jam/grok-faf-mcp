"use strict";
/**
 * 🔗 Bi-Sync Engine - Mk3 Bundled Edition
 * Revolutionary project.faf ↔ CLAUDE.md Synchronization
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
exports.fafToPlatformFormat = fafToPlatformFormat;
exports.syncBiDirectional = syncBiDirectional;
const yaml_1 = require("../fix-once/yaml");
const path = __importStar(require("path"));
const fs_1 = require("fs");
const file_utils_1 = require("../utils/file-utils");
const PLATFORM_TARGETS = {
    '.clinerules': { filename: '.clinerules', displayName: 'Cline' },
    '.cursorrules': { filename: '.cursorrules', displayName: 'Cursor' },
    '.windsurfrules': { filename: '.windsurfrules', displayName: 'Windsurf' },
    'CLAUDE.md': { filename: 'CLAUDE.md', displayName: 'Claude Desktop' }
};
async function detectPlatformTargets(projectDir) {
    const existingTargets = [];
    for (const targetKey of Object.keys(PLATFORM_TARGETS)) {
        const targetPath = path.join(projectDir, PLATFORM_TARGETS[targetKey].filename);
        if (await (0, file_utils_1.fileExists)(targetPath)) {
            existingTargets.push(targetKey);
        }
    }
    return existingTargets;
}
function resolveTargets(targetOption, existingTargets) {
    if (targetOption === 'all') {
        return Object.keys(PLATFORM_TARGETS);
    }
    if (targetOption && targetOption !== 'auto' && PLATFORM_TARGETS[targetOption]) {
        return [targetOption];
    }
    // Auto-detect: use existing files or default to CLAUDE.md
    return existingTargets.length > 0 ? existingTargets : ['CLAUDE.md'];
}
/**
 * 🔄 Convert project.faf YAML content to platform-specific format
 */
function fafToPlatformFormat(fafContent, targetPlatform) {
    try {
        const fafData = (0, yaml_1.parse)(fafContent);
        const platformInfo = PLATFORM_TARGETS[targetPlatform] || PLATFORM_TARGETS['CLAUDE.md'];
        const headerName = platformInfo.filename.toUpperCase().replace(/\./g, '');
        let content = `# 🏎️ ${headerName} - ${fafData.project?.name || 'Project'} Persistent Context\n\n`;
        content += `**Platform:** ${platformInfo.displayName}\n`;
        content += `**Synced from:** project.faf (IANA format: application/vnd.faf+yaml)\n\n`;
        // Project State
        if (fafData.project) {
            content += `## PROJECT STATE: ${fafData.context_quality?.overall_assessment || 'ACTIVE'} 🚀\n`;
            if (fafData.project.goal) {
                content += `**Current Position:** ${fafData.project.goal}\n`;
            }
            content += `**Tyre Compound:** ULTRASOFT C5 (Maximum Performance)\n\n`;
            content += `---\n\n`;
        }
        // Core Context
        content += `## 🎨 CORE CONTEXT\n\n`;
        if (fafData.project) {
            content += `### Project Identity\n`;
            content += `- **Name:** ${fafData.project.name || 'Unknown'}\n`;
            if (fafData.instant_context?.tech_stack) {
                content += `- **Stack:** ${fafData.instant_context.tech_stack}\n`;
            }
            content += `- **Quality:** F1-INSPIRED (Championship Performance)\n\n`;
        }
        // Technical Context
        if (fafData.instant_context) {
            content += `### Technical Architecture\n`;
            if (fafData.instant_context.what_building) {
                content += `- **What Building:** ${fafData.instant_context.what_building}\n`;
            }
            if (fafData.instant_context.main_language) {
                content += `- **Main Language:** ${fafData.instant_context.main_language}\n`;
            }
            content += `\n`;
        }
        // Context Quality
        if (fafData.context_quality) {
            content += `### 📊 Context Quality Status\n`;
            content += `- **Overall Assessment:** ${fafData.context_quality.overall_assessment || 'Good'}\n`;
            content += `- **Last Updated:** ${new Date().toISOString().split('T')[0]}\n\n`;
        }
        // Championship Footer
        content += `---\n\n`;
        content += `**STATUS: BI-SYNC ACTIVE 🔗 - Synchronized with project.faf (.FAF Foundation)**\n\n`;
        content += `*Last Sync: ${new Date().toISOString()}*\n`;
        content += `*Sync Engine: .FAF Foundation*\n`;
        content += `*Target Platform: ${platformInfo.displayName}*\n`;
        content += `*🏎️⚡️_championship_sync*\n`;
        return content;
    }
    catch (error) {
        throw new Error(`Failed to convert .faf to CLAUDE.md: ${error instanceof Error ? error.message : String(error)}`);
    }
}
/**
 * 🔗 Main Bi-Sync function - Platform-Aware
 */
async function syncBiDirectional(projectPath, options = {}) {
    const startTime = Date.now();
    const result = {
        success: false,
        direction: 'none',
        filesChanged: [],
        conflicts: [],
        duration: 0,
        message: ''
    };
    try {
        // Find project.faf file
        const fafPath = projectPath ? path.join(projectPath, 'project.faf') : await (0, file_utils_1.findFafFile)();
        if (!fafPath || !await (0, file_utils_1.fileExists)(fafPath)) {
            result.message = 'No project.faf file found. Run faf init first.';
            result.duration = Date.now() - startTime;
            return result;
        }
        const projectDir = path.dirname(fafPath);
        // Detect existing platform files
        const existingTargets = await detectPlatformTargets(projectDir);
        // Resolve which targets to sync
        const targetsToSync = resolveTargets(options.target, existingTargets);
        // Read .faf content
        const fafContent = await fs_1.promises.readFile(fafPath, 'utf-8');
        const fafData = (0, yaml_1.parse)(fafContent);
        const currentScore = fafData.faf_score || '0%';
        // Sync to all resolved targets
        for (const target of targetsToSync) {
            const platformInfo = PLATFORM_TARGETS[target];
            let targetPath = path.join(projectDir, platformInfo.filename);
            // Special handling for CLAUDE.md - detect case-insensitive
            if (target === 'CLAUDE.md') {
                const lowercasePath = path.join(projectDir, 'claude.md');
                if (await (0, file_utils_1.fileExists)(lowercasePath)) {
                    targetPath = lowercasePath; // Update existing lowercase file
                }
            }
            // Generate platform-specific content
            const platformContent = fafToPlatformFormat(fafContent, target);
            await fs_1.promises.writeFile(targetPath, platformContent, 'utf-8');
            result.filesChanged.push(path.basename(targetPath));
        }
        result.success = true;
        result.direction = 'faf-to-claude'; // Keep for backward compat
        result.duration = Date.now() - startTime;
        if (targetsToSync.length === 1) {
            const platformName = PLATFORM_TARGETS[targetsToSync[0]].displayName;
            result.message = `Synced to ${platformName}! FAF Score: ${currentScore}`;
        }
        else {
            const platforms = targetsToSync.map(t => PLATFORM_TARGETS[t].displayName).join(', ');
            result.message = `Synced to ${targetsToSync.length} platforms (${platforms})! FAF Score: ${currentScore}`;
        }
        return result;
    }
    catch (error) {
        result.duration = Date.now() - startTime;
        result.message = error instanceof Error ? error.message : 'Sync failed';
        return result;
    }
}
//# sourceMappingURL=bi-sync.js.map