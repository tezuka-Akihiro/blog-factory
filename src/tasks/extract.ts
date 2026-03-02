import fs from 'fs/promises';
import matter from 'gray-matter';
import { BlogPost } from '../types';
import { Logger } from '../utils/logger';
import { relative } from 'path';

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
  const slug = data.slug || '';
  const publishedAt = data.publishedAt || '';
  const author = data.author || '';

  const characterCount = body.replace(/\s/g, '').length;

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
    body,
    slug,
    publishedAt: typeof publishedAt === 'string' ? publishedAt : publishedAt?.toISOString?.() || String(publishedAt),
    author,
    paywall: data.paywall === true,
    freeContentHeading: data.freeContentHeading,
  };
}
