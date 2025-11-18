/**
 * 🔗 Bi-Sync Engine - Mk3 Bundled Edition
 * Revolutionary project.faf ↔ CLAUDE.md Synchronization
 */

import { parse as parseYAML, stringify as stringifyYAML } from '../fix-once/yaml';
import * as path from 'path';
import { promises as fs } from 'fs';
import { findFafFile, fileExists } from '../utils/file-utils';

export interface BiSyncOptions {
  auto?: boolean;
  watch?: boolean;
  force?: boolean;
  json?: boolean;
  target?: 'auto' | '.clinerules' | '.cursorrules' | '.windsurfrules' | 'CLAUDE.md' | 'all';
}

export interface BiSyncResult {
  success: boolean;
  direction: 'faf-to-claude' | 'claude-to-faf' | 'bidirectional' | 'none';
  filesChanged: string[];
  conflicts: string[];
  duration: number;
  message: string;
}

/**
 * 🎯 Platform Detection & Target Resolution
 */
interface PlatformTarget {
  filename: string;
  displayName: string;
}

const PLATFORM_TARGETS: Record<string, PlatformTarget> = {
  '.clinerules': { filename: '.clinerules', displayName: 'Cline' },
  '.cursorrules': { filename: '.cursorrules', displayName: 'Cursor' },
  '.windsurfrules': { filename: '.windsurfrules', displayName: 'Windsurf' },
  'CLAUDE.md': { filename: 'CLAUDE.md', displayName: 'Claude Desktop' }
};

async function detectPlatformTargets(projectDir: string): Promise<string[]> {
  const existingTargets: string[] = [];

  for (const targetKey of Object.keys(PLATFORM_TARGETS)) {
    const targetPath = path.join(projectDir, PLATFORM_TARGETS[targetKey].filename);
    if (await fileExists(targetPath)) {
      existingTargets.push(targetKey);
    }
  }

  return existingTargets;
}

function resolveTargets(targetOption: string | undefined, existingTargets: string[]): string[] {
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
export function fafToPlatformFormat(fafContent: string, targetPlatform: string): string {
  try {
    const fafData = parseYAML(fafContent);
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

  } catch (error) {
    throw new Error(`Failed to convert .faf to CLAUDE.md: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * 🔗 Main Bi-Sync function - Platform-Aware
 */
export async function syncBiDirectional(projectPath?: string, options: BiSyncOptions = {}): Promise<BiSyncResult> {
  const startTime = Date.now();
  const result: BiSyncResult = {
    success: false,
    direction: 'none',
    filesChanged: [],
    conflicts: [],
    duration: 0,
    message: ''
  };

  try {
    // Find project.faf file
    const fafPath = projectPath ? path.join(projectPath, 'project.faf') : await findFafFile();

    if (!fafPath || !await fileExists(fafPath)) {
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
    const fafContent = await fs.readFile(fafPath, 'utf-8');
    const fafData = parseYAML(fafContent);
    const currentScore = fafData.faf_score || '0%';

    // Sync to all resolved targets
    for (const target of targetsToSync) {
      const platformInfo = PLATFORM_TARGETS[target];
      let targetPath = path.join(projectDir, platformInfo.filename);

      // Special handling for CLAUDE.md - detect case-insensitive
      if (target === 'CLAUDE.md') {
        const lowercasePath = path.join(projectDir, 'claude.md');
        if (await fileExists(lowercasePath)) {
          targetPath = lowercasePath; // Update existing lowercase file
        }
      }

      // Generate platform-specific content
      const platformContent = fafToPlatformFormat(fafContent, target);
      await fs.writeFile(targetPath, platformContent, 'utf-8');

      result.filesChanged.push(path.basename(targetPath));
    }

    result.success = true;
    result.direction = 'faf-to-claude'; // Keep for backward compat
    result.duration = Date.now() - startTime;

    if (targetsToSync.length === 1) {
      const platformName = PLATFORM_TARGETS[targetsToSync[0]].displayName;
      result.message = `Synced to ${platformName}! FAF Score: ${currentScore}`;
    } else {
      const platforms = targetsToSync.map(t => PLATFORM_TARGETS[t].displayName).join(', ');
      result.message = `Synced to ${targetsToSync.length} platforms (${platforms})! FAF Score: ${currentScore}`;
    }

    return result;

  } catch (error) {
    result.duration = Date.now() - startTime;
    result.message = error instanceof Error ? error.message : 'Sync failed';
    return result;
  }
}
