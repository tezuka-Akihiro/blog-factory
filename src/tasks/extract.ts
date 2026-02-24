import fs from 'fs/promises';
import matter from 'gray-matter';
import { BlogPost } from '../types';
import { Logger } from '../utils/logger';
import { relative } from 'path';

/**
 * 単一ファイルから BlogPost 型のデータを抽出します。
 * @param filePath ファイルパス
 * @param basePath ルートパス（相対パス計算用）
 * @param publicCategories 公開カテゴリのリスト
 * @returns BlogPost オブジェクト
 */
export async function extractPost(
  filePath: string,
  basePath: string,
  publicCategories: string[] = []
): Promise<BlogPost> {
  const content = await fs.readFile(filePath, 'utf-8');
  const stats = await fs.stat(filePath);
  const { data, content: body } = matter(content);

  const title = data.title || '';
  const category = data.category || '';
  const description = data.description || '';
  const tags = Array.isArray(data.tags) ? data.tags : [];
  const lastModified = data.updatedAt || stats.mtime.toISOString();

  const characterCount = body.replace(/\s/g, '').length;

  // 有料記事判定:
  // 1. カテゴリが公開カテゴリに含まれていない
  // 2. または、フロントマターに freeContentHeading が存在する（一部有料）
  const isPublicCategory = publicCategories.includes(category);
  const hasFreeContentHeading = !!data.freeContentHeading;
  const isPaid = !isPublicCategory || hasFreeContentHeading;

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
    isPaid,
    characterCount,
    tags,
  };
}
