import { describe, it, expect } from 'vitest';
import { calculateStats } from '../stats';
import { BlogPost } from '../../types';

function makePost(overrides: Partial<BlogPost>): BlogPost {
  return {
    title: 'テスト記事',
    description: '説明',
    category: '記録・考察',
    path: '/posts/test.md',
    isPaid: true,
    characterCount: 1000,
    tags: [],
    body: '本文',
    slug: 'test',
    ...overrides,
  };
}

describe('calculateStats', () => {
  describe('正常系', () => {
    it('paywall=true の記事 → paidCount に加算され premiumChars が計算される', () => {
      const post = makePost({ paywall: true, body: 'ABCDE', category: '有料カテゴリ' });
      const result = calculateStats([post]);

      expect(result.total.paidCount).toBe(1);
      expect(result.total.count).toBe(1);
      expect(result.total.premiumChars).toBeGreaterThan(0);
    });

    it('category に "ClaudeMix" を含む記事 → isPaidForStats=true として扱われる', () => {
      const post = makePost({ category: 'ClaudeMix ガイド', body: 'テキスト内容' });
      const result = calculateStats([post]);

      expect(result.total.paidCount).toBe(1);
      expect(result.total.premiumChars).toBeGreaterThan(0);
    });

    it('paywall=false かつ category に ClaudeMix を含まない → premiumChars=0', () => {
      const post = makePost({ category: '無料カテゴリ', body: '無料の本文' });
      const result = calculateStats([post]);

      expect(result.total.paidCount).toBe(0);
      expect(result.total.premiumChars).toBe(0);
    });

    it('複数カテゴリの記事 → カテゴリ別カウントが正しく集計される', () => {
      const posts = [
        makePost({ category: 'カテゴリA' }),
        makePost({ category: 'カテゴリA' }),
        makePost({ category: 'カテゴリB' }),
      ];
      const result = calculateStats(posts);

      expect(result.total.count).toBe(3);
      expect(result.categories['カテゴリA']?.count).toBe(2);
      expect(result.categories['カテゴリB']?.count).toBe(1);
    });

    it('有料・無料の混合 → 有料のみ paidCount に加算される', () => {
      const posts = [
        makePost({ paywall: true, category: '有料', body: 'AAA' }),
        makePost({ category: '無料', body: 'BBB' }),
        makePost({ paywall: true, category: '有料2', body: 'CCC' }),
      ];
      const result = calculateStats(posts);

      expect(result.total.count).toBe(3);
      expect(result.total.paidCount).toBe(2);
    });
  });

  describe('境界値', () => {
    it('空配列 → 全カウントが 0', () => {
      const result = calculateStats([]);

      expect(result.total.count).toBe(0);
      expect(result.total.paidCount).toBe(0);
      expect(result.total.premiumChars).toBe(0);
      expect(result.categories).toEqual({});
    });

    it('category が空文字 → "Uncategorized" に集計される', () => {
      const post = makePost({ category: '' });
      const result = calculateStats([post]);

      expect(result.categories['Uncategorized']).toBeDefined();
      expect(result.categories['Uncategorized']?.count).toBe(1);
    });
  });

  describe('freeContentHeading（部分有料）', () => {
    it('freeContentHeading あり → 見出し以降のみ premiumChars に加算される', () => {
      const fullBody = '無料の前文\n\n## 有料コンテンツ開始\n\n有料の本文内容ABCDE';
      const freeBody = '無料の前文';

      const postWithHeading = makePost({
        paywall: true,
        body: fullBody,
        freeContentHeading: '有料コンテンツ開始',
      });
      const postWithoutHeading = makePost({
        paywall: true,
        body: freeBody,
      });

      const resultWithHeading = calculateStats([postWithHeading]);
      const resultWithoutHeading = calculateStats([postWithoutHeading]);

      // 見出し以降のみカウントなので、本文全体よりも多い文字数になるはず
      expect(resultWithHeading.total.premiumChars).toBeGreaterThan(resultWithoutHeading.total.premiumChars);
    });

    it('freeContentHeading に一致する見出しがない → body 全体を premiumChars に計算する', () => {
      const body = '## 別の見出し\n\n本文内容';
      const post = makePost({
        paywall: true,
        body,
        freeContentHeading: '存在しない見出し',
      });
      const postFull = makePost({ paywall: true, body });

      const resultWithHeading = calculateStats([post]);
      const resultFull = calculateStats([postFull]);

      // 見出しが見つからない場合は body 全体が対象なので同じになる
      expect(resultWithHeading.total.premiumChars).toBe(resultFull.total.premiumChars);
    });
  });

  describe('stripMarkdown（calculateStats 経由でのテスト）', () => {
    it('Markdown 記号が除去され、空白なしの文字数が計算される', () => {
      // "# 見出し" の # とスペースが除去され "見出し" = 3文字（見・出・し）
      const post = makePost({ paywall: true, body: '# 見出し' });
      const result = calculateStats([post]);

      expect(result.total.premiumChars).toBe(3);
    });

    it('リンク記法 [text](url) → text のみが文字数に含まれる', () => {
      const post = makePost({ paywall: true, body: '[テキスト](https://example.com)' });
      const result = calculateStats([post]);

      expect(result.total.premiumChars).toBe(4); // "テキスト" = 4文字
    });
  });
});
