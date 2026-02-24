import fs from 'fs/promises';
import path from 'path';
import matter from 'gray-matter';
import { Logger } from './logger';

export interface BlogSpec {
  access_control?: {
    public_categories?: string[];
  };
  tags?: Array<{
    name: string;
    group: string;
  }>;
}

/**
 * blog-spec.yaml を読み込みます。
 * ファイルが存在しない場合はデフォルト値を返します。
 * @returns BlogSpec オブジェクト
 */
export async function loadBlogSpec(): Promise<BlogSpec> {
  const specPath = path.join(process.cwd(), 'blog-spec.yaml');
  try {
    const content = await fs.readFile(specPath, 'utf-8');
    // authorizedライブラリである gray-matter を使用して YAML をパースします。
    // スタンドアロンの YAML ファイルをフロントマター形式として認識させるため、デリミタで囲みます。
    const parsed = matter('---\n' + content + '\n---');
    return parsed.data as BlogSpec;
  } catch (error) {
    Logger.warn(`blog-spec.yaml の読み込みに失敗しました（デフォルト値を使用します）: ${error instanceof Error ? error.message : String(error)}`);
    return {
      access_control: { public_categories: [] },
      tags: [],
    };
  }
}

/**
 * スペックデータからタグ名からグループ名へのマッピングを作成します。
 * @param spec BlogSpec オブジェクト
 * @returns タグ名をキー、グループ名を値とするオブジェクト
 */
export function getTagToGroupMap(spec: BlogSpec): Record<string, string> {
  const map: Record<string, string> = {};
  if (spec.tags && Array.isArray(spec.tags)) {
    for (const tag of spec.tags) {
      if (tag.name && tag.group) {
        map[tag.name] = tag.group;
      }
    }
  }
  return map;
}
