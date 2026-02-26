import fs from 'fs/promises';
import path from 'path';
import { parseDocument, YAMLMap } from 'yaml';
import { BlogStats } from '../types';
import { Logger } from '../utils/logger';

export async function deliverStats(stats: BlogStats, outputPath: string): Promise<void> {
  try {
    const content = await fs.readFile(outputPath, 'utf-8');
    const doc = parseDocument(content);
    const plans = doc.get('plans');

    if (plans instanceof YAMLMap) {
      plans.items.forEach((pair) => {
        const plan = pair.value;
        if (plan instanceof YAMLMap) {
          plan.set('paid_article_count', stats.total.paidCount);
          plan.set('paid_total_chars', stats.total.premiumChars);
        }
      });
    }

    const updatedYaml = doc.toString();
    const tempPath = `${outputPath}.tmp`;

    await fs.writeFile(tempPath, updatedYaml, 'utf-8');
    await fs.rename(tempPath, outputPath);

    Logger.success(`YAML updated: ${outputPath}`);
  } catch (error) {
    throw new Error(`YAML update failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}
