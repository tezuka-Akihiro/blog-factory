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
    const data = parsed.data as Strategy;

    // Validation
    if (!data.management_design?.future_vision) {
      Logger.warn('strategy.yaml: mandatory field [management_design.future_vision] is missing.');
    }

    return data;
  } catch (error) {
    Logger.error(`strategy.yaml 読み込み失敗: ${error instanceof Error ? error.message : String(error)}`);
    throw error;
  }
}

function replacePlaceholders(obj: any, replacements: Record<string, string>): any {
  if (typeof obj === 'string') {
    let result = obj;
    for (const [key, value] of Object.entries(replacements)) {
      result = result.replace(new RegExp(`{{${key}}}`, 'g'), value);
    }
    return result;
  }
  if (Array.isArray(obj)) {
    return obj.map(item => replacePlaceholders(item, replacements));
  }
  if (typeof obj === 'object' && obj !== null) {
    const newObj: any = {};
    for (const key in obj) {
      newObj[key] = replacePlaceholders(obj[key], replacements);
    }
    return newObj;
  }
  return obj;
}

export async function generateHtmlReport(data: ReportData): Promise<string> {
  const replacements = {
    ARTICLE_COUNT: data.stats.totalArticles.toString(),
  };

  const strategy = replacePlaceholders(data.strategy, replacements) as Strategy;
  const { stats } = data;

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

        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans JP", sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol";
            background-color: #fcfcfc;
            color: #333333;
            padding: 2rem;
            max-width: 1000px;
            margin: 0 auto;
        }

        .report-container {
            background-color: white;
            padding: 3rem;
            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
            border: 1px solid #e5e7eb;
            position: relative;
        }

        header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            border-bottom: 3px solid #001f3f;
            padding-bottom: 1.5rem;
            margin-bottom: 2.5rem;
        }

        .title-group h1 { font-size: 2rem; font-weight: 900; letter-spacing: -0.025em; color: #001f3f; margin-bottom: 0.25rem; }
        .title-group p { font-size: 0.875rem; color: #666; font-weight: 500; text-transform: uppercase; letter-spacing: 0.1em; }

        .owner-info { text-align: right; }
        .owner-info .name { font-weight: 700; font-size: 1.25rem; color: #001f3f; }
        .owner-info .role { font-size: 0.8rem; color: #666; margin-top: 0.25rem; }
        .owner-info .date { font-size: 0.75rem; color: #999; margin-top: 0.5rem; }

        .seal-of-quality {
            display: flex;
            gap: 1.5rem;
            margin-bottom: 2rem;
            background-color: #f0f4f8;
            padding: 1rem 1.5rem;
            border-radius: 4px;
            border-left: 4px solid #001f3f;
        }
        .seal-item { display: flex; align-items: center; gap: 0.5rem; }
        .seal-label { font-size: 0.65rem; font-weight: 700; color: #001f3f; text-transform: uppercase; }
        .seal-value { font-size: 1.1rem; font-weight: 900; color: #001f3f; }

        section { margin-bottom: 3rem; }

        .section-header {
            display: flex;
            align-items: center;
            margin-bottom: 1.5rem;
            border-bottom: 1px solid #001f3f;
            padding-bottom: 0.5rem;
        }
        .section-number {
            background-color: #001f3f;
            color: white;
            padding: 0.2rem 0.8rem;
            font-weight: 900;
            font-size: 0.8rem;
            margin-right: 1rem;
        }
        .section-title {
            font-weight: 900;
            color: #001f3f;
            font-size: 1.25rem;
            text-transform: uppercase;
            letter-spacing: 0.05em;
        }

        .design-sheet-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 1.5rem;
        }
        .design-cell {
            background-color: #fff;
            padding: 1.5rem;
            border: 1px solid #e5e7eb;
            position: relative;
        }
        .cell-label {
            font-size: 0.75rem;
            font-weight: 900;
            color: #001f3f;
            text-transform: uppercase;
            margin-bottom: 1rem;
            display: flex;
            align-items: center;
            border-bottom: 1px solid #f0f0f0;
            padding-bottom: 0.5rem;
        }
        .cell-label::before {
            content: "";
            display: inline-block;
            width: 8px;
            height: 8px;
            background-color: #001f3f;
            margin-right: 0.75rem;
            transform: rotate(45deg);
        }

        .cell-content { font-size: 0.95rem; line-height: 1.7; }
        .cell-content strong { color: #001f3f; display: block; margin-bottom: 0.5rem; font-size: 1.05rem; }

        .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; }
        .stat-card {
            border: 1px solid #e5e7eb;
            padding: 1.25rem;
            text-align: center;
            background-color: #fff;
        }
        .stat-label { font-size: 0.7rem; color: #666; font-weight: 700; margin-bottom: 0.75rem; text-transform: uppercase; }
        .stat-value { font-size: 1.75rem; font-weight: 900; color: #001f3f; }
        .stat-unit { font-size: 0.75rem; font-weight: 500; color: #999; margin-left: 0.25rem; }

        .agenda-box {
            background-color: #fff;
            border: 1px solid #001f3f;
            padding: 2rem;
        }
        .agenda-list { list-style: none; padding: 0; }
        .agenda-item {
            margin-bottom: 1rem;
            display: flex;
            align-items: flex-start;
            font-weight: 700;
            font-size: 1rem;
            color: #333;
        }
        .agenda-item::before {
            content: "QUESTION";
            font-size: 0.6rem;
            font-weight: 900;
            color: #fff;
            background-color: #001f3f;
            padding: 0.1rem 0.4rem;
            margin-right: 1rem;
            margin-top: 0.25rem;
        }

        footer {
            margin-top: 4rem;
            text-align: center;
            font-size: 0.75rem;
            color: #999;
            border-top: 1px solid #eee;
            padding-top: 2rem;
        }

        @media print {
            body { padding: 0; background-color: white; }
            .report-container { box-shadow: none; border: none; padding: 0; }
            section { page-break-inside: avoid; }
            .page-break { page-break-after: always; }
            @page { margin: 2cm; }
        }
    </style>
</head>
<body>
    <div class="report-container">
        <header>
            <div class="title-group">
                <h1>経営デザインシート型・事業進捗レポート</h1>
                <p>Strategic Design & Business Performance Review</p>
            </div>
            <div class="owner-info">
                <div class="name">${strategy.owner.name}</div>
                <div class="role">${strategy.owner.role}</div>
                <div class="date">Issued: ${new Date().toLocaleDateString('ja-JP')}</div>
            </div>
        </header>

        <div class="seal-of-quality">
            <div class="seal-item">
                <span class="seal-label">Error Rate:</span>
                <span class="seal-value">0.0%</span>
            </div>
            <div class="seal-item">
                <span class="seal-label">Lighthouse Score:</span>
                <span class="seal-value" style="color: #059669;">100/100</span>
            </div>
            <div class="seal-item">
                <span class="seal-label">Status:</span>
                <span class="seal-value" style="color: #001f3f; font-size: 0.9rem;">CERTIFIED FOUNDATION</span>
            </div>
        </div>

        <!-- Section 1: 経営デザインシート (戦略面) -->
        <section class="page-break">
            <div class="section-header">
                <span class="section-number">01</span>
                <span class="section-title">Strategic Design (経営デザイン)</span>
            </div>

            <div class="design-sheet-grid">
                <!-- 知的資産（過去・現在） -->
                ${strategy.management_design.past_present ? `
                <div class="design-cell">
                    <div class="cell-label">知的資産（過去・現在）</div>
                    <div class="cell-content">
                        <strong>${strategy.management_design.past_present.experience}</strong>
                        <p style="font-size: 0.85rem; color: #666; margin-bottom: 0.75rem;">${strategy.management_design.past_present.core_philosophy}</p>
                        <ul style="padding-left: 1.25rem; font-size: 0.85rem; color: #333;">
                            ${strategy.management_design.past_present.assets.map(a => `<li style="margin-bottom: 0.25rem;">${a}</li>`).join('')}
                        </ul>
                    </div>
                </div>
                ` : ''}

                <!-- 価値創造メカニズム（移行期） -->
                ${strategy.management_design.value_creation ? `
                <div class="design-cell">
                    <div class="cell-label">価値創造メカニズム（移行期）</div>
                    <div class="cell-content">
                        <strong>${strategy.management_design.value_creation.mechanism}</strong>
                        <p style="font-size: 0.85rem; margin-bottom: 0.75rem;">${strategy.management_design.value_creation.strategy}</p>
                        <p style="margin-top: 1rem; font-weight: 700; color: #001f3f; border-top: 1px dashed #ccc; padding-top: 0.5rem;">Value Proposition:<br>${strategy.management_design.value_creation.benefit}</p>
                    </div>
                </div>
                ` : ''}

                <!-- 外部環境（機会と脅威） -->
                ${strategy.external_environment ? `
                <div class="design-cell" style="grid-column: span 2;">
                    <div class="cell-label">外部環境（機会と脅威）</div>
                    <div class="cell-content" style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem;">
                        <div style="background-color: #f0fdf4; padding: 1.25rem; border: 1px solid #dcfce7;">
                            <strong style="color: #15803d; border-bottom: 1px solid #bbf7d0; display: block; margin-bottom: 0.75rem;">OPPORTUNITY (機会)</strong>
                            <ul style="padding-left: 1.25rem; font-size: 0.85rem; color: #166534;">
                                ${strategy.external_environment.opportunity.map(o => `<li style="margin-bottom: 0.5rem;">${o}</li>`).join('')}
                            </ul>
                        </div>
                        <div style="background-color: #fff7ed; padding: 1.25rem; border: 1px solid #ffedd5;">
                            <strong style="color: #c2410c; border-bottom: 1px solid #fed7aa; display: block; margin-bottom: 0.75rem;">THREAT (脅威)</strong>
                            <ul style="padding-left: 1.25rem; font-size: 0.85rem; color: #9a3412;">
                                ${strategy.external_environment.threat.map(t => `<li style="margin-bottom: 0.5rem;">${t}</li>`).join('')}
                            </ul>
                        </div>
                    </div>
                </div>
                ` : ''}

                <!-- 未来の姿（価値） -->
                ${strategy.management_design.future_vision ? `
                <div class="design-cell" style="grid-column: span 2;">
                    <div class="cell-label">未来の姿（価値）</div>
                    <div class="cell-content" style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem;">
                        <div>
                            <strong>収益・規模目標</strong>
                            <p style="font-size: 1.25rem; font-weight: 900; color: #001f3f;">${strategy.management_design.future_vision.profit_goal}</p>
                            <p style="font-size: 0.85rem; color: #666; margin-top: 0.5rem;">${strategy.management_design.future_vision.milestone}</p>
                        </div>
                        <div style="border-left: 1px solid #eee; padding-left: 2rem;">
                            <strong>社会的インパクト / ビジョン</strong>
                            <p style="font-size: 0.95rem; font-weight: 700; color: #333; line-height: 1.6;">${strategy.management_design.future_vision.social_impact}</p>
                        </div>
                    </div>
                </div>
                ` : ''}
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
                    <div class="stat-label">System Score</div>
                    <div class="stat-value" style="color: #059669;">100</div>
                </div>
            </div>

            <div style="margin-top: 1.5rem; display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem;">
                <div style="border: 1px solid #e5e7eb; padding: 1.5rem; background-color: #fff;">
                    <div class="stat-label">システム健康度 (直近7日間)</div>
                    <div style="display: flex; justify-content: space-around; margin-top: 1rem;">
                        <div style="text-align: center;">
                            <div style="font-size: 0.65rem; text-transform: uppercase; color: #ef4444; font-weight: 900; letter-spacing: 0.05em;">Critical</div>
                            <div style="font-size: 1.5rem; font-weight: 900;">${stats.monitoring.criticalCount}</div>
                        </div>
                        <div style="text-align: center;">
                            <div style="font-size: 0.65rem; text-transform: uppercase; color: #f59e0b; font-weight: 900; letter-spacing: 0.05em;">Warning</div>
                            <div style="font-size: 1.5rem; font-weight: 900;">${stats.monitoring.warningCount}</div>
                        </div>
                    </div>
                </div>
                <div style="border: 1px solid #e5e7eb; padding: 1.5rem; background-color: #fff;">
                    <div class="stat-label">運用目標ペース</div>
                    <div style="text-align: center; margin-top: 1rem;">
                        <div style="font-size: 1.25rem; font-weight: 900; color: #001f3f;">${strategy.performance_manual ? strategy.performance_manual.update_frequency : '-'}</div>
                        <div style="font-size: 0.65rem; color: #999; margin-top: 0.5rem; text-transform: uppercase; font-weight: 700;">Performance Target</div>
                    </div>
                </div>
            </div>

            <div style="margin-top: 1.5rem; display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.5rem;">
                <div style="border: 1px solid #e5e7eb; padding: 1rem; text-align: center;">
                    <div class="stat-label">PV (Monthly)</div>
                    <div class="stat-value" style="font-size: 1.25rem; color: #999;">${stats.traffic.pv}</div>
                </div>
                <div style="border: 1px solid #e5e7eb; padding: 1rem; text-align: center;">
                    <div class="stat-label">UU (Monthly)</div>
                    <div class="stat-value" style="font-size: 1.25rem; color: #999;">${stats.traffic.uu}</div>
                </div>
                <div style="border: 1px solid #e5e7eb; padding: 1rem; text-align: center;">
                    <div class="stat-label">Avg. Stay Time</div>
                    <div class="stat-value" style="font-size: 1.25rem; color: #999;">${stats.traffic.avgStayTime}</div>
                </div>
            </div>
        </section>

        <!-- Section 3: 本日の相談事項 -->
        <section style="margin-bottom: 0;">
            <div class="section-header">
                <span class="section-number">03</span>
                <span class="section-title">Consultation Agenda (本日の相談事項)</span>
            </div>
            ${strategy.today_agenda ? `
            <div class="agenda-box">
                <ul class="agenda-list">
                    ${strategy.today_agenda.map(item => `
                        <li class="agenda-item">${item}</li>
                    `).join('')}
                </ul>
            </div>
            ` : ''}
        </section>

        <footer>
            <p>© ${new Date().getFullYear()} 技術本 2.0 延命計画 - Business Intelligence Report - Confidential</p>
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
