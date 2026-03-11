import fs from 'fs/promises';
import matter from 'gray-matter';
import { BlogPost, BlogFrontmatter } from '../types';
import { Logger } from '../utils/logger';
import { relative } from 'path';

export async function extractPost(
  filePath: string,
  basePath: string,
  publicCategories: string[] = []
): Promise<BlogPost> {
  const content = await fs.readFile(filePath, 'utf-8');
  const { data, content: body } = matter(content) as unknown as { data: BlogFrontmatter; content: string };

  const title = data.title || '';
  const category = data.category || '';
  const description = data.description || '';
  const tags = Array.isArray(data.tags) ? data.tags : [];
  let lastModified: string | Date | undefined = data.updatedAt || data.publishedAt || undefined;
  if (!lastModified) {
    try {
      const stats = await fs.stat(filePath);
      lastModified = stats.mtime;
    } catch {
      // Ignore
    }
  }
  const slug = data.slug || '';
  const publishedAt = data.publishedAt || '';
  const author = data.author || '';

  const characterCount = body.replace(/\s/g, '').length;

  const isPublicCategory = Array.isArray(publicCategories) && publicCategories.includes(category);
  const hasFreeContentHeading = !!data.freeContentHeading;
  const isPaid = !isPublicCategory || hasFreeContentHeading;
  const jsonLd = data.jsonLd === true;

  if (!title) {
    Logger.warn(`Title is missing in ${filePath}`);
  }
  if (!category) {
    Logger.warn(`Category is missing in ${filePath}`);
  }

  const lastModifiedStr = lastModified != null
    ? (typeof lastModified === 'string' ? lastModified : (lastModified as { toISOString(): string }).toISOString())
    : undefined;

  return {
    title,
    description,
    category,
    path: relative(basePath, filePath),
    ...(lastModifiedStr !== undefined ? { lastModified: lastModifiedStr } : {}),
    isPaid,
    characterCount,
    tags,
    body,
    slug,
    publishedAt: typeof publishedAt === 'string' ? publishedAt : (publishedAt as { toISOString?(): string })?.toISOString?.() || String(publishedAt),
    author,
    paywall: data.paywall === true,
    freeContentHeading: data.freeContentHeading ?? undefined,
    jsonLd,
  };
}
