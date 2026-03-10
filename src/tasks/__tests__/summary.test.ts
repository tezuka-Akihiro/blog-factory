import { describe, it, expect } from 'vitest';
import { calculateSummary, formatSummaryToMarkdown } from '../summary';
import { BlogPost, SummaryData } from '../../types';

function makePost(overrides: Partial<BlogPost>): BlogPost {
  return {
    title: 'テスト記事',
    description: '説明',
    category: '記録・考察',
    path: '/posts/test.md',
    isPaid: true,
    characterCount: 2000,
    tags: ['Claude'],
    body: '本文',
    slug: 'test',
    ...overrides,
  };
}

describe('calculateSummary', () => {
  describe('正常系', () => {
    it('isPaid=true の記事 → paidPostsCount と totalPaidCharacterCount に加算される', () => {
      const posts = [
        makePost({ isPaid: true, characterCount: 3000 }),
        makePost({ isPaid: true, characterCount: 5000 }),
      ];
      const result = calculateSummary(posts, {});

      expect(result.paidPostsCount).toBe(2);
      expect(result.totalPaidCharacterCount).toBe(8000);
    });

    it('isPaid=false の記事 → paidPostsCount に加算されない', () => {
      const posts = [
        makePost({ isPaid: false, characterCount: 2000 }),
        makePost({ isPaid: true, characterCount: 4000 }),
      ];
      const result = calculateSummary(posts, {});

      expect(result.paidPostsCount).toBe(1);
      expect(result.totalPaidCharacterCount).toBe(4000);
    });

    it('totalPosts は isPaid に関わらず全記事数を返す', () => {
      const posts = [
        makePost({ isPaid: false }),
        makePost({ isPaid: true }),
        makePost({ isPaid: true }),
      ];
      const result = calculateSummary(posts, {});

      expect(result.totalPosts).toBe(3);
    });

    it('カテゴリ別カウントが正しく集計される', () => {
      const posts = [
        makePost({ category: 'カテゴリA' }),
        makePost({ category: 'カテゴリA' }),
        makePost({ category: 'カテゴリB' }),
      ];
      const result = calculateSummary(posts, {});

      expect(result.categoryCounts['カテゴリA']).toBe(2);
      expect(result.categoryCounts['カテゴリB']).toBe(1);
    });
  });

  describe('タググループ集計', () => {
    it('tagToGroupMap に一致するタグ → 対応グループにカウントされる', () => {
      const tagToGroupMap = { Claude: 'AI系', TypeScript: 'プログラミング' };
      const posts = [
        makePost({ tags: ['Claude'] }),
        makePost({ tags: ['TypeScript'] }),
        makePost({ tags: ['Claude'] }),
      ];
      const result = calculateSummary(posts, tagToGroupMap);

      expect(result.tagGroupCounts['AI系']).toBe(2);
      expect(result.tagGroupCounts['プログラミング']).toBe(1);
    });

    it('tagToGroupMap にないタグ → "その他" グループに集計される', () => {
      const posts = [makePost({ tags: ['未知のタグ'] })];
      const result = calculateSummary(posts, {});

      expect(result.tagGroupCounts['その他']).toBe(1);
    });

    it('タグが空配列 → "タグなし" グループに集計される', () => {
      const posts = [makePost({ tags: [] })];
      const result = calculateSummary(posts, {});

      expect(result.tagGroupCounts['タグなし']).toBe(1);
    });

    it('複数タグのうち同じグループのものは 1記事として 1カウント', () => {
      const tagToGroupMap = { Claude: 'AI系', GPT: 'AI系' };
      const posts = [makePost({ tags: ['Claude', 'GPT'] })];
      const result = calculateSummary(posts, tagToGroupMap);

      // 同一記事が同一グループに属するタグを複数持っても 1カウント
      expect(result.tagGroupCounts['AI系']).toBe(1);
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

    it('category が未設定 → "未設定" カテゴリに集計される', () => {
      const posts = [makePost({ category: '' })];
      const result = calculateSummary(posts, {});

      // category が falsy な場合は '未設定' になる
      expect(result.categoryCounts['未設定']).toBe(1);
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

  it('ヘッダー "# ブログ記事サマリー" を含む', () => {
    const result = formatSummaryToMarkdown(sampleSummary);
    expect(result).toContain('# ブログ記事サマリー');
  });

  it('記事総数が出力に含まれる', () => {
    const result = formatSummaryToMarkdown(sampleSummary);
    expect(result).toContain('10 件');
  });

  it('有料記事数が出力に含まれる', () => {
    const result = formatSummaryToMarkdown(sampleSummary);
    expect(result).toContain('7 件');
  });

  it('有料記事の総文字数が出力に含まれる', () => {
    const result = formatSummaryToMarkdown(sampleSummary);
    expect(result).toContain('50,000 文字');
  });

  it('カテゴリー別セクションが出力に含まれる', () => {
    const result = formatSummaryToMarkdown(sampleSummary);
    expect(result).toContain('## 📂 カテゴリー別記事数');
    expect(result).toContain('記録・考察');
    expect(result).toContain('ClaudeMix ガイド');
  });

  it('タググループ別セクションが出力に含まれる', () => {
    const result = formatSummaryToMarkdown(sampleSummary);
    expect(result).toContain('## 🏷️ タググループ別記事数');
    expect(result).toContain('AI系');
    expect(result).toContain('プログラミング');
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
