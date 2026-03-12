import fs from 'fs/promises';
import { parse } from 'csv-parse/sync';
import path from 'path';
import { Logger } from '../utils/logger';
import { writeAtomic } from '../utils/fs';
import { updateFrontmatterField } from '../utils/frontmatter';

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

/**
 * Updates metadata for multiple files based on a CSV file.
 *
 * @param csvPath Path to the CSV file containing metadata.
 * @param sourcePath Base directory for the files to update.
 */
export async function updateMetadataFromCsv(csvPath: string, sourcePath: string): Promise<void> {
  const records = await loadMetadataRecords(csvPath);

  for (const record of records) {
    await processMetadataRecord(record, sourcePath);
  }
}

/**
 * Loads metadata records from a CSV file.
 */
async function loadMetadataRecords(csvPath: string): Promise<CsvMetadataRow[]> {
  const csvContent = await fs.readFile(csvPath, 'utf-8');
  return parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  }) as CsvMetadataRow[];
}

/**
 * Processes a single metadata record and updates the corresponding file.
 */
async function processMetadataRecord(record: CsvMetadataRow, sourcePath: string): Promise<void> {
  const filePath = record.Path;
  const publishedAt = record['Published At'];
  const author = record.Author;

  if (!filePath) {
    Logger.warn('Skip: Path is missing in CSV row');
    return;
  }

  if (!publishedAt) {
    Logger.warn(`Skip: Published At is missing for ${filePath}`);
    return;
  }

  if (isNaN(Date.parse(publishedAt))) {
    Logger.warn(`Skip: Invalid date format "${publishedAt}" for ${filePath}`);
    return;
  }

  const fullPath = path.resolve(sourcePath, filePath);

  try {
    await fs.access(fullPath);
  } catch {
    Logger.warn(`Skip: File not found at ${fullPath}`);
    return;
  }

  await updateFileMetadata(fullPath, { publishedAt, author });
}

/**
 * Updates a single file's metadata in its frontmatter.
 */
async function updateFileMetadata(
  filePath: string,
  metadata: { publishedAt: string; author?: string }
): Promise<void> {
  const content = await fs.readFile(filePath, 'utf-8');

  const quotedPublishedAt = `"${metadata.publishedAt}"`;
  const quotedAuthor = metadata.author ? `"${metadata.author}"` : undefined;

  let updatedContent = updateFrontmatterField(content, 'publishedAt', quotedPublishedAt, ['date']);

  if (quotedAuthor) {
    updatedContent = updateFrontmatterField(updatedContent, 'author', quotedAuthor);
  }

  if (content === updatedContent) {
    Logger.info(`No change needed for ${filePath}`);
    return;
  }

  await writeAtomic(filePath, updatedContent);
  Logger.success(`Updated ${filePath}`);
}
