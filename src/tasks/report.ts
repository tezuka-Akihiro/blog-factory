import { writeFile, mkdir, readFile } from 'fs/promises';
import { join } from 'path';
import matter from 'gray-matter';
import { BlogSnapshot, InspectionResult, ReportData } from '../types';
import { Logger } from '../utils/logger';
import { Strategy } from '../types/strategy';

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
    <title>経営報告書</title>
    <style>
        /* Modern CSS Reset */
        *, *::before, *::after { box-sizing: border-box; }
        * { margin: 0; }
        body { line-height: 1.3; -webkit-font-smoothing: antialiased; font-size: 12pt; color: #333; background-color: #f3f4f6; }

        /* Page Layout */
        .page {
            width: 297mm;
            height: 210mm;
            padding: 10mm 15mm;
            margin: 10mm auto;
            position: relative;
            background: white;
            box-shadow: 0 0 10px rgba(0,0,0,0.1);
            page-break-after: always;
        }

        @media print {
            body { background: none; }
            .page { margin: 0; border: none; box-shadow: none; width: 297mm; height: 210mm; }
            @page { size: A4 landscape; margin: 0; }
        }

        /* Typography & Components */
        h1 { font-size: 15pt; font-weight: bold; color: #001f3f; border-bottom: 2px solid #001f3f; margin-bottom: 12px; padding-bottom: 4px; }
        .owner-header { position: absolute; top: 10mm; right: 15mm; text-align: right; }
        .owner-name { font-weight: bold; font-size: 13pt; }
        .owner-role { font-size: 11pt; color: #666; }

        /* Grid Layouts */
        .grid-container { display: grid; gap: 20px; }
        .two-cols { grid-template-columns: 1fr 1fr; }
        .three-cols { grid-template-columns: 1fr 1fr 1fr; }

        /* Common Box Styles */
        .section-box { border: 1px solid #001f3f; padding: 10px; position: relative; }
        .section-title {
            position: absolute; top: -10px; left: 15px; background: white; padding: 0 8px;
            font-weight: bold; font-size: 11pt; color: #001f3f; border: 1px solid #001f3f;
        }
        .content-area { margin-top: 5px; font-size: 12pt; }

        /* Metrics Styles */
        .metric-card { text-align: center; padding: 10px; border: 1px solid #eee; }
        .metric-label { font-size: 11pt; color: #666; margin-bottom: 5px; }
        .metric-value { font-weight: bold; color: #001f3f; }
        .value-xl { font-size: 24pt; }
        .value-lg { font-size: 18pt; }

        /* Page 1 Specifics (Management Design Sheet) */
        .design-sheet-grid { display: grid; grid-template-columns: 1fr auto 1fr; align-items: center; gap: 10px; margin-top: 20px; }
        .circle-box {
            border: 1px solid #aaa; border-radius: 50%; width: 120mm; height: 120mm;
            display: flex; flex-direction: column; justify-content: center; align-items: center;
            padding: 20px; background: #fff; position: relative;
        }
        .layer-box { width: 100%; border-bottom: 1px solid #eee; margin-bottom: 8px; padding-bottom: 4px; }
        .layer-title { font-weight: bold; font-size: 11pt; color: #001f3f; border-left: 3px solid #001f3f; padding-left: 5px; margin-bottom: 2px; }
        .arrow { font-size: 30pt; color: #001f3f; }

        /* Page 2 Specifics (Management Diagnosis) */
        .diagnosis-grid { grid-template-rows: auto auto 1fr; }
        .badge {
            display: inline-block; padding: 4px 12px; border-radius: 20px;
            background: #001f3f; color: white; font-weight: bold; font-size: 10pt;
        }
        .memo-space {
            border: 1px dashed #ccc; min-height: 150px; margin-top: 10px;
            background-image: repeating-linear-gradient(transparent, transparent 12pt, #eee 12pt, #eee 13pt);
            line-height: 13pt;
        }

        .footer {
            position: absolute; bottom: 5mm; left: 15mm; right: 15mm;
            font-size: 9pt; color: #999; text-align: center; border-top: 1px solid #eee; padding-top: 3px;
        }
    </style>
</head>
<body>
    <!-- PAGE 1: 経営デザインシート -->
    <div class="page">
        <div class="owner-header">
            <div style="font-size: 10pt; color: #999;">作成日: ${new Date().toLocaleDateString('ja-JP')}</div>
        </div>
        <h1>経営デザインシート</h1>

        <div class="design-sheet-grid">
            <!-- Left Circle: Past -->
            <div class="circle-box">
                <div class="section-title">これまで (現状・実績)</div>
                <div class="layer-box">
                    <div class="layer-title">資源 (Resources)</div>
                    <div class="content-area">${strategy.historical_context.resources.join('<br>')}</div>
                </div>
                <div class="layer-box">
                    <div class="layer-title">事業モデル</div>
                    <div class="content-area">${strategy.historical_context.business_model}</div>
                </div>
                <div class="layer-box">
                    <div class="layer-title">提供価値</div>
                    <div class="content-area">${strategy.historical_context.value}</div>
                </div>
            </div>

            <!-- Arrow -->
            <div class="arrow">▶</div>

            <!-- Right Circle: Future -->
            <div class="circle-box">
                <div class="section-title">これから (将来・理想)</div>
                <div class="layer-box">
                    <div class="layer-title">資源 (Resources)</div>
                    <div class="content-area">${strategy.future_ideal.resources.join('<br>')}</div>
                </div>
                <div class="layer-box">
                    <div class="layer-title">事業モデル</div>
                    <div class="content-area">${strategy.future_ideal.business_model}</div>
                </div>
                <div class="layer-box">
                    <div class="layer-title">提供価値</div>
                    <div class="content-area">${strategy.future_ideal.value}</div>
                </div>
            </div>
        </div>

        <div style="margin-top: 25px; display: grid; grid-template-columns: 1.5fr 1fr; gap: 30px;">
            <div class="section-box" style="border-radius: 30px; padding: 15px;">
                <div class="section-title">移行期の課題・アクション</div>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                    ${strategy.strategic_challenges.map(c => `
                        <div style="border-bottom: 1px solid #001f3f; padding: 5px; min-height: 40px; display: flex; align-items: center;">
                            ${c}
                        </div>
                    `).join('')}
                </div>
            </div>
            <div class="section-box">
                <div class="section-title">外部環境</div>
                <div style="font-size: 11pt;">
                    <strong>機会:</strong> ${strategy.external_environment.opportunity.join(', ')}<br>
                    <div style="margin-top: 5px;"></div>
                    <strong>脅威:</strong> ${strategy.external_environment.threat.join(', ')}
                </div>
            </div>
        </div>

        <div class="footer">1/2 - 経営デザインシート (統合版)</div>
    </div>

    <!-- PAGE 2: 経営診断書 -->
    <div class="page">
        <div class="owner-header">
            <div style="font-size: 10pt; color: #999;">作成日: ${new Date().toLocaleDateString('ja-JP')}</div>
        </div>
        <h1>経営診断書 (Management Diagnosis)</h1>

        <div class="grid-container diagnosis-grid">
            <!-- Middle: BUSINESS & ASSETS -->
            <div class="grid-container two-cols">
                <div class="section-box">
                    <div class="section-title">BUSINESS GROWTH（ビジネス進捗）</div>
                    <div class="grid-container two-cols" style="margin-top: 10px;">
                        <div class="metric-card">
                            <div class="metric-label">有料会員数 / 目標</div>
                            <div class="metric-value value-lg">${stats.business.paidMembers} / 100</div>
                        </div>
                        <div class="metric-card">
                            <div class="metric-label">無料会員数</div>
                            <div class="metric-value value-lg">${stats.business.freeMembers}</div>
                        </div>
                    </div>
                </div>
                <div class="section-box">
                    <div class="section-title">INTELLECTUAL ASSETS（資産の状態）</div>
                    <div class="grid-container" style="margin-top: 10px;">
                        <div class="metric-card">
                            <div class="metric-label">総記事数</div>
                            <div class="metric-value value-lg">${stats.totalArticles} posts</div>
                        </div>
                        <div class="metric-card">
                            <div class="metric-label">30日以内の更新数</div>
                            <div class="metric-value value-lg">${stats.last30DaysUpdates} updates</div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Traffic + Brand + Top5 -->
            <div class="grid-container three-cols">
                <div class="section-box">
                    <div class="section-title">TRAFFIC（直近30日）</div>
                    <div class="grid-container three-cols" style="margin-top: 10px;">
                        <div class="metric-card">
                            <div class="metric-label">UU（訪問者数）</div>
                            <div class="metric-value value-lg">${stats.traffic.uu}</div>
                        </div>
                        <div class="metric-card">
                            <div class="metric-label">PV（ページ表示数）</div>
                            <div class="metric-value value-lg">${stats.traffic.pv}</div>
                        </div>
                        <div class="metric-card">
                            <div class="metric-label">エラー率</div>
                            <div class="metric-value value-lg">${stats.monitoring.errorRate}</div>
                        </div>
                    </div>
                </div>
                <div class="section-box">
                    <div class="section-title">BRAND TRACTION（直近28日）</div>
                    <div class="grid-container" style="margin-top: 10px; grid-template-columns: 1fr 1fr;">
                        <div class="metric-card">
                            <div class="metric-label">指名検索数</div>
                            <div class="metric-value value-lg">${stats.brand.namedSearchCount}</div>
                        </div>
                        <div class="metric-card">
                            <div class="metric-label">リード転換数</div>
                            <div class="metric-value value-lg">${stats.conversion.microCvCount}</div>
                        </div>
                        <div class="metric-card">
                            <div class="metric-label">平均エンゲージメント時間</div>
                            <div class="metric-value" style="font-size: 14pt;">${stats.brand.avgEngagementTime}</div>
                        </div>
                        <div class="metric-card">
                            <div class="metric-label">再訪率</div>
                            <div class="metric-value" style="font-size: 14pt;">${stats.brand.returnRate}</div>
                        </div>
                    </div>
                </div>
                <div class="section-box">
                    <div class="section-title">人気記事 TOP 5（直近24時間）</div>
                    <div style="margin-top: 10px; font-size: 10pt;">
                        ${stats.traffic.topPages.length > 0
                          ? stats.traffic.topPages.map((p, i) => `
                            <div style="padding: 3px 0; border-bottom: 1px solid #eee; display: flex; gap: 8px;">
                                <span style="color: #001f3f; font-weight: bold; min-width: 18px;">${i + 1}.</span>
                                <span style="flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${p.path}</span>
                                <span style="color: #666;">${p.requests} req</span>
                            </div>`).join('')
                          : '<div style="color: #999; padding: 8px 0;">データなし</div>'
                        }
                    </div>
                </div>
            </div>

            <!-- Bottom: CONSULTATION & MEMO -->
            <div class="section-box">
                <div class="section-title">CONSULTATION & MEMO</div>
                <div class="grid-container two-cols" style="margin-top: 10px; height: 100%;">
                    <div>
                        <div style="font-weight: bold; font-size: 11pt; color: #001f3f; margin-bottom: 5px;">■ 本日の相談事項</div>
                        <ul style="list-style: none; padding: 0;">
                            ${strategy.consultation_items.map(item => `
                                <li style="padding: 4px 0; border-bottom: 1px solid #eee; display: flex; align-items: flex-start;">
                                    <span style="color: #001f3f; margin-right: 8px;">▶</span>
                                    <span>${item}</span>
                                </li>
                            `).join('')}
                        </ul>
                    </div>
                    <div>
                        <div style="font-weight: bold; font-size: 11pt; color: #001f3f; margin-bottom: 5px;">■ コンシェルジュ・メモ</div>
                        <div class="memo-space"></div>
                    </div>
                </div>
            </div>
        </div>

        <div class="footer">2/2 - 経営診断書 (Management Diagnosis Report)</div>
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
