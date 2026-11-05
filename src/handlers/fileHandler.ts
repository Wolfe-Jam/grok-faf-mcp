// grok-faf-mcp/src/handlers/fileHandler.ts
// 🏎️ FAF File Operations - Production Ready Implementation

import * as fs from 'fs/promises';
import * as fsSync from 'fs';
import * as crypto from 'crypto';
import * as os from 'os';
import * as path from 'path';
import type { Tool, CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { confineFileOp, PathConfinementError } from '../utils/safe-path';

/**
 * Security validator for file paths
 */
export class PathValidator {
  private static readonly FORBIDDEN_PATHS = ['/etc', '/sys', '/proc', '/private/etc'];
  private static readonly MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
  
  static validate(filePath: string): { valid: boolean; error?: string } {
    // Normalize and resolve path
    const normalized = path.normalize(filePath);
    const resolved = path.resolve(filePath);
    
    // Check for path traversal
    if (normalized.includes('..')) {
      return { valid: false, error: 'Path traversal detected' };
    }
    
    // Check forbidden paths
    for (const forbidden of this.FORBIDDEN_PATHS) {
      if (resolved.startsWith(forbidden)) {
        return { valid: false, error: `Access to ${forbidden} is forbidden` };
      }
    }
    
    return { valid: true };
  }
  
  static async checkFileSize(filePath: string): Promise<{ valid: boolean; error?: string }> {
    try {
      const stats = await fs.stat(filePath);
      if (stats.size > this.MAX_FILE_SIZE) {
        return { 
          valid: false, 
          error: `File too large: ${(stats.size / 1024 / 1024).toFixed(2)}MB (max: 50MB)` 
        };
      }
      return { valid: true };
    } catch (_error: unknown) {
      // File doesn't exist yet (for write operations)
      return { valid: true };
    }
  }
}

/**
 * FAF Read Tool Definition
 */
export const fafReadTool: Tool = {
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
    required: ['path']
  }
};

/**
 * FAF Write Tool Definition
 */
export const FAF_WRITE_DESCRIPTION =
  'Write a file inside the project (the server\'s cwd). Refuses paths outside cwd, ' +
  'anything inside .git/, symlinks, and .faf-dna (the birth certificate is never written). ' +
  'Refuses to replace an existing *.faf, CLAUDE.md or AGENTS.md unless overwrite: true. ' +
  'Writes atomically (temp file + rename).';

export const FAF_WRITE_INPUT_SCHEMA = {
  type: 'object' as const,
  properties: {
    path: {
      type: 'string',
      description: 'File path inside the project (relative to cwd, or absolute under it)'
    },
    content: {
      type: 'string',
      description: 'Content to write to the file'
    },
    overwrite: {
      type: 'boolean',
      description: 'Required to replace an existing *.faf, CLAUDE.md or AGENTS.md. Never applies to .faf-dna.'
    }
  },
  required: ['path', 'content']
};

export const fafWriteTool: Tool = {
  name: 'faf_write',
  description: FAF_WRITE_DESCRIPTION,
  annotations: { readOnlyHint: false, destructiveHint: true, openWorldHint: false },
  inputSchema: FAF_WRITE_INPUT_SCHEMA
};

/**
 * Handle faf_read tool execution
 */
export async function handleFafRead(args: any): Promise<CallToolResult> {
  const startTime = Date.now();
  
  try {
    const { path: rawPath } = args;

    // Confine to the project root(s) — any file type, but no escape to
    // /etc, ~/.ssh, or via ../ traversal (CWE-22). Returns symlink-canonical path.
    let filePath: string;
    try {
      filePath = confineFileOp(rawPath);
    } catch (err) {
      if (err instanceof PathConfinementError) {
        return {
          content: [{ type: 'text', text: `❌ Security error: ${err.message}` }],
          isError: true,
        };
      }
      throw err;
    }

    // Check file size
    const sizeValidation = await PathValidator.checkFileSize(filePath);
    if (!sizeValidation.valid) {
      return {
        content: [{
          type: 'text',
          text: `❌ ${sizeValidation.error}`
        }],
        isError: true
      };
    }
    
    // Read file with timeout
    const content = await Promise.race([
      fs.readFile(filePath, 'utf8'),
      new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('Read timeout (30s)')), 30000)
      )
    ]);
    
    const duration = Date.now() - startTime;
    const stats = await fs.stat(filePath);
    
    return {
      content: [{
        type: 'text',
        text: content
      }],
      metadata: {
        duration_ms: duration,
        file_size: stats.size,
        file_path: path.resolve(filePath),
        message: `✅ Read ${stats.size} bytes in ${duration}ms`
      }
    };
    
  } catch (error: any) {
    return {
      content: [{
        type: 'text',
        text: `❌ Failed to read file: ${error.message}`
      }],
      isError: true
    };
  }
}

/** The birth certificate. Written once per project, never by this tool. */
const BIRTH_CERTIFICATE = '.faf-dna';

/** Normalise a path segment for name comparison: case-folded, and with the
 *  trailing dots/spaces Windows silently strips (".faf-dna." === ".faf-dna"). */
function segmentKey(segment: string): string {
  return segment.toLowerCase().replace(/[. ]+$/, '');
}

function hasSegment(p: string, name: string): boolean {
  return p.split(/[\\/]+/).some((seg) => seg.length > 0 && segmentKey(seg) === name);
}

/** Existing files of these names are context files: replaced only on overwrite: true. */
export function isProtectedContextFile(p: string): boolean {
  const key = segmentKey(path.basename(p));
  return key.endsWith('.faf') || key === 'claude.md' || key === 'agents.md';
}

export class WriteGuardError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'WriteGuardError';
  }
}

/** Real path of `p`, tolerating a missing tail: resolve the nearest existing
 *  ancestor through symlinks, then re-append the missing segments. */
function realPathTolerant(p: string): string {
  let cur = p;
  const tail: string[] = [];
  for (;;) {
    try {
      const real = fsSync.realpathSync(cur);
      return tail.length ? path.join(real, ...tail.reverse()) : real;
    } catch {
      const parent = path.dirname(cur);
      if (parent === cur) return p;
      tail.push(path.basename(cur));
      cur = parent;
    }
  }
}

export interface WriteTarget {
  /** Canonical absolute path the content lands at. */
  target: string;
  /** True when a file already exists at `target`. */
  exists: boolean;
}

/**
 * Every faf_write check, before anything touches the disk. Throws
 * WriteGuardError on refusal.
 *
 *   1. `.faf-dna` anywhere in the path (any case) — always refused.
 *   2. Confined to the real cwd. No OS temp dir, no FAF_ALLOWED_ROOTS widening.
 *      Directory symlinks are resolved first, so a link out of cwd is caught.
 *   3. Nothing inside `.git/` (hooks, config, refs).
 *   4. The final component must not be a symlink (covers a link to `.faf-dna`
 *      or to a file outside cwd).
 *   5. An existing *.faf / CLAUDE.md / AGENTS.md needs overwrite: true.
 */
export function resolveWriteTarget(rawPath: unknown, overwrite: boolean): WriteTarget {
  if (typeof rawPath !== 'string' || rawPath.length === 0) {
    throw new WriteGuardError('path must be a non-empty string');
  }
  if (rawPath.includes('\0')) {
    throw new WriteGuardError('path contains a null byte');
  }

  const refuseDna = () =>
    new WriteGuardError(
      `refusing to write "${rawPath}": .faf-dna is the project birth certificate. ` +
        'It is written once and never changed, replaced or reissued.',
    );

  if (hasSegment(rawPath, BIRTH_CERTIFICATE)) throw refuseDna();

  const root = fsSync.realpathSync(process.cwd());
  // `~` means the user's home (as it did before), which is then outside cwd.
  const expanded =
    rawPath === '~' || rawPath.startsWith('~/') || rawPath.startsWith('~\\')
      ? path.join(os.homedir(), rawPath.slice(2))
      : rawPath;
  const lexical = path.resolve(root, expanded);
  if (hasSegment(lexical, BIRTH_CERTIFICATE)) throw refuseDna();

  // Final component: never write through a symlink. Inspect where it points so
  // a link to the birth certificate gets the specific refusal.
  let linkStat: fsSync.Stats | null = null;
  try {
    linkStat = fsSync.lstatSync(lexical);
  } catch {
    linkStat = null;
  }
  if (linkStat?.isSymbolicLink()) {
    let pointsAt = '';
    try {
      pointsAt = fsSync.realpathSync(lexical);
    } catch {
      try {
        pointsAt = path.resolve(path.dirname(lexical), fsSync.readlinkSync(lexical));
      } catch {
        pointsAt = '';
      }
    }
    if (pointsAt && hasSegment(pointsAt, BIRTH_CERTIFICATE)) throw refuseDna();
    throw new WriteGuardError(`refusing to write "${rawPath}": it is a symlink. Write the real file path instead.`);
  }

  const target = path.join(realPathTolerant(path.dirname(lexical)), path.basename(lexical));
  if (hasSegment(target, BIRTH_CERTIFICATE)) throw refuseDna();

  const rel = path.relative(root, target);
  if (rel === '' || rel === '..' || rel.startsWith('..' + path.sep) || path.isAbsolute(rel)) {
    throw new WriteGuardError(`refusing to write "${rawPath}": path is outside the project (${root}).`);
  }
  if (hasSegment(rel, '.git')) {
    throw new WriteGuardError(`refusing to write "${rawPath}": paths inside .git/ are not writable.`);
  }

  let exists = false;
  try {
    const st = fsSync.lstatSync(target);
    if (st.isSymbolicLink()) {
      throw new WriteGuardError(`refusing to write "${rawPath}": it is a symlink. Write the real file path instead.`);
    }
    if (!st.isFile()) {
      throw new WriteGuardError(`refusing to write "${rawPath}": it exists and is not a regular file.`);
    }
    exists = true;
  } catch (err) {
    if (err instanceof WriteGuardError) throw err;
    exists = false;
  }

  if (exists && !overwrite && isProtectedContextFile(target)) {
    throw new WriteGuardError(
      `refusing to overwrite "${rawPath}": ${path.basename(target)} already exists. ` +
        'Read it first and merge your changes, then call faf_write again with overwrite: true ' +
        'to replace it.',
    );
  }

  return { target, exists };
}

/**
 * Atomic write: content goes to a temp file in the target's directory, then
 * moves into place. A new protected file is placed with link() (exclusive
 * create, so a file that appears between the check and the write is never
 * clobbered); everything else with rename().
 */
async function atomicWrite(target: string, content: string, exclusive: boolean): Promise<void> {
  const dir = path.dirname(target);
  const tmp = path.join(
    dir,
    `.${path.basename(target)}.faf-write-${process.pid}-${crypto.randomBytes(6).toString('hex')}.tmp`,
  );
  let mode: number | undefined;
  try {
    mode = (await fs.stat(target)).mode & 0o777;
  } catch {
    mode = undefined;
  }
  try {
    await fs.writeFile(tmp, content, { encoding: 'utf8', flag: 'wx', mode: mode ?? 0o644 });
    if (mode !== undefined) await fs.chmod(tmp, mode);
    if (exclusive) {
      try {
        await fs.link(tmp, target);
      } catch (err) {
        const code = (err as NodeJS.ErrnoException | null)?.code;
        if (code === 'EEXIST') {
          throw new WriteGuardError(
            `refusing to overwrite "${target}": it was created while writing. ` +
              'Read it, then call faf_write again with overwrite: true.',
          );
        }
        if (code !== 'EPERM' && code !== 'ENOTSUP' && code !== 'EXDEV') throw err;
        // No hard links on this filesystem: fall back to an exclusive-create write.
        await fs.writeFile(target, content, { encoding: 'utf8', flag: 'wx', mode: 0o644 });
      }
      await fs.unlink(tmp).catch(() => undefined);
    } else {
      await fs.rename(tmp, target);
    }
  } catch (err) {
    await fs.unlink(tmp).catch(() => undefined);
    throw err;
  }
}

/**
 * Handle faf_write tool execution
 */
export async function handleFafWrite(args: unknown): Promise<CallToolResult> {
  const startTime = Date.now();

  try {
    const input = (args ?? {}) as { path?: unknown; content?: unknown; overwrite?: unknown };
    const rawPath = input.path;
    const content = input.content;
    const overwrite = input.overwrite === true;

    if (typeof content !== 'string') {
      return {
        content: [{ type: 'text', text: '❌ content must be a string' }],
        isError: true
      };
    }

    let resolved: WriteTarget;
    try {
      resolved = resolveWriteTarget(rawPath, overwrite);
    } catch (err) {
      if (err instanceof WriteGuardError) {
        return {
          content: [{ type: 'text', text: `❌ Security error: ${err.message}` }],
          isError: true,
        };
      }
      throw err;
    }
    const filePath = resolved.target;

    // Check content size
    const contentSize = Buffer.byteLength(content, 'utf8');
    if (contentSize > 50 * 1024 * 1024) {
      return {
        content: [{
          type: 'text',
          text: `❌ Content too large: ${(contentSize / 1024 / 1024).toFixed(2)}MB (max: 50MB)`
        }],
        isError: true
      };
    }

    // Create directory if needed (all checks above ran on the resolved path).
    await fs.mkdir(path.dirname(filePath), { recursive: true });

    try {
      await atomicWrite(filePath, content, !resolved.exists && isProtectedContextFile(filePath));
    } catch (err) {
      if (err instanceof WriteGuardError) {
        return {
          content: [{ type: 'text', text: `❌ Security error: ${err.message}` }],
          isError: true,
        };
      }
      throw err;
    }

    const duration = Date.now() - startTime;

    return {
      content: [{
        type: 'text',
        text: `✅ Successfully wrote ${contentSize} bytes to ${filePath}${resolved.exists ? ' (replaced existing file)' : ''}`
      }],
      metadata: {
        duration_ms: duration,
        bytes_written: contentSize,
        file_path: filePath,
        replaced: resolved.exists,
        message: `✅ Write completed in ${duration}ms`
      }
    };

  } catch (error) {
    return {
      content: [{
        type: 'text',
        text: `❌ Failed to write file: ${error instanceof Error ? error.message : String(error)}`
      }],
      isError: true
    };
  }
}

// Export handlers
export const fileHandlers = {
  faf_read: handleFafRead,
  faf_write: handleFafWrite
};
