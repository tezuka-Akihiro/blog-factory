import { Strategy } from '../types/strategy';
import { ReportData } from '../types';

export function renderStyles(): string {
  return `
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
        .funnel-arrow { display: flex; align-items: center; font-size: 18pt; color: #001f3f; padding: 0 2px; }
        .stage-box { border: 1px solid #001f3f; padding: 8px; position: relative; display: flex; flex-direction: column; gap: 6px; }
        .stage-title { position: absolute; top: -10px; left: 10px; background: white; padding: 0 6px; font-weight: bold; font-size: 9pt; color: #001f3f; border: 1px solid #001f3f; white-space: nowrap; }
        .stage-metric { text-align: center; padding: 5px 4px; border: 1px solid #eee; }
        .stage-metric .metric-label { font-size: 9pt; color: #666; margin-bottom: 3px; }
        .stage-metric .metric-value { font-weight: bold; color: #001f3f; font-size: 14pt; }
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
    </style>`;
}

export function renderPage1(strategy: Strategy, date: string): string {
  return `
    <div class="page">
        <div class="owner-header">
            <div style="font-size: 10pt; color: #999;">作成日: ${date}</div>
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

        <div class="footer">1/3 - 経営デザインシート (統合版)</div>
    </div>`;
}

export function renderPage2(stats: ReportData['stats'], strategy: Strategy, date: string): string {
  return `
    <div class="page" style="display: flex; flex-direction: column; gap: 20px;">
        <div class="owner-header">
            <div style="font-size: 10pt; color: #999;">作成日: ${date}</div>
        </div>
        <h1>経営診断書 (Management Diagnosis)</h1>

        <!-- Funnel Row -->
        <div style="display: grid; grid-template-columns: 1fr auto 1fr auto 1fr auto 1fr auto 1fr; align-items: stretch; gap: 4px;">
            <div class="stage-box">
                <div class="stage-title">① 資産（コンテンツ）</div>
                <div style="margin-top: 12px; display: grid; grid-template-columns: 1fr 1fr; gap: 4px;">
                    <div class="stage-metric">
                        <div class="metric-label">総記事数</div>
                        <div class="metric-value" style="font-size: 16pt;">${stats.totalArticles}</div>
                        <div style="font-size: 8pt; color: #999;">posts</div>
                    </div>
                    <div class="stage-metric">
                        <div class="metric-label">30日更新数</div>
                        <div class="metric-value" style="font-size: 16pt;">${stats.last30DaysUpdates}</div>
                        <div style="font-size: 8pt; color: #999;">updates</div>
                    </div>
                </div>
            </div>
            <div class="funnel-arrow">▶</div>

            <div class="stage-box">
                <div class="stage-title">② 流入（直近24h）</div>
                <div style="margin-top: 12px; display: grid; grid-template-columns: 1fr 1fr; gap: 4px;">
                    <div class="stage-metric">
                        <div class="metric-label">UU</div>
                        <div class="metric-value" style="font-size: 16pt;">${stats.traffic.uu}</div>
                        <div style="font-size: 8pt; color: #999;">訪問者数</div>
                    </div>
                    <div class="stage-metric">
                        <div class="metric-label">PV</div>
                        <div class="metric-value" style="font-size: 16pt;">${stats.traffic.pv}</div>
                        <div style="font-size: 8pt; color: #999;">ページ表示</div>
                    </div>
                </div>
                <div class="stage-metric" style="grid-column: span 2;">
                    <div class="metric-label">エラー率</div>
                    <div class="metric-value" style="font-size: 14pt;">${stats.monitoring.errorRate}</div>
                </div>
            </div>
            <div class="funnel-arrow">▶</div>

            <div class="stage-box">
                <div class="stage-title">③ 閲覧状況（直近28日）</div>
                <div style="margin-top: 12px; display: flex; flex-direction: column; gap: 4px;">
                    <div class="stage-metric">
                        <div class="metric-label">指名検索数</div>
                        <div class="metric-value" style="font-size: 16pt;">${stats.brand.namedSearchCount}</div>
                    </div>
                    <div class="stage-metric">
                        <div class="metric-label">平均エンゲージメント時間</div>
                        <div class="metric-value" style="font-size: 14pt;">${stats.brand.avgEngagementTime}</div>
                    </div>
                    <div class="stage-metric">
                        <div class="metric-label">再訪率</div>
                        <div class="metric-value" style="font-size: 14pt;">${stats.brand.returnRate}</div>
                    </div>
                </div>
            </div>
            <div class="funnel-arrow">▶</div>

            <div class="stage-box" style="justify-content: center; align-items: center; text-align: center;">
                <div class="stage-title">④ 無料会員</div>
                <div style="margin-top: 12px;">
                    <div style="font-size: 9pt; color: #666; margin-bottom: 4px;">無料会員数</div>
                    <div style="font-weight: bold; color: #001f3f; font-size: 28pt;">${stats.business.freeMembers}</div>
                    <div style="font-size: 8pt; color: #999;">members</div>
                </div>
            </div>
            <div class="funnel-arrow">▶</div>

            <div class="stage-box" style="justify-content: center; align-items: center; text-align: center; background: #f8faff;">
                <div class="stage-title" style="background: #f8faff;">⑤ 有料会員</div>
                <div style="margin-top: 12px;">
                    <div style="font-size: 9pt; color: #666; margin-bottom: 4px;">有料会員数 / 目標</div>
                    <div style="font-weight: bold; color: #001f3f; font-size: 28pt;">${stats.business.paidMembers}</div>
                    <div style="font-size: 10pt; color: #aaa;">/ 100</div>
                </div>
            </div>
        </div>

        <!-- Bottom Row -->
        <div style="display: grid; grid-template-columns: 1fr 2fr; gap: 10px; flex: 1; min-height: 0; margin-bottom: 8mm;">
            <div class="section-box">
                <div class="section-title">人気記事 TOP5（直近24時間）</div>
                <div style="margin-top: 10px; font-size: 9.5pt; overflow: hidden;">
                    ${stats.traffic.topPages.length > 0
                      ? stats.traffic.topPages.map((p, i) => `
                        <div style="padding: 3px 0; border-bottom: 1px solid #eee; display: flex; gap: 6px; align-items: center;">
                            <span style="color: #001f3f; font-weight: bold; min-width: 16px;">${i + 1}.</span>
                            <span style="flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${p.path}</span>
                            <span style="color: #666; white-space: nowrap;">${p.requests} req</span>
                        </div>`).join('')
                      : '<div style="color: #999; padding: 8px 0;">データなし</div>'
                    }
                </div>
            </div>

            <div class="section-box">
                <div class="section-title">CONSULTATION & MEMO</div>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-top: 10px; height: calc(100% - 10px);">
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

        <div class="footer">2/3 - 経営診断書 (Management Diagnosis Report)</div>
    </div>`;
}

export function renderPage3(strategy: Strategy, date: string): string {
  const content = strategy.six_w2h ? `
    <div style="flex: 1; display: grid; grid-template-columns: 1fr 1fr 1fr; grid-template-rows: 1fr 1fr 1fr; gap: 20px; padding-top: 14px; margin-bottom: 8mm;">
        <div class="section-box">
            <div class="section-title">Who（誰が）</div>
            <div class="content-area" style="margin-top: 10px; font-size: 12pt;">${strategy.six_w2h.who}</div>
        </div>
        <div class="section-box">
            <div class="section-title">Whom（誰に）</div>
            <div class="content-area" style="margin-top: 10px; font-size: 12pt;">${strategy.six_w2h.whom}</div>
        </div>
        <div class="section-box">
            <div class="section-title">What（何を）</div>
            <div class="content-area" style="margin-top: 10px; font-size: 12pt;">${strategy.six_w2h.what}</div>
        </div>
        <div class="section-box">
            <div class="section-title">How（どのように）</div>
            <div class="content-area" style="margin-top: 10px; font-size: 12pt;">${strategy.six_w2h.how}</div>
        </div>
        <div class="section-box" style="background: #f0f4ff; border: 2px solid #3b82f6;">
            <div class="section-title" style="color: #1d4ed8;">起業アイディア</div>
            <div class="content-area" style="margin-top: 10px; font-size: 12pt; font-weight: bold;">${strategy.six_w2h.idea}</div>
        </div>
        <div class="section-box">
            <div class="section-title">Why（それはなぜ）</div>
            <div class="content-area" style="margin-top: 10px; font-size: 12pt;">${strategy.six_w2h.why}</div>
        </div>
        <div class="section-box">
            <div class="section-title">When（いつ）</div>
            <div class="content-area" style="margin-top: 10px; font-size: 12pt;">${strategy.six_w2h.when}</div>
        </div>
        <div class="section-box">
            <div class="section-title">Where（どこで）</div>
            <div class="content-area" style="margin-top: 10px; font-size: 12pt;">${strategy.six_w2h.where}</div>
        </div>
        <div class="section-box">
            <div class="section-title">How Much（いくらで）</div>
            <div class="content-area" style="margin-top: 10px; font-size: 12pt;">${strategy.six_w2h.how_much}</div>
        </div>
    </div>` : '<div style="color: #999; padding: 20px;">strategy.yaml に six_w2h セクションが設定されていません。</div>';

  return `
    <div class="page" style="display: flex; flex-direction: column;">
        <div class="owner-header">
            <div style="font-size: 10pt; color: #999;">作成日: ${date}</div>
        </div>
        <h1>6W2H シート</h1>
        ${content}
        <div class="footer">3/3 - 6W2H シート</div>
    </div>`;
}
