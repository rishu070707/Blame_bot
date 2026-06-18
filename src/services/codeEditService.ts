// ============================================================
// BlameBot — Code Edit Service
// Resolves file paths from AI code fences and applies edits
// in real time using Tauri's filesystem commands.
// ============================================================

import { applyCodeEdit, replaceInFile, readFileContent } from './tauriService';

// ─── Types ────────────────────────────────────────────────────

export interface ParsedCodeBlock {
  /** Language identifier (e.g. "typescript", "python") */
  language: string;
  /** Raw file path from the code fence (may be relative or absolute) */
  rawPath: string;
  /** Resolved absolute path (after combining with project root) */
  resolvedPath: string;
  /** The code content */
  code: string;
}

export type ApplyStatus = 'idle' | 'applying' | 'applied' | 'error';

export interface ApplyResult {
  status: 'applied' | 'error';
  path: string;
  error?: string;
}

// ─── Path Resolution ──────────────────────────────────────────

/**
 * Parse the "language filepath" from a markdown code fence className.
 * e.g.  className="language-typescript src/utils/foo.ts"
 *       → { language: "typescript", rawPath: "src/utils/foo.ts" }
 */
export function parseCodeFenceMeta(
  className: string | undefined,
  meta: string | undefined
): { language: string; rawPath: string } | null {
  const langMatch = /language-(\w+)/.exec(className || '');
  if (!langMatch) return null;

  const language = langMatch[1];
  // Meta is everything after the language identifier in the fence opener
  const rawPath = (meta || '').trim();
  return { language, rawPath };
}

/**
 * Resolve a potentially-relative code fence path against the active project root.
 * Returns the absolute path to write to.
 */
export function resolvePath(rawPath: string, projectPath: string | null | undefined): string {
  if (!rawPath) return '';

  // Already absolute (Windows or POSIX)
  if (rawPath.match(/^[a-zA-Z]:[\\/]/) || rawPath.startsWith('/')) {
    return rawPath;
  }

  if (!projectPath) return '';

  // Normalise separator to match the project path
  const sep = projectPath.includes('\\') ? '\\' : '/';
  const normalised = rawPath.replace(/[\\/]/g, sep);

  return `${projectPath}${projectPath.endsWith(sep) ? '' : sep}${normalised}`;
}

// ─── Apply Logic ──────────────────────────────────────────────

/**
 * Apply a full-file replacement edit. Used when the AI outputs a complete file.
 */
export async function applyFullFile(path: string, code: string): Promise<ApplyResult> {
  try {
    await applyCodeEdit(path, code);
    return { status: 'applied', path };
  } catch (e: any) {
    return { status: 'error', path, error: String(e) };
  }
}

/**
 * Apply a targeted snippet replacement. Used when the AI outputs a partial block
 * and we can find the original snippet in the file.
 */
export async function applySnippet(
  path: string,
  originalSnippet: string,
  newSnippet: string
): Promise<ApplyResult> {
  try {
    await replaceInFile(path, originalSnippet, newSnippet);
    return { status: 'applied', path };
  } catch (e: any) {
    return { status: 'error', path, error: String(e) };
  }
}

/**
 * Read the current content of a file (for diff preview).
 * Returns null if the file cannot be read.
 */
export async function readCurrentFile(path: string): Promise<string | null> {
  try {
    return await readFileContent(path);
  } catch {
    return null;
  }
}

// ─── Diff Helper ──────────────────────────────────────────────

export interface DiffLine {
  type: 'added' | 'removed' | 'unchanged';
  content: string;
}

/**
 * Produce a simple line-level diff between old and new content.
 * Returns an array of DiffLine objects for rendering.
 * Caps at 80 lines to keep the preview fast.
 */
export function computeDiff(oldContent: string, newContent: string): DiffLine[] {
  const oldLines = oldContent.split('\n');
  const newLines = newContent.split('\n');
  const result: DiffLine[] = [];

  // Simple LCS-based diff (Myers algorithm lite — good enough for UI preview)
  const maxLines = 80;
  const added = new Set(newLines);
  const removed = new Set(oldLines);

  // Find changed region
  let startOld = 0, startNew = 0;
  while (startOld < oldLines.length && startNew < newLines.length && oldLines[startOld] === newLines[startNew]) {
    startOld++; startNew++;
  }
  let endOld = oldLines.length - 1, endNew = newLines.length - 1;
  while (endOld > startOld && endNew > startNew && oldLines[endOld] === newLines[endNew]) {
    endOld--; endNew--;
  }

  // Show 3 lines context before
  const contextStart = Math.max(0, startOld - 3);
  for (let i = contextStart; i < startOld; i++) {
    result.push({ type: 'unchanged', content: oldLines[i] });
  }

  // Show removed lines
  for (let i = startOld; i <= endOld && result.length < maxLines; i++) {
    result.push({ type: 'removed', content: oldLines[i] });
  }

  // Show added lines
  for (let i = startNew; i <= endNew && result.length < maxLines; i++) {
    result.push({ type: 'added', content: newLines[i] });
  }

  // Show 3 lines context after
  const contextEnd = Math.min(oldLines.length - 1, endOld + 3);
  for (let i = endOld + 1; i <= contextEnd && result.length < maxLines; i++) {
    result.push({ type: 'unchanged', content: oldLines[i] });
  }

  return result;
}
