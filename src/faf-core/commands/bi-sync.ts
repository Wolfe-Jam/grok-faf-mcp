/**
 * 🔗 Bi-Sync Engine - Mk3 Bundled Edition
 * Revolutionary project.faf ↔ CLAUDE.md Synchronization
 */

import { parse as parseYAML } from '../fix-once/yaml';
import * as path from 'path';
import { promises as fs } from 'fs';
import { findFafFile, fileExists } from '../utils/file-utils';
import { injectFafBlock } from '../inject';

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
  /** faf-cli's notes on files it prefixed instead of replacing (legacy stamp, unpaired marker). */
  notes?: string[];
  /** Files faf left unchanged, with the reason (not UTF-8, a link out of the project, inside .git, no permission). */
  refused?: Array<{ file: string; reason: string }>;
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

  // Read the folder once. CLAUDE.md matches in any case (claude.md, Claude.md),
  // the same on every OS; the other files match exactly.
  const entries = await fs.readdir(projectDir).catch(() => [] as string[]);
  for (const targetKey of Object.keys(PLATFORM_TARGETS)) {
    const name = PLATFORM_TARGETS[targetKey].filename;
    const found = targetKey === 'CLAUDE.md'
      ? entries.some((e) => e.toLowerCase() === 'claude.md')
      : entries.includes(name);
    if (found) existingTargets.push(targetKey);
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
      content += `\n`;
    }

    // Championship Footer
    content += `---\n\n`;
    content += `**STATUS: SYNC ACTIVE - written from project.faf (one way)**\n\n`;
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

    // An unknown target is an error, not a silent "auto".
    const known = ['auto', 'all', ...Object.keys(PLATFORM_TARGETS)];
    if (options.target !== undefined && !known.includes(options.target)) {
      result.message = `Unknown target "${String(options.target)}". Use one of: ${known.join(', ')}.`;
      result.duration = Date.now() - startTime;
      return result;
    }

    // Detect existing platform files
    const existingTargets = await detectPlatformTargets(projectDir);

    // Resolve which targets to sync
    const targetsToSync = resolveTargets(options.target, existingTargets);

    // Read .faf content; a project.faf that isn't valid YAML stops here, before any file is written.
    const fafContent = await fs.readFile(fafPath, 'utf-8');
    parseYAML(fafContent);

    // Sync to all resolved targets
    for (const target of targetsToSync) {
      const platformInfo = PLATFORM_TARGETS[target];
      let targetPath = path.join(projectDir, platformInfo.filename);

      // CLAUDE.md: write the file the user already has, under its real name (claude.md,
      // Claude.md …). Read the folder listing: on a case-insensitive disk (macOS),
      // fileExists('claude.md') is true for CLAUDE.md and would rename it in the reply.
      if (target === 'CLAUDE.md') {
        const entries = await fs.readdir(projectDir).catch(() => [] as string[]);
        const existing = entries.includes('CLAUDE.md')
          ? 'CLAUDE.md'
          : entries.find((e) => e.toLowerCase() === 'claude.md');
        if (existing) targetPath = path.join(projectDir, existing);
      }

      // Generate platform-specific content — non-destructive: inject/update the faf block, preserve the rest.
      // Each file on its own: a file faf refuses is reported and the others still sync.
      const platformContent = fafToPlatformFormat(fafContent, target);
      try {
        const note = await injectFafBlock(targetPath, platformContent);
        if (note) (result.notes ??= []).push(note);
        result.filesChanged.push(path.basename(targetPath));
      } catch (error) {
        // faf-cli names the file by its absolute path; say it by its name in the project.
        const raw = error instanceof Error ? error.message : String(error);
        (result.refused ??= []).push({
          file: path.basename(targetPath),
          // Drop any absolute folder prefix (faf-cli may report the real path, e.g. /private/var/…).
          reason: raw.replace(/(?:[A-Za-z]:)?[\\/][^\s'"]*[\\/]/g, ''),
        });
      }
    }

    const refused = result.refused ?? [];
    // Failed only when nothing could be written; a partial sync says exactly what happened.
    result.success = result.filesChanged.length > 0 || refused.length === 0;
    result.direction = result.filesChanged.length > 0 ? 'faf-to-claude' : 'none'; // Keep for backward compat
    result.duration = Date.now() - startTime;

    const lines: string[] = [];
    if (result.filesChanged.length > 0) {
      lines.push(`Synced ${result.filesChanged.join(', ')} from project.faf.`);
    }
    for (const r of refused) {
      lines.push(r.reason.startsWith(r.file) ? `Not written: ${r.reason}` : `Not written: ${r.file}: ${r.reason}`);
    }
    if (result.notes?.length) {
      lines.push('', ...result.notes);
    }
    result.message = lines.join('\n');

    return result;

  } catch (error) {
    result.duration = Date.now() - startTime;
    result.message = error instanceof Error ? error.message : 'Sync failed';
    return result;
  }
}
