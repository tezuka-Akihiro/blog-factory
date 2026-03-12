import { writeFile, mkdir, readFile } from 'fs/promises';
import { join } from 'path';
import matter from 'gray-matter';
import { BlogSnapshot, InspectionResult, ReportData } from '../types';
import { Logger } from '../utils/logger';
import { Strategy } from '../types/strategy';
import { replacePlaceholders } from '../utils/report-utils';
import { renderStyles, renderPage1, renderPage2, renderPage3 } from './report-components';

const SNAPSHOT_PATH = join(process.cwd(), 'data', 'blog-snapshot.json');

export async function saveBlogSnapshot(snapshot: BlogSnapshot): Promise<void> {
  await mkdir(join(process.cwd(), 'data'), { recursive: true });
  await writeFile(SNAPSHOT_PATH, JSON.stringify(snapshot, null, 2), 'utf-8');
  Logger.success(`Blog snapshot saved to ${SNAPSHOT_PATH}`);
}

export async function loadBlogSnapshot(): Promise<BlogSnapshot> {
  try {
    const content = await readFile(SNAPSHOT_PATH, 'utf-8');
    return JSON.parse(content) as BlogSnapshot;
  } catch {
    throw new Error(
      'data/blog-snapshot.json が見つかりません。先に `npm run summary` を実行してスナップショットを生成してください。',
    );
  }
}

export async function loadStrategy(): Promise<Strategy> {
  const strategyPath = join(process.cwd(), 'docs', 'strategy.yaml');
  try {
    const content = await readFile(strategyPath, 'utf-8');
    const parsed = matter('---\n' + content + '\n---');
    const data = parsed.data as Strategy;

    if (!data.historical_context) {
      Logger.warn('strategy.yaml: mandatory field [historical_context] is missing.');
    }
    if (!data.future_ideal) {
      Logger.warn('strategy.yaml: mandatory field [future_ideal] is missing.');
    }

    return data;
  } catch (error) {
    Logger.error(`strategy.yaml 読み込み失敗: ${error instanceof Error ? error.message : String(error)}`);
    throw error;
  }
}

export async function generateHtmlReport(data: ReportData): Promise<string> {
  const replacements = {
    ARTICLE_COUNT: data.stats.totalArticles.toString(),
  };

  const strategy = replacePlaceholders(data.strategy, replacements) as Strategy;
  const { stats } = data;
  const date = new Date().toLocaleDateString('ja-JP');

  return `
<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>経営報告書</title>
    ${renderStyles()}
</head>
<body>
    ${renderPage1(strategy, date)}
    ${renderPage2(stats, strategy, date)}
    ${renderPage3(strategy, date)}
</body>
</html>
  `;
}

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
