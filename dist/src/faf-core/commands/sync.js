"use strict";
/**
 * 🔄 faf sync - Sync Command (Mk3 Bundled)
 * Sync project.faf file with project changes (package.json, git, etc.)
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
exports.syncFafFile = syncFafFile;
const fs_1 = require("fs");
const path = __importStar(require("path"));
const yaml_1 = require("../fix-once/yaml");
const file_utils_1 = require("../utils/file-utils");
async function syncFafFile(projectPath, options = {}) {
    try {
        const fafPath = projectPath ? path.join(projectPath, 'project.faf') : await (0, file_utils_1.findFafFile)();
        if (!fafPath || !await (0, file_utils_1.fileExists)(fafPath)) {
            return {
                success: false,
                changesDetected: 0,
                changesApplied: 0,
                message: 'No project.faf file found. Run faf init first.'
            };
        }
        // Read current .faf file
        const content = await fs_1.promises.readFile(fafPath, 'utf-8');
        const fafData = (0, yaml_1.parse)(content);
        // Detect changes
        const changes = await detectProjectChanges(fafData, path.dirname(fafPath));
        if (changes.length === 0) {
            return {
                success: true,
                changesDetected: 0,
                changesApplied: 0,
                message: 'project.faf file is up to date'
            };
        }
        if (options.dryRun) {
            return {
                success: true,
                changesDetected: changes.length,
                changesApplied: 0,
                message: `Found ${changes.length} potential updates (dry run - no changes applied)`
            };
        }
        // Apply changes if auto mode
        if (options.auto) {
            applyChanges(fafData, changes);
            // Update generated timestamp
            if (!fafData.meta)
                fafData.meta = {};
            fafData.meta.last_sync = new Date().toISOString();
            // Write updated .faf file
            const updatedContent = (0, yaml_1.stringify)(fafData);
            await fs_1.promises.writeFile(fafPath, updatedContent, 'utf-8');
            return {
                success: true,
                changesDetected: changes.length,
                changesApplied: changes.length,
                message: `Applied ${changes.length} changes to project.faf`
            };
        }
        return {
            success: true,
            changesDetected: changes.length,
            changesApplied: 0,
            message: `Found ${changes.length} potential updates. Run with --auto to apply.`
        };
    }
    catch (error) {
        return {
            success: false,
            changesDetected: 0,
            changesApplied: 0,
            message: error instanceof Error ? error.message : 'Sync failed'
        };
    }
}
async function detectProjectChanges(fafData, projectRoot) {
    const changes = [];
    try {
        // Check package.json changes
        const packageJsonPath = path.join(projectRoot, 'package.json');
        if (await (0, file_utils_1.fileExists)(packageJsonPath)) {
            const packageContent = await fs_1.promises.readFile(packageJsonPath, 'utf-8');
            const packageData = JSON.parse(packageContent);
            // Project name change
            if (packageData.name && packageData.name !== fafData.project?.name) {
                changes.push({
                    path: 'project.name',
                    description: 'Project name changed in package.json',
                    oldValue: fafData.project?.name || 'undefined',
                    newValue: packageData.name,
                    confidence: 'high'
                });
            }
            // Description/goal change
            if (packageData.description && packageData.description !== fafData.project?.goal) {
                changes.push({
                    path: 'project.goal',
                    description: 'Project description changed in package.json',
                    oldValue: fafData.project?.goal || 'undefined',
                    newValue: packageData.description,
                    confidence: 'medium'
                });
            }
            // Dependencies changes - detect frameworks
            const deps = {
                ...packageData.dependencies,
                ...packageData.devDependencies
            };
            // Check for framework changes
            if (deps.svelte && !fafData.stack?.frontend?.includes('Svelte')) {
                changes.push({
                    path: 'stack.frontend',
                    description: 'Svelte dependency detected',
                    oldValue: fafData.stack?.frontend || '',
                    newValue: 'Svelte',
                    confidence: 'high'
                });
            }
            if (deps.react && !fafData.stack?.frontend?.includes('React')) {
                changes.push({
                    path: 'stack.frontend',
                    description: 'React dependency detected',
                    oldValue: fafData.stack?.frontend || '',
                    newValue: 'React',
                    confidence: 'high'
                });
            }
            if (deps.vue && !fafData.stack?.frontend?.includes('Vue')) {
                changes.push({
                    path: 'stack.frontend',
                    description: 'Vue dependency detected',
                    oldValue: fafData.stack?.frontend || '',
                    newValue: 'Vue',
                    confidence: 'high'
                });
            }
        }
        // Check if generated timestamp is very old (30+ days)
        if (fafData.meta?.generated) {
            const generatedDate = new Date(fafData.meta.generated);
            const daysSince = Math.abs(Date.now() - generatedDate.getTime()) / (1000 * 60 * 60 * 24);
            if (daysSince > 30) {
                changes.push({
                    path: 'meta.generated',
                    description: `Generated timestamp is ${Math.round(daysSince)} days old`,
                    oldValue: fafData.meta.generated,
                    newValue: new Date().toISOString(),
                    confidence: 'high'
                });
            }
        }
    }
    catch {
        // Continue with what we have
    }
    return changes;
}
function applyChanges(fafData, changes) {
    changes.forEach(change => {
        if (change.confidence === 'high' || change.confidence === 'medium') {
            setNestedValue(fafData, change.path, change.newValue);
        }
    });
}
function setNestedValue(obj, path, value) {
    const parts = path.split('.');
    let current = obj;
    for (let i = 0; i < parts.length - 1; i++) {
        if (!current[parts[i]]) {
            current[parts[i]] = {};
        }
        current = current[parts[i]];
    }
    current[parts[parts.length - 1]] = value;
}
//# sourceMappingURL=sync.js.map