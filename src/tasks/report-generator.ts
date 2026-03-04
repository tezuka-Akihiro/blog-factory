import { ReportData } from '../types';

export function generateHtmlReport(data: ReportData): string {
  const dateStr = new Date(data.generatedAt).toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' });

  return `<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ClaudeMix 事業進捗レポート - ${dateStr}</title>
    <style>
        /* Base Styles */
        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
            padding: 2rem;
            background-color: #f9fafb;
        }

        /* Typography */
        h1 { font-size: 2rem; margin-bottom: 0.5rem; color: #111; }
        h2 { font-size: 1.5rem; margin-top: 2rem; border-bottom: 2px solid #e5e7eb; padding-bottom: 0.5rem; color: #1f2937; }
        .timestamp { color: #6b7280; font-size: 0.875rem; margin-bottom: 2rem; }

        /* Layout */
        .grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
            gap: 1.5rem;
            margin-bottom: 2rem;
        }

        /* Card Component */
        .card {
            background: white;
            padding: 1.5rem;
            border-radius: 0.5rem;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            border: 1px solid #e5e7eb;
        }
        .card-label { font-size: 0.875rem; color: #6b7280; font-weight: 600; text-transform: uppercase; }
        .card-value { font-size: 1.875rem; font-weight: bold; margin-top: 0.25rem; color: #111; }
        .card-sub { font-size: 0.875rem; margin-top: 0.5rem; }
        .trend-up { color: #059669; }
        .trend-neutral { color: #6b7280; }

        /* Tables */
        table { width: 100%; border-collapse: collapse; margin-top: 1rem; background: white; border-radius: 0.5rem; overflow: hidden; border: 1px solid #e5e7eb; }
        th, td { padding: 0.75rem 1rem; text-align: left; border-bottom: 1px solid #e5e7eb; }
        th { background-color: #f3f4f6; font-weight: 600; color: #374151; }

        /* Status Badges */
        .badge { display: inline-block; padding: 0.25rem 0.5rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 600; }
        .badge-critical { background-color: #fee2e2; color: #dc2626; }
        .badge-warning { background-color: #fef3c7; color: #d97706; }
        .badge-success { background-color: #d1fae5; color: #059669; }

        /* Print Optimization */
        @media print {
            body { background-color: white; padding: 0; max-width: 100%; }
            .card { box-shadow: none; border: 1px solid #ccc; }
            h2 { border-color: #333; }
            @page { size: A4; margin: 2cm; }
        }
    </style>
</head>
<body>
    <header>
        <h1>📋 ClaudeMix 事業進捗レポート</h1>
        <div class="timestamp">生成日時: ${dateStr}</div>
    </header>

    <article>
        <section>
            <h2>① 会員ステータス (Vital Signs)</h2>
            <div class="grid">
                <div class="card">
                    <div class="card-label">総会員数</div>
                    <div class="card-value">${data.members.total.toLocaleString()}</div>
                    <div class="card-sub trend-neutral">直近30日の増減: ${data.members.recentChange30Days > 0 ? '+' : ''}${data.members.recentChange30Days.toLocaleString()}</div>
                </div>
                <div class="card">
                    <div class="card-label">有料会員数</div>
                    <div class="card-value">${data.members.paid.toLocaleString()}</div>
                    <div class="card-sub">有料化率: ${data.members.total > 0 ? ((data.members.paid / data.members.total) * 100).toFixed(1) : 0}%</div>
                </div>
            </div>
        </section>

        <section>
            <h2>② コンテンツ品質 (Content Quality)</h2>
            <div class="grid">
                <div class="card">
                    <div class="card-label">総記事数</div>
                    <div class="card-value">${data.content.totalPosts.toLocaleString()}</div>
                </div>
                <div class="card">
                    <div class="card-label">構造化タグ付与率 (JSON-LD)</div>
                    <div class="card-value">${data.content.jsonLdCoverageRate.toFixed(1)}%</div>
                    <div class="card-sub">Web標準準拠・AI親和性指標</div>
                </div>
            </div>
        </section>

        <section>
            <h2>③ システム健康度 (System Health)</h2>
            <table>
                <thead>
                    <tr>
                        <th>項目</th>
                        <th>直近7日間の発生数</th>
                        <th>ステータス</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>致命的なエラー (CRITICAL)</td>
                        <td>${data.system.errorsLast7Days.critical}</td>
                        <td>
                            <span class="badge ${data.system.errorsLast7Days.critical > 0 ? 'badge-critical' : 'badge-success'}">
                                ${data.system.errorsLast7Days.critical > 0 ? '要対応' : '良好'}
                            </span>
                        </td>
                    </tr>
                    <tr>
                        <td>警告 (WARNING)</td>
                        <td>${data.system.errorsLast7Days.warning}</td>
                        <td>
                            <span class="badge ${data.system.errorsLast7Days.warning > 0 ? 'badge-warning' : 'badge-success'}">
                                ${data.system.errorsLast7Days.warning > 0 ? '注意' : '良好'}
                            </span>
                        </td>
                    </tr>
                </tbody>
            </table>
        </section>
    </article>

    <footer style="margin-top: 4rem; text-align: center; color: #9ca3af; font-size: 0.75rem;">
        &copy; ${new Date().getFullYear()} ClaudeMix / blog-factory - 延命医のこだわり: 軽量・高速・単一ファイル。
    </footer>
</body>
</html>`;
}
