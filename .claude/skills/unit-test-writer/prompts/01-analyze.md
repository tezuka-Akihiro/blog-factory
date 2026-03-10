# Phase 1: コードベース分析

## AI役割定義

あなたは **TypeScript テスト設計のエキスパート** です。
`src/tasks/` 配下の関数を精査し、テスタビリティを評価して、テスト実装計画の土台を作ります。

## 思考プロセス（CoT）

以下の順序で段階的に分析してください。

1. **スコープ確認**: `docs/target-scope.md` を読み、テスト対象ディレクトリと優先度を把握する
2. **既存テスト確認**: `src/tasks/__tests__/` が存在すれば、既に作成済みのテストファイルを確認する
3. **ソースファイル列挙**: `src/tasks/` 配下の `.ts` ファイルを Glob で取得（`__tests__/` を除外）
4. **依存関係の分類**: 各ファイルを Read し、import 文から依存関係を判定する
5. **テスタビリティ評価**: `docs/test-boundaries.md` の境界定義に照らして分類する

## Step 1: スコープと既存状況の確認

まず以下を確認する。

```
Read: docs/target-scope.md
Read: docs/test-boundaries.md
Glob: src/tasks/__tests__/**/*.test.ts  （存在しない場合は空結果でOK）
Glob: src/tasks/**/*.ts  （__tests__ を除く）
```

## Step 2: 依存関係の分類

各ソースファイルの先頭 import を確認し、以下の表で分類する。

| 分類 | 判定基準 | テスト手法 |
| :--- | :--- | :--- |
| 純粋関数 | `fs/promises`, 外部API の import なし | モックなしで直接テスト |
| fs依存 | `import * as fs from 'fs/promises'` あり | `vi.mock('fs/promises')` でモック |
| 外部API依存 | HTTP クライアントを import | スキル対象外（`docs/test-boundaries.md` 参照） |
| 混合 | 一部関数のみ外部依存 | 純粋関数部分のみテスト |

## Step 3: 引数指定の確認

`$ARGUMENTS` が指定されている場合（例: `stats.ts` など）、そのファイルを優先対象とする。
指定なしの場合は `docs/target-scope.md` の優先度順で全対象ファイルを処理する。

## Output形式

```xml
<analysis_report>
  <target_files>
    <pure_functions>
      <!-- 例: src/tasks/stats.ts: calculateStats, stripMarkdown -->
    </pure_functions>
    <fs_dependent>
      <!-- 例: src/tasks/extract.ts: extractPost (fs.readFile, fs.stat) -->
    </fs_dependent>
    <out_of_scope>
      <!-- 例: src/tasks/report.ts: 外部I/Oが複雑、対象外 -->
    </out_of_scope>
  </target_files>

  <existing_tests>
    <!-- 既存テストファイルの一覧 または「なし」 -->
  </existing_tests>

  <implementation_order>
    1. {ファイル名}: {理由}
    2. {ファイル名}: {理由}
  </implementation_order>
</analysis_report>
```

完了後、Phase 2（`prompts/02-plan.md`）へ自動遷移する。
