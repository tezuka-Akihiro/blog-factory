import { describe, it, expect } from 'vitest';
import { calculateSummary, formatSummaryToMarkdown } from '../summary';
import { SummaryData } from '../../types';
import { makePost } from './test-utils';

describe('calculateSummary', () => {
  describe('正常系', () => {
    it('有料記事の集計', () => {
      const posts = [
        makePost({ isPaid: true, characterCount: 3000 }),
        makePost({ isPaid: true, characterCount: 5000 }),
        makePost({ isPaid: false, characterCount: 2000 }),
      ];
      const result = calculateSummary(posts, {});

      expect(result.totalPosts).toBe(3);
      expect(result.paidPostsCount).toBe(2);
      expect(result.totalPaidCharacterCount).toBe(8000);
    });

    it('カテゴリ別カウントが正しく集計される', () => {
      const posts = [
        makePost({ category: 'カテゴリA' }),
        makePost({ category: 'カテゴリA' }),
        makePost({ category: 'カテゴリB' }),
        makePost({ category: '' }), // 未設定
      ];
      const result = calculateSummary(posts, {});

      expect(result.categoryCounts['カテゴリA']).toBe(2);
      expect(result.categoryCounts['カテゴリB']).toBe(1);
      expect(result.categoryCounts['未設定']).toBe(1);
    });
  });

  describe('タググループ集計', () => {
    const tagToGroupMap = { Claude: 'AI系', GPT: 'AI系', TypeScript: 'プログラミング' };

    it.each([
      {
        desc: 'マッピングに一致するタグ',
        tags: ['Claude', 'TypeScript'],
        expected: { 'AI系': 1, 'プログラミング': 1 },
      },
      {
        desc: '同一グループの複数タグは1カウント',
        tags: ['Claude', 'GPT'],
        expected: { 'AI系': 1 },
      },
      {
        desc: '未知のタグは"その他"',
        tags: ['未知'],
        expected: { 'その他': 1 },
      },
      {
        desc: 'タグなし',
        tags: [],
        expected: { 'タグなし': 1 },
      },
    ])('$desc', ({ tags, expected }) => {
      const result = calculateSummary([makePost({ tags })], tagToGroupMap);
      Object.entries(expected).forEach(([group, count]) => {
        expect(result.tagGroupCounts[group]).toBe(count);
      });
    });
  });

  describe('境界値', () => {
    it('空配列 → 全フィールドが 0 または空', () => {
      const result = calculateSummary([], {});
      expect(result.totalPosts).toBe(0);
      expect(result.paidPostsCount).toBe(0);
      expect(result.totalPaidCharacterCount).toBe(0);
      expect(result.categoryCounts).toEqual({});
      expect(result.tagGroupCounts).toEqual({});
    });
  });
});

describe('formatSummaryToMarkdown', () => {
  const sampleSummary: SummaryData = {
    totalPosts: 10,
    paidPostsCount: 7,
    totalPaidCharacterCount: 50000,
    categoryCounts: { '記録・考察': 5, 'ClaudeMix ガイド': 5 },
    tagGroupCounts: { 'AI系': 8, 'プログラミング': 2 },
  };

  it('主要なセクションと数値が含まれる', () => {
    const result = formatSummaryToMarkdown(sampleSummary);
    const expectedContents = [
      '# ブログ記事サマリー',
      '10 件',
      '7 件',
      '50,000 文字',
      '## 📂 カテゴリー別記事数',
      '記録・考察',
      '## 🏷️ タググループ別記事数',
      'AI系',
    ];
    expectedContents.forEach(content => expect(result).toContain(content));
  });

  it('空の summary → 0件の統計を出力する', () => {
    const empty: SummaryData = {
      totalPosts: 0,
      paidPostsCount: 0,
      totalPaidCharacterCount: 0,
      categoryCounts: {},
      tagGroupCounts: {},
    };
    const result = formatSummaryToMarkdown(empty);
    expect(result).toContain('0 件');
  });
});
