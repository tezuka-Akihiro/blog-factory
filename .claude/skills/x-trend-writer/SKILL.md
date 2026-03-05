---
name: x-trend-writer
description: Writes "XトレンドをAIに聞いてみた" series articles for ClaudeMix インフォメーションカテゴリ (free, no login). Use when user provides an X (Twitter) trend topic with source URL and asks to write a blog article analyzing how it affects vibe coders, engineers, or individual tech workers. Produces a 4-section article plus X announcement post. Requires trend content and source URL as $ARGUMENTS.
argument-hint: "[トレンドの概要と出典URL]"
allowed-tools: Read, Write, Edit, Glob, Grep, AskUserQuestion
---

# XトレンドをAIに聞いてみた — 執筆スキル

ClaudeMixの「XトレンドをAIに聞いてみた」シリーズ記事を執筆する専門スキルです。
オペレーターがチャットで渡したトレンド情報を元に、バイブコーダー・技術者・個人事業主向けに洗練された記事を作成します。

## When to Use

- `/x-trend-writer [トレンド情報と出典URL]` と指示された時
- Xで話題になっているAI・テクノロジー・ビジネストレンドの記事を書く時
- 「ClaudeMixらしい視点」でトレンドを深堀りしたい時

## あなたの専門知識

- **対象読者**: バイブコーダー・技術者・個人事業主
- **カテゴリ**: インフォメーション（無料・ログイン不要）
- **記事フォーマット**: 4セクション構成（状況把握 → 影響分析 → 本質探求 → アクションプラン）
- **導入スタイル**: 一言要約 + 読者への問いかけ + 記事予告の3文構成
- **信頼性原則**: 事実・AI分析・推論を明確に区別して表記

## 実行フロー

```text
Phase 1: 入力検証          → prompts/01-validate-input.md
    ↓ 引数の充足確認。不足があれば補足を求めて停止

Phase 2: AI分析            → prompts/02-research.md
    ↓ 4セクション分の分析を構造化

Phase 3: 記事執筆          → prompts/03-write.md
    ↓ frontmatter + 導入部 + 4セクション本文を生成

Phase 4: X告知文生成       → prompts/04-announce.md
    ↓ 告知ポスト（テンプレート埋め込み済み）を出力

完成
```

## 各フェーズの要約

### Phase 1: 入力検証

**参照**: `prompts/01-validate-input.md`

$ARGUMENTS を以下の3指標で評価する：

1. **トレンドの核心** — 「何が」「どう変わった/起きた」が1文で言えるか
2. **一次情報の所在** — URL・発表元・報道日時が含まれているか
3. **読者への接点** — 技術者・個人事業主への影響が想像できるか

不足があれば執筆せず、補足を求めて停止する。

### Phase 2: AI分析

**参照**: `prompts/02-research.md`

4セクションに対応した分析を構造化する：

- セクション1用: 何が起きたかの事実整理
- セクション2用: バイブコーダー・個人事業主への脅威と機会
- セクション3用: 本質的な構造変化・信憑性・今後のリスク
- セクション4用: 今週中に取れるアクション・プロンプト例

### Phase 3: 記事執筆

**参照**: `prompts/03-write.md` / `docs/article-structure.md` / `docs/format-rules.md`

1. frontmatter生成（カテゴリ・タグ・slug・title・description）
2. 導入部執筆（3文構成）
3. 4セクション本文執筆
4. ファイルを `content/blog/posts/[slug].md` に出力

### Phase 4: X告知文生成

**参照**: `prompts/04-announce.md`

記事完成後、Xへの告知ポストを生成する。

## 成果物

| フェーズ | 成果物 |
| :--- | :--- |
| Phase 1 | 入力OK / 補足要求の判断 |
| Phase 2 | 4セクション分の構造化分析メモ |
| Phase 3 | 完成記事ファイル（`content/blog/posts/[slug].md`） |
| Phase 4 | X告知ポスト文（コピペ可能） |

## 参照ドキュメント

| ファイル | 役割 |
| :--- | :--- |
| `prompts/01-validate-input.md` | 入力検証の手順 |
| `prompts/02-research.md` | AI分析プロンプトテンプレート |
| `prompts/03-write.md` | 記事執筆の手順 |
| `prompts/04-announce.md` | X告知文生成の手順 |
| `docs/article-structure.md` | 4セクション構成の詳細 |
| `docs/format-rules.md` | 文字数・タイトル・slug・メタデータ規定 |
| `docs/checklist.md` | 公開前の品質チェックリスト |

## 信頼性表記ルール（必須）

| 情報の種類 | 表記方法 |
| :--- | :--- |
| 公式発表・報道から得た事実 | そのまま記述（出典明記） |
| AIの分析・予測 | 「ClaudeMixの見解では〜」と明記 |
| 筆者の解釈・推論 | 「〜と考えられる」「〜の可能性がある」と明記 |
| 未確認の情報 | 記載しない |
