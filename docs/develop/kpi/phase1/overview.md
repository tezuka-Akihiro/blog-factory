# 作業手順書：フェーズ1 マーケティング計測基盤

## 前提条件

- [ ] Cloudflare ダッシュボードで **API Token** を発行済み（必要スコープ: `Account Analytics: Read`）
- [ ] Cloudflare ダッシュボードで **Account ID** を確認済み

---

## Step 1: 環境変数の追加

`.env` と `.env.example` に以下を追記する。

### `.env`（実値を設定）

```sh
CLOUDFLARE_ACCOUNT_ID=<your-account-id>
CLOUDFLARE_API_TOKEN=<your-api-token>
```

### `.env.example`（テンプレートとして追記）

```sh
# Cloudflare Analytics API（フェーズ1で追加）
CLOUDFLARE_ACCOUNT_ID=
CLOUDFLARE_API_TOKEN=
```

---

## Step 2: 型定義の拡張

[src/types/index.ts](../../src/types/index.ts) の `ReportData` インターフェースの `traffic` フィールドを更新する。

### 変更前

```typescript
traffic: {
  pv: number | string;
  uu: number | string;
  avgStayTime: number | string;
};
```

### 変更後

```typescript
traffic: {
  pv: number | string;
  uu: number | string;
  avgStayTime: number | string; // フェーズ1では '-' 固定
  topSources: Array<{ host: string; visits: number }>;
  topPages: Array<{ path: string; requests: number }>;
};
```

> `errorRate` は `stats.monitoring.errorRate`（既存フィールド）へ格納するため `traffic` には追加しない。

---

## Step 3: Cloudflare クライアントの実装

[src/utils/cloudflare-client.ts](../../src/utils/cloudflare-client.ts) を新規作成する。

### 取得対象

| 指標 | GraphQL ディメンション / メトリクス | 格納先 |
| --- | --- | --- |
| UU | `sum { visits }` | `traffic.uu` |
| PV | `sum { pageViews }` | `traffic.pv` |
| 流入経路 TOP | `dimensions { clientRefererHost }` | `traffic.topSources` |
| 人気記事 TOP 5 | `dimensions { clientRequestPath }` | `traffic.topPages` |
| エラー率 | `dimensions { edgeResponseStatus }` | `monitoring.errorRate` |

### 実装の骨格

```typescript
// src/utils/cloudflare-client.ts

export interface CloudflareTrafficData {
  uu: number;
  pv: number;
  topSources: Array<{ host: string; visits: number }>;
  topPages: Array<{ path: string; requests: number }>;
  errorRate: string;
}

export async function fetchCloudflareAnalytics(days: number = 7): Promise<CloudflareTrafficData> {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const apiToken = process.env.CLOUDFLARE_API_TOKEN;

  // 未設定時はフォールバック値を返す（レポート生成を止めない）
  if (!accountId || !apiToken) {
    return { uu: 0, pv: 0, topSources: [], topPages: [], errorRate: '-' };
  }

  try {
    // GraphQL クエリ・レスポンスのパース処理をここに実装
    // エンドポイント: https://api.cloudflare.com/client/v4/graphql
    // データセット: httpRequestsAdaptiveGroups
    // ...
  } catch {
    // 取得失敗時もフォールバック値を返す
    return { uu: 0, pv: 0, topSources: [], topPages: [], errorRate: '-' };
  }
}
```

---

## Step 4: report.ts の更新

[src/commands/report.ts](../../src/commands/report.ts) に Cloudflare Analytics の取得を追加し、`traffic` と `monitoring.errorRate` を実値に差し替える。

### 変更概要

```typescript
import { fetchCloudflareAnalytics } from '../utils/cloudflare-client';

// D1 データ取得の後に追加
const cfTraffic = await fetchCloudflareAnalytics(7);

// reportData 内の traffic・errorRate を差し替え
monitoring: {
  criticalCount,
  warningCount,
  errorRate: cfTraffic.errorRate,   // ← ハードコード "0.0%" を置き換え
},
traffic: {
  pv: cfTraffic.pv,
  uu: cfTraffic.uu,
  avgStayTime: '-',                 // フェーズ1では固定
  topSources: cfTraffic.topSources,
  topPages: cfTraffic.topPages,
},
```

---

## Step 5: 動作確認

```sh
npm run report
```

`results/report.html` を開いて以下を確認する。

- [ ] UU・PV が実数値で表示されている
- [ ] 流入経路リストに `referrerHost` が表示されている
- [ ] 人気記事 TOP 5 に `requestPath` が表示されている
- [ ] `monitoring.errorRate` がハードコード `"0.0%"` でなく実値になっている
- [ ] `.env` の値を空にした状態でもレポートが正常生成される（フォールバック確認）

---

## 完了チェックリスト

- [ ] Step 1: `.env` / `.env.example` に環境変数を追加
- [ ] Step 2: `src/types/index.ts` の `traffic` 型を拡張
- [ ] Step 3: `src/utils/cloudflare-client.ts` を実装
- [ ] Step 4: `src/commands/report.ts` を更新
- [ ] Step 5: `npm run report` で動作確認
