# ClaudeMix 計測実装ロードマップ（起業初期案）

## 各フェーズ共通の技術要件

### 実行方式

blog-factory CLI で運用する。

```sh
npm run kpi-collect   # 毎日実行：前日の KPI を蓄積
npm run report        # 任意のタイミングで実行：蓄積データを元にレポート生成
→ results/report.html に出力
```

> **設計原則**：外部 API（Cloudflare 等）の無料プランは**取得できる期間が直近に限定**される。そのため、`kpi-collect` で毎日前日データをローカルに蓄積し、`report` はその蓄積データを参照するアーキテクチャを採用する。オンデマンドでの複数日取得には依存しない。

### データソースの分類

| 区分 | データ | 取得方法 |
| --- | --- | --- |
| **自前DB** | 会員数・サブスクリプション状態・モニタリングログ | Cloudflare D1（`wrangler d1 execute --local`） |
| **外部API（Ph1）** | 訪問者数（UU）・PV | Cloudflare Zone Analytics GraphQL API |
| **外部API（Ph2）** | 指名検索数・エンゲージメント時間 | Google Search Console API / GA4 API |
| **外部API（Ph3）** | MRR・チャーンレート・LTV | Stripe API |

自前DBへのアクセスは `src/utils/d1-client.ts` で実装済み（`wrangler` CLIをサブプロセス実行）。外部APIは各フェーズで `src/utils/` 配下に新規クライアントとして追加する。

### 認証・設定管理

すべてのAPIキー・トークン類は `.env` で管理し、`process.env` 経由で参照する。

```sh
# .env に追加していくイメージ
CLOUDFLARE_ZONE_ID=...          # Ph1 で追加（Account ID ではなく Zone ID）
CF_ANALYTICS_TOKEN=...          # Ph1 で追加
GOOGLE_SERVICE_ACCOUNT_JSON=... # Ph2 で追加
GA4_PROPERTY_ID=...             # Ph2 で追加
STRIPE_SECRET_KEY=...           # Ph3 で追加
```

### 実装の拡張ルール

1. APIクライアントは `src/utils/<service>-client.ts` に実装する
2. 日次蓄積が必要な指標は `src/tasks/kpi.ts` に取得ロジックを追加し、`kpi-collect` コマンドで収集する
3. `src/commands/report.ts` は蓄積済みデータを読んで `ReportData` の対応フィールドに詰める
4. APIが取得できない場合は例外を投げず、フォールバック値（`0` / `'-'`）を返してレポート生成を継続する

---

## フェーズ1：【基盤構築】リリース直後〜会員数10名まで ✅ 実装済み

### 目的

サイトが「誰かが興味を持っているか」をAPIで自動観測する。

### 指標

- **UU（訪問者数）**: そもそも人が来ているか。（Cloudflare Zone Analytics API）
- **PV（ページビュー）**: 一人あたり何ページ見ているか。（Cloudflare Zone Analytics API）

### 実装（実態）

- **`npm run kpi-collect`** を毎日実行し、`httpRequests1dGroups`（日次集計）から前日の UU・PV を取得して `results/kpi-history.json` に蓄積
- **`npm run report`** はその蓄積データの直近30日分を合計して表示

### フェーズ1で判明した API 制限事項

| 項目 | 当初計画 | 実態 |
| --- | --- | --- |
| 使用データセット | `httpRequestsAdaptiveGroups`（分単位） | `httpRequests1dGroups`（日次集計） |
| 取得期間 | オンデマンドで過去7日分 | 無料プランは直近24hのみ → **毎日蓄積に変更** |
| 流入経路（`clientRefererHost`） | 取得予定 | **無料プランでは利用不可** → `topSources: []` 固定 |
| 人気記事TOP5 | 取得予定 | `kpi-collect` では収集対象外 → `topPages: []` 固定 |
| エラー率 | 実値取得予定 | 現状 `'-'` 固定（未実装） |

---

## フェーズ2：【信頼検証】会員数11名〜100名

### 目的

コンテンツが「深く読まれているか」と「ブランドが認知されているか」を測る。

### 指標

- **指名検索数**: 「ClaudeMix」で探されているか。（Google Search Console API）
- **平均エンゲージメント時間**: 流行に流されない層が定着しているか。（GA4 API）
- **リード転換率**: 無料レターへの登録や、有料プランボタンのクリック数。

### 実装

- Search Console / GA4 API との連携（**両 API ともオンデマンド取得で対応**）
- クリックイベントのカスタム集計（Cloudflare Workers Analytics Engine）

### API 事前確認結果（2026-03-06 調査済み）

| API | 無料枠 | 取得可能期間 | データ遅延 | 取得戦略 |
| --- | --- | --- | --- | --- |
| Search Console API | 無料 | 最大16ヶ月 | 通常2〜3日 | **オンデマンド**（endDate: 3daysAgo） |
| GA4 Data API | 無料 | 標準レポート無期限 | 24〜48時間 | **オンデマンド**（endDate: 2daysAgo） |

#### GA4 メトリクス仕様（実装時の注意点）

- `averageEngagementTime` は組み込みではなく `expression: "userEngagementDuration/activeUsers"` で導出する
- `returningUsersRate` は**存在しない**。`newVsReturning` ディメンション + `activeUsers` で比率を手動計算する
- `averageSessionDuration`（セッション時間）はエンゲージメント時間とは別物。使用しない

---

## フェーズ3：【生存証明】会員数100名以降

### 目的

収益の安定性と「死なない（低解約率）」を証明し、事業を安定させる。

### 指標

- **MRR（月間経常収益）**: 目標10万円への進捗。（Stripe API等）
- **チャーンレート（解約率）**: 最重要指標。システムの延命成功の証。（Stripe API等）
- **LTV（顧客生涯価値）**: ユーザーがどれだけ長く「防衛拠点」に滞在するか。（Stripe API等）

### 実装

- 決済プラットフォーム API との連携（月次データのためオンデマンド取得で対応）
- 解約理由のログ収集と分析基盤

---

## コンシェルジュへの相談ポイント

- 「フェーズ1の数値が月間XXX Visitsを超えたら、フェーズ2へ投資する判断基準は妥当か？」
- 「会員ゼロの今、まずは『エラー率ゼロ』と『流入経路の特定』に絞っているが、起業家支援の視点で足りない項目はあるか？」
