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
            border-bottom: 2px solid #111827;
            padding-bottom: 1rem;
            margin-bottom: 2rem;
        }

        h1 { font-size: 1.875rem; font-weight: 700; letter-spacing: -0.025em; }
        .subtitle { color: #4b5563; margin-top: 0.25rem; font-size: 1rem; font-weight: 500; }
        .date { font-size: 0.875rem; color: #6b7280; text-align: right; }

        section { margin-bottom: 3rem; }

        .section-title {
            border-left: 4px solid #003366;
            padding-left: 0.75rem;
            margin-bottom: 1.5rem;
            font-weight: 700;
            color: #003366;
            font-size: 1.25rem;
            text-transform: uppercase;
        }

        .grid { display: grid; gap: 1.5rem; }
        .grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }

        .card {
            border: 1px solid #e5e7eb;
            padding: 1.25rem;
            background-color: #ffffff;
            height: 100%;
        }

        .card-future {
            background-color: #f8fafc;
            border-color: #cbd5e1;
        }

        .badge-opportunity {
            display: inline-block;
            padding: 0.125rem 0.5rem;
            background-color: #dcfce7;
            color: #166534;
            border-radius: 9999px;
            font-size: 0.7rem;
            font-weight: 700;
            margin-bottom: 0.5rem;
        }

        .badge-threat {
            display: inline-block;
            padding: 0.125rem 0.5rem;
            background-color: #fee2e2;
            color: #991b1b;
            border-radius: 9999px;
            font-size: 0.7rem;
            font-weight: 700;
            margin-bottom: 0.5rem;
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
        .value-future { font-size: 1.125rem; font-weight: 700; color: #1e3a8a; }

        .text-sm { font-size: 0.875rem; }
        .text-xs { font-size: 0.75rem; }
        .text-gray-500 { color: #6b7280; }
        .text-blue-900 { color: #1e3a8a; }

        .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; margin-bottom: 1.5rem; }
        .stats-card { text-align: center; padding: 1rem; border: 1px solid #f3f4f6; }

        .health-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }

        ul { list-style-type: disc; list-style-position: inside; padding: 0; }
        li { margin-bottom: 0.25rem; font-size: 0.875rem; }

        .agenda-card {
            border-left: 4px solid #1e3a8a;
            background-color: #f9fafb;
            padding: 1.5rem;
        }

        footer {
            margin-top: 4rem;
            padding-top: 2rem;
            border-top: 1px solid #e5e7eb;
            text-align: center;
            font-size: 0.75rem;
            color: #9ca3af;
        }

        @media print {
            body { padding: 0; background-color: white; }
            section { page-break-inside: avoid; }
            @page { margin: 1.5cm; }
            .no-print { display: none; }
        }
    </style>
</head>
<body>
    <header>
        <div>
            <h1>経営デザインシート / 事業進捗レポート</h1>
            <p class="subtitle">${strategy.vision.catchphrase}</p>
        </div>
        <div class="date">
            <p>Report Date: ${new Date().toLocaleDateString('ja-JP')}</p>
        </div>
    </header>

    <!-- Section 1: 経営デザインシート (戦略面) -->
    <section>
        <h2 class="section-title">Section 1: 経営デザインシート (戦略面)</h2>

        <div class="grid grid-cols-2" style="margin-bottom: 1.5rem;">
            <!-- Past to Present -->
            <div class="card">
                <div class="label" style="border-bottom: 1px solid #e5e7eb; padding-bottom: 0.5rem; margin-bottom: 1rem;">【現状・実績】これまでのこと</div>
                <div style="display: flex; flex-direction: column; gap: 1rem;">
                    <div>
                        <div class="text-xs text-gray-500 font-bold uppercase mb-1">知的資産・強み</div>
                        <ul style="list-style: none;">
                            ${strategy.historical_context.assets.map(asset => `<li style="margin-bottom: 0.25rem;">• ${asset}</li>`).join('')}
                        </ul>
                    </div>
                    <div>
                        <div class="text-xs text-gray-500 font-bold uppercase mb-1">ビジネスモデル</div>
                        <p class="text-sm font-medium">${strategy.historical_context.business_model}</p>
                    </div>
                    <div>
                        <div class="text-xs text-gray-500 font-bold uppercase mb-1">提供価値</div>
                        <p class="text-sm font-medium">${strategy.historical_context.value_offered}</p>
                    </div>
                </div>
            </div>

            <!-- Future Ideal -->
            <div class="card card-future">
                <div class="label label-future" style="border-bottom: 1px solid #cbd5e1; padding-bottom: 0.5rem; margin-bottom: 1rem;">【将来・理想】ありたい姿 (${strategy.future_ideal.target_date})</div>
                <div style="display: flex; flex-direction: column; gap: 1rem;">
                    <div>
                        <div class="text-xs text-gray-500 font-bold uppercase mb-1">理想の強み</div>
                        <p class="text-sm font-bold text-blue-900">${strategy.future_ideal.best_strength}</p>
                    </div>
                    <div>
                        <div class="text-xs text-gray-500 font-bold uppercase mb-1">ビジネスモデル</div>
                        <div class="text-xs">
                            <p><b>ターゲット:</b> ${strategy.future_ideal.business_model.target_audience}</p>
                            <p><b>内容:</b> ${strategy.future_ideal.business_model.offering}</p>
                            <p><b>提供方法:</b> ${strategy.future_ideal.business_model.how_to_deliver}</p>
                        </div>
                    </div>
                    <div>
                        <div class="text-xs text-gray-500 font-bold uppercase mb-1">提供価値</div>
                        <p class="value-future">${strategy.future_ideal.value_offered}</p>
                    </div>
                </div>
            </div>
        </div>

        <div class="grid grid-cols-2">
             <!-- External Environment -->
             <div class="card" style="border-style: dashed;">
                <div class="label" style="margin-bottom: 1rem;">外部環境 (Opportunity & Threat)</div>
                <div class="grid grid-cols-2" style="gap: 1rem;">
                    <div>
                        <span class="badge-opportunity">機会 (Opportunity)</span>
                        <ul style="list-style: none; font-size: 0.75rem;">
                            ${strategy.future_ideal.external_environment.opportunity.map(item => `<li style="margin-bottom: 0.25rem;">• ${item}</li>`).join('')}
                        </ul>
                    </div>
                    <div>
                        <span class="badge-threat">脅威 (Threat)</span>
                        <ul style="list-style: none; font-size: 0.75rem;">
                            ${strategy.future_ideal.external_environment.threat.map(item => `<li style="margin-bottom: 0.25rem;">• ${item}</li>`).join('')}
                        </ul>
                    </div>
                </div>
            </div>

            <!-- Strategic Challenges -->
            <div class="card" style="border-left: 4px solid #475569;">
                <div class="label" style="margin-bottom: 1rem;">【自身の課題】これから取り組むべきこと</div>
                <div style="display: flex; flex-direction: column; gap: 0.75rem;">
                    <div>
                        <div class="text-xs text-gray-500 font-bold uppercase mb-1">解決すべき弱み</div>
                        <ul style="list-style: none; font-size: 0.8125rem;">
                            ${strategy.strategic_challenges.weakness_to_solve.map(item => `<li>• ${item}</li>`).join('')}
                        </ul>
                    </div>
                    <div>
                        <div class="text-xs text-gray-500 font-bold uppercase mb-1">具体的アクション</div>
                        <ul style="list-style: none; font-size: 0.8125rem;" class="font-medium text-blue-900">
                            ${strategy.strategic_challenges.actions.map(item => `<li>• ${item}</li>`).join('')}
                        </ul>
                    </div>
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
                <div class="value-large" style="color: #16a34a;">${stats.lighthouseScore}</div>
            </div>
        </div>

        <div class="health-grid">
            <div class="card">
                <h3 class="font-bold text-sm" style="margin-bottom: 1rem;">システム健康度 (直近7日間)</h3>
                <div style="display: flex; justify-content: space-around;">
                    <div style="text-align: center;">
                        <div class="text-xs text-gray-500">Critical</div>
                        <div class="value-large ${stats.monitoring.criticalCount > 0 ? 'text-red-600' : ''}">${stats.monitoring.criticalCount}</div>
                    </div>
                    <div style="text-align: center;">
                        <div class="text-xs text-gray-500">Warning</div>
                        <div class="value-large ${stats.monitoring.warningCount > 0 ? 'text-amber-500' : ''}">${stats.monitoring.warningCount}</div>
                    </div>
                </div>
            </div>
            <div class="card">
                <h3 class="font-bold text-sm" style="margin-bottom: 1rem;">トラフィック (流入)</h3>
                <div style="display: flex; justify-content: space-around;">
                    <div style="text-align: center;">
                        <div class="text-xs text-gray-500">PV</div>
                        <div class="font-bold" style="color: #9ca3af;">${stats.traffic.pv}</div>
                    </div>
                    <div style="text-align: center;">
                        <div class="text-xs text-gray-500">UU</div>
                        <div class="font-bold" style="color: #9ca3af;">${stats.traffic.uu}</div>
                    </div>
                    <div style="text-align: center;">
                        <div class="text-xs text-gray-500">Avg Stay</div>
                        <div class="font-bold" style="color: #9ca3af;">${stats.traffic.avgStayTime}</div>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- Section 3: 本日の相談事項 -->
    <section>
        <h2 class="section-title">Section 3: 本日の相談事項</h2>
        <div class="agenda-card">
            <ul style="list-style-type: disc; list-style-position: inside;">
                ${strategy.consultation_items.map(item => `<li style="font-weight: 500; margin-bottom: 0.5rem;">${item}</li>`).join('')}
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
