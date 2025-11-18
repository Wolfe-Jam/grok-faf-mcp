"use strict";
/**
 * 🔍 faf audit - Comprehensive Quality Audit (Mk3 Bundled)
 * Audit project.faf quality and completeness
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.auditFafFile = auditFafFile;
const fs_1 = require("fs");
const yaml_1 = require("../fix-once/yaml");
const file_utils_1 = require("../utils/file-utils");
const faf_compiler_1 = require("../compiler/faf-compiler");
async function auditFafFile(projectPath, options = {}) {
    try {
        const fafPath = projectPath ? `${projectPath}/project.faf` : await (0, file_utils_1.findFafFile)();
        if (!fafPath || !await (0, file_utils_1.fileExists)(fafPath)) {
            return {
                success: false,
                score: 0,
                grade: 'F',
                issues: [{ severity: 'high', message: 'No project.faf file found', fix: 'Run faf init' }],
                strengths: [],
                message: 'No project.faf file found'
            };
        }
        // Read and parse
        const content = await fs_1.promises.readFile(fafPath, 'utf-8');
        const fafData = (0, yaml_1.parse)(content);
        // Run compiler scoring
        const compiler = new faf_compiler_1.FafCompiler();
        const scoreResult = await compiler.compile(fafPath);
        const issues = [];
        const strengths = [];
        // Audit checks
        if (!fafData.project?.name) {
            issues.push({ severity: 'high', message: 'Missing project name', fix: 'Add project.name field' });
        }
        else {
            strengths.push('Project name defined');
        }
        if (!fafData.project?.goal) {
            issues.push({ severity: 'medium', message: 'Missing project goal', fix: 'Add project.goal field' });
        }
        else {
            strengths.push('Project goal defined');
        }
        if (!fafData.stack?.frontend && !fafData.stack?.backend) {
            issues.push({ severity: 'medium', message: 'Stack information incomplete', fix: 'Add stack details' });
        }
        else {
            strengths.push('Stack information present');
        }
        if (!fafData.instant_context?.what_building) {
            issues.push({ severity: 'low', message: 'Missing instant context', fix: 'Add what_building description' });
        }
        else {
            strengths.push('Instant context defined');
        }
        // Determine grade
        const grade = scoreResult.score >= 90 ? 'A' :
            scoreResult.score >= 80 ? 'B' :
                scoreResult.score >= 70 ? 'C' :
                    scoreResult.score >= 60 ? 'D' : 'F';
        return {
            success: true,
            score: scoreResult.score,
            grade,
            issues,
            strengths,
            message: `Audit complete - Score: ${scoreResult.score}% (Grade: ${grade})`
        };
    }
    catch (error) {
        return {
            success: false,
            score: 0,
            grade: 'F',
            issues: [{ severity: 'high', message: error instanceof Error ? error.message : 'Audit failed' }],
            strengths: [],
            message: 'Audit failed'
        };
    }
}
//# sourceMappingURL=audit.js.map