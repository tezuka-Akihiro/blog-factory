# 作業手順書：フェーズ3 収益最大化・生存維持基盤

## 前提条件

- [ ] フェーズ1・2の実装が完了している（`npm run kpi-collect` が継続稼働し、UU/PV データが蓄積されている）
- [ ] Stripe アカウントでシークレットキーを取得済み
- [ ] CPA（顧客獲得コスト）の初期値を手動で把握済み

---

## Step 1: 環境変数の追加

`.env` と `.env.example` に以下を追記する。

### `.env`（実値を設定）

```sh
STRIPE_SECRET_KEY=<your-stripe-secret-key>
CPA_MANUAL=<顧客獲得コスト（円）>   # 広告費等の手動入力値
```

### `.env.example`（テンプレートとして追記）

```sh
# Stripe API（フェーズ3で追加）
STRIPE_SECRET_KEY=
CPA_MANUAL=0
```

> フェーズ1・2で追加済みの `CLOUDFLARE_ZONE_ID` / `CF_ANALYTICS_TOKEN` / `GOOGLE_SERVICE_ACCOUNT_JSON` / `GA4_PROPERTY_ID` はそのまま残す。

---

## Step 2: 型定義の拡張

[src/types/index.ts](../../src/types/index.ts) の `ReportData.stats` に `revenue` ブロックを追加する。

```typescript
stats: {
  // ...既存フィールド...
  revenue: {
    mrr: number;           // 月次経常収益（Stripe API）
    churnRate: string;     // チャーンレート（Stripe API）
    ltv: number;           // 顧客生涯価値（内部計算: ARPU / churnRate）
    arpu: number;          // ユーザー平均単価（Stripe API）
    unitEconomics: string; // LTV / CPA の比率（内部計算）
  };
};
```

---

## Step 3: Stripe クライアントの実装

[src/utils/stripe-client.ts](../../src/utils/stripe-client.ts) を新規作成する。

### 取得対象

| 指標 | Stripe API | 算出方法 |
| --- | --- | --- |
| MRR | `subscriptions.list` | アクティブサブスクの月額合計 |
| チャーンレート | `subscriptions.list` (canceled) | 当月解約数 / 月初会員数 |
| ARPU | MRR / アクティブ会員数 | 内部計算 |
| LTV | ARPU / チャーンレート | 内部計算 |
| ユニットエコノミクス | LTV / CPA | `CPA_MANUAL` を使用 |

### 実装の骨格

```typescript
// src/utils/stripe-client.ts

export interface RevenueData {
  mrr: number;
  churnRate: string;
  ltv: number;
  arpu: number;
  unitEconomics: string;
}

export async function fetchRevenueData(): Promise<RevenueData> {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  const cpaManual = Number(process.env.CPA_MANUAL ?? '0');

  if (!secretKey) {
    return { mrr: 0, churnRate: '-', ltv: 0, arpu: 0, unitEconomics: '-' };
  }

  try {
    // Stripe SDK または REST API でサブスクリプション一覧を取得
    // MRR・チャーンレート・ARPU を算出
    // LTV = ARPU / churnRate（月次）
    // unitEconomics = (LTV / cpaManual).toFixed(2)
    // ...
  } catch {
    return { mrr: 0, churnRate: '-', ltv: 0, arpu: 0, unitEconomics: '-' };
  }
}
```

---

## Step 4: report.ts の更新

[src/commands/report.ts](../../src/commands/report.ts) に Stripe データの取得を追加し、`revenue` を `reportData` に詰める。

### 変更概要

```typescript
import { fetchRevenueData } from '../utils/stripe-client';

// 既存の取得処理の後に追加
const revenueData = await fetchRevenueData();

// reportData に追加
revenue: {
  mrr: revenueData.mrr,
  churnRate: revenueData.churnRate,
  ltv: revenueData.ltv,
  arpu: revenueData.arpu,
  unitEconomics: revenueData.unitEconomics,
},
```

---

## Step 5: 動作確認

```sh
npm run report
```

`results/report.html` を開いて以下を確認する。

- [ ] MRR・チャーンレート・LTV・ARPU が実数値で表示されている
- [ ] ユニットエコノミクスが `CPA_MANUAL` の値に基づき算出されている
- [ ] 環境変数未設定時でもレポートが正常生成される（フォールバック確認）

---

## 完了チェックリスト

- [ ] Step 1: `.env` / `.env.example` に環境変数を追加
- [ ] Step 2: `src/types/index.ts` に `revenue` ブロックを追加
- [ ] Step 3: `src/utils/stripe-client.ts` を実装
- [ ] Step 4: `src/commands/report.ts` を更新
- [ ] Step 5: `npm run report` で動作確認
