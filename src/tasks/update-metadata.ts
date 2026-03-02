import fs from 'fs/promises';
import { parse } from 'csv-parse/sync';
import path from 'path';
import { Logger } from '../utils/logger';

interface CsvRow {
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
  const records: CsvRow[] = parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  });

  for (const record of records) {
    const filePath = record.Path;
    const publishedAt = record['Published At'];

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

    await updateFilePublishedAt(fullPath, publishedAt);
  }
}

async function updateFilePublishedAt(filePath: string, newDate: string): Promise<void> {
  const content = await fs.readFile(filePath, 'utf-8');

  // Use regex to find publishedAt or date in frontmatter
  // We want to preserve everything else exactly as is.
  // Frontmatter is between the first two ---
  const frontmatterMatch = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);

  if (!frontmatterMatch) {
    Logger.warn(`Skip: No frontmatter found in ${filePath}`);
    return;
  }

  const frontmatter = frontmatterMatch[1];
  if (frontmatter === undefined) {
    Logger.warn(`Skip: Could not extract frontmatter in ${filePath}`);
    return;
  }

  let updatedFrontmatter = frontmatter;

  const publishedAtRegex = /^(\s*publishedAt:\s*).*$/m;
  const dateRegex = /^(\s*date:\s*).*$/m;

  if (publishedAtRegex.test(frontmatter)) {
    updatedFrontmatter = frontmatter.replace(publishedAtRegex, `$1${newDate}`);
  } else if (dateRegex.test(frontmatter)) {
    updatedFrontmatter = frontmatter.replace(dateRegex, `$1${newDate}`);
  } else {
    // If neither exists, add publishedAt at the end of frontmatter
    updatedFrontmatter = frontmatter + `\npublishedAt: ${newDate}`;
  }

  if (frontmatter === updatedFrontmatter) {
    Logger.info(`No change needed for ${filePath}`);
    return;
  }

  const updatedContent = content.replace(frontmatter, updatedFrontmatter);

  const tempPath = `${filePath}.tmp`;
  await fs.writeFile(tempPath, updatedContent, 'utf-8');
  await fs.rename(tempPath, filePath);

  Logger.success(`Updated ${filePath}`);
}
