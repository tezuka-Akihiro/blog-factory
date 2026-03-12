import { Strategy } from '../types/strategy';
import { ReportData } from '../types';
import { DESIGN_TOKENS, toCssVariableName } from '../utils/design-tokens';

export function renderStyles(): string {
  const cssVariables = Object.entries(DESIGN_TOKENS)
    .map(([key, value]) => `        ${toCssVariableName(key)}: ${value};`)
    .join('\n');

  return `
    <style>
        :root {
${cssVariables}
        }

        /* Modern CSS Reset */
        *, *::before, *::after { box-sizing: border-box; }
        * { margin: 0; }
        body {
            line-height: 1.3;
            -webkit-font-smoothing: antialiased;
            font-size: var(--font-size-base);
            color: var(--color-text-base);
            background-color: var(--color-bg-base);
        }

        /* Page Layout */
        .page {
            width: 297mm;
            height: 210mm;
            padding: var(--spacing-page-padding-v) var(--spacing-page-padding-h);
            margin: 10mm auto;
            position: relative;
            background: var(--color-bg-white);
            box-shadow: 0 0 10px rgba(0,0,0,0.1);
            page-break-after: always;
        }

        @media print {
            body { background: none; }
            .page { margin: 0; border: none; box-shadow: none; width: 297mm; height: 210mm; }
            @page { size: A4 landscape; margin: 0; }
        }

        /* Typography & Components */
        h1 {
            font-size: var(--font-size-xl);
            font-weight: bold;
            color: var(--color-primary);
            border-bottom: var(--border-width-medium) solid var(--color-primary);
            margin-bottom: var(--spacing-m);
            padding-bottom: var(--spacing-s);
        }
        .owner-header {
            position: absolute;
            top: var(--spacing-page-padding-v);
            right: var(--spacing-page-padding-h);
            text-align: right;
        }
        .owner-name { font-weight: bold; font-size: var(--font-size-large); }
        .owner-role { font-size: var(--font-size-small); color: var(--color-text-muted); }

        /* Grid Layouts */
        .grid-container { display: grid; gap: var(--spacing-gap-default); }
        .two-cols { grid-template-columns: 1fr 1fr; }
        .three-cols { grid-template-columns: 1fr 1fr 1fr; }

        /* Common Box Styles */
        .section-box { border: var(--border-width-thin) solid var(--color-border-primary); padding: var(--spacing-gap-small); position: relative; }
        .section-title {
            position: absolute; top: -10px; left: var(--spacing-section-title-left); background: var(--color-bg-white); padding: 0 var(--spacing-base);
            font-weight: bold; font-size: var(--font-size-small); color: var(--color-primary); border: var(--border-width-thin) solid var(--color-border-primary);
        }
        .content-area { margin-top: var(--spacing-content-top); font-size: var(--font-size-base); }

        /* Metrics Styles */
        .metric-card { text-align: center; padding: var(--spacing-gap-small); border: var(--border-width-thin) solid var(--color-border-default); }
        .metric-label { font-size: var(--font-size-small); color: var(--color-text-muted); margin-bottom: var(--spacing-content-top); }
        .metric-value { font-weight: bold; color: var(--color-primary); }
        .value-xl { font-size: var(--font-size-xxxl); }
        .value-lg { font-size: var(--font-size-xxl); }

        /* Page 1 Specifics (Management Design Sheet) */
        .design-sheet-grid { display: grid; grid-template-columns: 1fr auto 1fr; align-items: center; gap: var(--spacing-gap-small); margin-top: var(--spacing-gap-default); }
        .circle-box {
            border: var(--border-width-thin) solid var(--color-border-strong); border-radius: 50%; width: 120mm; height: 120mm;
            display: flex; flex-direction: column; justify-content: center; align-items: center;
            padding: var(--spacing-gap-default); background: var(--color-bg-white); position: relative;
        }
        .layer-box { width: 100%; border-bottom: var(--border-width-thin) solid var(--color-border-default); margin-bottom: var(--spacing-base); padding-bottom: var(--spacing-s); }
        .layer-title {
            font-weight: bold;
            font-size: var(--font-size-small);
            color: var(--color-primary);
            border-left: var(--border-width-thick) solid var(--color-primary);
            padding-left: var(--spacing-content-top);
            margin-bottom: 2px;
        }
        .arrow { font-size: var(--font-size-mega); color: var(--color-primary); }

        /* Page 2 Specifics (Management Diagnosis) */
        .funnel-arrow { display: flex; align-items: center; font-size: var(--font-size-xxl); color: var(--color-primary); padding: 0 2px; }
        .stage-box { border: var(--border-width-thin) solid var(--color-border-primary); padding: var(--spacing-base); position: relative; display: flex; flex-direction: column; gap: var(--spacing-stage-gap); }
        .stage-title {
            position: absolute; top: -10px; left: var(--spacing-stage-title-left); background: var(--color-bg-white); padding: 0 var(--spacing-stage-gap);
            font-weight: bold; font-size: var(--font-size-tiny); color: var(--color-primary);
            border: var(--border-width-thin) solid var(--color-border-primary); white-space: nowrap;
        }
        .stage-metric { text-align: center; padding: 5px 4px; border: var(--border-width-thin) solid var(--color-border-default); }
        .stage-metric .metric-label { font-size: var(--font-size-tiny); color: var(--color-text-muted); margin-bottom: 3px; }
        .stage-metric .metric-value { font-weight: bold; color: var(--color-primary); font-size: var(--font-size-medium); }
        .badge {
            display: inline-block; padding: var(--spacing-badge-padding-v) var(--spacing-badge-padding-h); border-radius: var(--radius-small);
            background: var(--color-primary); color: var(--color-bg-white); font-weight: bold; font-size: var(--font-size-xs);
        }
        .memo-space {
            border: var(--border-width-thin) dashed var(--color-border-muted); min-height: var(--spacing-memo-gap); margin-top: var(--spacing-memo-margin-top);
            background-image: repeating-linear-gradient(transparent, transparent 12pt, var(--color-border-default) 12pt, var(--color-border-default) 13pt);
            line-height: 13pt;
        }

        .footer {
            position: absolute; bottom: var(--spacing-footer-bottom); left: var(--spacing-page-padding-h); right: var(--spacing-page-padding-h);
            font-size: var(--font-size-tiny); color: var(--color-text-subtle); text-align: center; border-top: var(--border-width-thin) solid var(--color-border-default); padding-top: 3px;
        }
    </style>`;
}

export function renderPage1(strategy: Strategy, date: string): string {
  return `
    <div class="page">
        <div class="owner-header">
            <div style="font-size: var(--font-size-xs); color: var(--color-text-subtle);">作成日: ${date}</div>
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

        <div style="margin-top: var(--spacing-page-gap); display: grid; grid-template-columns: 1.5fr 1fr; gap: var(--spacing-grid-gap);">
            <div class="section-box" style="border-radius: var(--radius-medium); padding: var(--spacing-section-title-left);">
                <div class="section-title">移行期の課題・アクション</div>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--spacing-section-title-left);">
                    ${strategy.strategic_challenges.map(c => `
                        <div style="border-bottom: var(--border-width-thin) solid var(--color-border-primary); padding: var(--spacing-content-top); min-height: var(--spacing-item-min-height); display: flex; align-items: center;">
                            ${c}
                        </div>
                    `).join('')}
                </div>
            </div>
            <div class="section-box">
                <div class="section-title">外部環境</div>
                <div style="font-size: var(--font-size-small);">
                    <strong>機会:</strong> ${strategy.external_environment.opportunity.join(', ')}<br>
                    <div style="margin-top: var(--spacing-content-top);"></div>
                    <strong>脅威:</strong> ${strategy.external_environment.threat.join(', ')}
                </div>
            </div>
        </div>

        <div class="footer">1/3 - 経営デザインシート (統合版)</div>
    </div>`;
}

export function renderPage2(stats: ReportData['stats'], strategy: Strategy, date: string): string {
  return `
    <div class="page" style="display: flex; flex-direction: column; gap: var(--spacing-gap-default);">
        <div class="owner-header">
            <div style="font-size: var(--font-size-xs); color: var(--color-text-subtle);">作成日: ${date}</div>
        </div>
        <h1>経営診断書 (Management Diagnosis)</h1>

        <!-- Funnel Row -->
        <div style="display: grid; grid-template-columns: 1fr auto 1fr auto 1fr auto 1fr auto 1fr; align-items: stretch; gap: var(--spacing-gap-tiny);">
            <div class="stage-box">
                <div class="stage-title">① 資産（コンテンツ）</div>
                <div style="margin-top: 12px; display: grid; grid-template-columns: 1fr 1fr; gap: var(--spacing-gap-tiny);">
                    <div class="stage-metric">
                        <div class="metric-label">総記事数</div>
                        <div class="metric-value" style="font-size: var(--font-size-title-inner);">${stats.totalArticles}</div>
                        <div style="font-size: var(--font-size-mini); color: var(--color-text-subtle);">posts</div>
                    </div>
                    <div class="stage-metric">
                        <div class="metric-label">30日更新数</div>
                        <div class="metric-value" style="font-size: var(--font-size-title-inner);">${stats.last30DaysUpdates}</div>
                        <div style="font-size: var(--font-size-mini); color: var(--color-text-subtle);">updates</div>
                    </div>
                </div>
            </div>
            <div class="funnel-arrow">▶</div>

            <div class="stage-box">
                <div class="stage-title">② 流入（直近24h）</div>
                <div style="margin-top: 12px; display: grid; grid-template-columns: 1fr 1fr; gap: var(--spacing-gap-tiny);">
                    <div class="stage-metric">
                        <div class="metric-label">UU</div>
                        <div class="metric-value" style="font-size: var(--font-size-title-inner);">${stats.traffic.uu}</div>
                        <div style="font-size: var(--font-size-mini); color: var(--color-text-subtle);">訪問者数</div>
                    </div>
                    <div class="stage-metric">
                        <div class="metric-label">PV</div>
                        <div class="metric-value" style="font-size: var(--font-size-title-inner);">${stats.traffic.pv}</div>
                        <div style="font-size: var(--font-size-mini); color: var(--color-text-subtle);">ページ表示</div>
                    </div>
                </div>
                <div class="stage-metric" style="grid-column: span 2;">
                    <div class="metric-label">エラー率</div>
                    <div class="metric-value" style="font-size: var(--font-size-medium);">${stats.monitoring.errorRate}</div>
                </div>
            </div>
            <div class="funnel-arrow">▶</div>

            <div class="stage-box">
                <div class="stage-title">③ 閲覧状況（直近28日）</div>
                <div style="margin-top: 12px; display: flex; flex-direction: column; gap: var(--spacing-gap-tiny);">
                    <div class="stage-metric">
                        <div class="metric-label">指名検索数</div>
                        <div class="metric-value" style="font-size: var(--font-size-title-inner);">${stats.brand.namedSearchCount}</div>
                    </div>
                    <div class="stage-metric">
                        <div class="metric-label">平均エンゲージメント時間</div>
                        <div class="metric-value" style="font-size: var(--font-size-medium);">${stats.brand.avgEngagementTime}</div>
                    </div>
                    <div class="stage-metric">
                        <div class="metric-label">再訪率</div>
                        <div class="metric-value" style="font-size: var(--font-size-medium);">${stats.brand.returnRate}</div>
                    </div>
                </div>
            </div>
            <div class="funnel-arrow">▶</div>

            <div class="stage-box" style="justify-content: center; align-items: center; text-align: center;">
                <div class="stage-title">④ 無料会員</div>
                <div style="margin-top: 12px;">
                    <div style="font-size: var(--font-size-tiny); color: var(--color-text-muted); margin-bottom: 4px;">無料会員数</div>
                    <div style="font-weight: bold; color: var(--color-primary); font-size: var(--font-size-giga);">${stats.business.freeMembers}</div>
                    <div style="font-size: var(--font-size-mini); color: var(--color-text-subtle);">members</div>
                </div>
            </div>
            <div class="funnel-arrow">▶</div>

            <div class="stage-box" style="justify-content: center; align-items: center; text-align: center; background: var(--color-bg-alt);">
                <div class="stage-title" style="background: var(--color-bg-alt);">⑤ 有料会員</div>
                <div style="margin-top: 12px;">
                    <div style="font-size: var(--font-size-tiny); color: var(--color-text-muted); margin-bottom: 4px;">有料会員数 / 目標</div>
                    <div style="font-weight: bold; color: var(--color-primary); font-size: var(--font-size-giga);">${stats.business.paidMembers}</div>
                    <div style="font-size: var(--font-size-xs); color: var(--color-border-strong);">/ 100</div>
                </div>
            </div>
        </div>

        <!-- Bottom Row -->
        <div style="display: grid; grid-template-columns: 1fr 2fr; gap: var(--spacing-box-padding); flex: 1; min-height: 0; margin-bottom: var(--spacing-page-bottom-margin);">
            <div class="section-box">
                <div class="section-title">人気記事 TOP5（直近24時間）</div>
                <div style="margin-top: var(--spacing-box-padding); font-size: var(--font-size-tiny-plus); overflow: hidden;">
                    ${stats.traffic.topPages.length > 0
                      ? stats.traffic.topPages.map((p, i) => `
                        <div style="padding: 3px 0; border-bottom: var(--border-width-thin) solid var(--color-border-default); display: flex; gap: 6px; align-items: center;">
                            <span style="color: var(--color-primary); font-weight: bold; min-width: 16px;">${i + 1}.</span>
                            <span style="flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${p.path}</span>
                            <span style="color: var(--color-text-muted); white-space: nowrap;">${p.requests} req</span>
                        </div>`).join('')
                      : '<div style="color: var(--color-text-subtle); padding: 8px 0;">データなし</div>'
                    }
                </div>
            </div>

            <div class="section-box">
                <div class="section-title">CONSULTATION & MEMO</div>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--spacing-section-title-left); margin-top: var(--spacing-box-padding); height: calc(100% - var(--spacing-box-padding));">
                    <div>
                        <div style="font-weight: bold; font-size: var(--font-size-small); color: var(--color-primary); margin-bottom: var(--spacing-content-top);">■ 本日の相談事項</div>
                        <ul style="list-style: none; padding: 0;">
                            ${strategy.consultation_items.map(item => `
                                <li style="padding: 4px 0; border-bottom: var(--border-width-thin) solid var(--color-border-default); display: flex; align-items: flex-start;">
                                    <span style="color: var(--color-primary); margin-right: 8px;">▶</span>
                                    <span>${item}</span>
                                </li>
                            `).join('')}
                        </ul>
                    </div>
                    <div>
                        <div style="font-weight: bold; font-size: var(--font-size-small); color: var(--color-primary); margin-bottom: var(--spacing-content-top);">■ コンシェルジュ・メモ</div>
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
    <div style="flex: 1; display: grid; grid-template-columns: 1fr 1fr 1fr; grid-template-rows: 1fr 1fr 1fr; gap: var(--spacing-gap-default); padding-top: var(--spacing-layout-top-padding); margin-bottom: var(--spacing-page-bottom-margin);">
        <div class="section-box">
            <div class="section-title">Who（誰が）</div>
            <div class="content-area" style="margin-top: 10px; font-size: var(--font-size-base);">${strategy.six_w2h.who}</div>
        </div>
        <div class="section-box">
            <div class="section-title">Whom（誰に）</div>
            <div class="content-area" style="margin-top: 10px; font-size: var(--font-size-base);">${strategy.six_w2h.whom}</div>
        </div>
        <div class="section-box">
            <div class="section-title">What（何を）</div>
            <div class="content-area" style="margin-top: 10px; font-size: var(--font-size-base);">${strategy.six_w2h.what}</div>
        </div>
        <div class="section-box">
            <div class="section-title">How（どのように）</div>
            <div class="content-area" style="margin-top: 10px; font-size: var(--font-size-base);">${strategy.six_w2h.how}</div>
        </div>
        <div class="section-box" style="background: var(--color-bg-highlight); border: var(--border-width-medium) solid var(--color-accent-blue-base);">
            <div class="section-title" style="color: var(--color-accent-blue-dark);">起業アイディア</div>
            <div class="content-area" style="margin-top: 10px; font-size: var(--font-size-base); font-weight: bold;">${strategy.six_w2h.idea}</div>
        </div>
        <div class="section-box">
            <div class="section-title">Why（それはなぜ）</div>
            <div class="content-area" style="margin-top: 10px; font-size: var(--font-size-base);">${strategy.six_w2h.why}</div>
        </div>
        <div class="section-box">
            <div class="section-title">When（いつ）</div>
            <div class="content-area" style="margin-top: 10px; font-size: var(--font-size-base);">${strategy.six_w2h.when}</div>
        </div>
        <div class="section-box">
            <div class="section-title">Where（どこで）</div>
            <div class="content-area" style="margin-top: 10px; font-size: var(--font-size-base);">${strategy.six_w2h.where}</div>
        </div>
        <div class="section-box">
            <div class="section-title">How Much（いくらで）</div>
            <div class="content-area" style="margin-top: 10px; font-size: var(--font-size-base);">${strategy.six_w2h.how_much}</div>
        </div>
    </div>` : '<div style="color: var(--color-text-subtle); padding: 20px;">strategy.yaml に six_w2h セクションが設定されていません。</div>';

  return `
    <div class="page" style="display: flex; flex-direction: column;">
        <div class="owner-header">
            <div style="font-size: var(--font-size-xs); color: var(--color-text-subtle);">作成日: ${date}</div>
        </div>
        <h1>6W2H シート</h1>
        ${content}
        <div class="footer">3/3 - 6W2H シート</div>
    </div>`;
}
