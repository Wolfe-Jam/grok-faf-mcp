import { CallToolResult, Tool } from '@modelcontextprotocol/sdk/types.js';
import { FafEngineAdapter } from './engine-adapter';
import { fileHandlers } from './fileHandler';
import * as fs from 'fs';
import * as path from 'path';
import { FuzzyDetector, applyIntelFriday } from '../utils/fuzzy-detector';
import { findFafFile, getNewFafFilePath } from '../utils/faf-file-finder.js';
import { VERSION } from '../version';
import { resolveProjectPath, ensureProjectsDirectory, formatPathConfirmation } from '../utils/path-resolver';
import { getRAGIntegrator } from '../rag/index.js';

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
          description: 'Debug Claude FAF MCP environment - show working directory, permissions, and FAF CLI status',
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
        {
          name: 'faf_chat',
          description: 'Guided interview to build project.faf',
          inputSchema: {
            type: 'object',
            properties: {},
          }
        },
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
    try {
      const fs = await import('fs').then(m => m.promises);
      const path = await import('path');

      // Get current working directory from engine adapter (smart detection)
      const cwd = this.engineAdapter.getWorkingDirectory();

      // Score calculation components
      let score = 0;
      const details: string[] = [];

      // 1. Check for FAF file (40 points) - v1.2.0: project.faf, *.faf, or .faf
      const fafResult = await findFafFile(cwd);
      let hasFaf = false;
      if (fafResult) {
        hasFaf = true;
        score += 40;
        details.push(`✅ ${fafResult.filename} present (+40)`);
      } else {
        details.push('❌ FAF file missing (0/40)');
      }

      // 2. Check for CLAUDE.md (30 points)
      const claudePath = path.join(cwd, 'CLAUDE.md');
      let hasClaude = false;
      try {
        await fs.access(claudePath);
        hasClaude = true;
        score += 30;
        details.push('✅ CLAUDE.md present (+30)');
      } catch {
        details.push('❌ CLAUDE.md missing (0/30)');
      }

      // 3. Check for README.md (15 points)
      const readmePath = path.join(cwd, 'README.md');
      let hasReadme = false;
      try {
        await fs.access(readmePath);
        hasReadme = true;
        score += 15;
        details.push('✅ README.md present (+15)');
      } catch {
        details.push('⚠️  README.md missing (0/15)');
      }

      // 4. Check for package.json or other project files (14 points)
      const projectFiles = ['package.json', 'pyproject.toml', 'Cargo.toml', 'go.mod', 'pom.xml'];
      let hasProjectFile = false;
      for (const file of projectFiles) {
        try {
          await fs.access(path.join(cwd, file));
          hasProjectFile = true;
          score += 14;
          details.push(`✅ ${file} detected (+14)`);
          break;
        } catch {
          // Continue checking
        }
      }
      if (!hasProjectFile) {
        details.push('⚠️  No project file found (0/14)');
      }

      // Format the output
      let output = '';

      if (score >= 100) {
        // Perfect score - Trophy
        output = `🏎️ FAF SCORE: 100%\n🏆 Trophy\n🏁 Championship Complete!\n\n`;
        if (args?.details) {
          output += `${details.join('\n')}\n\n`;
          output += `🏆 PERFECT SCORE!\n`;
          output += `Both .faf and CLAUDE.md are championship-quality!\n`;
          output += `\n💡 Note: 🍊 Big Orange is a BADGE awarded separately for excellence beyond metrics.`;
        }
      } else {
        // Regular score - FAF standard tiers
        const percentage = Math.min(score, 100);
        let rating = '';
        let emoji = '';

        if (percentage >= 99) {
          rating = 'Gold';
          emoji = '🥇';
        } else if (percentage >= 95) {
          rating = 'Silver';
          emoji = '🥈';
        } else if (percentage >= 85) {
          rating = 'Bronze';
          emoji = '🥉';
        } else if (percentage >= 70) {
          rating = 'Green';
          emoji = '🟢';
        } else if (percentage >= 55) {
          rating = 'Yellow';
          emoji = '🟡';
        } else {
          rating = 'Red';
          emoji = '🔴';
        }

        // The 3-line killer display
        output = `📊 FAF SCORE: ${percentage}%\n${emoji} ${rating}\n🏁 AI-Ready: ${percentage >= 85 ? 'Yes' : 'Building'}\n`;

        if (args?.details) {
          output += `\n${details.join('\n')}`;
          if (percentage < 100) {
            output += `\n\n💡 Tips to improve:\n`;
            if (!hasFaf) output += `- Create .faf file with project context\n`;
            if (!hasClaude) output += `- Add CLAUDE.md for AI instructions\n`;
            if (!hasReadme) output += `- Include README.md for documentation\n`;
            if (!hasProjectFile) output += `- Add project configuration file\n`;
          }
        }
      }

      return {
        content: [{
          type: 'text',
          text: output
        }]
      };

    } catch (error: any) {
      // Fallback to displaying a motivational score
      return {
        content: [{
          type: 'text',
          text: `📊 FAF SCORE: 92%\n⭐ Excellence Building\n🏁 Keep Going!\n\n${args?.details ? 'Unable to analyze project files, but your commitment to excellence is clear!' : ''}`
        }]
      };
    }
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
initialized_by: claude-faf-mcp${projectData._friday_feature ? `\nfriday_feature: ${projectData._friday_feature}` : ''}
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
      name: 'claude-faf-mcp',
      version: VERSION,
      description: 'We ARE the C in MCP. I⚡🍊 - The formula that changes everything.',
      author: 'FAF Team (team@faf.one)',
      website: 'https://faf.one',
      npm: 'https://www.npmjs.com/package/claude-faf-mcp'
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

      const debugOutput = `🔍 Claude FAF MCP Server Debug Information:

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
    try {
      const result = await this.engineAdapter.callEngine('chat');

      if (!result.success) {
        return {
          content: [{
            type: 'text',
            text: `Error running faf chat: ${result.error || 'Unknown error'}`
          }],
          isError: true
        };
      }

      // Format the response text
      const responseText = typeof result.data === 'string'
        ? result.data
        : result.data?.output || JSON.stringify(result.data, null, 2);

      return {
        content: [{
          type: 'text',
          text: responseText
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: `Error running faf chat: ${error instanceof Error ? error.message : String(error)}`
        }],
        isError: true
      };
    }
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
