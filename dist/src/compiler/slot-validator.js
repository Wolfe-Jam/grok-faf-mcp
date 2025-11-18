"use strict";
/**
 * Slot Validator - FAF Compiler Engine MK3
 * Championship-grade slot validation with .faf content analysis
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
exports.SlotValidator = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const yaml = __importStar(require("js-yaml"));
const slots_1 = require("../types/slots");
const project_types_1 = require("../types/project-types");
class SlotValidator {
    /**
     * Validate all slots against project type
     */
    validate(fafContent, projectType) {
        const allSlots = slots_1.UNIVERSAL_SLOTS;
        const ignoredSlots = project_types_1.SLOT_IGNORE_BY_TYPE[projectType];
        const relevantSlots = 21 - ignoredSlots.length;
        // Check each slot
        const slots = allSlots.map(slot => {
            const slotName = slot.name;
            const isIgnored = ignoredSlots.includes(slotName);
            const isRequired = !isIgnored;
            const isFilled = this.isSlotFilled(slotName, fafContent);
            return {
                slotNumber: slot.number,
                slotName: slotName,
                required: isRequired,
                filled: isFilled,
                value: this.getSlotValue(slotName, fafContent),
                points: isFilled && isRequired ? 1 : 0,
            };
        });
        // Count filled slots (only count required slots)
        const filledSlots = slots.filter(s => s.required && s.filled).length;
        // Calculate score
        const score = Math.round((filledSlots / relevantSlots) * 100);
        // Determine medal
        const medal = this.getMedal(score);
        return {
            totalSlots: 21,
            relevantSlots,
            filledSlots,
            slots,
            score,
            medal,
        };
    }
    /**
     * Check if a specific slot is filled in .faf content
     */
    isSlotFilled(slotName, fafContent) {
        if (!fafContent)
            return false;
        // Map slot names to .faf structure
        switch (slotName) {
            // Core Project (Slots 1-4)
            case 'project_identity':
                return !!(fafContent.project?.name &&
                    fafContent.project?.version);
            case 'language':
                return !!(fafContent.tech?.language ||
                    fafContent.project?.primary_language);
            case 'human_context':
                return !!(fafContent.human_context?.what ||
                    fafContent.human_context?.why ||
                    fafContent.project?.goal);
            case 'documentation':
                return !!(fafContent.files?.readme ||
                    fafContent.files?.claude_md ||
                    fafContent.documentation);
            // Stack (Slots 5-14)
            case 'frontend':
                return !!(fafContent.tech?.frontend ||
                    fafContent.stack?.frontend ||
                    this.hasFramework(fafContent, ['react', 'vue', 'svelte', 'angular']));
            case 'backend':
                return !!(fafContent.tech?.backend ||
                    fafContent.stack?.backend ||
                    this.hasFramework(fafContent, ['express', 'fastapi', 'nestjs', 'rails']));
            case 'database':
                return !!(fafContent.tech?.database ||
                    fafContent.stack?.database ||
                    this.hasFramework(fafContent, ['postgresql', 'mongodb', 'mysql', 'supabase']));
            case 'build_tool':
                return !!(fafContent.tech?.build ||
                    fafContent.stack?.build_tool ||
                    this.hasFramework(fafContent, ['vite', 'webpack', 'esbuild', 'rollup']));
            case 'package_manager':
                return !!(fafContent.tech?.package_manager ||
                    fafContent.stack?.package_manager ||
                    this.hasFramework(fafContent, ['npm', 'pnpm', 'yarn', 'bun']));
            case 'api':
                return !!(fafContent.tech?.api ||
                    fafContent.stack?.api ||
                    fafContent.api_type);
            case 'hosting':
                return !!(fafContent.tech?.hosting ||
                    fafContent.stack?.hosting ||
                    fafContent.deployment?.platform);
            case 'cicd':
                return !!(fafContent.tech?.cicd ||
                    fafContent.stack?.cicd ||
                    fafContent.ci_cd);
            case 'testing':
                return !!(fafContent.tech?.testing ||
                    fafContent.stack?.testing ||
                    this.hasFramework(fafContent, ['vitest', 'jest', 'pytest', 'mocha']));
            case 'css':
                return !!(fafContent.tech?.css ||
                    fafContent.stack?.styling ||
                    this.hasFramework(fafContent, ['tailwind', 'css-modules', 'styled-components']));
            // Architecture (Slots 15-21)
            case 'ui_library':
                return !!(fafContent.tech?.ui_library ||
                    fafContent.stack?.ui_components ||
                    this.hasFramework(fafContent, ['shadcn', 'mui', 'chakra']));
            case 'state':
                return !!(fafContent.tech?.state ||
                    fafContent.stack?.state_management ||
                    this.hasFramework(fafContent, ['zustand', 'redux', 'mobx']));
            case 'runtime':
                return !!(fafContent.tech?.runtime ||
                    fafContent.stack?.runtime ||
                    this.hasFramework(fafContent, ['node', 'deno', 'bun', 'browser']));
            case 'auth':
                return !!(fafContent.tech?.auth ||
                    fafContent.stack?.authentication ||
                    fafContent.authentication);
            case 'storage':
                return !!(fafContent.tech?.storage ||
                    fafContent.stack?.file_storage ||
                    fafContent.storage);
            case 'caching':
                return !!(fafContent.tech?.caching ||
                    fafContent.stack?.caching ||
                    this.hasFramework(fafContent, ['redis', 'memcached']));
            case 'team':
                return !!(fafContent.team ||
                    fafContent.workflow ||
                    fafContent.contributors);
            default:
                return false;
        }
    }
    /**
     * Get the value of a slot from .faf content
     */
    getSlotValue(slotName, fafContent) {
        if (!fafContent)
            return null;
        switch (slotName) {
            case 'project_identity':
                return {
                    name: fafContent.project?.name,
                    version: fafContent.project?.version,
                    type: fafContent.project?.type,
                };
            case 'language':
                return fafContent.tech?.language || fafContent.project?.primary_language;
            case 'human_context':
                return fafContent.human_context;
            case 'frontend':
                return fafContent.tech?.frontend || fafContent.stack?.frontend;
            case 'backend':
                return fafContent.tech?.backend || fafContent.stack?.backend;
            case 'database':
                return fafContent.tech?.database || fafContent.stack?.database;
            case 'build_tool':
                return fafContent.tech?.build || fafContent.stack?.build_tool;
            case 'package_manager':
                return fafContent.tech?.package_manager || fafContent.stack?.package_manager;
            case 'api':
                return fafContent.tech?.api || fafContent.api_type;
            case 'hosting':
                return fafContent.tech?.hosting || fafContent.deployment?.platform;
            case 'cicd':
                return fafContent.tech?.cicd || fafContent.ci_cd;
            case 'testing':
                return fafContent.tech?.testing || fafContent.stack?.testing;
            case 'css':
                return fafContent.tech?.css || fafContent.stack?.styling;
            case 'ui_library':
                return fafContent.tech?.ui_library || fafContent.stack?.ui_components;
            case 'state':
                return fafContent.tech?.state || fafContent.stack?.state_management;
            case 'runtime':
                return fafContent.tech?.runtime || fafContent.stack?.runtime;
            case 'auth':
                return fafContent.tech?.auth || fafContent.authentication;
            case 'storage':
                return fafContent.tech?.storage || fafContent.storage;
            case 'caching':
                return fafContent.tech?.caching || fafContent.stack?.caching;
            case 'team':
                return fafContent.team || fafContent.workflow;
            default:
                return null;
        }
    }
    /**
     * Helper: Check if fafContent has a specific framework
     */
    hasFramework(fafContent, frameworks) {
        if (!fafContent)
            return false;
        // Check in various locations
        const techString = JSON.stringify(fafContent.tech || {}).toLowerCase();
        const stackString = JSON.stringify(fafContent.stack || {}).toLowerCase();
        const allString = JSON.stringify(fafContent).toLowerCase();
        return frameworks.some(fw => {
            const lowerFw = fw.toLowerCase();
            return techString.includes(lowerFw) ||
                stackString.includes(lowerFw) ||
                allString.includes(lowerFw);
        });
    }
    /**
     * Determine medal from score
     */
    getMedal(score) {
        if (score >= 85)
            return 'trophy'; // 🏆
        if (score >= 70)
            return 'gold'; // 🥇
        if (score >= 55)
            return 'silver'; // 🥈
        if (score >= 40)
            return 'bronze'; // 🥉
        if (score >= 20)
            return 'red'; // 🔴
        return 'white'; // 🤍
    }
    /**
     * Load and parse .faf file from directory
     */
    static async loadFafFile(projectPath) {
        try {
            // Try .faf first
            let fafPath = path.join(projectPath, '.faf');
            if (!fs.existsSync(fafPath)) {
                // Try project.faf (v1.2.0 standard)
                fafPath = path.join(projectPath, 'project.faf');
            }
            if (!fs.existsSync(fafPath)) {
                return null;
            }
            const content = fs.readFileSync(fafPath, 'utf-8');
            return yaml.load(content);
        }
        catch (error) {
            console.error('Error loading .faf file:', error);
            return null;
        }
    }
}
exports.SlotValidator = SlotValidator;
//# sourceMappingURL=slot-validator.js.map