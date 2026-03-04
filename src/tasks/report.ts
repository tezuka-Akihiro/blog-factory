import { writeFile, mkdir, readFile } from 'fs/promises';
import { join } from 'path';
import matter from 'gray-matter';
import { InspectionResult, ReportData } from '../types';
import { Logger } from '../utils/logger';
import { Strategy } from '../types/strategy';

export async function loadStrategy(): Promise<Strategy> {
  const strategyPath = join(process.cwd(), 'strategy.yaml');
  try {
    const content = await readFile(strategyPath, 'utf-8');
    const parsed = matter('---\n' + content + '\n---');
    return parsed.data as Strategy;
  } catch (error) {
    Logger.warn(`strategy.yaml 読み込み失敗: ${error instanceof Error ? error.message : String(error)}`);
    throw error;
  }
}

export async function generateHtmlReport(data: ReportData): Promise<string> {
  const { strategy, stats } = data;

  const html = `
<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>経営デザインシート型・事業進捗レポート</title>
    <style>
        /* Modern CSS Reset */
        *, *::before, *::after { box-sizing: border-box; }
        * { margin: 0; }
        body { line-height: 1.5; -webkit-font-smoothing: antialiased; }
        img, picture, video, canvas, svg { display: block; max-width: 100%; }
        input, button, textarea, select { font: inherit; }
        p, h1, h2, h3, h4, h5, h6 { overflow-wrap: break-word; }

        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&family=Noto+Sans+JP:wght@400;500;700&display=swap');

        body {
            font-family: 'Inter', 'Noto Sans JP', sans-serif;
            background-color: #ffffff;
            color: #1a1a1a;
            padding: 2rem;
            max-width: 56rem;
            margin: 0 auto;
        }

        header {
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
            border-bottom: 2px solid #111827;
            padding-bottom: 1rem;
            margin-bottom: 2rem;
        }

        h1 { font-size: 1.875rem; font-weight: 700; letter-spacing: -0.025em; }
        .subtitle { color: #4b5563; margin-top: 0.25rem; }
        .date { font-size: 0.875rem; color: #6b7280; text-align: right; }

        section { margin-bottom: 3rem; }

        .section-title {
            border-left: 4px solid #003366;
            padding-left: 0.75rem;
            margin-bottom: 1.5rem;
            font-weight: 700;
            color: #003366;
            font-size: 1.25rem;
        }

        .grid { display: grid; gap: 1.5rem; }
        .grid-cols-1 { grid-template-columns: repeat(1, minmax(0, 1fr)); }
        .grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
        .grid-cols-4 { grid-template-columns: repeat(4, minmax(0, 1fr)); }

        .card {
            border: 1px solid #e5e7eb;
            padding: 1.5rem;
            background-color: #f9fafb;
        }

        .card-future {
            background-color: #f8fafc;
            border-color: #e2e8f0;
        }

        .label {
            font-size: 0.75rem;
            font-weight: 600;
            text-transform: uppercase;
            color: #6b7280;
            margin-bottom: 0.5rem;
        }

        .label-future { color: #1e40af; }

        .value-large { font-size: 1.5rem; font-weight: 700; }
        .value-future { font-size: 1.125rem; font-weight: 600; color: #1e3a8a; }
        .text-sm { font-size: 0.875rem; }
        .text-xs { font-size: 0.75rem; }
        .text-gray-600 { color: #4b5563; }
        .text-gray-700 { color: #374151; }
        .text-gray-500 { color: #6b7280; }
        .text-green-600 { color: #16a34a; }
        .text-red-600 { color: #dc2626; }
        .text-amber-500 { color: #f59e0b; }
        .text-gray-400 { color: #9ca3af; }

        .font-medium { font-weight: 500; }
        .font-bold { font-weight: 700; }

        .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; margin-bottom: 1.5rem; }
        .stats-card { text-align: center; padding: 1rem; }

        .health-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }

        .flex-around { display: flex; justify-content: space-around; }

        ul { list-style-type: disc; list-style-position: inside; }
        li { margin-bottom: 0.75rem; color: #1f2937; font-weight: 500; }

        .border-l-blue { border-left: 4px solid #1e3a8a; }

        footer {
            margin-top: 4rem;
            padding-top: 2rem;
            border-top: 1px solid #e5e7eb;
            text-align: center;
            font-size: 0.75rem;
            color: #9ca3af;
        }

        @media (max-width: 640px) {
            .grid-cols-4 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
            .health-grid { grid-template-columns: 1fr; }
        }

        @media print {
            body { padding: 0; background-color: white; }
            .no-print { display: none; }
            section { page-break-inside: avoid; }
            @page { margin: 1.5cm; }
        }
    </style>
</head>
<body>
    <header>
        <div>
            <h1>経営デザインシート / 事業進捗レポート</h1>
            <p class="subtitle">${strategy.owner.role}：${strategy.owner.name}</p>
        </div>
        <div class="date">
            <p>Report Date: ${new Date().toLocaleDateString('ja-JP')}</p>
        </div>
    </header>

    <!-- Section 1: 経営デザインシート (戦略面) -->
    <section>
        <h2 class="section-title">Section 1: 経営デザインシート (戦略面)</h2>
        <div class="grid grid-cols-1">
            <div class="card">
                <div class="label">知的資産 (過去・現在)</div>
                <div style="display: flex; flex-direction: column; gap: 0.5rem;">
                    <p class="font-medium">${strategy.management_design.past_present.experience}</p>
                    <p class="text-sm text-gray-600">${strategy.management_design.past_present.core_philosophy}</p>
                </div>
            </div>

            <div class="card">
                <div class="label">価値創造メカニズム (移行期)</div>
                <div style="display: flex; flex-direction: column; gap: 0.5rem;">
                    <p class="font-medium">${strategy.management_design.value_creation.mechanism}</p>
                    <p class="text-sm text-gray-600">${strategy.management_design.value_creation.benefit}</p>
                </div>
            </div>

            <div class="card card-future">
                <div class="label label-future">未来の姿 (価値)</div>
                <div style="display: flex; flex-direction: column; gap: 0.5rem;">
                    <p class="value-future">${strategy.management_design.future_vision.profit_goal}</p>
                    <p class="text-sm text-gray-700">${strategy.management_design.future_vision.social_impact}</p>
                </div>
            </div>
        </div>
    </section>

    <!-- Section 2: ビジネス実績 (事実面) -->
    <section>
        <h2 class="section-title">Section 2: ビジネス実績 (事実面)</h2>
        <div class="stats-grid">
            <div class="card stats-card">
                <div class="label">総記事数</div>
                <div class="value-large">${stats.totalArticles}</div>
            </div>
            <div class="card stats-card">
                <div class="label">30日更新数</div>
                <div class="value-large">${stats.last30DaysUpdates}</div>
            </div>
            <div class="card stats-card">
                <div class="label">JSON-LD 網羅率</div>
                <div class="value-large">${stats.jsonLdCoverage}%</div>
            </div>
            <div class="card stats-card">
                <div class="label">Lighthouse</div>
                <div class="value-large text-green-600">${stats.lighthouseScore}</div>
            </div>
        </div>

        <div class="health-grid">
            <div class="card">
                <h3 class="font-bold text-sm text-gray-700" style="margin-bottom: 1rem;">システム健康度 (直近7日間)</h3>
                <div class="flex-around">
                    <div style="text-align: center;">
                        <div class="text-xs text-gray-500" style="margin-bottom: 0.25rem;">Critical</div>
                        <div class="value-large ${stats.monitoring.criticalCount > 0 ? 'text-red-600' : ''}">${stats.monitoring.criticalCount}</div>
                    </div>
                    <div style="text-align: center;">
                        <div class="text-xs text-gray-500" style="margin-bottom: 0.25rem;">Warning</div>
                        <div class="value-large ${stats.monitoring.warningCount > 0 ? 'text-amber-500' : ''}">${stats.monitoring.warningCount}</div>
                    </div>
                </div>
            </div>
            <div class="card">
                <h3 class="font-bold text-sm text-gray-700" style="margin-bottom: 1rem;">トラフィック (流入)</h3>
                <div class="stats-grid" style="margin-bottom: 0; grid-template-columns: repeat(3, 1fr); gap: 0.5rem;">
                    <div style="text-align: center;">
                        <div class="text-xs text-gray-500">PV</div>
                        <div class="font-bold text-gray-400">${stats.traffic.pv}</div>
                    </div>
                    <div style="text-align: center;">
                        <div class="text-xs text-gray-500">UU</div>
                        <div class="font-bold text-gray-400">${stats.traffic.uu}</div>
                    </div>
                    <div style="text-align: center;">
                        <div class="text-xs text-gray-500">Avg Stay</div>
                        <div class="font-bold text-gray-400">${stats.traffic.avgStayTime}</div>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- Section 3: 本日の相談事項 -->
    <section>
        <h2 class="section-title">Section 3: 本日の相談事項</h2>
        <div class="card border-l-blue">
            <ul>
                ${strategy.today_agenda.map(item => `<li>${item}</li>`).join('')}
            </ul>
        </div>
    </section>

    <footer class="no-print">
        <p>Built with Blog Factory Production Line - Minimalist Monochrome Design</p>
    </footer>
</body>
</html>
  `;

  return html;
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
