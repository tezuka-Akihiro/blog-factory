import { readdir } from 'fs/promises';
import { join } from 'path';

export async function scanFiles(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const results = await Promise.all(
    entries.map(async (entry) => {
      if (entry.name === 'node_modules') return [];

      const fullPath = join(directory, entry.name);
      if (entry.isDirectory()) return scanFiles(fullPath);
      if (!entry.name.match(/\.mdx?$/)) return [];

      return fullPath;
    })
  );
  return results.flat();
}
