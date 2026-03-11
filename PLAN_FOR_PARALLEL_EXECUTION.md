# リファクター並列実行計画書

生成日: 2026-03-11
対象区分: 型定義 (types)

## 概要

現在、`src/types/` および `src/tasks/` 配下には計13ファイルが存在し、特に `src/tasks/report.ts` (469行) は規模が大きく、一括でのリファクタリングはコンテキスト汚染やデグレードのリスクが高いと判断しました。
構造的品質を維持しつつ、型定義をより厳密化（Strict Typing）するために、以下の3タスクに分割して並列実行することを推奨します。

## 並列指示文

### タスク 1: 型定義の基盤強化 (Core Types)

対象:
- `src/types/index.ts`
- `src/types/strategy.ts`

指示内容:
1. `exactOptionalPropertyTypes: true` への適合を再確認し、必要に応じて `| undefined` を追加する。
2. 可能な限り `string` 型を文字列リテラル型や Union 型（例: カテゴリ名、ステータス、ログレベル等）に置き換える。
3. `ReportData` や `Strategy` インターフェースにおけるオプショナルプロパティの妥当性を精査する。

---

### タスク 2: 大規模タスクの型整合性向上 (Complex Logic)

対象:
- `src/tasks/report.ts`
- `src/tasks/kpi.ts`
- `src/tasks/summary.ts`

指示内容:
1. `src/types/` で強化された新しい型定義を適用し、ロジック内の型不整合を解消する。
2. 外部データ（D1 レスポンスや YAML パース結果）に対する型ガードまたはバリデーションを強化する。
3. `report.ts` 内の `replacePlaceholders` などのジェネリクス関数の型安全性を再検証する。
4. 冗長な型注釈（型推論で解決可能なもの）を削除し、コードのノイズを減らす。

---

### タスク 3: 周辺タスクおよびユーティリティの型整理 (Supporting Tasks)

対象:
- `src/tasks/delivery.ts`
- `src/tasks/export.ts`
- `src/tasks/extract.ts`
- `src/tasks/info.ts`
- `src/tasks/scan.ts`
- `src/tasks/stats.ts`
- `src/tasks/update-metadata.ts`

指示内容:
1. ファイルシステム操作 (`fs/promises`) や `gray-matter` の戻り値に対する型アサーションを、可能な限り型ガードまたはインターフェースによる厳密な定義に置き換える。
2. 各タスク関数の引数と戻り値の型定義が一貫しているか確認する。
3. 未使用の型定義やインポートを整理する。

## 実行後の作業

1. 全タスクの完了後、`npm run lint` および `npm test` を実行して正常性を確認してください。
2. 正常性が確認されたら、`/auto-refactor` を再実行して `refactor-record.json` の記録を更新してください。
