# カタログ構造定義

`blog-catalog` スキルが生成するカタログファイルの構造と管理ルールを定義します。

## 出力先

`.claude/skills/izanami-product-writer/docs/blog-catalog.md`

## ファイル構造

カタログファイルは以下の形式で生成されます：

```markdown
# ブログ記事カタログ

> 有効期限: YYYY-MM-DD
> 生成日: YYYY-MM-DD
> TTL: {TTL_DAYS} 日

## ClaudeMix 記録

| slug | title | description |
| :--- | :--- | :--- |
| slug-1 | タイトル1 | 説明文1 |

## ClaudeMix 考察

| slug | title | description |
| :--- | :--- | :--- |
| slug-2 | タイトル2 | 説明文2 |
```

## 管理ルール

### 1. TTL（Time To Live）

- デフォルトの有効期限は生成から **30日間** です。
- `scripts/extract.mjs` 内の `TTL_DAYS` 変数で制御されます。

### 2. 更新タイミング

- 新しい有料記事（記録・考察カテゴリ）を公開した時。
- 既存の有料記事のタイトルや説明文を大幅に変更した時。
- カタログの有効期限が切れた時。

### 3. 利用者

- 主に `izanami-product-writer` スキルが、関連記事の提案やリンク生成のために参照します。
