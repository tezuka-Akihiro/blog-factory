import fs from 'fs/promises';
import { BlogStats } from '../types';
import { Logger } from '../utils/logger';
import { writeAtomic } from '../utils/fs';

/**
 * Updates a YAML file with blog statistics.
 *
 * @param stats The blog statistics to deliver.
 * @param outputPath The path to the YAML file to update.
 */
export async function deliverStats(stats: BlogStats, outputPath: string): Promise<void> {
  try {
    const content = await fs.readFile(outputPath, 'utf-8');
    const updatedContent = applyStatsToYaml(content, stats);

    await writeAtomic(outputPath, updatedContent);

    Logger.success(`YAML updated: ${outputPath}`);
  } catch (error) {
    throw new Error(`Delivery failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Replaces statistics placeholders in a YAML string with actual values.
 *
 * @param content The original YAML content.
 * @param stats The statistics to apply.
 * @returns The updated YAML content.
 */
function applyStatsToYaml(content: string, stats: BlogStats): string {
  let updated = content;

  updated = updated.replace(
    /(\s+paid_article_count:\s*)\d+/g,
    `$1${stats.total.paidCount}`
  );

  updated = updated.replace(
    /(\s+paid_total_chars:\s*)\d+/g,
    `$1${stats.total.premiumChars}`
  );

  return updated;
}
