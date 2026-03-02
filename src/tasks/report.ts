import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { InspectionResult } from '../types';
import { Logger } from '../utils/logger';

export async function saveReport(result: InspectionResult): Promise<string> {
  const resultsDir = join(process.cwd(), 'results');
  await mkdir(resultsDir, { recursive: true });

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `result-${result.category || 'all'}-${timestamp}.json`;
  const filePath = join(resultsDir, filename);

  await writeFile(filePath, JSON.stringify(result, null, 2), 'utf-8');
  Logger.success(`Report saved to ${filePath}`);

  return filePath;
}

export async function saveExportFile(content: string, filename: string): Promise<string> {
  const resultsDir = join(process.cwd(), 'results');
  await mkdir(resultsDir, { recursive: true });

  const filePath = join(resultsDir, filename);

  await writeFile(filePath, content, 'utf-8');
  Logger.success(`Export file saved to ${filePath}`);

  return filePath;
}

export async function saveMarkdownReport(content: string, filename: string = 'summary.md'): Promise<string> {
  const resultsDir = join(process.cwd(), 'results');
  await mkdir(resultsDir, { recursive: true });

  const filePath = join(resultsDir, filename);

  await writeFile(filePath, content, 'utf-8');
  Logger.success(`Markdown report saved to ${filePath}`);

  return filePath;
}
