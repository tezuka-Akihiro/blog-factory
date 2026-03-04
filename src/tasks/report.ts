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
        body { line-height: 1.5; -webkit-font-smoothing: antialiased; font-size: 14px; }
        img, picture, video, canvas, svg { display: block; max-width: 100%; }
        p, h1, h2, h3, h4, h5, h6 { overflow-wrap: break-word; }

        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&family=Noto+Sans+JP:wght@400;500;700&display=swap');

        body {
            font-family: 'Inter', 'Noto Sans JP', sans-serif;
            background-color: #f3f4f6;
            color: #111827;
            padding: 1.5rem;
            max-width: 1000px;
            margin: 0 auto;
        }

        .report-container {
            background-color: white;
            padding: 2.5rem;
            box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
            border: 1px solid #e5e7eb;
        }

        header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            border-bottom: 2px solid #111827;
            padding-bottom: 1rem;
            margin-bottom: 2rem;
        }

        .title-group h1 { font-size: 1.75rem; font-weight: 800; letter-spacing: -0.025em; color: #111827; }
        .title-group p { font-size: 0.875rem; color: #4b5563; font-weight: 500; }

        .owner-info { text-align: right; }
        .owner-info .name { font-weight: 700; font-size: 1.125rem; }
        .owner-info .role { font-size: 0.75rem; color: #6b7280; }
        .owner-info .date { font-size: 0.75rem; color: #9ca3af; margin-top: 0.25rem; }

        section { margin-bottom: 2.5rem; }

        .section-header {
            display: flex;
            align-items: center;
            margin-bottom: 1.25rem;
            border-bottom: 1px solid #e5e7eb;
            padding-bottom: 0.5rem;
        }
        .section-number {
            background-color: #111827;
            color: white;
            padding: 0.25rem 0.75rem;
            font-weight: 700;
            font-size: 0.75rem;
            margin-right: 0.75rem;
        }
        .section-title {
            font-weight: 800;
            color: #111827;
            font-size: 1.125rem;
            text-transform: uppercase;
            letter-spacing: 0.05em;
        }

        .design-sheet-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 1px;
            background-color: #e5e7eb;
            border: 1px solid #e5e7eb;
        }
        .design-cell {
            background-color: white;
            padding: 1.25rem;
        }
        .cell-label {
            font-size: 0.7rem;
            font-weight: 700;
            color: #6b7280;
            text-transform: uppercase;
            margin-bottom: 0.75rem;
            display: flex;
            align-items: center;
        }
        .cell-label::before {
            content: "";
            display: inline-block;
            width: 4px;
            height: 12px;
            background-color: #3b82f6;
            margin-right: 0.5rem;
        }

        .cell-content { font-size: 0.9rem; line-height: 1.6; }
        .cell-content strong { color: #111827; display: block; margin-bottom: 0.25rem; }

        .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; }
        .stat-card {
            border: 1px solid #e5e7eb;
            padding: 1rem;
            text-align: center;
            background-color: #fafafa;
        }
        .stat-label { font-size: 0.7rem; color: #6b7280; font-weight: 600; margin-bottom: 0.5rem; }
        .stat-value { font-size: 1.5rem; font-weight: 800; color: #111827; }
        .stat-unit { font-size: 0.75rem; font-weight: 500; color: #9ca3af; margin-left: 0.125rem; }

        .agenda-box {
            background-color: #f9fafb;
            border-left: 4px solid #111827;
            padding: 1.5rem;
        }
        .agenda-list { list-style: none; padding: 0; }
        .agenda-item {
            margin-bottom: 0.75rem;
            display: flex;
            align-items: flex-start;
            font-weight: 500;
            font-size: 0.95rem;
        }
        .agenda-item::before {
            content: "Q.";
            font-weight: 800;
            color: #3b82f6;
            margin-right: 0.75rem;
        }

        footer {
            margin-top: 3rem;
            text-align: center;
            font-size: 0.7rem;
            color: #9ca3af;
        }

        @media print {
            body { padding: 0; background-color: white; }
            .report-container { box-shadow: none; border: none; padding: 0; }
            section { page-break-inside: avoid; }
            @page { margin: 1.5cm; }
        }
    </style>
</head>
<body>
    <div class="report-container">
        <header>
            <div class="title-group">
                <h1>経営デザインシート型・事業進捗レポート</h1>
                <p>Strategic Design & Performance Metrics Visualization</p>
            </div>
            <div class="owner-info">
                <div class="name">${strategy.owner.name}</div>
                <div class="role">${strategy.owner.role}</div>
                <div class="date">Issued: ${new Date().toLocaleDateString('ja-JP')}</div>
            </div>
        </header>

        <!-- Section 1: 経営デザインシート (戦略面) -->
        <section>
            <div class="section-header">
                <span class="section-number">01</span>
                <span class="section-title">Strategic Design (経営デザイン)</span>
            </div>

            <div class="design-sheet-grid">
                <!-- 知的資産（過去・現在） -->
                <div class="design-cell">
                    <div class="cell-label">知的資産（過去・現在）</div>
                    <div class="cell-content">
                        <strong>${strategy.management_design.past_present.experience}</strong>
                        <p style="font-size: 0.8rem; color: #4b5563; margin-bottom: 0.5rem;">${strategy.management_design.past_present.core_philosophy}</p>
                        <ul style="padding-left: 1.25rem; font-size: 0.8rem;">
                            ${strategy.management_design.past_present.assets.map(a => `<li>${a}</li>`).join('')}
                        </ul>
                    </div>
                </div>

                <!-- 価値創造メカニズム（移行期） -->
                <div class="design-cell">
                    <div class="cell-label">価値創造メカニズム（移行期）</div>
                    <div class="cell-content">
                        <strong>${strategy.management_design.value_creation.mechanism}</strong>
                        <p style="font-size: 0.8rem;">${strategy.management_design.value_creation.strategy}</p>
                        <p style="margin-top: 0.5rem; font-weight: 600; color: #2563eb;">→ ${strategy.management_design.value_creation.benefit}</p>
                    </div>
                </div>

                <!-- 未来の姿（価値） -->
                <div class="design-cell" style="grid-column: span 2;">
                    <div class="cell-label">未来の姿（価値）</div>
                    <div class="cell-content" style="display: flex; justify-content: space-between; align-items: flex-start;">
                        <div style="flex: 1;">
                            <strong>収益・規模目標</strong>
                            <p style="font-size: 1.1rem; font-weight: 700; color: #111827;">${strategy.management_design.future_vision.profit_goal}</p>
                            <p style="font-size: 0.8rem; color: #4b5563; margin-top: 0.25rem;">${strategy.management_design.future_vision.milestone}</p>
                        </div>
                        <div style="flex: 1; border-left: 1px solid #e5e7eb; padding-left: 1.5rem;">
                            <strong>社会的インパクト / ビジョン</strong>
                            <p style="font-size: 0.9rem; font-weight: 500; line-height: 1.5;">${strategy.management_design.future_vision.social_impact}</p>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <!-- Section 2: ビジネス実績 (事実面) -->
        <section>
            <div class="section-header">
                <span class="section-number">02</span>
                <span class="section-title">Performance Metrics (実績・事実)</span>
            </div>

            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-label">総記事数</div>
                    <div class="stat-value">${stats.totalArticles}<span class="stat-unit">posts</span></div>
                </div>
                <div class="stat-card">
                    <div class="stat-label">30日更新数</div>
                    <div class="stat-value">${stats.last30DaysUpdates}<span class="stat-unit">updates</span></div>
                </div>
                <div class="stat-card">
                    <div class="stat-label">JSON-LD 網羅率</div>
                    <div class="stat-value">${stats.jsonLdCoverage}<span class="stat-unit">%</span></div>
                </div>
                <div class="stat-card">
                    <div class="stat-label">Lighthouse</div>
                    <div class="stat-value" style="color: #059669;">${stats.lighthouseScore}</div>
                </div>
            </div>

            <div style="margin-top: 1.5rem; display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                <div style="border: 1px solid #e5e7eb; padding: 1rem; background-color: #fafafa;">
                    <div class="stat-label">システム健康度 (直近7日間)</div>
                    <div style="display: flex; justify-content: space-around; margin-top: 0.5rem;">
                        <div style="text-align: center;">
                            <div style="font-size: 0.6rem; text-transform: uppercase; color: #ef4444; font-weight: 700;">Critical</div>
                            <div style="font-size: 1.25rem; font-weight: 800;">${stats.monitoring.criticalCount}</div>
                        </div>
                        <div style="text-align: center;">
                            <div style="font-size: 0.6rem; text-transform: uppercase; color: #f59e0b; font-weight: 700;">Warning</div>
                            <div style="font-size: 1.25rem; font-weight: 800;">${stats.monitoring.warningCount}</div>
                        </div>
                    </div>
                </div>
                <div style="border: 1px solid #e5e7eb; padding: 1rem; background-color: #fafafa;">
                    <div class="stat-label">運用ペース</div>
                    <div style="text-align: center; margin-top: 0.5rem;">
                        <div style="font-size: 1.125rem; font-weight: 700;">${strategy.performance_manual.update_frequency}</div>
                        <div style="font-size: 0.65rem; color: #6b7280; margin-top: 0.25rem;">Performance Target</div>
                    </div>
                </div>
            </div>
        </section>

        <!-- Section 3: 本日の相談事項 -->
        <section style="margin-bottom: 0;">
            <div class="section-header">
                <span class="section-number">03</span>
                <span class="section-title">Consultation Agenda (本日の相談事項)</span>
            </div>
            <div class="agenda-box">
                <ul class="agenda-list">
                    ${strategy.today_agenda.map(item => `
                        <li class="agenda-item">${item}</li>
                    `).join('')}
                </ul>
            </div>
        </section>

        <footer>
            <p>© ${new Date().getFullYear()} 技術本 2.0 延命計画 - Generated by blog-factory-production-line</p>
        </footer>
    </div>
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
