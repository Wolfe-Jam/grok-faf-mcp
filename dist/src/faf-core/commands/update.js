"use strict";
/**
 * 📦 faf update - Update project.faf metadata (Mk3 Bundled)
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateFafFile = updateFafFile;
const fs_1 = require("fs");
const yaml_1 = require("../fix-once/yaml");
const file_utils_1 = require("../utils/file-utils");
async function updateFafFile(projectPath, options = {}) {
    try {
        const fafPath = projectPath ? `${projectPath}/project.faf` : await (0, file_utils_1.findFafFile)();
        if (!fafPath || !await (0, file_utils_1.fileExists)(fafPath)) {
            return {
                success: false,
                updated: false,
                message: 'No project.faf file found'
            };
        }
        // Read current file
        const content = await fs_1.promises.readFile(fafPath, 'utf-8');
        const fafData = (0, yaml_1.parse)(content);
        // Update metadata
        if (!fafData.meta) {
            fafData.meta = {};
        }
        fafData.meta.last_updated = new Date().toISOString();
        fafData.meta.updated_by = 'faf-update-command';
        // Write updated file
        const updatedContent = (0, yaml_1.stringify)(fafData);
        await fs_1.promises.writeFile(fafPath, updatedContent, 'utf-8');
        return {
            success: true,
            updated: true,
            message: 'project.faf metadata updated successfully'
        };
    }
    catch (error) {
        return {
            success: false,
            updated: false,
            message: error instanceof Error ? error.message : 'Update failed'
        };
    }
}
//# sourceMappingURL=update.js.map