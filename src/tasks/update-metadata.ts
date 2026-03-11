import fs from 'fs/promises';
import { parse } from 'csv-parse/sync';
import path from 'path';
import { Logger } from '../utils/logger';

export interface CsvMetadataRow {
  Title: string;
  Description: string;
  Category: string;
  Tags: string;
  'Published At': string;
  'Last Modified': string;
  Path: string;
  'Character Count': string;
  'Is Paid': string;
  Slug: string;
  Author: string;
}

export async function updateMetadataFromCsv(csvPath: string, sourcePath: string): Promise<void> {
  const csvContent = await fs.readFile(csvPath, 'utf-8');
  const records = parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  }) as CsvMetadataRow[];

  for (const record of records) {
    const filePath = record.Path;
    const publishedAt = record['Published At'];
    const author = record.Author;

    if (!filePath) {
      Logger.warn('Skip: Path is missing in CSV row');
      continue;
    }

    if (!publishedAt) {
      Logger.warn(`Skip: Published At is missing for ${filePath}`);
      continue;
    }

    // Basic date format validation (YYYY-MM-DD or ISO string)
    if (isNaN(Date.parse(publishedAt))) {
      Logger.warn(`Skip: Invalid date format "${publishedAt}" for ${filePath}`);
      continue;
    }

    const fullPath = path.resolve(sourcePath, filePath);

    try {
      await fs.access(fullPath);
    } catch {
      Logger.warn(`Skip: File not found at ${fullPath}`);
      continue;
    }

    await updateFileMetadata(fullPath, { publishedAt, author });
  }
}

async function updateFileMetadata(
  filePath: string,
  metadata: { publishedAt: string; author?: string }
): Promise<void> {
  const content = await fs.readFile(filePath, 'utf-8');

  // Use regex to find frontmatter
  const frontmatterRegex = /^(---\r?\n)([\s\S]*?)(^---)/m;
  const frontmatterMatch = content.match(frontmatterRegex);

  if (!frontmatterMatch) {
    Logger.warn(`Skip: No frontmatter found in ${filePath}`);
    return;
  }

  const opening = frontmatterMatch[1];
  const frontmatter = frontmatterMatch[2];
  const closing = frontmatterMatch[3];

  if (frontmatter === undefined) {
    Logger.warn(`Skip: Could not extract frontmatter in ${filePath}`);
    return;
  }

  let updatedFrontmatter = frontmatter;

  // Enclose values in double quotes as requested
  const quotedPublishedAt = `"${metadata.publishedAt}"`;
  const quotedAuthor = metadata.author ? `"${metadata.author}"` : undefined;

  // 1. Update Published At
  const publishedAtRegex = /^(\s*publishedAt:\s*).*$/m;
  const dateRegex = /^(\s*date:\s*).*$/m;

  if (publishedAtRegex.test(updatedFrontmatter)) {
    updatedFrontmatter = updatedFrontmatter.replace(publishedAtRegex, `$1${quotedPublishedAt}`);
  } else if (dateRegex.test(updatedFrontmatter)) {
    updatedFrontmatter = updatedFrontmatter.replace(dateRegex, `$1${quotedPublishedAt}`);
  } else {
    updatedFrontmatter = updatedFrontmatter.trimEnd();
    if (updatedFrontmatter.length > 0) updatedFrontmatter += '\n';
    updatedFrontmatter += `publishedAt: ${quotedPublishedAt}`;
  }

  // 2. Update Author (if present in CSV)
  if (quotedAuthor) {
    const authorRegex = /^(\s*author:\s*).*$/m;
    if (authorRegex.test(updatedFrontmatter)) {
      updatedFrontmatter = updatedFrontmatter.replace(authorRegex, `$1${quotedAuthor}`);
    } else {
      updatedFrontmatter = updatedFrontmatter.trimEnd();
      if (updatedFrontmatter.length > 0) updatedFrontmatter += '\n';
      updatedFrontmatter += `author: ${quotedAuthor}`;
    }
  }

  // Ensure it ends with exactly one newline if not empty
  updatedFrontmatter = updatedFrontmatter.trimEnd();
  if (updatedFrontmatter.length > 0) {
    updatedFrontmatter += '\n';
  }

  if (frontmatter === updatedFrontmatter) {
    Logger.info(`No change needed for ${filePath}`);
    return;
  }

  // Reconstruct with original delimiters and body
  const body = content.slice(frontmatterMatch[0].length);
  const updatedContent = `${opening}${updatedFrontmatter}${closing}${body}`;

  const tempPath = `${filePath}.tmp`;
  await fs.writeFile(tempPath, updatedContent, 'utf-8');
  await fs.rename(tempPath, filePath);

  Logger.success(`Updated ${filePath}`);
}
