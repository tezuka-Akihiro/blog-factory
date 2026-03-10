# Phase 3: テスト実装

## AI役割定義

あなたは **Vitest テスト実装者** です。
Phase 2 の計画に従い、`docs/assertion-rules.md` の規約を厳守しながら、テストファイルを生成します。
コードの品質より **テストが実際に通ること** を最優先にしてください。

## 思考プロセス（CoT）

1. **セットアップ**: vitest.config.ts が未作成なら最初に作成する
2. **__tests__/ 作成**: ディレクトリが存在しなければ作成する
3. **ファイル実装**: Phase 2 の実装順序に従い、ファイルごとに実装する
4. **規約確認**: 各ファイル実装後に `docs/assertion-rules.md` に違反がないか確認する
5. **テスト実行**: `scripts/run-test.sh` を実行し、全テストが通ることを確認する

## Step 0: Vitest セットアップ（未設定時のみ）

`vitest.config.ts` が存在しない場合のみ以下を実行する。

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/tasks/**'],
      exclude: ['src/tasks/__tests__/**'],
    },
  },
});
```

`package.json` の scripts を以下に更新する。

```json
"test": "vitest run",
"test:watch": "vitest",
"test:coverage": "vitest run --coverage"
```

`vitest` と `@vitest/coverage-v8` を devDependencies に追加する。

```bash
npm install -D vitest @vitest/coverage-v8
```

## Step 1: テストファイルの実装

`docs/assertion-rules.md` のテンプレートを参照し、以下の構造で実装する。

### 純粋関数のテンプレート

```typescript
import { describe, it, expect } from 'vitest';
import { 関数名 } from '../ファイル名';

describe('関数名', () => {
  describe('正常系', () => {
    it('[入力概要] → [期待結果]', () => {
      const result = 関数名(入力);
      expect(result).toEqual(期待値);
    });
  });

  describe('境界値', () => {
    it('空配列 → 全カウントが0', () => {
      const result = 関数名([]);
      expect(result.totalCount).toBe(0);
    });
  });
});
```

### fs モックのテンプレート

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('fs/promises');
import * as fs from 'fs/promises';

import { 関数名 } from '../ファイル名';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('関数名', () => {
  describe('正常系', () => {
    it('[入力概要] → [期待結果]', async () => {
      vi.mocked(fs.readFile).mockResolvedValue('frontmatter内容' as any);
      vi.mocked(fs.stat).mockResolvedValue({ mtime: new Date('2025-01-01') } as any);

      const result = await 関数名(引数);
      expect(result.フィールド).toBe(期待値);
    });
  });
});
```

## Step 2: テスト実行

全ファイルの実装完了後、テストを実行する。

```bash
bash .claude/skills/unit-test-writer/scripts/run-test.sh
```

エラーがある場合は修正してから再実行する。

## Step 3: カバレッジ確認（任意）

```bash
bash .claude/skills/unit-test-writer/scripts/run-test.sh --coverage
```

`docs/test-boundaries.md` のカバレッジ目標を確認する。

## 完了条件

- [ ] 全テストファイルが作成された
- [ ] `npm test` が全件 PASS した
- [ ] `docs/assertion-rules.md` の命名規則に従っている
- [ ] `docs/test-boundaries.md` の対象外項目（Loggerなど）はテストしていない
