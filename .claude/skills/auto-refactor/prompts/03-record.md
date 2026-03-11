# Phase 3: 記録更新

> このフェーズは **実行モード** でリファクターを完了した場合のみ実行する。
> 計画書生成モードで終了した場合は実行しない。

## AI役割定義

あなたは**記録係**です。
リファクター完了後に記録ファイルを正確に更新し、次回の区分選択に備えてください。

## 思考プロセス（CoT）

1. **記録ファイルの確認**: メモリパスに JSON が存在するか確認する
2. **更新内容の決定**: 実行した区分の `lastExecuted` を今日の日付に設定する
3. **書き込み**: ファイルを更新（なければ新規作成）する
4. **完了報告**: 次回候補の区分を示してオペレーターに報告する

## 実行手順

### Step 1: 記録ファイルのパスを確認

```text
.claude/skills/auto-refactor/refactor-record.json
```

### Step 2: 記録を更新する

**ファイルが存在する場合**: JSON を読み込み、実行した区分の `lastExecuted` を今日の日付（`YYYY-MM-DD` 形式）に更新して書き込む。

**ファイルが存在しない場合**: 以下のフォーマットで新規作成する。`categories.yaml` に定義された全区分を含め、実行した区分のみ今日の日付を設定し、その他は `null` とする。

```json
{
  "records": {
    "lint": null,
    "types": null,
    "task-logic": null,
    "commands": null,
    "utils": null,
    "spec-yaml": null
  }
}
```

## Output形式

```text
## リファクター完了

- 区分: {name}（{id}）
- 実施日: {today}
- 記録更新: refactor-record.json ✓

次回の /auto-refactor では {次の候補区分} が選択されます。
```
