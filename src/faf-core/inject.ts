import * as path from 'path';
import { fafCli } from '../utils/faf-cli-bridge.js';

/**
 * Block markers for the faf-managed front section. Markdown files use HTML
 * comments; non-markdown files (.cursorrules etc.) pass hash-comment markers.
 */
export const FAF_START = '<!-- faf:start -->';
export const FAF_END = '<!-- faf:end -->';

/**
 * Write a faf-managed block into a file through faf-cli's injector, the same
 * one faf-cli, faf-mcp and claude-faf-mcp use. Its rules (see faf-cli
 * `interop/inject`):
 *
 *   - no file                → create it with just the block
 *   - whole-line marker pair → replace only between the markers
 *   - anything else          → prefix the block; everything already there stays
 *
 * faf replaces only text it can prove it wrote. A file with no marker pair is
 * never reclaimed, whatever it starts with (a `<!-- faf:` first line, a START
 * with no END). Markers count only as whole lines, never as substrings. A file
 * that is not UTF-8, a link out of the project or into `.git` is refused and
 * left as it is (faf-cli throws SafePathError). Writes are atomic.
 *
 * Returns faf-cli's note for the user when the file carried a legacy stamp or
 * an unpaired marker (why the block went on top instead of replacing), or null.
 * Callers put it in their reply so nothing happens in silence.
 */
export async function injectFafBlock(
  filePath: string,
  block: string,
  start: string = FAF_START,
  end: string = FAF_END,
): Promise<string | null> {
  const cli = await fafCli;
  const root = path.dirname(filePath);
  const note = cli.legacyStampNoteAt(filePath, path.basename(filePath), start, end, { root });
  cli.injectFafBlock(filePath, block, start, end, { root });
  return note;
}
