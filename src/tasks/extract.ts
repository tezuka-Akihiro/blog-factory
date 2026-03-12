import fs from 'fs/promises';
import matter from 'gray-matter';
import { BlogPost, BlogFrontmatter } from '../types';
import { Logger } from '../utils/logger';
import { relative } from 'path';

/**
 * Extracts a BlogPost object from a Markdown file.
 *
 * @param filePath Path to the Markdown file.
 * @param basePath Base directory to calculate relative paths.
 * @param publicCategories Categories that are considered public.
 */
export async function extractPost(
  filePath: string,
  basePath: string,
  publicCategories: string[] = []
): Promise<BlogPost> {
  const fileContent = await fs.readFile(filePath, 'utf-8');
  let mtime: Date | undefined;

  try {
    const stats = await fs.stat(filePath);
    mtime = stats.mtime;
  } catch {
    // Ignore stat errors
  }

  const relativePath = relative(basePath, filePath);
  return parseBlogPost(fileContent, relativePath, publicCategories, mtime);
}

/**
 * Parses Markdown content and frontmatter into a BlogPost object.
 */
export function parseBlogPost(
  fileContent: string,
  relativePath: string,
  publicCategories: string[] = [],
  mtime?: Date
): BlogPost {
  const { data, content: body } = matter(fileContent);
  const frontmatter = data as BlogFrontmatter;

  const title = frontmatter.title || '';
  const category = frontmatter.category || '';
  const description = frontmatter.description || '';
  const tags = Array.isArray(frontmatter.tags) ? frontmatter.tags : [];
  const slug = frontmatter.slug || '';
  const publishedAt = frontmatter.publishedAt || '';
  const author = frontmatter.author || '';
  const jsonLd = frontmatter.jsonLd === true;

  // Last modified logic
  let lastModified: string | Date | undefined = frontmatter.updatedAt || frontmatter.publishedAt || mtime;
  const lastModifiedStr = lastModified instanceof Date
    ? lastModified.toISOString()
    : lastModified;

  // Character count (excluding whitespace)
  const characterCount = body.replace(/\s/g, '').length;

  // Access control logic
  const isPublicCategory = Array.isArray(publicCategories) && publicCategories.includes(category);
  const hasFreeContentHeading = !!frontmatter.freeContentHeading;
  const isPaid = !isPublicCategory || hasFreeContentHeading;

  if (!title) {
    Logger.warn(`Title is missing in ${relativePath}`);
  }
  if (!category) {
    Logger.warn(`Category is missing in ${relativePath}`);
  }

  const publishedAtStr = publishedAt instanceof Date
    ? publishedAt.toISOString()
    : String(publishedAt);

  return {
    title,
    description,
    category,
    path: relativePath,
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
