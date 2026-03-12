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
  const fileContent = await fs.readFile(filePath, 'utf-8');
  const { data, content: body } = matter(fileContent);
  const frontmatter = data as BlogFrontmatter;

  const title = frontmatter.title || '';
  const category = frontmatter.category || '';
  const description = frontmatter.description || '';
  const tags = Array.isArray(frontmatter.tags) ? frontmatter.tags : [];

  let lastModified: string | Date | undefined = frontmatter.updatedAt || frontmatter.publishedAt;
  if (!lastModified) {
    try {
      const stats = await fs.stat(filePath);
      lastModified = stats.mtime;
    } catch {
      // Ignore
    }
  }

  const slug = frontmatter.slug || '';
  const publishedAt = frontmatter.publishedAt || '';
  const author = frontmatter.author || '';

  const characterCount = body.replace(/\s/g, '').length;

  const isPublicCategory = Array.isArray(publicCategories) && publicCategories.includes(category);
  const hasFreeContentHeading = !!frontmatter.freeContentHeading;
  const isPaid = !isPublicCategory || hasFreeContentHeading;
  const jsonLd = frontmatter.jsonLd === true;

  if (!title) {
    Logger.warn(`Title is missing in ${filePath}`);
  }
  if (!category) {
    Logger.warn(`Category is missing in ${filePath}`);
  }

  const lastModifiedStr = lastModified instanceof Date
    ? lastModified.toISOString()
    : lastModified;

  const publishedAtStr = publishedAt instanceof Date
    ? publishedAt.toISOString()
    : String(publishedAt);

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
    publishedAt: publishedAtStr,
    author,
    paywall: frontmatter.paywall === true,
    freeContentHeading: frontmatter.freeContentHeading ?? undefined,
    jsonLd,
  };
}
