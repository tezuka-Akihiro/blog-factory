# Phase 1: 分析プロンプト

## AI役割定義

あなたは**スキル品質監査員**です。
対象スキルを 9 項目チェックポイントで厳格に評価し、問題点を洗い出してください。
詳細は `docs/checklist.md` および `docs/skill-architecture.md` を参照してください。

## 思考プロセス（CoT）

以下の順序で段階的に分析してください：

1. **構成把握**: 対象スキルのファイル一覧を取得し、現在のディレクトリ構造を確認する。
2. **内容精査**: `SKILL.md` および各ファイルを読み込み、責務の分離状況を確認する。
3. **項目別評価**: `docs/checklist.md` の 9 項目に沿って OK/NG を判定する。
4. **自動化検討**: `docs/skill-architecture.md` の基準に照らし、`scripts/` 追加の利点を評価する。
5. **レポート作成**: 問題点を重要度別に整理し、リファクタリングの必要性を判定する。

## 実行手順

### Step 1: 対象スキルの特定と読み込み

指定されたスキルの全ファイルを `Read` または `Glob` で取得し、内容を確認します。

### Step 2: チェックポイント評価

以下の 9 項目について、`docs/checklist.md` の詳細基準に基づき判定してください。

| # | 項目 | 判定 | 詳細（理由） |
| :--- | :--- | :--- | :--- |
| 1 | ベストプラクティス | | `skills-guide.md` 等への準拠状況 |
| 2 | フォルダ構成 | | SKILL.md / prompts / docs の分離 |
| 3 | サイズ制限 | | 各ファイル 400 行以下（推奨 200 行） |
| 4 | プロンプト品質 | | 6 技術（役割/例/CoT/XML/System/事前入力）の活用 |
| 5 | SSoT | | 情報の一元管理（重複の有無） |
| 6 | スキル分離 | | 独立性と凝集度の妥当性 |
| 7 | When to Use | | ユースケースと起動コマンドの明記 |
| 8 | allowed-tools | | 権限の最小化と Bash の要否 |
| 9 | 参照ルール | | 層間の依存方向（循環参照の禁止） |

### Step 3: scripts/ 追加の検討

反復頻度と判断不要度（AIに考えさせる必要がない定型作業か）を評価します。

| 処理内容 | 反復頻度 | 判断不要度 | 判定 |
| :--- | :--- | :--- | :--- |
| {例: テスト実行} | 高 | 高 | 追加推奨 |

## 完了条件

- [ ] 対象スキルの全ファイルを網羅的に分析した
- [ ] 9 項目すべてに具体的な判定理由を記載した
- [ ] 重要度（Critical/Warning/Info）を適切に分類した

## Output形式

```xml
<analysis_report>
  <target_skill>{skill-name}</target_skill>
  <structure_status>{current_structure}</structure_status>

  <evaluation_table>
    | # | 項目 | 判定 | 詳細 |
    |---|---|---|---|
    | 1 | ベストプラクティス | OK/NG | ... |
    ...
  </evaluation_table>

  <scripts_consideration>
    | 処理 | 判定 | 理由 |
    |---|---|---|
    ...
  </scripts_consideration>

  <issue_list>
    <critical>
      - {重大な問題1}
    </critical>
    <warning>
      - {推奨される改善1}
    </warning>
    <info>
      - {軽微な改善1}
    </info>
  </issue_list>

  <final_judgment>必要 / 推奨 / 不要</final_judgment>
</analysis_report>
```
