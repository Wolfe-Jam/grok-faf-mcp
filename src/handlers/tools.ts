import type { CallToolResult, Tool } from '@modelcontextprotocol/sdk/types.js';
import { FafEngineAdapter } from './engine-adapter';
import { fileHandlers } from './fileHandler';
import * as fs from 'fs';
import * as path from 'path';
import { FuzzyDetector, applyIntelFriday } from '../utils/fuzzy-detector';
import { findFafFile, getNewFafFilePath } from '../utils/faf-file-finder.js';
import { VERSION } from '../version';
import { resolveProjectPath, ensureProjectsDirectory, formatPathConfirmation } from '../utils/path-resolver';
import { getRAGIntegrator } from '../rag/index.js';
// v1.4.1: single-source scoring — port-then-wire the truthful scorer into the
// live FafToolHandler (grok has no ChampionshipToolHandler wired). faf_score
// now reads faf-cli's real scoreFafYaml (the IANA-spec one) instead of the
// legacy 40+30+15+14 file-presence pseudo-score. NEVER reimplement scoring
// or the tier ladder here — that's exactly the drift the v1.4.x line set out
// to kill across the FAF MCP family. Mirror of faf-mcp 2.1.1 + claude-faf-mcp
// 5.6.1 — same single-source faf-cli path, adapted to grok's handler shape.
//
// Imported via ../utils/faf-cli-bridge.js — a one-file re-export that pins
// the relative dist path (faf-cli 6.7.1's `bun` exports condition resolves to
// a non-shipped src/, breaking the test runner). Both Node and Bun load the
// same compiled module through the bridge. Bridge is removable once faf-cli
// drops the bad `bun` condition.
import { fafCli } from '../utils/faf-cli-bridge.js';

export class FafToolHandler {
  constructor(private engineAdapter: FafEngineAdapter) {}

  async listTools() {
    return {
      tools: [
        {
          name: 'faf_about',
          description: 'Learn what .faf format is',
          inputSchema: {
            type: 'object',
            properties: {},
          }
        },
        {
          name: 'faf_what',
          description: 'Quick explanation of .faf format',
          inputSchema: {
            type: 'object',
            properties: {},
          }
        },
        {
          name: 'faf_status',
          description: 'Check if project has project.faf',
          inputSchema: {
            type: 'object',
            properties: {},
          }
        },
        {
          name: 'faf_score',
          description: 'Calculate AI-readiness score (0-100%)',
          inputSchema: {
            type: 'object',
            properties: {
              details: { type: 'boolean', description: 'Include detailed breakdown and improvement suggestions' }
            },
          }
        },
        {
          name: 'refresh_faf',
          description: 'Re-ground on the live .faf — re-read + re-score the current project DNA, report drift vs your last-known score, and return the fresh context. The explicit re-grounding primitive for long sessions: drift → refresh → re-grounded. Built for Grok, by request.',
          inputSchema: {
            type: 'object',
            properties: {
              baseline: { type: 'number', description: 'Your last-known score (0-100). If provided, the drift delta is reported.' },
              path: { type: 'string', description: 'Project directory or .faf path (supports ~). Defaults to the session working directory.' }
            },
          }
        },
        {
          name: 'faf_init',
          description: 'Create project.faf for a project',
          inputSchema: {
            type: 'object',
            properties: {
              force: { type: 'boolean', description: 'Force reinitialize existing FAF context' },
              directory: { type: 'string', description: 'Project directory path (supports ~ tilde expansion). Creates directory if it doesn\'t exist.' },
              path: { type: 'string', description: 'Alias for directory parameter' },
              projectName: { type: 'string', description: 'Project name for path inference (used with Projects convention)' }
            },
          }
        },
        {
          name: 'faf_trust',
          description: 'Validate project.faf integrity',
          inputSchema: {
            type: 'object',
            properties: {},
          }
        },
        {
          name: 'faf_sync',
          description: 'Sync .faf with CLAUDE.md',
          inputSchema: {
            type: 'object',
            properties: {},
          }
        },
        {
          name: 'faf_enhance',
          description: 'Enhance .faf with AI optimization',
          inputSchema: {
            type: 'object',
            properties: {
              model: { type: 'string', description: 'Target AI model: claude|chatgpt|gemini|universal (default: claude)' },
              focus: { type: 'string', description: 'Enhancement focus: claude-optimal|human-context|ai-instructions|completeness' },
              consensus: { type: 'boolean', description: 'Build consensus from multiple AI models' },
              dryRun: { type: 'boolean', description: 'Preview enhancement without applying changes' }
            },
          }
        },
        {
          name: 'faf_bi_sync',
          description: 'Bi-directional sync between project.faf and CLAUDE.md. v4.5.0: Also sync to AGENTS.md, .cursorrules, GEMINI.md!',
          inputSchema: {
            type: 'object',
            properties: {
              auto: { type: 'boolean', description: 'Enable automatic synchronization' },
              watch: { type: 'boolean', description: 'Start real-time file watching for changes' },
              force: { type: 'boolean', description: 'Force overwrite conflicting changes' },
              target: {
                type: 'string',
                enum: ['auto', '.clinerules', '.cursorrules', '.windsurfrules', 'CLAUDE.md', 'all'],
                description: 'Sync target: auto (detect existing), specific platform, or all'
              }
            },
          }
        },
        {
          name: 'faf_clear',
          description: 'Clear caches, temporary files, and reset FAF state for a fresh start',
          inputSchema: {
            type: 'object',
            properties: {
              cache: { type: 'boolean', description: 'Clear trust cache only' },
              todos: { type: 'boolean', description: 'Clear todo lists only' },
              backups: { type: 'boolean', description: 'Clear backup files only' },
              all: { type: 'boolean', description: 'Clear everything (default)' }
            },
          }
        },
        {
          name: 'faf_debug',
          description: 'Debug grok-faf-mcp environment - show working directory, permissions, and FAF CLI status',
          inputSchema: {
            type: 'object',
            properties: {},
          }
        },
        {
          name: 'faf_read',
          description: 'Read content from any file on the local filesystem',
          inputSchema: {
            type: 'object',
            properties: {
              path: {
                type: 'string',
                description: 'Absolute or relative file path to read'
              }
            },
            required: ['path'],
          }
        },
        {
          name: 'faf_write',
          description: 'Write content to any file on the local filesystem',
          inputSchema: {
            type: 'object',
            properties: {
              path: {
                type: 'string',
                description: 'Absolute or relative file path to write'
              },
              content: {
                type: 'string',
                description: 'Content to write to the file'
              }
            },
            required: ['path', 'content'],
          }
        },
        {
          name: 'faf_list',
          description: 'List directories and discover projects with project.faf files - Essential for FAF discovery workflow',
          inputSchema: {
            type: 'object',
            properties: {
              path: {
                type: 'string',
                description: 'Directory path to list (e.g., ~/Projects, /Users/username/Projects)'
              },
              filter: {
                type: 'string',
                enum: ['faf', 'dirs', 'all'],
                description: 'Filter: "faf" (only dirs with project.faf), "dirs" (all directories), "all" (dirs and files). Default: "dirs"'
              },
              depth: {
                type: 'number',
                enum: [1, 2],
                description: 'Directory depth to scan: 1 (immediate children) or 2 (one level deeper). Default: 1'
              },
              showHidden: {
                type: 'boolean',
                description: 'Show hidden files/directories (starting with .). Default: false'
              }
            },
            required: ['path'],
          }
        },
        // faf_chat — DEPRECATED, un-advertised. The host IS the chat (Claude Code /
        // Grok CLI / Desktop); a chat-shim tool is redundant. Dispatch keeps a
        // deprecation stub (below) for anyone still wired. Fleet sweep then full retire.
        {
          name: 'faf_friday',
          description: 'Friday features — Chrome Extension detection, fuzzy matching',
          inputSchema: {
            type: 'object',
            properties: {
              test: {
                type: 'string',
                description: 'Test fuzzy matching with typos like "raect" or "chr ext"'
              }
            },
          }
        },
        {
          name: 'faf_guide',
          description: 'FAF MCP usage guide for Claude Desktop - Projects convention, path resolution, and UX patterns',
          inputSchema: {
            type: 'object',
            properties: {},
          }
        },
        // RAG Tools - LAZY-RAG Cache + xAI Collections
        {
          name: 'rag_query',
          description: 'Ask a question with RAG-enhanced context from xAI Collections. Uses LAZY-RAG cache for 100,000x speedup on repeated queries.',
          inputSchema: {
            type: 'object',
            properties: {
              question: { type: 'string', description: 'Question to ask' }
            },
            required: ['question']
          }
        },
        {
          name: 'rag_cache_stats',
          description: 'Get LAZY-RAG cache statistics - hits, misses, hit rate, cache size',
          inputSchema: {
            type: 'object',
            properties: {}
          }
        },
        {
          name: 'rag_cache_clear',
          description: 'Clear the LAZY-RAG cache to start fresh',
          inputSchema: {
            type: 'object',
            properties: {}
          }
        }
      ] as Tool[]
    };
  }

  async callTool(name: string, args: any): Promise<CallToolResult> {
    // Input validation
    if (!name || typeof name !== 'string') {
      throw new Error('Tool name must be a non-empty string');
    }
    
    switch (name) {
      case 'faf_status':
        return await this.handleFafStatus(args);
      case 'faf_score':
        return await this.handleFafScore(args);
      case 'refresh_faf':
        return await this.handleFafRefresh(args);
      case 'faf_init':
        return await this.handleFafInit(args);
      case 'faf_trust':
        return await this.handleFafTrust(args);
      case 'faf_sync':
        return await this.handleFafSync(args);
      case 'faf_enhance':
        return await this.handleFafEnhance(args);
      case 'faf_bi_sync':
        return await this.handleFafBiSync(args);
      case 'faf_clear':
        return await this.handleFafClear(args);
      case 'faf_debug':
        return await this.handleFafDebug(args);
      case 'faf_about':
        return await this.handleFafAbout(args);
      case 'faf_what':
        return await this.handleFafWhat(args);
      case 'faf_read':
        return await fileHandlers.faf_read(args);
      case 'faf_chat':
        return await this.handleFafChat(args);
      case 'faf_friday':
        return await this.handleFafFriday(args);
      case 'faf_write':
        return await fileHandlers.faf_write(args);
      case 'faf_list':
        return await this.handleFafList(args);
      case 'faf_guide':
        return await this.handleFafGuide(args);
      // RAG Tools
      case 'rag_query':
        return await this.handleRagQuery(args);
      case 'rag_cache_stats':
        return await this.handleRagCacheStats(args);
      case 'rag_cache_clear':
        return await this.handleRagCacheClear(args);
      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  }
  
  private async handleFafStatus(_args: any): Promise<CallToolResult> {  // ✅ FIXED: Prefixed unused args
    // Native implementation - no CLI needed!
    const cwd = this.engineAdapter.getWorkingDirectory();

    try {
      const fafResult = await findFafFile(cwd);

      if (!fafResult) {
        return {
          content: [{
            type: 'text',
            text: `🤖 Claude FAF Project Status:\n\n❌ No FAF file found in ${cwd}\n💡 Run faf_init to create project.faf`
          }]
        };
      }

      const fafContent = fs.readFileSync(fafResult.path, 'utf-8');
      const lines = fafContent.split('\n').slice(0, 20);

      return {
        content: [{
          type: 'text',
          text: `🤖 Claude FAF Project Status:\n\n✅ ${fafResult.filename} found in ${cwd}\n\nContent preview:\n${lines.join('\n')}`
        }]
      };
    } catch (error: any) {
      return {
        content: [{
          type: 'text',
          text: `🤖 Claude FAF Project Status:\n\n❌ Error: ${error.message}`
        }],
        isError: true
      };
    }
  }

  private async handleFafScore(args: any): Promise<CallToolResult> {
    // v1.4.1: single-sourced from faf-cli's real scorer — the same number
    // `faf score` (CLI) emits. The legacy file-presence pseudo-score
    // (40 + 30 + 15 + 14, capped at 100) is dead. Headline format carries
    // both `FAF SCORE: <n>/100` AND `(<n>%)` so the AERO parity regex AND
    // any consumer scanning for the legacy `\d+%` form continue to match.
    // Invalid/unreadable .faf paths return an honest `0/100 (0%)` with a
    // diagnostic — no fake numbers, no crash.
    //
    // grok-faf-mcp surgery context: this is "port-then-wire" (Case B per
    // AERO Phase 2). Sibling faf-mcp had ChampionshipToolHandler exists-but-
    // unwired (Case A, just rewire); grok doesn't have it wired into the
    // live server at all, so we bring the WIRING into FafToolHandler here.
    // Mirrors faf-mcp 2.1.1's handleFafScore body verbatim.

    // Honour args.path when provided (AERO fixtures pass it explicitly).
    // Fallback to the engine adapter's working directory (existing behaviour).
    let cwd: string;
    const explicitPath: string | undefined = args?.path;
    if (explicitPath) {
      const expandedPath = explicitPath.startsWith('~')
        ? path.join(require('os').homedir(), explicitPath.slice(1))
        : explicitPath;
      const resolvedPath = path.resolve(expandedPath);
      cwd = fs.existsSync(resolvedPath) && fs.statSync(resolvedPath).isFile()
        ? path.dirname(resolvedPath)
        : resolvedPath;
      // Set session context so subsequent calls inherit (mirror faf-mcp).
      if (fs.existsSync(cwd)) {
        this.engineAdapter.setWorkingDirectory(cwd);
      }
    } else {
      cwd = this.engineAdapter.getWorkingDirectory();
    }

    const { findFafFile: cliFindFafFile, readFafRaw, scoreFafYaml, getNextTier } = await fafCli;

    const fafPath = cliFindFafFile(cwd);
    if (!fafPath) {
      return {
        content: [
          {
            type: 'text',
            text:
              `FAF SCORE: 0/100 (0%)  ♡ no .faf\n\n` +
              `No \`.faf\` found in \`${cwd}\`.\n` +
              `Run \`faf_init\` to create one — then \`faf_score\` reports the real score.`,
          },
        ],
      };
    }

    // Strip ANSI from tier indicator (faf-cli emits colored glyphs).
    // eslint-disable-next-line no-control-regex
    const strip = (s: string): string => s.replace(/\[[0-9;]*m/g, '').trim();

    let raw: string;
    try {
      raw = readFafRaw(fafPath);
    } catch (error: any) {
      return {
        content: [
          {
            type: 'text',
            text:
              `FAF SCORE: 0/100 (0%)  ○ UNREADABLE\n\n` +
              `Could not read \`${fafPath}\`: ${error?.message ?? String(error)}`,
          },
        ],
        isError: true,
      };
    }

    let result: ReturnType<Awaited<typeof fafCli>['scoreFafYaml']>;
    try {
      result = scoreFafYaml(raw);
    } catch (error: any) {
      // Invalid .faf content (malformed YAML, etc.) — honest 0 score with a
      // diagnostic, not a fake number. The output still carries `0%` so
      // downstream regex matchers like `/\d+%/` find a percentage token.
      return {
        content: [
          {
            type: 'text',
            text:
              `FAF SCORE: 0/100 (0%)  ○ INVALID\n\n` +
              `\`${fafPath}\` couldn't be parsed as a valid .faf YAML:\n` +
              `  ${error?.message ?? String(error)}\n\n` +
              `Re-run \`faf_init\` to regenerate a valid file.`,
          },
        ],
        isError: true,
      };
    }

    const score = result.score;
    const tierDisplay = strip(result.tier.indicator);
    const next = getNextTier(score);
    const nextTierDisplay = next ? `${strip(next.indicator)} (${next.threshold}%)` : null;

    // Progress bar — same width/style as the championship handler.
    const barWidth = 24;
    const filled = Math.max(0, Math.min(barWidth, Math.round((score / 100) * barWidth)));
    const progressBar = '█'.repeat(filled) + '░'.repeat(barWidth - filled);

    // Headline carries both `/100` AND `(%)` so multiple matchers stay happy.
    let output =
      `FAF SCORE: ${score}/100 (${score}%)  ${tierDisplay}\n` +
      `${progressBar} ${score}%\n` +
      `${result.populated}/${result.total} slots populated` +
      (nextTierDisplay ? `  ·  next: ${nextTierDisplay}` : '  ·  top tier') +
      `\n\n` +
      `Scored by faf-cli — the same context your AI reads.`;

    if (args?.details) {
      const populatedSlots = Object.entries(result.slots)
        .filter(([, state]) => state === 'populated')
        .map(([slot]) => slot);
      const emptySlots = Object.entries(result.slots)
        .filter(([, state]) => state === 'empty')
        .map(([slot]) => slot);
      const ignoredSlots = Object.entries(result.slots)
        .filter(([, state]) => state === 'slotignored')
        .map(([slot]) => slot);

      output += `\n\n--- Slot breakdown ---\n`;
      output += `Populated (${populatedSlots.length}): ${populatedSlots.join(', ') || '(none)'}\n`;
      output += `Empty (${emptySlots.length}): ${emptySlots.join(', ') || '(none)'}\n`;
      output += `Ignored (${ignoredSlots.length}): ${ignoredSlots.join(', ') || '(none)'}`;
      if (score < 100 && emptySlots.length > 0) {
        output += `\n\nTip: fill empty slots or mark them \`slotignored\` to climb tiers. Slot-by-slot detail: \`faf score\` (CLI).`;
      }
    }

    return {
      content: [
        {
          type: 'text',
          text: output,
        },
      ],
    };
  }

  /**
   * `refresh_faf` — re-ground on the live .faf. The explicit re-grounding primitive.
   *
   *   drift → refresh → re-grounded
   *
   * Re-reads the LIVE .faf and re-scores it via the SINGLE-SOURCE faf-cli scorer
   * (the same `fafCli` bridge faf_score uses — scoring is NEVER reimplemented here,
   * per the v1.4.x doctrine). The only new logic is orchestration: drift vs an
   * optional baseline (the agent's last-known score) + emitting the fresh DNA so
   * the agent re-grounds mid-session.
   *
   * MCP ahead of faf-cli by design — consolidates into `faf refresh` later.
   * (.fafb re-compile is the next layer, wired in the faf-cli consolidation.)
   */
  private async handleFafRefresh(args: any): Promise<CallToolResult> {
    // cwd resolution — mirror handleFafScore (honour args.path, else session dir).
    let cwd: string;
    const explicitPath: string | undefined = args?.path;
    if (explicitPath) {
      const expandedPath = explicitPath.startsWith('~')
        ? path.join(require('os').homedir(), explicitPath.slice(1))
        : explicitPath;
      const resolvedPath = path.resolve(expandedPath);
      cwd = fs.existsSync(resolvedPath) && fs.statSync(resolvedPath).isFile()
        ? path.dirname(resolvedPath)
        : resolvedPath;
      if (fs.existsSync(cwd)) {
        this.engineAdapter.setWorkingDirectory(cwd);
      }
    } else {
      cwd = this.engineAdapter.getWorkingDirectory();
    }

    const { findFafFile: cliFindFafFile, readFafRaw, scoreFafYaml, getNextTier } = await fafCli;

    const fafPath = cliFindFafFile(cwd);
    if (!fafPath) {
      return {
        content: [
          {
            type: 'text',
            text:
              `REFRESH — nothing to re-ground\n\n` +
              `No \`.faf\` found in \`${cwd}\`.\n` +
              `Run \`faf_init\` to create one, then \`refresh_faf\` re-grounds on it.`,
          },
        ],
      };
    }

    // Strip ANSI from tier glyphs (faf-cli emits colored indicators).
    // eslint-disable-next-line no-control-regex
    const strip = (s: string): string => s.replace(/\[[0-9;]*m/g, '').trim();

    let raw: string;
    try {
      raw = readFafRaw(fafPath);
    } catch (error: any) {
      return {
        content: [
          { type: 'text', text: `REFRESH — could not read \`${fafPath}\`: ${error?.message ?? String(error)}` },
        ],
        isError: true,
      };
    }

    let result: ReturnType<Awaited<typeof fafCli>['scoreFafYaml']>;
    try {
      result = scoreFafYaml(raw);
    } catch (error: any) {
      return {
        content: [
          { type: 'text', text: `REFRESH — \`${fafPath}\` isn't valid .faf YAML:\n  ${error?.message ?? String(error)}` },
        ],
        isError: true,
      };
    }

    const score = result.score;
    const tierDisplay = strip(result.tier.indicator);
    const next = getNextTier(score);
    const nextLine = next ? `  next: ${strip(next.indicator)} (${next.threshold}%)\n` : '';

    // Drift — orchestration only, no scoring reimplemented. Optional baseline =
    // the agent's last-known score; when present, report the delta.
    const baseline = typeof args?.baseline === 'number' ? args.baseline : null;
    let driftLine: string;
    if (baseline != null) {
      const delta = score - baseline;
      driftLine =
        delta === 0
          ? `  drift: none — steady at ${score}%\n`
          : `  drift: ${baseline}% ${delta > 0 ? '↑' : '↓'} ${score}% (${delta > 0 ? '+' : ''}${delta})\n`;
    } else {
      driftLine = `  re-grounded at ${score}%\n`;
    }

    return {
      content: [
        {
          type: 'text',
          text:
            `REFRESH — re-grounded on the live .faf\n\n` +
            driftLine +
            `  tier: ${tierDisplay} ${score}%\n` +
            nextLine +
            `\n— fresh DNA (re-grounded context) —\n` +
            raw,
        },
      ],
    };
  }

  private async handleFafInit(args: any): Promise<CallToolResult> {
    // Native implementation - creates project.faf with Projects convention!
    try {
      // Determine project path using Projects convention or explicit path
      let targetDir: string;
      let projectName: string;

      // Accept both 'directory' (legacy) and 'path' (new)
      const explicitPath = args?.path || args?.directory;

      if (explicitPath) {
        // User explicit path always wins
        // Expand tilde (~) to home directory
        const expandedPath = explicitPath.startsWith('~')
          ? path.join(require('os').homedir(), explicitPath.slice(1))
          : explicitPath;
        targetDir = path.resolve(expandedPath);
        projectName = path.basename(targetDir);

        // Ensure directory exists
        if (!fs.existsSync(targetDir)) {
          fs.mkdirSync(targetDir, { recursive: true });
        }
      } else if (args?.projectName) {
        // Use Projects convention with provided name
        ensureProjectsDirectory();
        const resolution = resolveProjectPath(args.projectName);
        targetDir = resolution.projectPath;
        projectName = resolution.projectName;

        // Ensure project directory exists
        if (!fs.existsSync(targetDir)) {
          fs.mkdirSync(targetDir, { recursive: true });
        }
      } else {
        // Use current working directory (legacy behavior)
        targetDir = this.engineAdapter.getWorkingDirectory();
        projectName = path.basename(targetDir);
      }

      const fafPath = path.join(targetDir, 'project.faf');

      // Check if any FAF file exists and force flag
      const existingFaf = await findFafFile(targetDir);
      if (existingFaf && !args?.force) {
        return {
          content: [{
            type: 'text',
            text: `🚀 Claude FAF Initialization:\n\n⚠️ ${existingFaf.filename} already exists in ${targetDir}\n💡 Use force: true to overwrite`
          }]
        };
      }

      // Check project type with fuzzy detection (Friday Feature!)
      const projectDescription = args?.description || '';

      // Detect Chrome Extension with fuzzy matching
      const chromeDetection = FuzzyDetector.detectChromeExtension(projectDescription);
      const projectType = FuzzyDetector.detectProjectType(projectDescription);

      // Build project data with Intel-Friday auto-fill!
      let projectData: any = {
        project: projectName,
        project_type: projectType,
        description: projectDescription,
        generated: new Date().toISOString(),
        version: VERSION
      };

      // Apply Intel-Friday: Auto-fill Chrome Extension slots for 90%+ score!
      if (chromeDetection.detected) {
        projectData = applyIntelFriday(projectData);
      }

      // Create enhanced .faf content
      const fafContent = `# USE>FAF - call FAF-MCP (or faf/cli)
# FAF - Foundational AI Context
project: ${projectData.project}
type: ${projectData.project_type}${chromeDetection.detected ? ' 🎯' : ''}
context: I⚡🍊
generated: ${projectData.generated}
version: ${projectData.version}
${chromeDetection.corrected ? `# Auto-corrected: "${args?.description}" → "${chromeDetection.corrected}"` : ''}

# The Formula
human_input: Your project files
multiplier: FAF Context
output: Championship Performance

# Quick Context
working_directory: ${targetDir}
initialized_by: grok-faf-mcp${projectData._friday_feature ? `\nfriday_feature: ${projectData._friday_feature}` : ''}
vitamin_context: true
faffless: true

${chromeDetection.detected ? `# Chrome Extension Auto-Fill (90%+ Score!)
runtime: ${projectData.runtime}
hosting: ${projectData.hosting}
api_type: ${projectData.api_type}
backend: ${projectData.backend}
database: ${projectData.database}
build: ${projectData.build}
package_manager: ${projectData.package_manager}` : ''}
`;

      fs.writeFileSync(fafPath, fafContent);

      return {
        content: [{
          type: 'text',
          text: `🚀 Claude FAF Initialization:\n\n✅ Created project.faf in ${targetDir}\n🍊 Vitamin Context activated!\n⚡ FAFFLESS AI ready!${
            chromeDetection.detected ? '\n\n🎯 Friday Feature: Chrome Extension detected!\n📈 Auto-filled 7 slots for 90%+ score!' : ''
          }${
            chromeDetection.corrected ? `\n📝 Auto-corrected: "${args?.description}" → "${chromeDetection.corrected}"` : ''
          }`
        }]
      };
    } catch (error: any) {
      return {
        content: [{
          type: 'text',
          text: `🚀 Claude FAF Initialization:\n\n❌ Error: ${error.message}`
        }],
        isError: true
      };
    }
  }

  private async handleFafTrust(_args: any): Promise<CallToolResult> {  // ✅ FIXED: Prefixed unused args
    const result = await this.engineAdapter.callEngine('trust');

    if (!result.success) {
      return {
        content: [{
          type: 'text',
          text: `🔒 Claude FAF Trust Validation:\n\nFailed to check trust: ${result.error}`
        }],
        isError: true
      };
    }

    const output = typeof result.data === 'string'
      ? result.data
      : result.data?.output || JSON.stringify(result.data, null, 2);

    return {
      content: [{
        type: 'text',
        text: `🔒 Claude FAF Trust Validation:\n\n${output}`
      }]
    };
  }

  private async handleFafSync(_args: any): Promise<CallToolResult> {  // ✅ FIXED: Prefixed unused args
    const result = await this.engineAdapter.callEngine('sync');

    if (!result.success) {
      return {
        content: [{
          type: 'text',
          text: `🔄 Claude FAF Sync:\n\nFailed to sync: ${result.error}`
        }],
        isError: true
      };
    }

    const output = typeof result.data === 'string'
      ? result.data
      : result.data?.output || JSON.stringify(result.data, null, 2);

    return {
      content: [{
        type: 'text',
        text: `🔄 Claude FAF Sync:\n\n${output}`
      }]
    };
  }

  private async handleFafEnhance(args: any): Promise<CallToolResult> {
    const enhanceArgs: string[] = [];

    // Default to Claude optimization if no model specified
    const model = args?.model || 'claude';
    enhanceArgs.push('--model', model);

    if (args?.focus) {
      enhanceArgs.push('--focus', args.focus);
    }
    if (args?.consensus) {
      enhanceArgs.push('--consensus');
    }
    if (args?.dryRun) {
      enhanceArgs.push('--dry-run');
    }

    const result = await this.engineAdapter.callEngine('enhance', enhanceArgs);

    if (!result.success) {
      return {
        content: [{
          type: 'text',
          text: `🚀 Claude FAF Enhancement:\n\nFailed to enhance: ${result.error}`
        }],
        isError: true
      };
    }

    const output = typeof result.data === 'string'
      ? result.data
      : result.data?.output || JSON.stringify(result.data, null, 2);

    return {
      content: [{
        type: 'text',
        text: `🚀 Claude FAF Enhancement:\n\n${output}`
      }]
    };
  }

  private async handleFafBiSync(args: any): Promise<CallToolResult> {
    const biSyncArgs: string[] = [];

    if (args?.auto) {
      biSyncArgs.push('--auto');
    }
    if (args?.watch) {
      biSyncArgs.push('--watch');
    }
    if (args?.force) {
      biSyncArgs.push('--force');
    }
    if (args?.target) {
      biSyncArgs.push(`--target=${args.target}`);
    }

    const result = await this.engineAdapter.callEngine('bi-sync', biSyncArgs);

    if (!result.success) {
      return {
        content: [{
          type: 'text',
          text: `🔗 Claude FAF Bi-Sync:\n\nFailed to bi-sync: ${result.error}`
        }],
        isError: true
      };
    }

    const output = typeof result.data === 'string'
      ? result.data
      : result.data?.output || JSON.stringify(result.data, null, 2);

    return {
      content: [{
        type: 'text',
        text: `🔗 Claude FAF Bi-Sync:\n\n${output}`
      }]
    };
  }

  private async handleFafClear(args: any): Promise<CallToolResult> {
    const clearArgs: string[] = [];
    
    if (args?.cache) {
      clearArgs.push('--cache');
    }
    if (args?.todos) {
      clearArgs.push('--todos');
    }
    if (args?.backups) {
      clearArgs.push('--backups');
    }
    if (args?.all || (!args?.cache && !args?.todos && !args?.backups)) {
      clearArgs.push('--all');
    }

    const result = await this.engineAdapter.callEngine('clear', clearArgs);

    if (!result.success) {
      return {
        content: [{
          type: 'text',
          text: `🧹 Claude FAF Clear:\n\nFailed to clear: ${result.error}`
        }],
        isError: true
      };
    }

    const output = typeof result.data === 'string'
      ? result.data
      : result.data?.output || JSON.stringify(result.data, null, 2);

    return {
      content: [{
        type: 'text',
        text: `🧹 Claude FAF Clear:\n\n${output}`
      }]
    };
  }

  private async handleFafAbout(_args: any): Promise<CallToolResult> {  // ✅ FIXED: Prefixed unused args
    // Stop FAFfing about and get the facts!
    const packageInfo = {
      name: 'grok-faf-mcp',
      version: VERSION,
      description: 'grok-faf-mcp — the first MCP for Grok. Persistent project context for xAI/Grok',
      author: 'FAF Team (team@faf.one)',
      website: 'https://faf.one',
      npm: 'https://www.npmjs.com/package/grok-faf-mcp'
    };

    const aboutText = `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🤖 .faf = project DNA for AI
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

WHAT IS .FAF?
• .faf = Foundational AI-context Format
• One file captures your project DNA for any AI
• The dot (.) means it's a file format!

🧡 Trust: Context verified, IANA-registered
⚡️ Speed: Generated in <29ms

Version ${packageInfo.version}

Your project's DNA — persistent context
that survives sessions, tools, and AI systems.

HOW IT WORKS:
1. Drop a file or paste the path
2. Create .faf (Foundational AI-context Format)
3. Talk to Claude to bi-sync it
4. You're done⚡

🩵 You just made Claude Happy
🧡⚡️ Persistent context. Zero drift.`;

    return {
      content: [{
        type: 'text',
        text: aboutText
      }]
    };
  }

  private async handleFafWhat(_args: any): Promise<CallToolResult> {  // ✅ FIXED: Prefixed unused args
    const whatText = `.faf = project DNA for AI

WHAT: .faf = Foundational AI-context Format
      (The dot means it's a file format, like .jpg or .pdf)

WHY:  Persistent project context that works across
      Claude, Gemini, Grok, Cursor, and any AI tool.

HOW:  Run 'faf' on any project to create one.
      Run 'faf_score' to check AI-readiness (target: 99%).

REMEMBER: Always use ".faf" with the dot - it's a FORMAT!

🧡⚡️ Persistent context. Zero drift.`;

    return {
      content: [{
        type: 'text',
        text: whatText
      }]
    };
  }

  private async handleFafDebug(_args: any): Promise<CallToolResult> {  // ✅ FIXED: Prefixed unused args
    try {
      const fs = await import('fs');
      const path = await import('path');
      const { exec } = await import('child_process');
      const { promisify } = await import('util');
      const execAsync = promisify(exec);

      const cwd = this.engineAdapter.getWorkingDirectory();
      const debugInfo = {
        workingDirectory: cwd,
        canWrite: false,
        fafCliPath: null as string | null,
        fafVersion: null as string | null,
        permissions: {} as any,
        enginePath: this.engineAdapter.getEnginePath(),
        pathEnv: process.env.PATH?.split(':') || []
      };
      
      // Check write permissions
      try {
        const testFile = path.join(cwd, '.claude-faf-test');
        fs.writeFileSync(testFile, 'test');
        fs.unlinkSync(testFile);
        debugInfo.canWrite = true;
      } catch (error) {
        debugInfo.permissions.writeError = error instanceof Error ? error.message : String(error);
      }
      
      // Check FAF CLI availability using championship auto-detection
      try {
        const cliInfo = this.engineAdapter.getCliInfo();

        if (cliInfo.detected && cliInfo.path) {
          debugInfo.fafCliPath = cliInfo.path;
          debugInfo.fafVersion = cliInfo.version || null;
        } else {
          debugInfo.fafCliPath = null;
          debugInfo.fafVersion = null;
        }
      } catch (error) {
        debugInfo.permissions.fafError = error instanceof Error ? error.message : String(error);
      }
      
      // Check for existing FAF file (v1.2.0: project.faf, *.faf, or .faf)
      const fafResult = await findFafFile(cwd);
      const hasFaf = fafResult !== null;

      const debugOutput = `🔍 grok-faf-mcp Debug Information:

📂 Working Directory: ${debugInfo.workingDirectory}
✏️ Write Permissions: ${debugInfo.canWrite ? '✅ Yes' : '❌ No'}
${debugInfo.permissions.writeError ? `   Error: ${debugInfo.permissions.writeError}\n` : ''}🤖 FAF Engine Path: ${debugInfo.enginePath}
🏎️ FAF CLI Path: ${debugInfo.fafCliPath || '❌ Not found'}
📋 FAF Version: ${debugInfo.fafVersion || 'Unknown'}
${debugInfo.permissions.fafError ? `   FAF Error: ${debugInfo.permissions.fafError}\n` : ''}📄 FAF File: ${hasFaf ? `✅ ${fafResult.filename} exists` : '❌ Not found (run faf_init)'}
🛤️ System PATH: ${debugInfo.pathEnv.slice(0, 3).join(', ')}${debugInfo.pathEnv.length > 3 ? '...' : ''}

💡 Quick Start:
   1. If FAF CLI not found: npm install -g faf-cli
   2. If .faf file missing: use faf_init tool
   3. For optimization: use faf_enhance tool with model="claude"
`;
      
      return {
        content: [{
          type: 'text',
          text: debugOutput
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: `🔍 Claude FAF Debug Failed: ${error instanceof Error ? error.message : String(error)}`
        }],
        isError: true
      };
    }
  }

  private async handleFafChat(_args: any): Promise<CallToolResult> {
    // DEPRECATED: the host (Claude Code / Grok CLI / Desktop) IS the chat — a
    // chat-shim MCP tool is redundant. Un-advertised in listTools; this stub
    // stays so anyone still wired gets a clear signal, not a crash. The old body
    // shelled `faf chat` via the engine subprocess, which dropped the MCP
    // connection (wjttc-bun:449) — removing that shell fixes the flake too.
    return {
      content: [{
        type: 'text',
        text:
          'faf_chat is retired — the host is your chat, just talk here. ' +
          'For FAF: faf_init / faf_score / faf_sync / refresh_faf, or "ask questions" + faf go.',
      }],
    };
  }

  private async handleFafFriday(args: any): Promise<CallToolResult> {
    const { test } = args || {};

    let response = `🎉 **Friday Features in FAF MCP!**\n\n`;
    response += `**Chrome Extension Auto-Detection** | Boosts scores to 90%+ automatically\n`;
    response += `**Universal Fuzzy Matching** | Typo-tolerant: "raect"→"react", "chr ext"→"chrome extension"\n`;
    response += `**Intel-Friday™** | Smart IF statements that add massive value\n\n`;

    if (test) {
      // Test fuzzy matching
      const suggestion = FuzzyDetector.getSuggestion(test);
      const projectType = FuzzyDetector.detectProjectType(test);
      const chromeDetection = FuzzyDetector.detectChromeExtension(test);

      response += `\n**Testing: "${test}"**\n`;

      if (suggestion) {
        response += `✅ Fuzzy Match: "${test}" → "${suggestion}"\n`;
      }

      response += `📦 Project Type Detected: ${projectType}\n`;

      if (chromeDetection.detected) {
        response += `🎯 Chrome Extension Detected! (Confidence: ${chromeDetection.confidence})\n`;
        if (chromeDetection.corrected) {
          response += `   Corrected from: "${test}" → "${chromeDetection.corrected}"\n`;
        }
      }

      // Show what would be auto-filled
      if (chromeDetection.detected && chromeDetection.confidence === 'high') {
        response += `\n**Auto-fill Preview (7 slots for 90%+ score):**\n`;
        const slots = FuzzyDetector.getChromeExtensionSlots();
        for (const [key, value] of Object.entries(slots)) {
          response += `• ${key}: ${value}\n`;
        }
      }
    } else {
      response += `\n💡 Try: \`faf_friday test:"raect"\` or \`faf_friday test:"chr ext"\``;
    }

    return {
      content: [{
        type: 'text',
        text: response
      }]
    };
  }

  private async handleFafGuide(_args: any): Promise<CallToolResult> {
    const guide = `# FAF MCP - Claude Desktop Guide

## Path Convention (CRITICAL)
**Default**: \`~/Projects/[project-name]/project.faf\`

**Project name from:**
1. AI inference (README, files, context)
2. User statement
3. User custom path (always wins)

**Example Flow:**
- User uploads README for "Heritage Club Dubai"
- Infer: \`~/Projects/heritage-club-dubai/project.faf\`
- Confirm: "Creating at ~/Projects/heritage-club-dubai/"

## Real Filesystem Only
- ✅ \`/Users/wolfejam/Projects/my-app/\`
- ❌ \`/mnt/user-data/\` (container paths)
- ❌ \`/home/claude/\` (container paths)

## Commands
All work: \`faf init\`, \`faf init new\`, \`faf init --new\`, \`faf init -new\`

**Core:**
- \`faf init\` - create FAF (infer path from context)
- \`faf score\` - show AI-readiness
- \`faf sync\` - synchronize files
- \`faf quick\` - rapid FAF creation

**Extensions:**
- \`new\` - force overwrite existing
- \`full\` - detailed output
- \`bi\` - bi-directional sync

## UX Rules
1. **Don't offer option menus** - just solve it
2. **Infer project name** from context
3. **Suggest Projects path** if ambiguous
4. **User path always wins**
5. **No CLI talk** - you ARE the FAF system

## Quick Patterns

**User uploads README:**
→ Infer project name
→ Create at \`~/Projects/[name]/project.faf\`
→ Confirm location

**User gives path:**
→ Use exactly as provided
→ No validation needed

**No context available:**
→ Ask once: "Project name or path?"
→ Use Projects convention with answer

## Username Detection
- Check \`$HOME\` environment
- Default to \`~/Projects/\` structure
- Works across macOS/Linux/Windows

## Test Your Understanding
❌ "I need more information" (when README uploaded)
❌ "Option 1, Option 2, Option 3..." (option menus)
❌ Creating files in \`/mnt/user-data/\`
✅ "Creating FAF for [project] at ~/Projects/[name]/"
✅ Using context to infer and act
✅ Real filesystem paths only`;

    return {
      content: [{
        type: 'text',
        text: guide
      }]
    };
  }

  private async handleFafList(args: any): Promise<CallToolResult> {
    try {
      const fs = await import('fs');
      const path = await import('path');

      // Parse arguments
      const targetPath = args?.path || this.engineAdapter.getWorkingDirectory();
      const filter = args?.filter || 'dirs';
      const depth = args?.depth || 1;
      const showHidden = args?.showHidden || false;

      // Expand tilde
      const expandedPath = targetPath.startsWith('~')
        ? path.join(require('os').homedir(), targetPath.slice(1))
        : targetPath;

      const resolvedPath = path.resolve(expandedPath);

      // Check if directory exists
      if (!fs.existsSync(resolvedPath)) {
        return {
          content: [{
            type: 'text',
            text: `❌ Directory not found: ${resolvedPath}`
          }],
          isError: true
        };
      }

      // Check if it's actually a directory
      const stats = fs.statSync(resolvedPath);
      if (!stats.isDirectory()) {
        return {
          content: [{
            type: 'text',
            text: `❌ Not a directory: ${resolvedPath}`
          }],
          isError: true
        };
      }

      // Scan directory
      const results: Array<{name: string; path: string; hasFaf: boolean; isDir: boolean}> = [];

      const scanDir = (dirPath: string, currentDepth: number) => {
        if (currentDepth > depth) return;

        const entries = fs.readdirSync(dirPath);

        for (const entry of entries) {
          // Skip hidden files unless requested
          if (!showHidden && entry.startsWith('.')) continue;

          const fullPath = path.join(dirPath, entry);
          const entryStats = fs.statSync(fullPath);
          const isDir = entryStats.isDirectory();

          // Check for project.faf
          const hasFaf = isDir && fs.existsSync(path.join(fullPath, 'project.faf'));

          // Apply filter
          if (filter === 'faf' && !hasFaf) continue;
          if (filter === 'dirs' && !isDir) continue;

          results.push({
            name: entry,
            path: fullPath,
            hasFaf,
            isDir
          });

          // Recurse if needed
          if (isDir && currentDepth < depth) {
            scanDir(fullPath, currentDepth + 1);
          }
        }
      };

      scanDir(resolvedPath, 1);

      // Sort: FAF projects first, then alphabetically
      results.sort((a, b) => {
        if (a.hasFaf && !b.hasFaf) return -1;
        if (!a.hasFaf && b.hasFaf) return 1;
        return a.name.localeCompare(b.name);
      });

      // Format output
      let output = `📁 ${resolvedPath}\n\n`;

      if (results.length === 0) {
        output += '(empty)\n';
      } else {
        for (const item of results) {
          const indent = item.path.split('/').length - resolvedPath.split('/').length - 1;
          const prefix = '  '.repeat(indent);
          const icon = item.isDir ? '📁' : '📄';
          const status = item.hasFaf ? '✅ project.faf' : '';

          output += `${prefix}${icon} ${item.name}`;
          if (status) output += ` ${status}`;
          output += '\n';
        }
      }

      output += `\nTotal: ${results.length} items`;
      if (filter === 'faf') {
        const fafCount = results.filter(r => r.hasFaf).length;
        output += ` (${fafCount} with project.faf)`;
      }

      return {
        content: [{
          type: 'text',
          text: output
        }]
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return {
        content: [{
          type: 'text',
          text: `❌ Failed to list directory: ${errorMessage}`
        }],
        isError: true
      };
    }
  }

  // RAG Tool Handlers

  private async handleRagQuery(args: any): Promise<CallToolResult> {
    const { question } = args;

    if (!question) {
      return {
        content: [{
          type: 'text',
          text: '❌ Question is required'
        }],
        isError: true
      };
    }

    try {
      const rag = getRAGIntegrator();

      if (!rag.isConfigured()) {
        return {
          content: [{
            type: 'text',
            text: '❌ XAI_API_KEY not configured. Set the environment variable to enable RAG queries.'
          }],
          isError: true
        };
      }

      const result = await rag.query(question);

      const status = result.cached ? '⚡ CACHE HIT' : '🔄 API CALL';
      const elapsed = result.cached
        ? `${(result.elapsed * 1000).toFixed(3)}ms`
        : `${result.elapsed.toFixed(2)}s`;

      return {
        content: [{
          type: 'text',
          text: `${status} (${elapsed})\n\n${result.answer}`
        }]
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return {
        content: [{
          type: 'text',
          text: `❌ RAG Query Failed: ${errorMessage}`
        }],
        isError: true
      };
    }
  }

  private async handleRagCacheStats(_args: any): Promise<CallToolResult> {
    try {
      const rag = getRAGIntegrator();
      const stats = rag.getCacheStats();

      const hitRatePercent = (stats.hitRate * 100).toFixed(1);

      const output = `📊 LAZY-RAG Cache Statistics

📦 Cache Size: ${stats.size} entries
✅ Cache Hits: ${stats.hits}
❌ Cache Misses: ${stats.misses}
📈 Hit Rate: ${hitRatePercent}%
🔌 Enabled: ${stats.enabled ? 'Yes' : 'No'}

${stats.hitRate > 0.5 ? '⚡ Great cache performance!' : stats.size === 0 ? '💡 Cache is empty - queries will populate it' : '📈 Cache warming up...'}`;

      return {
        content: [{
          type: 'text',
          text: output
        }]
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return {
        content: [{
          type: 'text',
          text: `❌ Failed to get cache stats: ${errorMessage}`
        }],
        isError: true
      };
    }
  }

  private async handleRagCacheClear(_args: any): Promise<CallToolResult> {
    try {
      const rag = getRAGIntegrator();
      const result = rag.clearCache();

      return {
        content: [{
          type: 'text',
          text: `🧹 LAZY-RAG Cache Cleared

✅ Cleared ${result.previousSize} cached entries
💡 Next queries will call the API and repopulate the cache`
        }]
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return {
        content: [{
          type: 'text',
          text: `❌ Failed to clear cache: ${errorMessage}`
        }],
        isError: true
      };
    }
  }
}
