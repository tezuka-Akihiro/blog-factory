# CLAUDE.md — blog-factory

このファイルは、Claude Code がこのリポジトリで作業する際の指針です。

## プロジェクト概要

blog-factory は、外部ブログリポジトリ（claudemix）の記事メタデータを解析・集計する TypeScript CLI ツールです。記事ファイル自体は持たず、`BLOG_SOURCE_PATH` で指定された外部ディレクトリを読み込みます。

## コマンド

```bash
# 依存関係のインストール
npm install

# 記事メタデータの抽出（全件 or カテゴリ絞り込み）
npm run inspect
npm run inspect -- --category="ClaudeMix ガイド"

# サマリーレポートの生成（results/summary.md に出力）
npm run summary
```

TypeScriptのビルドは `ts-node` で直接実行するため、`npm run build` は不要です。

## ディレクトリ構成と役割

```text
src/
├── commands/        # CLIコマンドの実装とルーティング（index.ts がエントリーポイント）
├── tasks/           # ビジネスロジック（scan, extract, report, summary）
├── types/index.ts   # 共有型定義（BlogPost, SummaryData, InspectionResult）
├── utils/           # ユーティリティ（logger, spec-loader）
```

- `tasks/` はCLIに依存しない純粋な関数群です。テストを書く場合はここを対象にしてください。
- `commands/` は `tasks/` を組み合わせてCLI向けに整形する薄いレイヤーです。

## 重要ファイル

| ファイル | 役割 |
| --- | --- |
| `blog-spec.yaml` | カテゴリ・タグ・有料/無料判定のマスター定義 |
| `.env` | `BLOG_SOURCE_PATH` の設定（gitignore済み） |
| `.env.example` | 環境変数のテンプレート |
| `results/` | 生成されたレポートの出力先（gitignore 済み） |

## 型定義（src/types/index.ts）

```typescript
interface BlogPost {
  title: string;
  description: string;
  category: string;
  path: string;
  lastModified?: string;
  isPaid: boolean;
  characterCount: number;
  tags: string[];
}
```

## 有料/無料の判定ロジック

`src/tasks/extract.ts` に実装されています。

- カテゴリが `blog-spec.yaml` の `access_control.public_categories` に含まれる → 無料
- frontmatter に `freeContentHeading` フィールドがある → 無料（部分公開）
- それ以外 → 有料（`isPaid: true`）

## 拡張時の注意点

### 新しいコマンドを追加する場合

1. `src/commands/` に新しいコマンドファイルを作成
2. `src/commands/index.ts` に Commander コマンドとして登録
3. ロジックは `src/tasks/` に実装し、コマンドファイルからは呼び出すだけにする

### blog-spec.yaml を変更する場合

`src/utils/spec-loader.ts` の `loadBlogSpec()` がこのファイルを読み込みます。スキーマを変更する場合は型定義の更新も必要です。

### 新しいフロントマターフィールドを追加する場合

`src/tasks/extract.ts` の `extractMetadata()` 関数と `src/types/index.ts` の `BlogPost` 型を同時に更新してください。

## コーディング規約

- `strict: true` の TypeScript を使用。型エラーは必ず解消する。
- ログ出力は `src/utils/logger.ts` の `Logger` を使用する（`console.log` 直接使用不可）。
- `results/` への書き込みは `src/tasks/report.ts` の関数を経由する。
- 依存関係の追加は最小限に。Web標準・Node.js 標準で解決できるものは追加しない。
