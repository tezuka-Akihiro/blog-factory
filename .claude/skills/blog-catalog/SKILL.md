---
name: blog-catalog
description: ClaudeMixのブログ有料記事（記録・考察カテゴリ）から frontmatter を一括抽出し、izanami-product-writer が参照する商品宣伝用カタログを生成する。Use when generating or refreshing the blog catalog for izanami-product-writer.
allowed-tools: Read, Write, Bash
---

# ブログカタログ生成スキル

有料カテゴリ記事（`ClaudeMix 記録` / `ClaudeMix 考察`）の slug・title・description を
スクリプトで一括抽出し、izanami-product-writer の参考材料として保存します。

## 設定

TTL_DAYS（カタログ有効期限）は以下のスクリプトで管理しています：

```text
.claude/skills/blog-catalog/scripts/extract.mjs
```

変更する場合はスクリプト冒頭の `TTL_DAYS = 30` を直接編集してください。

## When to Use

- `/blog-catalog` と指示された時
- `izanami-product-writer` 実行前にカタログを最新化したい時
- ブログ記事を追加・更新した後

## 実行フロー

```text
Phase 1: スクリプト実行 → prompts/01-generate.md
    node .claude/skills/blog-catalog/scripts/extract.mjs
    出力: .claude/skills/izanami-product-writer/docs/blog-catalog.md
```

## 成果物

`.claude/skills/izanami-product-writer/docs/blog-catalog.md`

## 参照ドキュメント

| ファイル | 役割 |
| :--- | :--- |
| `docs/catalog-structure.md` | カタログのフォーマット定義とTTL管理ルール |
