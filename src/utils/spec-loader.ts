import fs from 'fs/promises';
import path from 'path';
import matter from 'gray-matter';
import { Logger } from './logger';
import { BlogSpec } from '../types';

export async function loadBlogSpec(): Promise<BlogSpec> {
  const specPath = path.join(process.cwd(), 'docs', 'blog-spec.yaml');
  try {
    const content = await fs.readFile(specPath, 'utf-8');
    const parsed = matter('---\n' + content + '\n---');
    return parsed.data as BlogSpec;
  } catch (error) {
    Logger.warn(`blog-spec.yaml 読み込み失敗: ${error instanceof Error ? error.message : String(error)}`);
    return {
      access_control: { public_categories: [] },
      tags: [],
    };
  }
}

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
