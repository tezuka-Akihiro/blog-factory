import { describe, it, expect } from 'vitest';
import { calculateStats } from '../stats';
import { makePost } from './test-utils';

describe('calculateStats', () => {
  describe('正常系', () => {
    it.each([
      {
        desc: 'paywall=true の記事',
        post: makePost({ paywall: true, body: 'ABCDE', category: '有料カテゴリ' }),
        expectedPaid: 1,
        shouldHavePremium: true,
      },
      {
        desc: 'category に "ClaudeMix" を含む記事',
        post: makePost({ category: 'ClaudeMix ガイド', body: 'テキスト内容' }),
        expectedPaid: 1,
        shouldHavePremium: true,
      },
      {
        desc: '無料記事',
        post: makePost({ category: '無料カテゴリ', body: '無料の本文', paywall: false }),
        expectedPaid: 0,
        shouldHavePremium: false,
      },
    ])('$desc', ({ post, expectedPaid, shouldHavePremium }) => {
      const result = calculateStats([post]);
      expect(result.total.paidCount).toBe(expectedPaid);
      if (shouldHavePremium) {
        expect(result.total.premiumChars).toBeGreaterThan(0);
      } else {
        expect(result.total.premiumChars).toBe(0);
      }
    });

    it('カテゴリ別集計', () => {
      const posts = [
        makePost({ category: 'カテゴリA' }),
        makePost({ category: 'カテゴリA' }),
        makePost({ category: 'カテゴリB' }),
        makePost({ category: '' }),
      ];
      const result = calculateStats(posts);

      expect(result.total.count).toBe(4);
      expect(result.categories['カテゴリA']?.count).toBe(2);
      expect(result.categories['カテゴリB']?.count).toBe(1);
      expect(result.categories['Uncategorized']?.count).toBe(1);
    });
  });

  describe('freeContentHeading（部分有料）', () => {
    it('見出し以降のみ premiumChars に加算される', () => {
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

      expect(resultWithHeading.total.premiumChars).toBeGreaterThan(resultWithoutHeading.total.premiumChars);
    });

    it('見出しがない場合は body 全体を計算する', () => {
      const body = '## 別の見出し\n\n本文内容';
      const post = makePost({
        paywall: true,
        body,
        freeContentHeading: '存在しない見出し',
      });
      const result = calculateStats([post]);
      const resultFull = calculateStats([makePost({ paywall: true, body })]);

      expect(result.total.premiumChars).toBe(resultFull.total.premiumChars);
    });
  });

  describe('stripMarkdown', () => {
    it.each([
      { desc: '見出し記号の除去', body: '# 見出し', expected: 3 },
      { desc: 'リンク記法の除去', body: '[テキスト](https://example.com)', expected: 4 },
      { desc: '空白の除去', body: 'A B C', expected: 3 },
    ])('$desc', ({ body, expected }) => {
      const post = makePost({ paywall: true, body });
      const result = calculateStats([post]);
      expect(result.total.premiumChars).toBe(expected);
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
  });
});
