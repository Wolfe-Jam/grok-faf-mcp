"use strict";
/**
 * 🔍 faf validate - Validation Command (Mk3 Bundled)
 * Validates project.faf files with detailed feedback
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateFafFile = validateFafFile;
const fs_1 = require("fs");
const yaml_1 = require("../fix-once/yaml");
const file_utils_1 = require("../utils/file-utils");
async function validateFafFile(projectPath, options = {}) {
    try {
        const fafPath = projectPath ? `${projectPath}/project.faf` : await (0, file_utils_1.findFafFile)();
        if (!fafPath || !await (0, file_utils_1.fileExists)(fafPath)) {
            return {
                success: false,
                valid: false,
                errors: [{ message: 'No project.faf file found', severity: 'error' }],
                warnings: [],
                message: 'No project.faf file found. Run faf init first.'
            };
        }
        // Read and parse project.faf file
        const content = await fs_1.promises.readFile(fafPath, 'utf-8');
        let fafData;
        try {
            fafData = (0, yaml_1.parse)(content);
        }
        catch (parseError) {
            return {
                success: false,
                valid: false,
                errors: [{ message: 'Invalid YAML syntax', severity: 'error' }],
                warnings: [],
                message: 'project.faf contains invalid YAML'
            };
        }
        // Validate structure
        const errors = [];
        const warnings = [];
        // Check required top-level fields
        if (!fafData.faf_version) {
            errors.push({ message: 'Missing required field: faf_version', path: 'faf_version', severity: 'error' });
        }
        if (!fafData.project) {
            errors.push({ message: 'Missing required section: project', path: 'project', severity: 'error' });
        }
        else {
            if (!fafData.project.name) {
                errors.push({ message: 'Missing required field: project.name', path: 'project.name', severity: 'error' });
            }
            if (!fafData.project.goal) {
                warnings.push({ message: 'Missing recommended field: project.goal', path: 'project.goal', severity: 'warning' });
            }
        }
        if (!fafData.instant_context) {
            warnings.push({ message: 'Missing recommended section: instant_context', path: 'instant_context', severity: 'warning' });
        }
        if (!fafData.stack) {
            warnings.push({ message: 'Missing recommended section: stack', path: 'stack', severity: 'warning' });
        }
        const valid = errors.length === 0;
        return {
            success: true,
            valid,
            errors,
            warnings,
            message: valid ? 'Valid project.faf file' : `Invalid project.faf file (${errors.length} errors, ${warnings.length} warnings)`
        };
    }
    catch (error) {
        return {
            success: false,
            valid: false,
            errors: [{ message: error instanceof Error ? error.message : 'Validation failed', severity: 'error' }],
            warnings: [],
            message: 'Validation failed'
        };
    }
}
//# sourceMappingURL=validate.js.map