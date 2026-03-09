# 作業手順書：フェーズ2 信頼検証・リード獲得基盤

## 事前確認結果（2026-03-06 調査済み）

フェーズ1の反省点を踏まえ、実装前に各 API の仕様を確認した。

### Google Search Console API

| 項目 | 確認結果 |
| --- | --- |
| 無料枠 | **無料**（Google Cloud プロジェクトで有効化するだけ） |
| 取得可能期間 | **最大16ヶ月**（過去データを遡れる） |
| データ遅延 | **2〜3日遅れ**（通常運用時）。クエリでは `endDate` を `3daysAgo` 以前に設定すること |
| クォータ | 1,200 QPM/サイト、30,000,000 QPD/プロジェクト（実用上問題なし） |
| 指名検索取得 | `searchanalytics.query` で `queryFilter` に "ClaudeMix" を指定すれば取得可能 |
| 認証 | サービスアカウントで利用可能 |
| **取得戦略** | **オンデマンド取得（過去28日）** で問題なし |

### GA4 Data API

| 項目 | 確認結果 |
| --- | --- |
| 無料枠 | **無料**（GA4 標準プロパティ） |
| 取得可能期間 | **標準レポートは無期限**（集計済みデータ）。Explorations は2〜14ヶ月 |
| データ遅延 | **24〜48時間**（最大72時間）。`endDate` は `yesterday` ではなく `2daysAgo` を推奨 |
| **`averageEngagementTime`** | **利用可能**。ただし組み込みメトリクスではなく `expression: "userEngagementDuration/activeUsers"` で導出する |
| **`returningUsersRate`** | **存在しない**。`newVsReturning` ディメンション（"new"/"returning" の文字列）を使い、`activeUsers` と組み合わせて比率を手動計算する |
| `averageSessionDuration` | 別メトリクス（セッション時間）。エンゲージメント時間とは異なるため使用しない |
| サンプリング | 複雑なクエリでは発生しうる。シンプルな日次集計では基本的に無サンプリング |
| 認証 | サービスアカウントで利用可能 |
| **取得戦略** | **オンデマンド取得（過去28日）** で問題なし |

> **結論**: Search Console・GA4 ともに無料で過去28日分のオンデマンド取得が可能。フェーズ1のような「毎日蓄積が必須」の制約はない。ただし各 API のデータ遅延を考慮した日付指定が必要。

---

## 前提条件

- [ ] フェーズ1の実装が完了している（`npm run kpi-collect` が毎日実行されており、`results/kpi-history.json` にデータが蓄積されている）
- [ ] Google Cloud プロジェクトでサービスアカウントを作成し、JSON キーを取得済み
- [ ] Search Console でサービスアカウントのメールアドレスを「閲覧者」として追加済み
- [ ] GA4 でサービスアカウントに「閲覧者」権限を付与済み
- [ ] GA4 のプロパティ ID を確認済み
- [x] **各 API の無料枠・取得可能期間を事前に確認済み**（上記「事前確認結果」を参照）
- [ ] cloudemix 側（Astro / Workers）でカスタムイベント計測の実装方針を決定済み

---

## Step 1: 環境変数の追加

`.env` と `.env.example` に以下を追記する。

### `.env`（実値を設定）

```sh
GOOGLE_SERVICE_ACCOUNT_JSON='{...}'   # サービスアカウント JSON をそのまま文字列で
GA4_PROPERTY_ID=<your-property-id>
```

### `.env.example`（テンプレートとして追記）

```sh
# Google Search Console / GA4（フェーズ2で追加）
GOOGLE_SERVICE_ACCOUNT_JSON=
GA4_PROPERTY_ID=
```

> フェーズ1で追加済みの `CLOUDFLARE_ZONE_ID` / `CF_ANALYTICS_TOKEN` はそのまま残す。

---

## Step 2: 型定義の拡張

[src/types/index.ts](../../src/types/index.ts) の `ReportData.stats` に `brand` と `conversion` ブロックを追加する。

```typescript
stats: {
  // ...既存フィールド...
  brand: {
    namedSearchCount: number;   // 指名検索数（Search Console）
    avgEngagementTime: string;  // 平均エンゲージメント時間（GA4）
    returnRate: string;         // 再訪率（GA4）
    avgScrollDepth: string;     // 平均読了率（Workers Beacon）
  };
  conversion: {
    microCvCount: number;       // リード転換数（Workers Analytics Engine）
  };
};
```

---

## Step 3: Search Console クライアントの実装

[src/utils/search-console-client.ts](../../src/utils/search-console-client.ts) を新規作成する。

### 取得対象

| 指標 | API / メソッド | 格納先 |
| --- | --- | --- |
| 指名検索数 | Search Console API `searchanalytics.query` | `brand.namedSearchCount` |

### 実装の骨格

```typescript
// src/utils/search-console-client.ts

export interface SearchConsoleData {
  namedSearchCount: number;
}

export async function fetchSearchConsoleData(days: number = 28): Promise<SearchConsoleData> {
  const serviceAccountJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;

  if (!serviceAccountJson) {
    return { namedSearchCount: 0 };
  }

  try {
    // Google Auth ライブラリでサービスアカウント認証
    // searchanalytics.query で "ClaudeMix" を含むクエリを絞り込み
    // clicks の合計を namedSearchCount として返す
    //
    // ポイント: データ遅延が通常 2〜3日 あるため、endDate は '3daysAgo' を推奨
    //   startDate: <days日前>, endDate: <3日前>
    // ...
  } catch {
    return { namedSearchCount: 0 };
  }
}
```

---

## Step 4: GA4 クライアントの実装

[src/utils/ga4-client.ts](../../src/utils/ga4-client.ts) を新規作成する。

### GA4 取得対象

| 指標 | GA4 メトリクス / 取得方法 | 格納先 |
| --- | --- | --- |
| 平均エンゲージメント時間 | メトリクス `averageEngagementTime`（expression: `userEngagementDuration/activeUsers`） | `brand.avgEngagementTime` |
| 再訪率 | ディメンション `newVsReturning` × メトリクス `activeUsers` で比率を手動計算 | `brand.returnRate` |

> **注意**: `returningUsersRate` という組み込みメトリクスは GA4 API に存在しない。`newVsReturning` ディメンションを使い、"returning" のユーザー数 ÷ 全ユーザー数で算出すること。

### GA4 実装の骨格

```typescript
// src/utils/ga4-client.ts

export interface GA4Data {
  avgEngagementTime: string;
  returnRate: string;
}

export async function fetchGA4Data(days: number = 28): Promise<GA4Data> {
  const serviceAccountJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  const propertyId = process.env.GA4_PROPERTY_ID;

  if (!serviceAccountJson || !propertyId) {
    return { avgEngagementTime: '-', returnRate: '-' };
  }

  try {
    // Google Auth でサービスアカウント認証
    // GA4 Data API (runReport) でメトリクスを取得
    //
    // ポイント①: averageEngagementTime は expression 指定が必要
    //   { name: 'averageEngagementTime', expression: 'userEngagementDuration/activeUsers' }
    //
    // ポイント②: returningUsersRate は存在しない。
    //   dimension: { name: 'newVsReturning' } + metric: { name: 'activeUsers' } を組み合わせ、
    //   "returning" の activeUsers ÷ 全 activeUsers で比率を計算する
    //
    // ポイント③: データ遅延が 24〜48h あるため endDate は '2daysAgo' を推奨
    //   startDate: `${days}daysAgo`, endDate: '2daysAgo'
    // ...
  } catch {
    return { avgEngagementTime: '-', returnRate: '-' };
  }
}
```

> `avgScrollDepth`（平均読了率）は Workers Beacon 側の実装が完了後に取得可能になる。フェーズ2開始時点では `'-'` 固定。

---

## Step 5: report.ts の更新

[src/commands/report.ts](../../src/commands/report.ts) に Search Console・GA4 の取得を追加し、`brand`・`conversion` を `reportData` に詰める。

### 変更概要

```typescript
import { fetchSearchConsoleData } from '../utils/search-console-client';
import { fetchGA4Data } from '../utils/ga4-client';

// 既存の D1・Cloudflare 取得処理の後に追加
const scData = await fetchSearchConsoleData(28);
const ga4Data = await fetchGA4Data(28);

// reportData に追加
brand: {
  namedSearchCount: scData.namedSearchCount,
  avgEngagementTime: ga4Data.avgEngagementTime,
  returnRate: ga4Data.returnRate,
  avgScrollDepth: '-',   // Workers Beacon 実装後に差し替え
},
conversion: {
  microCvCount: 0,       // Workers Analytics Engine 実装後に差し替え
},
```

---

## Step 6: 動作確認

```sh
npm run report
```

`results/report.html` を開いて以下を確認する。

- [ ] 指名検索数が実数値で表示されている
- [ ] 平均エンゲージメント時間・再訪率が表示されている
- [ ] 環境変数未設定時でもレポートが正常生成される（フォールバック確認）

---

## 完了チェックリスト

- [ ] Step 1: `.env` / `.env.example` に環境変数を追加
- [ ] Step 2: `src/types/index.ts` に `brand`・`conversion` ブロックを追加
- [ ] Step 3: `src/utils/search-console-client.ts` を実装
- [ ] Step 4: `src/utils/ga4-client.ts` を実装
- [ ] Step 5: `src/commands/report.ts` を更新
- [ ] Step 6: `npm run report` で動作確認
