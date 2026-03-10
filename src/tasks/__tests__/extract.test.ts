import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('fs/promises');
import fs from 'fs/promises';

import { extractPost } from '../extract';

function makeFrontmatter(overrides: Record<string, unknown> = {}): string {
  const fields = {
    title: 'テスト記事',
    description: '説明文',
    category: '記録・考察',
    tags: ['Claude', 'TypeScript'],
    slug: 'test-article',
    ...overrides,
  };
  const yaml = Object.entries(fields)
    .map(([k, v]) => {
      if (Array.isArray(v)) return `${k}:\n${v.map((i) => `  - ${i}`).join('\n')}`;
      return `${k}: ${JSON.stringify(v)}`;
    })
    .join('\n');
  return `---\n${yaml}\n---\n\n本文テキスト内容`;
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(fs.stat).mockResolvedValue({ mtime: new Date('2025-01-15T00:00:00Z') } as Awaited<ReturnType<typeof fs.stat>>);
});

describe('extractPost', () => {
  describe('正常系', () => {
    it('frontmatter の title, description, category, tags を正しく解析する', async () => {
      vi.mocked(fs.readFile).mockResolvedValue(makeFrontmatter() as never);

      const result = await extractPost('/blog/posts/article.md', '/blog');

      expect(result.title).toBe('テスト記事');
      expect(result.description).toBe('説明文');
      expect(result.category).toBe('記録・考察');
      expect(result.tags).toEqual(['Claude', 'TypeScript']);
    });

    it('path は basePath からの相対パスを返す', async () => {
      vi.mocked(fs.readFile).mockResolvedValue(makeFrontmatter() as never);

      const result = await extractPost('/blog/posts/sub/article.md', '/blog');

      expect(result.path).toBe('posts/sub/article.md');
    });

    it('characterCount は空白を除いた本文文字数を返す', async () => {
      const body = 'A B C\nD E F'; // スペース・改行を除いた文字数 = 6
      const content = `---\ntitle: テスト\ncategory: カテゴリ\n---\n\n${body}`;
      vi.mocked(fs.readFile).mockResolvedValue(content as never);

      const result = await extractPost('/blog/article.md', '/blog');

      expect(result.characterCount).toBe(6);
    });

    it('updatedAt が frontmatter に存在する場合 → lastModified に使用される', async () => {
      vi.mocked(fs.readFile).mockResolvedValue(
        makeFrontmatter({ updatedAt: '2025-06-01' }) as never
      );

      const result = await extractPost('/blog/article.md', '/blog');

      expect(result.lastModified).toBe('2025-06-01');
    });

    it('updatedAt が frontmatter にない場合 → fs.stat の mtime を使用する', async () => {
      vi.mocked(fs.readFile).mockResolvedValue(makeFrontmatter() as never);

      const result = await extractPost('/blog/article.md', '/blog');

      expect(result.lastModified).toBe('2025-01-15T00:00:00.000Z');
    });
  });

  describe('isPaid 判定', () => {
    it('publicCategories に含まれるカテゴリ + freeContentHeading なし → isPaid=false', async () => {
      vi.mocked(fs.readFile).mockResolvedValue(
        makeFrontmatter({ category: 'ClaudeMix ガイド' }) as never
      );

      const result = await extractPost('/blog/article.md', '/blog', ['ClaudeMix ガイド']);

      expect(result.isPaid).toBe(false);
    });

    it('publicCategories に含まれないカテゴリ → isPaid=true', async () => {
      vi.mocked(fs.readFile).mockResolvedValue(
        makeFrontmatter({ category: '記録・考察' }) as never
      );

      const result = await extractPost('/blog/article.md', '/blog', ['ClaudeMix ガイド']);

      expect(result.isPaid).toBe(true);
    });

    it('publicCategories に含まれる + freeContentHeading あり → isPaid=true（部分有料）', async () => {
      vi.mocked(fs.readFile).mockResolvedValue(
        makeFrontmatter({ category: 'ClaudeMix ガイド', freeContentHeading: '有料セクション' }) as never
      );

      const result = await extractPost('/blog/article.md', '/blog', ['ClaudeMix ガイド']);

      expect(result.isPaid).toBe(true);
    });

    it('publicCategories が空配列 → isPaid=true（全て有料扱い）', async () => {
      vi.mocked(fs.readFile).mockResolvedValue(
        makeFrontmatter({ category: '記録・考察' }) as never
      );

      const result = await extractPost('/blog/article.md', '/blog', []);

      expect(result.isPaid).toBe(true);
    });
  });

  describe('オプションフィールド', () => {
    it('paywall=true が frontmatter にある場合 → paywall=true を返す', async () => {
      vi.mocked(fs.readFile).mockResolvedValue(
        makeFrontmatter({ paywall: true }) as never
      );

      const result = await extractPost('/blog/article.md', '/blog');

      expect(result.paywall).toBe(true);
    });

    it('jsonLd=true が frontmatter にある場合 → jsonLd=true を返す', async () => {
      vi.mocked(fs.readFile).mockResolvedValue(
        makeFrontmatter({ jsonLd: true }) as never
      );

      const result = await extractPost('/blog/article.md', '/blog');

      expect(result.jsonLd).toBe(true);
    });

    it('tags が frontmatter にない場合 → 空配列を返す', async () => {
      const content = '---\ntitle: タイトル\ncategory: カテゴリ\n---\n\n本文';
      vi.mocked(fs.readFile).mockResolvedValue(content as never);

      const result = await extractPost('/blog/article.md', '/blog');

      expect(result.tags).toEqual([]);
    });
  });
});
