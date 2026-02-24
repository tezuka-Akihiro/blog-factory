import { readdir } from 'fs/promises';
import { join } from 'path';

/**
 * 指定されたディレクトリから .md および .mdx ファイルを再帰的に探索します。
 * @param directory 探索対象のディレクトリパス
 * @returns ファイルのパス配列
 */
export async function scanFiles(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      if (entry.name === 'node_modules') return [];
      const res = join(directory, entry.name);
      if (entry.isDirectory()) {
        return scanFiles(res);
      } else {
        return entry.name.endsWith('.md') || entry.name.endsWith('.mdx') ? res : [];
      }
    })
  );
  return files.flat();
}
