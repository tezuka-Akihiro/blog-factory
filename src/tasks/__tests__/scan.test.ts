import { describe, it, expect, vi, beforeEach } from 'vitest';
import { readdir } from 'fs/promises';
import { scanFiles } from '../scan';
import { normalizePath } from '../../utils/fs';

import { makeDirent } from './test-utils';


vi.mock('fs/promises');

beforeEach(() => {
  vi.clearAllMocks();
});

describe('scanFiles', () => {
  describe('正常系', () => {
    it.each([
      {
        name: '.md ファイルのみを返す',
        entries: [
          makeDirent('article.md', false),
          makeDirent('image.png', false),
          makeDirent('data.json', false),
        ],
        expected: ['/blog/article.md'],
      },
      {
        name: '.mdx ファイルも対象に含める',
        entries: [
          makeDirent('article.md', false),
          makeDirent('page.mdx', false),
        ],
        expected: ['/blog/article.md', '/blog/page.mdx'],
      },
    ])('$name', async ({ entries, expected }) => {
      vi.mocked(readdir).mockResolvedValue(entries as any);
      const result = await scanFiles('/blog');
      expect(result.map(normalizePath)).toEqual(expected);
    });

    it('サブディレクトリを再帰的に走査する', async () => {
      vi.mocked(readdir)
        .mockResolvedValueOnce([makeDirent('subdir', true)] as any)
        .mockResolvedValueOnce([makeDirent('article.md', false)] as any);

      const result = await scanFiles('/blog');
      expect(result.map(normalizePath)).toEqual(['/blog/subdir/article.md']);
    });

    it('複数階層のネストを正しく走査する', async () => {
      vi.mocked(readdir)
        .mockResolvedValueOnce([makeDirent('level1', true)] as any)
        .mockResolvedValueOnce([makeDirent('level2', true)] as any)
        .mockResolvedValueOnce([makeDirent('deep.md', false)] as any);

      const result = await scanFiles('/root');
      expect(result.map(normalizePath)).toEqual(['/root/level1/level2/deep.md']);
    });
  });

  describe('除外ルール', () => {
    it('node_modules ディレクトリは除外される', async () => {
      vi.mocked(readdir).mockResolvedValue([
        makeDirent('node_modules', true),
        makeDirent('article.md', false),
      ] as any);

      const result = await scanFiles('/blog');
      expect(result.map(normalizePath)).toEqual(['/blog/article.md']);
      expect(readdir).toHaveBeenCalledTimes(1);
    });

    it('.txt ファイルは含まれない', async () => {
      vi.mocked(readdir).mockResolvedValue([
        makeDirent('note.txt', false),
        makeDirent('readme.md', false),
      ] as any);

      const result = await scanFiles('/blog');
      expect(result.map(normalizePath)).toEqual(['/blog/readme.md']);
    });
  });

  describe('境界値', () => {
    it('空ディレクトリ → 空配列を返す', async () => {
      vi.mocked(readdir).mockResolvedValue([] as any);
      const result = await scanFiles('/empty');
      expect(result).toEqual([]);
    });

    it('.md ファイルのみのディレクトリ → 全ファイルを返す', async () => {
      vi.mocked(readdir).mockResolvedValue([
        makeDirent('a.md', false),
        makeDirent('b.md', false),
        makeDirent('c.md', false),
      ] as any);

      const result = await scanFiles('/blog');
      expect(result).toHaveLength(3);
    });
  });
});
