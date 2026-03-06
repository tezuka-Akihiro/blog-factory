# 作業手順書：フェーズ2 信頼検証・リード獲得基盤

## 前提条件

- [ ] フェーズ1の実装が完了している（`npm run kpi-collect` が毎日実行されており、`results/kpi-history.json` にデータが蓄積されている）
- [ ] Google Cloud プロジェクトでサービスアカウントを作成し、JSON キーを取得済み
- [ ] Search Console でサービスアカウントのメールアドレスを「閲覧者」として追加済み
- [ ] GA4 でサービスアカウントに「閲覧者」権限を付与済み
- [ ] GA4 のプロパティ ID を確認済み
- [ ] **各 API の無料枠・取得可能期間を事前に確認済み**（フェーズ1の反省点：無料プランでは利用不可の API があった）
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

| 指標 | GA4 メトリクス | 格納先 |
| --- | --- | --- |
| 平均エンゲージメント時間 | `averageSessionDuration` | `brand.avgEngagementTime` |
| 再訪率 | `returningUsersRate` | `brand.returnRate` |

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
