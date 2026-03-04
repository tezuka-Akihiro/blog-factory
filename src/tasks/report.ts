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
        body { line-height: 1.4; -webkit-font-smoothing: antialiased; font-size: 11px; color: #333; background-color: #fff; }

        /* Page Layout */
        .page {
            width: 420mm;
            height: 297mm;
            padding: 15mm;
            margin: 0 auto;
            page-break-after: always;
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
        h1 { font-size: 18px; font-weight: bold; color: #001f3f; border-bottom: 2px solid #001f3f; margin-bottom: 10px; padding-bottom: 5px; }
        .owner-header { position: absolute; top: 10mm; right: 10mm; text-align: right; }
        .owner-name { font-weight: bold; font-size: 14px; }
        .owner-role { font-size: 10px; color: #666; }

        /* Management Design Sheet Layout (Page 1) */
        .sheet-container {
            display: grid;
            grid-template-columns: 1fr 1fr;
            grid-template-rows: auto 1fr auto;
            height: calc(100% - 40px);
            gap: 20px;
            position: relative;
        }

        .external-env {
            position: absolute;
            top: 60px;
            right: 0;
            width: 180px;
            z-index: 10;
        }

        .env-box {
            border: 1px solid #001f3f;
            padding: 8px;
            margin-bottom: 10px;
            background: #f8fafc;
        }
        .env-title { font-weight: bold; font-size: 9px; color: #001f3f; border-bottom: 1px solid #001f3f; margin-bottom: 3px; }
        .env-list { list-style: none; padding: 0; font-size: 8px; }

        .circle-area {
            border: 1px solid #001f3f;
            border-radius: 50%;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            padding: 30px;
            aspect-ratio: 1 / 1;
            position: relative;
            background: #fff;
        }

        .circle-label {
            position: absolute;
            top: -12px;
            left: 50%;
            transform: translateX(-50%);
            background: white;
            padding: 0 15px;
            font-weight: bold;
            font-size: 14px;
            color: #001f3f;
            white-space: nowrap;
            border: 1px solid #001f3f;
            border-radius: 15px;
        }

        .layer-box {
            width: 90%;
            border: 1px solid #eee;
            margin-bottom: 8px;
            padding: 6px;
            background: #fff;
        }
        .layer-title { font-weight: bold; font-size: 10px; color: #001f3f; margin-bottom: 3px; border-left: 3px solid #001f3f; padding-left: 5px; }
        .layer-content { font-size: 10px; }

        .transition-area {
            grid-column: 1 / 3;
            border-top: 2px dashed #001f3f;
            margin-top: 20px;
            padding-top: 15px;
            display: flex;
            flex-direction: column;
            align-items: center;
        }
        .transition-label { font-weight: bold; font-size: 14px; color: #001f3f; margin-bottom: 10px; }
        .challenges-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 15px;
            width: 100%;
        }
        .challenge-item {
            border: 1px solid #001f3f;
            padding: 10px;
            background: #f0f4f8;
            font-weight: bold;
            text-align: center;
        }

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
        .arrow-connector::before {
            content: "";
            width: 100px;
            height: 2px;
            background: #001f3f;
            margin-bottom: -13px;
        }
        .arrow-connector::after {
            content: "▶";
            font-size: 24px;
            color: #001f3f;
            background: white;
            padding: 0 5px;
        }

        /* Performance Metrics & Agenda (Page 2) */
        .stats-section {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 15px;
            margin-top: 20px;
        }
        .stat-card {
            border: 1px solid #e5e7eb;
            padding: 15px;
            text-align: center;
        }
        .stat-label { font-size: 10px; color: #666; margin-bottom: 5px; }
        .stat-value { font-size: 24px; font-weight: bold; color: #001f3f; }

        .agenda-section { margin-top: 40px; }
        .agenda-list { list-style: none; padding: 0; }
        .agenda-item {
            padding: 10px;
            border-bottom: 1px solid #eee;
            display: flex;
            align-items: flex-start;
        }
        .agenda-item::before {
            content: "■";
            color: #001f3f;
            margin-right: 10px;
        }

        .footer {
            position: absolute;
            bottom: 10mm;
            left: 10mm;
            right: 10mm;
            font-size: 8px;
            color: #999;
            text-align: center;
            border-top: 1px solid #eee;
            padding-top: 5px;
        }
    </style>
</head>
<body>
    <!-- Page 1: 経営デザインシート -->
    <div class="page">
        <div class="owner-header">
            <div class="owner-name">${strategy.owner.name}</div>
            <div class="owner-role">${strategy.owner.role}</div>
            <div style="font-size: 9px; color: #999;">作成日: ${new Date().toLocaleDateString('ja-JP')}</div>
        </div>
        <h1>経営デザインシート (価値創造ストーリー)</h1>

        <div class="sheet-container">
            <!-- External Environment -->
            <div class="external-env">
                <div class="env-box">
                    <div class="env-title">機会 (Opportunity)</div>
                    <ul class="env-list">
                        ${strategy.external_environment.opportunity.map(o => `<li>・${o}</li>`).join('')}
                    </ul>
                </div>
                <div class="env-box">
                    <div class="env-title">脅威 (Threat)</div>
                    <ul class="env-list">
                        ${strategy.external_environment.threat.map(t => `<li>・${t}</li>`).join('')}
                    </ul>
                </div>
            </div>

            <!-- Left Circle: Past/Present -->
            <div style="display: flex; justify-content: flex-end; align-items: center; padding-right: 80px;">
                <div class="circle-area" style="width: 450px; height: 450px;">
                    <div class="circle-label">これまで (現状・実績)</div>

                    <div class="layer-box">
                        <div class="layer-title">資源 (Resources)</div>
                        <div class="layer-content">${strategy.historical_context.resources.join('<br>')}</div>
                    </div>
                    <div class="layer-box">
                        <div class="layer-title">事業モデル (Business Model)</div>
                        <div class="layer-content">${strategy.historical_context.business_model}</div>
                    </div>
                    <div class="layer-box">
                        <div class="layer-title">価値 (Value Proposition)</div>
                        <div class="layer-content">${strategy.historical_context.value}</div>
                    </div>
                </div>
            </div>

            <!-- Arrow -->
            <div class="arrow-connector"></div>

            <!-- Right Circle: Future/Ideal -->
            <div style="display: flex; justify-content: flex-start; align-items: center; padding-left: 80px;">
                <div class="circle-area" style="width: 450px; height: 450px;">
                    <div class="circle-label">これから (将来・理想)</div>

                    <div class="layer-box">
                        <div class="layer-title">資源 (Resources)</div>
                        <div class="layer-content">${strategy.future_ideal.resources.join('<br>')}</div>
                    </div>
                    <div class="layer-box">
                        <div class="layer-title">事業モデル (Business Model)</div>
                        <div class="layer-content">${strategy.future_ideal.business_model}</div>
                    </div>
                    <div class="layer-box">
                        <div class="layer-title">価値 (Value Proposition)</div>
                        <div class="layer-content">${strategy.future_ideal.value}</div>
                    </div>
                </div>
            </div>

            <!-- Bottom: Challenges/Actions -->
            <div class="transition-area">
                <div class="transition-label">移行期の課題・アクション</div>
                <div class="challenges-grid">
                    ${strategy.strategic_challenges.map(c => `<div class="challenge-item">${c}</div>`).join('')}
                </div>
            </div>
        </div>
        <div class="footer">Confidential - 経営デザインシート 標準様式準拠</div>
    </div>

    <!-- Page 2: 実績報告・相談事項 -->
    <div class="page">
        <h1>実績報告 (Performance Metrics)</h1>

        <div class="stats-section">
            <div class="stat-card">
                <div class="stat-label">総記事数</div>
                <div class="stat-value">${stats.totalArticles}</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">30日以内更新</div>
                <div class="stat-value">${stats.last30DaysUpdates}</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">JSON-LD 網羅率</div>
                <div class="stat-value">${stats.jsonLdCoverage}%</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">運用目標</div>
                <div style="font-size: 14px; font-weight: bold; color: #001f3f; margin-top: 10px;">
                    ${strategy.performance_manual ? strategy.performance_manual.update_frequency : '-'}
                </div>
            </div>
        </div>

        <div style="margin-top: 30px; display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
            <div style="border: 1px solid #e5e7eb; padding: 20px;">
                <div class="stat-label" style="text-align: center; border-bottom: 1px solid #eee; padding-bottom: 10px; margin-bottom: 10px;">システム健康度 (直近7日間)</div>
                <div style="display: flex; justify-content: space-around;">
                    <div style="text-align: center;">
                        <div style="font-size: 9px; color: #ef4444; font-weight: bold;">CRITICAL</div>
                        <div style="font-size: 20px; font-weight: bold;">${stats.monitoring.criticalCount}</div>
                    </div>
                    <div style="text-align: center;">
                        <div style="font-size: 9px; color: #f59e0b; font-weight: bold;">WARNING</div>
                        <div style="font-size: 20px; font-weight: bold;">${stats.monitoring.warningCount}</div>
                    </div>
                </div>
            </div>
            <div style="border: 1px solid #e5e7eb; padding: 20px; display: flex; flex-direction: column; justify-content: center;">
                <div class="stat-label" style="text-align: center;">トラフィック (月間)</div>
                <div style="display: flex; justify-content: space-around; margin-top: 10px;">
                    <div>PV: <span style="font-weight: bold;">${stats.traffic.pv}</span></div>
                    <div>UU: <span style="font-weight: bold;">${stats.traffic.uu}</span></div>
                </div>
            </div>
        </div>

        <div class="agenda-section">
            <h1 style="font-size: 14px; border-bottom: 1px solid #001f3f;">本日の相談事項 (Consultation Agenda)</h1>
            <ul class="agenda-list">
                ${strategy.consultation_items.map(item => `<li class="agenda-item">${item}</li>`).join('')}
            </ul>
        </div>

        <div class="footer">© ${new Date().getFullYear()} 技術本 2.0 延命計画 - 経営デザインシート補足資料</div>
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
