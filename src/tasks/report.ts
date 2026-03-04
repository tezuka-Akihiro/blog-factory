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
    <title>経営デザインシート / 事業進捗レポート</title>
    <style>
        /* Modern CSS Reset */
        *, *::before, *::after { box-sizing: border-box; }
        * { margin: 0; }
        body { line-height: 1.5; -webkit-font-smoothing: antialiased; }
        img, picture, video, canvas, svg { display: block; max-width: 100%; }
        p, h1, h2, h3, h4, h5, h6 { overflow-wrap: break-word; }

        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&family=Noto+Sans+JP:wght@400;500;700&display=swap');

        body {
            font-family: 'Inter', 'Noto Sans JP', sans-serif;
            background-color: #ffffff;
            color: #1a1a1a;
            padding: 2rem;
            max-width: 64rem;
            margin: 0 auto;
        }

        header {
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
            border-bottom: 3px solid #111827;
            padding-bottom: 1rem;
            margin-bottom: 2rem;
        }

        .header-title {
            display: flex;
            align-items: baseline;
            gap: 1rem;
        }

        h1 { font-size: 1.75rem; font-weight: 700; color: #111827; }
        .owner-info { font-size: 0.875rem; color: #4b5563; }
        .date { font-size: 0.875rem; color: #6b7280; text-align: right; }

        section { margin-bottom: 2.5rem; }

        .section-title {
            background-color: #111827;
            color: #ffffff;
            display: inline-block;
            padding: 0.25rem 1rem;
            margin-bottom: 1.5rem;
            font-weight: 700;
            font-size: 1rem;
            text-transform: uppercase;
            letter-spacing: 0.05em;
        }

        .design-sheet {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 1px;
            background-color: #e5e7eb;
            border: 1px solid #e5e7eb;
            margin-bottom: 1rem;
        }

        .design-cell {
            background-color: #ffffff;
            padding: 1.25rem;
            display: flex;
            flex-direction: column;
        }

        .cell-label {
            font-size: 0.75rem;
            font-weight: 700;
            color: #6b7280;
            margin-bottom: 0.75rem;
            border-bottom: 1px solid #f3f4f6;
            padding-bottom: 0.25rem;
        }

        .cell-content {
            font-size: 0.9375rem;
            color: #111827;
            font-weight: 500;
            flex-grow: 1;
        }

        .cell-sub-content {
            font-size: 0.8125rem;
            color: #4b5563;
            margin-top: 0.5rem;
        }

        .highlight-blue { color: #1e40af; font-weight: 700; }

        .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; margin-bottom: 1.5rem; }
        .stats-card {
            border: 1px solid #e5e7eb;
            padding: 1rem;
            text-align: center;
        }
        .stats-label { font-size: 0.75rem; font-weight: 600; color: #6b7280; margin-bottom: 0.5rem; }
        .stats-value { font-size: 1.5rem; font-weight: 700; }

        .health-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
        .health-card { border: 1px solid #e5e7eb; padding: 1rem; }

        .flex-around { display: flex; justify-content: space-around; }

        ul { list-style-type: disc; list-style-position: inside; }
        li { margin-bottom: 0.5rem; color: #111827; font-size: 0.9375rem; }

        .agenda-card {
            border-left: 4px solid #111827;
            background-color: #f9fafb;
            padding: 1.5rem;
        }

        footer {
            margin-top: 4rem;
            padding-top: 1rem;
            border-top: 1px solid #e5e7eb;
            text-align: center;
            font-size: 0.75rem;
            color: #9ca3af;
        }

        @media (max-width: 768px) {
            .design-sheet { grid-template-columns: 1fr; }
            .stats-grid { grid-template-columns: 1fr 1fr; }
            .health-grid { grid-template-columns: 1fr; }
        }

        @media print {
            body { padding: 0; background-color: white; }
            section { page-break-inside: avoid; }
            @page { margin: 1.2cm; }
            .no-print { display: none; }
        }
    </style>
</head>
<body>
    <header>
        <div class="header-title">
            <h1>経営デザインレポート</h1>
            <div class="owner-info">
                <strong>${strategy.owner.name}</strong> | ${strategy.owner.role}
            </div>
        </div>
        <div class="date">
            <p>Report Date: ${new Date().toLocaleDateString('ja-JP')}</p>
        </div>
    </header>

    <!-- Section 1: 経営デザインシート (戦略面) -->
    <section>
        <h2 class="section-title">Section 1: 経営デザインシート（戦略面）</h2>
        <div class="design-sheet">
            <div class="design-cell">
                <div class="cell-label">知的資産（過去・現在）</div>
                <div class="cell-content">
                    ${strategy.management_design.past_present.experience}
                </div>
                <div class="cell-sub-content">
                    ${strategy.management_design.past_present.core_philosophy}
                </div>
            </div>
            <div class="design-cell">
                <div class="cell-label">価値創造メカニズム（移行期）</div>
                <div class="cell-content highlight-blue">
                    ${strategy.management_design.value_creation.mechanism}
                </div>
                <div class="cell-sub-content">
                    ${strategy.management_design.value_creation.benefit}
                </div>
            </div>
            <div class="design-cell">
                <div class="cell-label">未来の姿（価値）</div>
                <div class="cell-content highlight-blue">
                    ${strategy.management_design.future_vision.profit_goal}
                </div>
                <div class="cell-sub-content">
                    ${strategy.management_design.future_vision.social_impact}
                </div>
            </div>
        </div>
        <p style="font-size: 0.75rem; color: #6b7280; text-align: right;">※経営戦略に基づく事業の全体像</p>
    </section>

    <!-- Section 2: ビジネス実績 (事実面) -->
    <section>
        <h2 class="section-title">Section 2: ビジネス実績（事実面）</h2>
        <div class="stats-grid">
            <div class="stats-card">
                <div class="stats-label">総記事数</div>
                <div class="stats-value">${stats.totalArticles}</div>
                <div style="font-size: 0.625rem; color: #9ca3af; margin-top: 0.25rem;">目標: ${strategy.performance_manual.update_frequency}</div>
            </div>
            <div class="stats-card">
                <div class="stats-label">30日更新数</div>
                <div class="stats-value">${stats.last30DaysUpdates}</div>
            </div>
            <div class="stats-card">
                <div class="stats-label">Lighthouse</div>
                <div class="stats-value" style="color: #16a34a;">${stats.lighthouseScore}</div>
            </div>
            <div class="stats-card">
                <div class="stats-label">JSON-LD 網羅率</div>
                <div class="stats-value">${stats.jsonLdCoverage}%</div>
            </div>
        </div>

        <div class="health-grid">
            <div class="health-card">
                <h3 style="font-size: 0.8125rem; font-weight: 700; margin-bottom: 1rem; text-align: center;">システム健康度 (直近7日間)</h3>
                <div class="flex-around">
                    <div style="text-align: center;">
                        <div style="font-size: 0.6875rem; color: #6b7280;">エラー発生率</div>
                        <div class="stats-value" style="font-size: 1.25rem;">0.0%</div>
                    </div>
                    <div style="text-align: center;">
                        <div style="font-size: 0.6875rem; color: #6b7280;">Critical Logs</div>
                        <div class="stats-value" style="font-size: 1.25rem; color: ${stats.monitoring.criticalCount > 0 ? '#dc2626' : '#111827'};">
                            ${stats.monitoring.criticalCount}
                        </div>
                    </div>
                </div>
            </div>
            <div class="health-card">
                <h3 style="font-size: 0.8125rem; font-weight: 700; margin-bottom: 1rem; text-align: center;">トラフィック（流入実績）</h3>
                <div class="flex-around">
                    <div style="text-align: center;">
                        <div style="font-size: 0.6875rem; color: #6b7280;">PV</div>
                        <div class="stats-value" style="font-size: 1.25rem; color: #9ca3af;">${stats.traffic.pv}</div>
                    </div>
                    <div style="text-align: center;">
                        <div style="font-size: 0.6875rem; color: #6b7280;">UU</div>
                        <div class="stats-value" style="font-size: 1.25rem; color: #9ca3af;">${stats.traffic.uu}</div>
                    </div>
                    <div style="text-align: center;">
                        <div style="font-size: 0.6875rem; color: #6b7280;">滞読時間</div>
                        <div class="stats-value" style="font-size: 1.25rem; color: #9ca3af;">${stats.traffic.avgStayTime}</div>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- Section 3: 本日の相談事項 -->
    <section>
        <h2 class="section-title">Section 3: 本日の相談事項</h2>
        <div class="agenda-card">
            <ul>
                ${strategy.today_agenda.map(item => `<li>${item}</li>`).join('')}
            </ul>
        </div>
    </section>

    <footer>
        <p>Built with Blog Factory Production Line - Minimalist Design for Strategic Decisions</p>
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
