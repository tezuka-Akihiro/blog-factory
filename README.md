# blog-factory

「技術本 2.0」を製造・メンテナンスし続ける、構造的品質の司令塔。

## 概要

blog-factory は、技術ブログのコンテンツを「製造ライン」として統制するためのTypeScript CLIツールです。

単なる記事の保管場所ではなく、AIを「特定ドメインの専門家」として育て上げ、5〜10年「死なない」プロダクトを維持するための延命装置として機能します。外部ブログリポジトリの記事メタデータを解析・集計し、コンテンツの品質管理と棚卸しを自動化します。

## 核心思想

- **最大の努力で最小の結果（死なないこと）**: 流行のブラックボックスを排し、Web標準に準拠した設計で、長期的な保守性を担保する。
- **AIを製造ラインとして統制**: AIを単なる執筆代行ではなく、構造的品質を守る「特定ドメインの作業員」として管理・教育する。
- **構造の不自然さを正す**: 既存記事の定期的な「サーチ（検診）」を通じて、情報の陳腐化や設計負債を早期に発見・修正する。

## 主な製造工程（ロードマップ）

### Phase 1: Inspection & Extraction ✅ 実装済み

- **カテゴリ検索 (inspect)**: 全記事から特定のカテゴリを指定し、タイトルと概要をJSON形式で抽出。
- **サマリー集計 (summary)**: カテゴリ・タググループ別の記事数・有料記事統計をMarkdownレポートとして出力。
<<<<<<< HEAD
- **インフォメーション抽出 (info)**: 「インフォメーション」カテゴリの記事タイトルと概要を抽出。
=======
>>>>>>> preview

### Phase 2: Assembly（将来）

- **AI執筆スキル (Writing)**: 蓄積されたナレッジを基に、AIがWeb標準（Remix）の型に沿った「本物のドキュメント」を下書き・校閲。

### Phase 3: Finishing & Packaging（将来）

- **プレビルド最適化**: Lighthouse 100点を維持するための画像処理、メタデータ、エッジ動的OGPの生成・検証。

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

**出力例 (`results/summary.md`)**:

```markdown
# ブログ記事サマリー

## 📊 全体統計
- 記事総数: 66 件
- 有料記事数: 45 件
- 有料記事の総文字数: 222,254 文字

## 📂 カテゴリー別記事数
- ClaudeMix ガイド: 7 件
- ClaudeMix 考察: 17 件
...
```

## 記事のフロントマター仕様

解析対象の記事は、以下のYAMLフロントマターを持つ `.md` / `.mdx` ファイルです。

```yaml
---
slug: "article-slug"
title: "記事タイトル"
description: "記事の概要"
author: "Author Name"
publishedAt: "2025-12-09"
category: "ClaudeMix 考察"
tags: ["TypeScript", "architecture"]
freeContentHeading: "無料公開の見出し"  # 省略可。指定時は有料記事として扱わない
---
```

`freeContentHeading` が指定されている場合、またはカテゴリが公開カテゴリ（`起業`・`インフォメーション`）の場合は無料記事として分類されます。

## blog-spec.yaml

`blog-spec.yaml` はブログのマスター仕様ファイルです。以下を定義します。

- **categories**: カテゴリ一覧（名前・説明・アイコン）
- **tags**: タグ一覧とグループ分類
- **access_control.public_categories**: 無料公開カテゴリ

このファイルを更新することで、有料/無料の判定ロジックやタググループが自動的に反映されます。

## 著者 / 責任者

**優作 (Systems Survivalist / 起業家)**
「優しい人が優しいまま生きられる世界」のため、防衛拠点としての技術を授ける。
