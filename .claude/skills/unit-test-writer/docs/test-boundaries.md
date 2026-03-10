# テスト範囲の境界定義

何をテストして、何をテストしないかを定義する。

## テストする対象

### ビジネスロジック（最優先）

| 対象 | 具体例 |
| :--- | :--- |
| 有料/無料の判定ロジック | `isPaid` フラグの計算（カテゴリ・frontmatter依存） |
| 文字数集計 | `characterCount`・`premiumChars` の計算式 |
| 集計・サマリー計算 | カテゴリ別カウント、平均文字数、KPI指標 |
| Markdown生成 | `formatSummaryToMarkdown` が期待するMarkdownを出力するか |
| フィルタリング | カテゴリ絞り込み、期間絞り込み |

### 境界値・エッジケース

| ケース | 例 |
| :--- | :--- |
| 空配列入力 | `calculateStats([])` → 全カウントが0 |
| 空文字列 | `title: ''` の記事が含まれる場合 |
| 複合フラグ | `isPaid=false` かつ `freeContentHeading` あり |
| 最大/最小値 | 文字数が0の記事、文字数が非常に多い記事 |

### fs依存関数の動作確認

| 対象 | テスト内容 |
| :--- | :--- |
| `extractPost()` | frontmatter が正しく解析されるか、isPaid判定が正しいか |
| `scanFiles()` | .md ファイルのみが対象になるか、ネスト構造が正しく走査されるか |

## テストしない対象

### Logger の出力

```typescript
// ❌ テストしない
expect(Logger.info).toHaveBeenCalledWith('...');

// ✅ 代わりに: 関数の戻り値や副作用をテストする
expect(result.posts).toHaveLength(3);
```

**理由**: Logger は `src/utils/logger.ts` の実装詳細。ログ文言の変更でテストが壊れる。

### ファイルへの書き込み（report.ts 系）

```typescript
// ❌ テストしない
expect(fs.writeFile).toHaveBeenCalledWith('results/summary.md', ...);
```

**理由**: `results/` への書き込みは `report.ts` に委譲されており、統合テストの領域。

### 外部API通信

- `utils/cloudflare-client.ts`, `utils/ga4-client.ts` など
- **理由**: 外部サービスへの実際の通信はユニットテストの範囲外

### Commander CLI のパース

- `commands/` ディレクトリのコマンドルーティング
- **理由**: `tasks/` のロジックのみをテストすれば十分。CLIレイヤーは薄いラッパー

### gray-matter のパース自体

- frontmatter の正規表現やパース動作そのもの
- **理由**: gray-matter ライブラリの内部動作は信頼する

## モック戦略

| 依存先 | 戦略 | 理由 |
| :--- | :--- | :--- |
| `fs/promises` | `vi.mock('fs/promises')` | ファイルシステムに依存しない純粋なロジックのみテスト |
| `gray-matter` | モックしない | ライブラリ自体は信頼し、実際のパース結果でテスト |
| `docs/blog-spec.yaml` | モックしない（実ファイルを使用） | YAMLの読み込みは `spec-loader.ts` 経由。実ファイルを使う方が信頼性高い |
| `Logger` | モックしない | ログ出力はテスト対象外 |

## カバレッジ目標

| 対象 | 目標カバレッジ |
| :--- | :--- |
| `tasks/stats.ts` | 90%以上 |
| `tasks/summary.ts` | 90%以上 |
| `tasks/extract.ts` | 70%以上（エラーパスは除く） |
| `tasks/scan.ts` | 70%以上 |

カバレッジは `npm run test:coverage` で確認する。
100%を目指す必要はなく、重要なビジネスロジックがカバーされていることを優先する。
