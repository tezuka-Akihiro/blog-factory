import { writeFile, mkdir, readFile } from 'fs/promises';
import { join } from 'path';
import matter from 'gray-matter';
import { InspectionResult, ReportData } from '../types';
import { Logger } from '../utils/logger';
import { Strategy } from '../types/strategy';

export async function loadStrategy(): Promise<Strategy> {
  const strategyPath = join(process.cwd(), 'docs', 'strategy.yaml');
  try {
    const content = await readFile(strategyPath, 'utf-8');
    const parsed = matter('---\n' + content + '\n---');
    const data = parsed.data as Strategy;

    // Validation
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
    <title>経営デザインシート</title>
    <style>
        /* Modern CSS Reset */
        *, *::before, *::after { box-sizing: border-box; }
        * { margin: 0; }
        body { line-height: 1.3; -webkit-font-smoothing: antialiased; font-size: 12pt; color: #333; background-color: #fff; }

        /* Page Layout */
        .page {
            width: 420mm;
            height: 297mm;
            padding: 10mm 15mm;
            margin: 0 auto;
            position: relative;
            overflow: hidden;
            background: white;
            border: 1px solid #eee;
        }

        @media print {
            body { background: none; }
            .page { margin: 0; border: none; box-shadow: none; width: 420mm; height: 297mm; }
            @page { size: A3 landscape; margin: 0; }
        }

        /* Typography & Components */
        h1 { font-size: 15pt; font-weight: bold; color: #001f3f; border-bottom: 2px solid #001f3f; margin-bottom: 8px; padding-bottom: 4px; }
        .owner-header { position: absolute; top: 8mm; right: 15mm; text-align: right; }
        .owner-name { font-weight: bold; font-size: 14pt; }
        .owner-role { font-size: 12pt; color: #666; }

        /* Management Design Sheet Layout */
        .sheet-container {
            display: flex;
            flex-direction: column;
            height: 100%;
        }

        .main-design-area {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
            position: relative;
            margin-bottom: 10px;
        }

        .external-env {
            position: absolute;
            top: 40px;
            right: 0;
            width: 200px;
            z-index: 10;
        }

        .env-box {
            border: 1px solid #001f3f;
            padding: 6px;
            margin-bottom: 8px;
            background: #f8fafc;
            min-height: 80px;
            display: flex;
            flex-direction: column;
        }
        .env-title { font-weight: bold; font-size: 12pt; color: #001f3f; border-bottom: 1px solid #001f3f; margin-bottom: 2px; }
        .env-list { list-style: none; padding: 0; font-size: 12pt; flex-grow: 1; }

        .circle-area {
            border: 1px solid #001f3f;
            border-radius: 50%;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            padding: 20px;
            aspect-ratio: 1 / 1;
            position: relative;
            background: #fff;
        }

        .circle-label {
            position: absolute;
            top: -10px;
            left: 50%;
            transform: translateX(-50%);
            background: white;
            padding: 0 12px;
            font-weight: bold;
            font-size: 13pt;
            color: #001f3f;
            white-space: nowrap;
            border: 1px solid #001f3f;
            border-radius: 12px;
        }

        .layer-box {
            width: 85%;
            border: 1px solid #eee;
            margin-bottom: 5px;
            padding: 5px;
            background: #fff;
            min-height: 85px;
        }
        .layer-title { font-weight: bold; font-size: 12pt; color: #001f3f; margin-bottom: 2px; border-left: 3px solid #001f3f; padding-left: 4px; }
        .layer-content { font-size: 12pt; line-height: 1.2; }

        .arrow-connector {
            position: absolute;
            top: 45%;
            left: 50%;
            transform: translate(-50%, -50%);
            z-index: 5;
            display: flex;
            flex-direction: column;
            align-items: center;
        }
        .arrow-connector::after {
            content: "▶";
            font-size: 20pt;
            color: #001f3f;
            background: white;
            padding: 0 5px;
        }

        .bottom-integrated-area {
            display: grid;
            grid-template-columns: 1.2fr 0.8fr;
            gap: 30px;
            border-top: 2px dashed #001f3f;
            padding-top: 15px;
        }

        .transition-column {
            display: flex;
            flex-direction: column;
            align-items: center;
            border: 1px solid #001f3f;
            border-radius: 50px;
            padding: 20px;
            background: #fcfcfc;
        }
        .section-label { font-weight: bold; font-size: 14pt; color: #001f3f; margin-bottom: 8px; }
        .challenges-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 15px;
            width: 100%;
        }
        .challenge-item {
            border-bottom: 1px solid #001f3f;
            padding: 8px;
            font-weight: bold;
            text-align: center;
            min-height: 60px;
            display: flex;
            flex-direction: column;
            justify-content: center;
            font-size: 12pt;
        }

        /* Performance & Agenda */
        .data-column {
            display: flex;
            flex-direction: column;
        }
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 10px;
            margin-bottom: 10px;
        }
        .stat-card {
            border: 1px solid #e5e7eb;
            padding: 8px;
            text-align: center;
        }
        .stat-label { font-size: 11pt; color: #666; margin-bottom: 2px; }
        .stat-value { font-size: 20pt; font-weight: bold; color: #001f3f; }

        .agenda-list { list-style: none; padding: 0; }
        .agenda-item {
            padding: 4px;
            border-bottom: 1px solid #eee;
            display: flex;
            align-items: flex-start;
            font-size: 12pt;
        }
        .agenda-item::before {
            content: "■";
            color: #001f3f;
            margin-right: 8px;
        }
        .agenda-memo {
            margin-top: 8px;
            padding: 8px;
            border: 1px dashed #ccc;
            min-height: 100px;
            font-size: 11pt;
            color: #666;
        }

        .footer {
            position: absolute;
            bottom: 5mm;
            left: 15mm;
            right: 15mm;
            font-size: 10pt;
            color: #999;
            text-align: center;
            border-top: 1px solid #eee;
            padding-top: 3px;
        }
    </style>
</head>
<body>
    <div class="page">
        <div class="owner-header">
            <div class="owner-name">${strategy.owner.name}</div>
            <div class="owner-role">${strategy.owner.role}</div>
            <div style="font-size: 11pt; color: #999;">作成日: ${new Date().toLocaleDateString('ja-JP')}</div>
        </div>
        <h1>経営デザインシート (統合事業報告)</h1>

        <div class="sheet-container">
            <!-- Middle: Main Design Area -->
            <div class="main-design-area">
                <!-- External Environment -->
                <div class="external-env">
                    <div class="env-box">
                        <div class="env-title">機会 (Opportunity)</div>
                        <ul class="env-list">
                            ${strategy.external_environment.opportunity.map(o => `<li>・${o}</li>`).join('')}
                        </ul>
                        <div style="margin-top: auto; border-bottom: 1px dotted #ccc; height: 13pt;"></div>
                    </div>
                    <div class="env-box">
                        <div class="env-title">脅威 (Threat)</div>
                        <ul class="env-list">
                            ${strategy.external_environment.threat.map(t => `<li>・${t}</li>`).join('')}
                        </ul>
                        <div style="margin-top: auto; border-bottom: 1px dotted #ccc; height: 13pt;"></div>
                    </div>
                </div>

                <!-- Left Circle -->
                <div style="display: flex; justify-content: flex-end; align-items: center; padding-right: 60px;">
                    <div class="circle-area" style="width: 400px; height: 400px;">
                        <div class="circle-label">これまで (現状・実績)</div>
                        <div class="layer-box">
                            <div class="layer-title">資源 (Resources)</div>
                            <div class="layer-content">${strategy.historical_context.resources.join(', ')}</div>
                            <div style="margin-top: 13pt; border-bottom: 1px dotted #eee; height: 13pt;"></div>
                        </div>
                        <div class="layer-box">
                            <div class="layer-title">事業モデル</div>
                            <div class="layer-content">${strategy.historical_context.business_model}</div>
                        </div>
                        <div class="layer-box">
                            <div class="layer-title">提供価値</div>
                            <div class="layer-content">${strategy.historical_context.value}</div>
                        </div>
                    </div>
                </div>

                <!-- Arrow -->
                <div class="arrow-connector"></div>

                <!-- Right Circle -->
                <div style="display: flex; justify-content: flex-start; align-items: center; padding-left: 60px;">
                    <div class="circle-area" style="width: 400px; height: 400px;">
                        <div class="circle-label">これから (将来・理想)</div>
                        <div class="layer-box">
                            <div class="layer-title">資源 (Resources)</div>
                            <div class="layer-content">${strategy.future_ideal.resources.join(', ')}</div>
                            <div style="margin-top: 13pt; border-bottom: 1px dotted #eee; height: 13pt;"></div>
                        </div>
                        <div class="layer-box">
                            <div class="layer-title">事業モデル</div>
                            <div class="layer-content">${strategy.future_ideal.business_model}</div>
                        </div>
                        <div class="layer-box">
                            <div class="layer-title">提供価値</div>
                            <div class="layer-content">${strategy.future_ideal.value}</div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Bottom: Integrated Info -->
            <div class="bottom-integrated-area">
                <!-- Transition/Challenges (Oval Shape) -->
                <div class="transition-column">
                    <div class="section-label">移行期の課題・アクション</div>
                    <div class="challenges-grid">
                        ${strategy.strategic_challenges.map(c => `
                            <div class="challenge-item">
                                <div>${c}</div>
                                <div style="margin-top: 8pt; border-bottom: 1px dotted #001f3f; height: 13pt;"></div>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <!-- Metrics & Agenda -->
                <div class="data-column">
                    <div class="stats-grid">
                        <div class="stat-card">
                            <div class="stat-label">記事数</div>
                            <div class="stat-value">${stats.totalArticles}</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-label">JSON-LD</div>
                            <div class="stat-value">${stats.jsonLdCoverage}%</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-label">CRITICAL</div>
                            <div class="stat-value" style="color: #ef4444;">${stats.monitoring.criticalCount}</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-label">UU</div>
                            <div class="stat-value">${stats.traffic.uu}</div>
                        </div>
                    </div>

                    <div class="agenda-list">
                        <div class="section-label" style="font-size: 12pt; border-bottom: 1px solid #001f3f; margin-bottom: 5px;">相談事項 & メモ</div>
                        ${strategy.consultation_items.map(item => `<div class="agenda-item">${item}</div>`).join('')}
                        <div class="agenda-memo">
                            <div style="border-bottom: 1px solid #eee; height: 13pt;"></div>
                            <div style="margin-top: 13pt; border-bottom: 1px solid #eee; height: 13pt;"></div>
                            <div style="margin-top: 13pt; border-bottom: 1px solid #eee; height: 13pt;"></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <div class="footer">Confidential - 経営デザインシート 標準様式準拠 (統合版)</div>
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
