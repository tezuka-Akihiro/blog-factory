import fs from 'fs/promises';
import { BlogStats } from '../types';
import { Logger } from '../utils/logger';

export async function deliverStats(stats: BlogStats, outputPath: string): Promise<void> {
  try {
    let content = await fs.readFile(outputPath, 'utf-8');

    content = content.replace(
      /(\s+paid_article_count:\s*)\d+/g,
      `$1${stats.total.paidCount}`
    );
    content = content.replace(
      /(\s+paid_total_chars:\s*)\d+/g,
      `$1${stats.total.premiumChars}`
    );

    const tempPath = `${outputPath}.tmp`;
    await fs.writeFile(tempPath, content, 'utf-8');
    await fs.rename(tempPath, outputPath);

    Logger.success(`YAML updated: ${outputPath}`);
  } catch (error) {
    throw new Error(`Delivery failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}
