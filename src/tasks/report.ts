import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { InspectionResult } from '../types';
import { Logger } from '../utils/logger';

/**
 * InspectionResult を JSON ファイルとして保存します。
 * @param result インスペクション結果
 * @returns 保存されたファイルのパス
 */
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

/**
 * 文字列をマークダウンファイルとして保存します。
 * @param content マークダウンの内容
 * @param filename ファイル名（デフォルト: summary.md）
 * @returns 保存されたファイルのパス
 */
export async function saveMarkdownReport(content: string, filename: string = 'summary.md'): Promise<string> {
  const resultsDir = join(process.cwd(), 'results');
  await mkdir(resultsDir, { recursive: true });

  const filePath = join(resultsDir, filename);

  await writeFile(filePath, content, 'utf-8');
  Logger.success(`Markdown report saved to ${filePath}`);

  return filePath;
}
