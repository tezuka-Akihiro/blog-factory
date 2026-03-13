import fs from 'fs/promises';

/**
 * Writes content to a file atomically by writing to a temporary file first
 * and then renaming it to the target path.
 *
 * @param filePath The path to the file to write.
 * @param content The content to write.
 */
export async function writeAtomic(filePath: string, content: string): Promise<void> {
  const tempPath = `${filePath}.tmp`;
  await fs.writeFile(tempPath, content, 'utf-8');
  await fs.rename(tempPath, filePath);
}

/**
 * Normalizes a file path to use forward slashes (/) regardless of the OS.
 */
export function normalizePath(path: string): string {
  return path.replace(/\\/g, '/');
}
