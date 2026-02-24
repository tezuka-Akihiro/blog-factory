import fs from 'fs/promises';
import matter from 'gray-matter';
import { BlogPost } from '../types';
import { Logger } from '../utils/logger';
import { relative } from 'path';

/**
 * 単一ファイルから BlogPost 型のデータを抽出します。
 * @param filePath ファイルパス
 * @param basePath ルートパス（相対パス計算用）
 * @returns BlogPost オブジェクト
 */
export async function extractPost(filePath: string, basePath: string): Promise<BlogPost> {
  const content = await fs.readFile(filePath, 'utf-8');
  const stats = await fs.stat(filePath);
  const { data } = matter(content);

  const title = data.title || '';
  const category = data.category || '';
  const description = data.description || '';
  const lastModified = data.updatedAt || stats.mtime.toISOString();

  if (!title) {
    Logger.warn(`Title is missing in ${filePath}`);
  }
  if (!category) {
    Logger.warn(`Category is missing in ${filePath}`);
  }

  return {
    title,
    description,
    category,
    path: relative(basePath, filePath),
    lastModified: typeof lastModified === 'string' ? lastModified : lastModified.toISOString(),
  };
}
