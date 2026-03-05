# blog-factory

「技術本 2.0」を製造・メンテナンスし続ける、構造的品質の司令塔。

## claude mix - リポジトリ構成

1 ClaudeMix

有料ブログ販売システム
マークダウン記事のプレビルドも行う。
当初はここで全てを実施していて、リポジトリを分離している。
責務が多すぎるので減らしたい。

2 blog-factory

ブログの編集室
ブログの執筆や、記事全体の編集、サマリー集計などを行う。
経営アドバイザーへの資料作成を新たに追加。

3 img-fortress-processor

サムネイルの印刷と展示
画像のリサイズ・変換・R2へのアップロードを行う。

## ディレクトリ構成

```text
blog-factory/
├── src/
│   ├── commands/
│   │   ├── index.ts         # CLIエントリーポイント
│   │   ├── inspect.ts       # inspectコマンド実装
│   │   ├── summary.ts       # summaryコマンド実装
│   │   └── info.ts          # infoコマンド実装
│   ├── tasks/
│   │   ├── scan.ts          # .md/.mdxファイルの再帰スキャン
│   │   ├── extract.ts       # frontmatterからメタデータ抽出
│   │   ├── report.ts        # JSON/Markdownレポート保存
│   │   └── summary.ts       # 統計計算・Markdown整形
│   ├── types/index.ts       # TypeScript型定義
│   ├── utils/
│   │   ├── logger.ts        # CLIロガー
│   │   └── spec-loader.ts   # blog-spec.yaml読み込み
├── results/                 # 生成されたレポートの出力先
├── contents/                # ローカルコンテンツ置き場（未使用）
├── blog-spec.yaml           # ブログ仕様マスター定義
├── sample.md                # 記事frontmatterサンプル
└── .env                     # BLOG_SOURCE_PATHの設定（要作成）
```

## 技術スタック

| 項目 | 技術 |
| --- | --- |
| Language | TypeScript 5.x |
| Runtime | Node.js |
| CLI Framework | Commander |
| Markdown Parser | gray-matter |
| Environment | dotenv |

## セットアップ

### 1. 依存関係のインストール

```bash
npm install
```

### 2. 環境変数の設定

`.env.example` をコピーして `.env` を作成し、ブログリポジトリのパスを設定します。

```bash
cp .env.example .env
```

`.env`:

```dotenv
BLOG_SOURCE_PATH=../claudemix/content/blog/posts
```

`BLOG_SOURCE_PATH` は、解析対象のブログ記事（`.md` / `.mdx` ファイル）が格納されているディレクトリへのパス（相対パス可）を指定します。

## 使い方

### 記事のカテゴリ別抽出（inspect）

指定カテゴリの記事メタデータをJSON形式で `results/` に出力します。

```bash
# すべての記事を抽出
npm run inspect

# カテゴリを絞り込んで抽出
npm run inspect -- --category="ClaudeMix ガイド"
```

### サマリーレポート生成（summary）

カテゴリ・タググループ別の統計をMarkdown形式で `results/summary.md` に出力します。

```bash
npm run summary
```

### インフォメーション記事の抽出（info）

「インフォメーション」カテゴリの記事タイトルと概要を抽出し、`results/info-list.md` に出力します。

```bash
npm run info
```

## 著者 / 責任者

**優作 (Systems Survivalist / 起業家)**
「優しい人が優しいまま生きられる世界」のため、防衛拠点としての技術を授ける。
