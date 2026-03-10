# テスト対象スコープ定義

このプロジェクト（blog-factory）でユニットテストが必要なディレクトリとファイルを定義する。

## テスト対象ディレクトリ

```text
src/
└── tasks/               ← 主要テスト対象（ビジネスロジックの純粋関数）
    ├── stats.ts
    ├── summary.ts
    ├── extract.ts
    ├── scan.ts
    ├── delivery.ts
    ├── export.ts
    ├── info.ts
    ├── kpi.ts
    ├── report.ts
    └── update-metadata.ts
```

## テスト対象外ディレクトリ

```text
src/
├── commands/     ← CLIレイヤー（tasks/ を薄くラップするだけ）
└── utils/        ← 外部API・外部サービスクライアント（統合テストの領域）
    ├── cloudflare-client.ts   ← Cloudflare Workers API
    ├── d1-client.ts           ← Cloudflare D1（DB）
    ├── ga4-client.ts          ← Google Analytics 4 API
    ├── search-console-client.ts ← Google Search Console API
    └── logger.ts              ← ログ出力（副作用のみ）
```

## ファイル別優先度と分類

| ファイル | 優先度 | 分類 | 理由 |
| :--- | :--- | :--- | :--- |
| `tasks/stats.ts` | ★★★ 高 | 純粋関数 | 外部依存なし。核心ロジック（premiumChars計算） |
| `tasks/summary.ts` | ★★★ 高 | 純粋関数 | 外部依存なし。集計・Markdown生成 |
| `tasks/extract.ts` | ★★☆ 中 | fs依存 | `fs/promises` モック必要。isPaid判定ロジック |
| `tasks/scan.ts` | ★★☆ 中 | fs依存 | `fs/promises` モック必要。ファイル走査 |
| `tasks/delivery.ts` | ★☆☆ 低 | 要調査 | 内容確認後に判断 |
| `tasks/export.ts` | ★☆☆ 低 | 要調査 | 内容確認後に判断 |
| `tasks/kpi.ts` | ★☆☆ 低 | 要調査 | CSV・外部依存の可能性 |
| `tasks/report.ts` | ★☆☆ 低 | 外部I/O | 複雑なHTML生成・ファイル書き込み |

## テストファイルの配置

```text
src/tasks/__tests__/
├── stats.test.ts
├── summary.test.ts
├── extract.test.ts
└── scan.test.ts
```

## 初回実装の推奨範囲

まず `stats.ts` と `summary.ts`（純粋関数）から始め、次に `extract.ts` と `scan.ts`（fs モック）を実装する。
`tasks/` 新規ファイル追加時は、このドキュメントの表を更新してから対応テストを追加すること。
