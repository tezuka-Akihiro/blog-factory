---
name: unit-test-writer
description: src/tasks/ 配下の TypeScript 関数に Vitest ユニットテストを生成する。「テストを書いて」「ユニットテストを作成して」「vitest でテストを追加して」と指示された時に使用。特定ファイル指定も可能（例: /unit-test-writer stats.ts）。
argument-hint: "[対象ファイル名（省略時は全対象ファイル）]"
allowed-tools: Read, Write, Edit, Glob, Grep, Bash
---

# ユニットテスト生成スキル

このプロジェクト（blog-factory）の `src/tasks/` 配下にある TypeScript 関数に対して、Vitest ユニットテストを生成するスキルです。

## When to Use

- 「テストを書いて」「ユニットテストを作成して」と指示された時
- `/unit-test-writer` または `/unit-test-writer stats.ts` のように実行する時
- `src/tasks/` に新しいファイルが追加されてテストが存在しない時

## 実行フロー

```text
Phase 1: コードベース分析 → prompts/01-analyze.md
    ↓
Phase 2: テスト計画       → prompts/02-plan.md
    ↓
Phase 3: テスト実装       → prompts/03-implement.md
    ↓ （scripts/run-test.sh でテスト実行）
完成
```

## 参照ドキュメント

| ファイル | 役割 | 読むタイミング |
| :--- | :--- | :--- |
| `docs/target-scope.md` | テスト対象ディレクトリと優先順位の定義 | Phase 1 冒頭 |
| `docs/assertion-rules.md` | マッチャー選択・命名規則・モックの書き方 | Phase 2・3 |
| `docs/test-boundaries.md` | テスト対象/対象外・モック戦略・カバレッジ目標 | Phase 2 |

## scripts/

| ファイル | 用途 |
| :--- | :--- |
| `scripts/run-test.sh` | `npm test` を実行するラッパー（Phase 3 で使用） |

## 成果物

| フェーズ | 成果物 |
| :--- | :--- |
| Phase 1 | 分析レポート（テスト対象ファイル一覧） |
| Phase 2 | テストケース設計表（ファイル別） |
| Phase 3 | テストファイル群（src/tasks/__tests__/） + 全件 PASS |
