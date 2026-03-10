import { describe, it, expect, vi, beforeEach } from 'vitest';
import fs from 'fs/promises';
import { extractPost } from '../extract';
import { makeFrontmatter } from './test-utils';

vi.mock('fs/promises');

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(fs.stat).mockResolvedValue({ mtime: new Date('2025-01-15T00:00:00Z') } as any);
});

describe('extractPost', () => {
  describe('正常系', () => {
    it('frontmatter の主要フィールドを正しく解析する', async () => {
      vi.mocked(fs.readFile).mockResolvedValue(makeFrontmatter({
        title: 'テスト記事',
        description: '説明文',
        category: '記録・考察',
        tags: ['Claude', 'TypeScript'],
      }));

      const result = await extractPost('/blog/posts/article.md', '/blog');

      expect(result).toMatchObject({
        title: 'テスト記事',
        description: '説明文',
        category: '記録・考察',
        tags: ['Claude', 'TypeScript'],
      });
    });

    it('path は basePath からの相対パスを返す', async () => {
      vi.mocked(fs.readFile).mockResolvedValue(makeFrontmatter());
      const result = await extractPost('/blog/posts/sub/article.md', '/blog');
      expect(result.path).toBe('posts/sub/article.md');
    });

    it('characterCount は空白を除いた本文文字数を返す', async () => {
      const body = 'A B C\nD E F'; // スペース・改行を除いた文字数 = 6
      const content = `---\ntitle: テスト\ncategory: カテゴリ\n---\n\n${body}`;
      vi.mocked(fs.readFile).mockResolvedValue(content);

      const result = await extractPost('/blog/article.md', '/blog');
      expect(result.characterCount).toBe(6);
    });

    it.each([
      {
        desc: 'updatedAt がある場合はそれを使用する',
        overrides: { updatedAt: '2025-06-01' },
        expected: '2025-06-01',
      },
      {
        desc: 'updatedAt がない場合は fs.stat の mtime を使用する',
        overrides: { updatedAt: undefined },
        expected: '2025-01-15T00:00:00.000Z',
      },
    ])('$desc', async ({ overrides, expected }) => {
      vi.mocked(fs.readFile).mockResolvedValue(makeFrontmatter(overrides));
      const result = await extractPost('/blog/article.md', '/blog');
      expect(result.lastModified).toBe(expected);
    });
  });

  describe('isPaid 判定', () => {
    it.each([
      {
        desc: 'publicCategories 内 + freeContentHeading なし → false',
        overrides: { category: 'ClaudeMix ガイド' },
        publicCats: ['ClaudeMix ガイド'],
        expected: false,
      },
      {
        desc: 'publicCategories 外 → true',
        overrides: { category: '記録・考察' },
        publicCats: ['ClaudeMix ガイド'],
        expected: true,
      },
      {
        desc: 'publicCategories 内 + freeContentHeading あり → true',
        overrides: { category: 'ClaudeMix ガイド', freeContentHeading: '有料セクション' },
        publicCats: ['ClaudeMix ガイド'],
        expected: true,
      },
      {
        desc: 'publicCategories が空 → true',
        overrides: { category: '記録・考察' },
        publicCats: [],
        expected: true,
      },
    ])('$desc', async ({ overrides, publicCats, expected }) => {
      vi.mocked(fs.readFile).mockResolvedValue(makeFrontmatter(overrides));
      const result = await extractPost('/blog/article.md', '/blog', publicCats);
      expect(result.isPaid).toBe(expected);
    });
  });

  describe('オプションフィールド', () => {
    it.each([
      { field: 'paywall', value: true },
      { field: 'jsonLd', value: true },
    ])('$field=$value がある場合に正しく反映される', async ({ field, value }) => {
      vi.mocked(fs.readFile).mockResolvedValue(makeFrontmatter({ [field]: value }));
      const result = await extractPost('/blog/article.md', '/blog');
      expect((result as any)[field]).toBe(value);
    });

    it('tags が frontmatter にない場合 → 空配列を返す', async () => {
      const content = '---\ntitle: タイトル\ncategory: カテゴリ\n---\n\n本文';
      vi.mocked(fs.readFile).mockResolvedValue(content);
      const result = await extractPost('/blog/article.md', '/blog');
      expect(result.tags).toEqual([]);
    });
  });
});
