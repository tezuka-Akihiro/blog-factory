# ClaudeMix 計測実装ロードマップ（起業初期案）

## 各フェーズ共通の技術要件

### 実行方式

blog-factory CLI（`npm run report`）でオンデマンド実行する。Cron Triggers（Workers）による自動配信はフェーズ1の実装目標だが、**指標値の取得・集約・レポート生成はすべて `src/commands/report.ts` に集約する**。

```sh
npm run report
→ results/report.html に出力
```

### データソースの分類

| 区分 | データ | 取得方法 |
| --- | --- | --- |
| **自前DB** | 会員数・サブスクリプション状態・モニタリングログ | Cloudflare D1（`wrangler d1 execute --local`） |
| **外部API（Ph1）** | 訪問者数・流入元 | Cloudflare Analytics API（REST） |
| **外部API（Ph2）** | 指名検索数・エンゲージメント時間 | Google Search Console API / GA4 API |
| **外部API（Ph3）** | MRR・チャーンレート・LTV | Stripe API |

自前DBへのアクセスは `src/utils/d1-client.ts` で実装済み（`wrangler` CLIをサブプロセス実行）。外部APIは各フェーズで `src/utils/` 配下に新規クライアントとして追加する。

### 認証・設定管理

すべてのAPIキー・トークン類は `.env` で管理し、`process.env` 経由で参照する。

```sh
# .env に追加していくイメージ
CLOUDFLARE_ACCOUNT_ID=...
CLOUDFLARE_API_TOKEN=...         # Ph1 で追加
GOOGLE_SERVICE_ACCOUNT_JSON=...  # Ph2 で追加
STRIPE_SECRET_KEY=...            # Ph3 で追加
```

### 実装の拡張ルール

1. APIクライアントは `src/utils/<service>-client.ts` に実装する
2. `src/commands/report.ts` からクライアントを呼び出し、`ReportData` の対応フィールドに詰める
3. APIが取得できない場合は例外を投げず、フォールバック値（`0` / `'-'`）を返してレポート生成を継続する

---

## フェーズ1：【基盤構築】リリース直後〜会員数10名まで

### 目的

サイトが「誰かが興味を持っているか」をAPIで自動観測する。

### 指標

- **Visits（訪問者数）**: そもそも人が来ているか。（Cloudflare Pages API）
- **Top Sources（流入元）**: SNS（Xなど）や検索から来ているか。（Cloudflare Pages API）

### 実装

- Cloudflare Analytics API を叩くCron Triggers（Workers）の実装
- Discord/メールへの「日報サマリー」自動送信

## フェーズ2：【信頼検証】会員数11名〜100名

### 目的

コンテンツが「深く読まれているか」と「ブランドが認知されているか」を測る。

### 指標

- **指名検索数**: 「ClaudeMix」で探されているか。（Google Search Console API）
- **平均エンゲージメント時間**: 流行に流されない層が定着しているか。（GA4 API）
- **リード転換率**: 無料レターへの登録や、有料プランボタンのクリック数。

### 実装

- Search Console / GA4 APIとの連携
- クリックイベントのカスタム集計（Cloudflare Workers Analytics Engine）

## フェーズ3：【生存証明】会員数100名以降

### 目的

収益の安定性と「死なない（低解約率）」を証明し、事業を安定させる。

### 指標

- **MRR（月間経常収益）**: 目標10万円への進捗。（Stripe API等）
- **チャーンレート（解約率）**: 最重要指標。システムの延命成功の証。（Stripe API等）
- **LTV（顧客生涯価値）**: ユーザーがどれだけ長く「防衛拠点」に滞在するか。（Stripe API等）

### 実装

- 決済プラットフォーム API との連携
- 解約理由のログ収集と分析基盤

---

## コンシェルジュへの相談ポイント

- 「フェーズ1の数値が月間XXX Visitsを超えたら、フェーズ2へ投資する判断基準は妥当か？」
- 「会員ゼロの今、まずは『エラー率ゼロ』と『流入経路の特定』に絞っているが、起業家支援の視点で足りない項目はあるか？」
