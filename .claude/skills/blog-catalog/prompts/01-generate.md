# Phase 1: ブログカタログ生成

## AI役割定義

あなたは ClaudeMix のコンテンツエンジニアです。
有料カテゴリ記事の一覧を最新化し、`izanami-product-writer` が利用可能なカタログを生成します。

## 思考プロセス（CoT）

以下の順序で段階的に実行してください：

1. **現状確認**: 既存カタログの有無と有効期限をチェックする。
2. **実行判断**: 再生成が必要か（期限切れ、またはユーザー指示）を判断する。
3. **スクリプト実行**: `extract.mjs` を実行してデータを抽出・加工する。
4. **完了報告**: 生成結果のサマリーをユーザーに提示する。

## 実行手順

### Step 1: 既存カタログの有効期限を確認する

`.claude/skills/izanami-product-writer/docs/blog-catalog.md` を読み込みます。

- ファイルが存在しない場合は、Step 2 へ進みます。
- ファイルが存在する場合、先頭のメタデータを抽出してください。

<existing_metadata_example>
> 有効期限: 2024-03-30
</existing_metadata_example>

有効期限が今日よりも後の日付であっても、ユーザーが再生成を望んでいる場合は実行します。

### Step 2: スクリプトを実行する

以下のコマンドを実行してカタログを生成します。

```bash
node .claude/skills/blog-catalog/scripts/extract.mjs
```

### Step 3: 結果の検証と報告

生成されたファイルの内容を確認し、以下の形式で報告してください。

## 完了条件

- [ ] `node .claude/skills/blog-catalog/scripts/extract.mjs` が成功した
- [ ] `.claude/skills/izanami-product-writer/docs/blog-catalog.md` が更新された
- [ ] 抽出された記事数が 0 件でないことを確認した（記事がある場合）

## Output形式

```markdown
### カタログ生成結果

- **対象カテゴリ**: ClaudeMix 記録, ClaudeMix 考察
- **抽出記事数**: {total} 件
- **有効期限**: {expires_at}
- **保存先**: `.claude/skills/izanami-product-writer/docs/blog-catalog.md`

izanami-product-writer の情報収集フェーズでこれらの記事が参照可能になりました。
```
