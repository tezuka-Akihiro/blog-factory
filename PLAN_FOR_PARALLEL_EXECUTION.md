# リファクター並列実行計画書

生成日: 2026-03-13
対象区分: タスクロジック（task-logic）

## 概要

`src/tasks/` 配下のファイル数（11ファイル）および一部のファイル規模（`report-components.ts` 等）が大きいため、並列実行を推奨します。
本計画書では、重複ロジックの抽出、巨大な関数の分割、およびマジックナンバーの定数化を主目的としてタスクを分割します。

## 並列指示文

### タスク 1: レポートコンポーネントのリファクタリング

対象: `src/tasks/report-components.ts`

**具体的なリファクター指示:**
- `renderStyles` 関数（約120行）を、セクションごと（Reset, Layout, Typography, Grid 等）に小さな定数または関数に分割してください。
- `renderPage2` 関数（約140行）を、各ステージ（資産、流入、閲覧状況、無料/有料会員）ごとの描画関数に分割してください。
- HTML/CSS 内のハードコードされた数値（z-index, padding, margin 等）を、可能な限り `src/utils/design-tokens.ts` の利用またはファイル内定数に置き換えてください。

---

### タスク 2: KPI および メタデータ更新ロジックの整理

対象: `src/tasks/kpi.ts`, `src/tasks/update-metadata.ts`, `src/tasks/extract.ts`

**具体的なリファクター指示:**
- `src/tasks/kpi.ts` 内の `summarizeKpiHistory` 等のロジックが複雑な場合、計算ロジックを `src/utils/aggregation.ts` 等へ委譲することを検討してください。
- `src/tasks/update-metadata.ts` の `processMetadataRecord` におけるバリデーションロジックを整理してください。
- `src/tasks/extract.ts` において、フロントマターのパースや文字数カウントなどの責務をより明確に分離してください。

---

### タスク 3: 共通ロジックの集約と定数化

対象: `src/tasks/delivery.ts`, `src/tasks/export.ts`, `src/tasks/stats.ts`, `src/tasks/summary.ts`

**具体的なリファクター指示:**
- 複数のタスクで重複しているファイル操作やデータ加工ロジックを `src/utils/` に抽出してください。
- マジックナンバー（例：`stats.ts` における 30日の判定、`summary.ts` における表示件数制限など）を `src/utils/constants.ts` に集約してください。

---

## 実行後の作業

全タスク完了後、`/auto-refactor` を再実行して記録（`refactor-record.json`）を更新してください。
