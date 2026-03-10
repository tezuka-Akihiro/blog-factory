# アサート規約

Vitest を使ったアサートの書き方・命名規則・マッチャー選択基準を定義する。

## インポート規約

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
```

`vitest.config.ts` で `globals: true` を設定している場合でも、明示的にインポートすること（可読性・IDE補完のため）。

## describe / it の命名規則

### 基本構造

```typescript
describe('関数名', () => {
  describe('正常系', () => {
    it('[入力の概要] → [期待する結果]', () => { ... });
  });

  describe('境界値', () => {
    it('[境界条件] → [期待する結果]', () => { ... });
  });

  describe('異常系', () => {
    it('[異常条件] → [期待する挙動]', () => { ... });
  });
});
```

### 命名の良い例と悪い例

```typescript
// ✅ 良い例: 入力と期待値が明確
it('isPaid=trueの記事のみ premiumChars に加算される', () => { ... });
it('空配列を渡した場合 totalCount が 0 になる', () => { ... });
it('freeContentHeading 以降のみが有料文字数として計算される', () => { ... });

// ❌ 悪い例: 実装詳細や曖昧な説明
it('正しく動く', () => { ... });
it('カウントをテスト', () => { ... });
it('should work', () => { ... });
```

## マッチャー選択基準

| 用途 | マッチャー | 例 |
| :--- | :--- | :--- |
| プリミティブの完全一致 | `toBe` | `expect(result.totalCount).toBe(3)` |
| オブジェクト・配列の深い比較 | `toEqual` | `expect(result).toEqual({ totalCount: 3, ... })` |
| 文字列の部分一致 | `toContain` | `expect(markdown).toContain('## サマリー')` |
| 文字列の正規表現マッチ | `toMatch` | `expect(output).toMatch(/\d+件/)` |
| 数値の近似値 | `toBeCloseTo` | `expect(ratio).toBeCloseTo(0.33, 2)` |
| null / undefined | `toBeNull` / `toBeUndefined` | `expect(result).toBeNull()` |
| 配列の要素数 | `toHaveLength` | `expect(posts).toHaveLength(5)` |
| モック呼び出し確認 | `toHaveBeenCalledWith` | `expect(fs.readFile).toHaveBeenCalledWith(path, 'utf-8')` |
| モック呼び出し回数 | `toHaveBeenCalledTimes` | `expect(fs.readFile).toHaveBeenCalledTimes(1)` |
| エラーのスロー | `toThrow` | `expect(() => fn()).toThrow('message')` |
| 非同期エラー | `rejects.toThrow` | `await expect(fn()).rejects.toThrow(...)` |

## モックの書き方規約

### fs/promises のモック（fs依存関数向け）

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('fs/promises');
import * as fs from 'fs/promises';

beforeEach(() => {
  vi.clearAllMocks(); // 各テスト前にモックをリセット
});

it('ファイルを正常に読み込む', async () => {
  vi.mocked(fs.readFile).mockResolvedValue('--- \ntitle: テスト\n---\n本文' as any);
  vi.mocked(fs.stat).mockResolvedValue({ mtime: new Date('2025-01-01') } as any);

  const result = await targetFn('/path/to/file.md');
  expect(result.title).toBe('テスト');
});
```

### モックの注意点

- `vi.mock()` はファイルの先頭に書く（ホイスティングされる）
- `vi.clearAllMocks()` を `beforeEach` に必ず入れる（テスト間の状態汚染防止）
- `as any` は fs.stat の戻り値型（fs.Stats）が複雑なため許容する

## テストデータの作り方

### BlogPost の fixture

```typescript
// __tests__/fixtures/blog-posts.ts に切り出しても良い
const paidPost: BlogPost = {
  title: '有料記事',
  description: '説明',
  category: '記録・考察',
  path: '/posts/paid.md',
  isPaid: true,
  characterCount: 3000,
  tags: ['Claude'],
  lastModified: '2025-01-01',
};

const freePost: BlogPost = {
  title: '無料記事',
  description: '説明',
  category: 'ClaudeMix ガイド',
  path: '/posts/free.md',
  isPaid: false,
  characterCount: 1000,
  tags: [],
  lastModified: '2025-01-01',
};
```

## アサートの粒度

- **1テスト = 1検証ポイント** を基本とする
- 複合アサートが必要な場合は `toEqual` でオブジェクト全体を検証する
- ログ出力（Logger）のアサートは行わない（`docs/test-boundaries.md` 参照）
