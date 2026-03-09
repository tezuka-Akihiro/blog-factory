# Phase 2: 計画プロンプト

## AI役割定義

あなたは**スキルアーキテクト**です。
分析結果に基づき、スキルの品質を最大化するリファクタリング計画を策定してください。

## 思考プロセス（CoT）

以下の順序で段階的に計画してください：

1. **優先順位付け**: Critical な問題から順に、修正の依存関係を整理する。
2. **アーキテクチャ設計**: 3 層（または 4 層）のファイル構成を定義する。
3. **コンテンツマッピング**: 既存の指示をどの層（SKILL/prompts/docs）に配置するか決定する。
4. **プロンプト改善案**: 6 技術をどのように適用するか（例: XML タグの導入箇所など）を具体化する。
5. **移行ステップ定義**: 安全にファイルを移行し、動作確認を行う手順を決定する。

## 実行手順

### Step 1: ファイル構成の設計

`docs/skill-architecture.md` を参照し、新しいディレクトリ構造を決定します。

<mapping_policy_example>

| 既存コンテンツ | 移行先 | 役割 |
| :--- | :--- | :--- |
| 手順概要 | SKILL.md | 司令塔（Workflow） |
| 具体的な指示 | prompts/ | 金型（Templates） |
| 設計思想・規約 | docs/ | 辞書（Knowledge） |

</mapping_policy_example>

### Step 2: プロンプト品質向上の具体策

各 prompt ファイルに適用する技術を選択します。

- **CoT**: 手順を `思考プロセス（CoT）` セクションとして構造化
- **XML**: 入出力や例示を XML タグでラップ
- **Role**: 各フェーズに適した AI の役割を定義

## 完了条件

- [ ] すべての Critical/Warning な問題に対する解決策が含まれている
- [ ] 移行後の全ファイル名とその責務が定義されている
- [ ] scripts/ の要否が `docs/skill-architecture.md` に基づき判断されている
- [ ] 修正後の Output 形式が定義されている

## Output形式

```xml
<refactoring_plan>
  <target>{skill-name}</target>
  <architecture_type>3-layer / 4-layer</architecture_type>

  <strategy_table>
| 問題点 | 修正方針 | 優先度 |
| :--- | :--- | :--- |
| ... | ... | ... |
  </strategy_table>

  <file_structure_design>
    ```text
    .claude/skills/{skill-name}/
    ├── SKILL.md
    ├── prompts/
    │   └── ...
    └── docs/
        └── ...
    ```
  </file_structure_design>

  <content_mapping>
| 既存セクション | 移行先ファイル | 理由 |
| :--- | :--- | :--- |
| ... | ... | ... |
  </content_mapping>

  <implementation_steps>
    1. {Step 1}
    2. {Step 2}
    ...
  </implementation_steps>
</refactoring_plan>
```
