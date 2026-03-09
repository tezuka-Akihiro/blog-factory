# Phase 3: 記事執筆

Phase 2 の分析メモを元に、記事ファイルを作成する。
詳細な規定は `docs/article-structure.md` と `docs/format-rules.md` を参照すること。

## 執筆手順

### Step 1: frontmatter の生成

以下のフィールドをすべて埋める。

```yaml
---
title: "[30〜50文字。シリーズ感を含む]"
description: "[80〜120文字。何がわかるかを1〜2文で]"
category: "インフォメーション"
tags: ["[blog-spec.yaml のタグから選択。下記ルール参照]"]
slug: "x-trend-[キーワード]"
author: "ClaudeMix Team"
publishedAt: "[YYYY-MM-DD]"
isPaid: false
---
```

**タグ選択ルール（必須）:**

- `docs/blog-spec.yaml` の `tags` セクションに定義されたタグの中から、記事に関連するものを1〜4個選ぶ
- **新しいタグを作らない**。未定義のタグを使用してはいけない
- 完全一致の名前で使用する（表記ゆれ禁止）
- 該当するタグが存在しない場合は、タグなし（空配列 `[]`）にする

利用可能なタグ一覧（`docs/blog-spec.yaml` から抜粋）:
- Claude Code 関連: `MCP`, `Skills`, `CLAUDE.md`, `Subagent`, `rules`
- Remix 関連: `SSR`, `Vite`, `React`, `Loader`, `Nested Routing`, `Playwright`, `Vitest`
- Cloudflare 関連: `Pages`, `D1`, `R2`, `KV`
- その他技術: `TypeScript`, `OGP`, `Stripe`, `Jules`
- 記事の性質: `troubleshooting`, `refactoring`, `testing`, `architecture`, `performance`
- 起業関連: `セミナー`, `スタハブ多摩`, `エンジニア初心者向き`, `spiritual`

タイトルフォーマット例:
- ✅ `Claude 4発表、バイブコーダーへの影響をAIに聞いてみた`
- ✅ `EU AI Act施行、個人開発者は今すぐ何をすべきかClaudeに聞いた`
- ❌ `最新AIツールについて詳しく解説します`（シリーズ感なし）

### Step 2: 導入部の執筆

以下の3文構成で150〜250文字に収める。

1. **トレンドの一言要約**（1文）— 「○○が起きた。」
2. **読者への問いかけ**（1文）— 「あなたの○○への影響、把握できていますか？」
3. **この記事でわかること**（2〜3文）— セクション構成を予告する

例:
```
EU AI Actの施行細則がついに確定した。オープンソースモデルを使う個人開発者も無関係ではいられません。

この記事では、（1）何が決まったのかの整理、（2）日本の個人事業主への実質的な影響、
（3）条文の裏にある思想、（4）今すぐ確認すべき3つのポイントを解説します。
```

### Step 3: 本文4セクションの執筆

各セクションの構成は `docs/article-structure.md` を参照。
文字数の目安は `docs/format-rules.md` を参照。

**信頼性表記ルールを必ず守ること:**
- 事実 → そのまま記述（出典明記）
- AI分析 → 「ClaudeMixの見解では〜」と明記
- 推論 → 「〜と考えられる」「〜の可能性がある」と明記
- 未確認情報 → 記載しない

### Step 4: ファイル出力

完成した記事を以下のパスに出力する。

```
contents/[slug].md
```

## 完了条件

- frontmatterの全フィールドが埋まっている
- 導入部が3文構成になっている
- 4セクションすべてが執筆されている
- 信頼性表記が適用されている
- ファイルが正しいパスに出力されている

完了後、`docs/checklist.md` を参照して最終確認を行う。
確認が完了したら Phase 4 へ進む。
