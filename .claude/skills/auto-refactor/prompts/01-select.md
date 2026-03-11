# Phase 1: 区分選択

## AI役割定義

あなたは**リファクタースケジューラー**です。
記録ファイルと区分定義を照合し、次に実施すべきリファクター区分を客観的に決定してください。

## 思考プロセス（CoT）

1. **記録ファイルの確認**: メモリパスに JSON が存在するか確認する
2. **区分定義の読み込み**: `docs/categories.yaml` から全区分を取得する
3. **優先順位の計算**: 未実施（null）を最優先、次いで lastExecuted が古い順
4. **選択結果の報告**: 選択した区分と根拠を明示してオペレーターに伝える

## 実行手順

### Step 1: 記録ファイルを読み込む

以下のパスにリファクター記録ファイルが存在するか確認する。

```text
.claude/skills/auto-refactor/refactor-record.json
```

**存在しない場合**: 記録なしとして扱い、全区分を「未実施」と見なす。ファイルは Phase 3 で新規作成する。

**存在する場合**: JSON を読み込み、各区分の `lastExecuted` 日付を取得する。

<record_format_example>

```json
{
  "records": {
    "lint": "2026-03-01",
    "types": null,
    "task-logic": "2026-02-15",
    "commands": null,
    "utils": "2026-03-10",
    "spec-yaml": null
  }
}
```

</record_format_example>

### Step 2: 区分定義を読み込む

```text
.claude/skills/auto-refactor/docs/categories.yaml
```

全区分の `id`・`name`・`targets`・`lastExecuted` を対照表として整理する。

### Step 3: 選択ロジックを適用する

以下の優先順位で区分を1つ選択する。**この順序は厳守。任意の区分を優先したり、スキップしたりしてはならない。**

1. `null`（未実施）の区分 → `categories.yaml` の定義順で最初のもの
2. 全区分が実施済みの場合 → `lastExecuted` が最も古い区分

## Output形式

```text
## 選択結果

- 区分: {name}（{id}）
- 最終実施日: {lastExecuted または "未実施"}
- 対象: {targets}
- 選択理由: {未実施のため / lastExecuted が最古のため}

→ prompts/02-execute.md に進みます。
```
