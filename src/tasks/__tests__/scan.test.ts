import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Dirent } from 'fs';

vi.mock('fs/promises');
import { readdir } from 'fs/promises';

import { scanFiles } from '../scan';

function makeDirent(name: string, isDir: boolean): Dirent {
  return {
    name,
    isDirectory: () => isDir,
    isFile: () => !isDir,
    isBlockDevice: () => false,
    isCharacterDevice: () => false,
    isFIFO: () => false,
    isSocket: () => false,
    isSymbolicLink: () => false,
    path: '',
    parentPath: '',
  } as Dirent;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('scanFiles', () => {
  describe('正常系', () => {
    it('.md ファイルのみを返す', async () => {
      vi.mocked(readdir).mockResolvedValue([
        makeDirent('article.md', false),
        makeDirent('image.png', false),
        makeDirent('data.json', false),
      ] as Awaited<ReturnType<typeof readdir>>);

      const result = await scanFiles('/blog');

      expect(result).toEqual(['/blog/article.md']);
    });

    it('.mdx ファイルも対象に含める', async () => {
      vi.mocked(readdir).mockResolvedValue([
        makeDirent('article.md', false),
        makeDirent('page.mdx', false),
      ] as Awaited<ReturnType<typeof readdir>>);

      const result = await scanFiles('/blog');

      expect(result).toHaveLength(2);
      expect(result).toContain('/blog/article.md');
      expect(result).toContain('/blog/page.mdx');
    });

    it('サブディレクトリを再帰的に走査する', async () => {
      vi.mocked(readdir)
        .mockResolvedValueOnce([
          makeDirent('subdir', true),
        ] as Awaited<ReturnType<typeof readdir>>)
        .mockResolvedValueOnce([
          makeDirent('article.md', false),
        ] as Awaited<ReturnType<typeof readdir>>);

      const result = await scanFiles('/blog');

      expect(result).toEqual(['/blog/subdir/article.md']);
    });

    it('複数階層のネストを正しく走査する', async () => {
      vi.mocked(readdir)
        .mockResolvedValueOnce([
          makeDirent('level1', true),
        ] as Awaited<ReturnType<typeof readdir>>)
        .mockResolvedValueOnce([
          makeDirent('level2', true),
        ] as Awaited<ReturnType<typeof readdir>>)
        .mockResolvedValueOnce([
          makeDirent('deep.md', false),
        ] as Awaited<ReturnType<typeof readdir>>);

      const result = await scanFiles('/root');

      expect(result).toEqual(['/root/level1/level2/deep.md']);
    });
  });

  describe('除外ルール', () => {
    it('node_modules ディレクトリは除外される', async () => {
      vi.mocked(readdir).mockResolvedValue([
        makeDirent('node_modules', true),
        makeDirent('article.md', false),
      ] as Awaited<ReturnType<typeof readdir>>);

      const result = await scanFiles('/blog');

      expect(result).toEqual(['/blog/article.md']);
      // node_modules に対して readdir が追加で呼ばれないこと
      expect(readdir).toHaveBeenCalledTimes(1);
    });

    it('.txt ファイルは含まれない', async () => {
      vi.mocked(readdir).mockResolvedValue([
        makeDirent('note.txt', false),
        makeDirent('readme.md', false),
      ] as Awaited<ReturnType<typeof readdir>>);

      const result = await scanFiles('/blog');

      expect(result).toEqual(['/blog/readme.md']);
    });
  });

  describe('境界値', () => {
    it('空ディレクトリ → 空配列を返す', async () => {
      vi.mocked(readdir).mockResolvedValue([] as Awaited<ReturnType<typeof readdir>>);

      const result = await scanFiles('/empty');

      expect(result).toEqual([]);
    });

    it('.md ファイルのみのディレクトリ → 全ファイルを返す', async () => {
      vi.mocked(readdir).mockResolvedValue([
        makeDirent('a.md', false),
        makeDirent('b.md', false),
        makeDirent('c.md', false),
      ] as Awaited<ReturnType<typeof readdir>>);

      const result = await scanFiles('/blog');

      expect(result).toHaveLength(3);
    });
  });
});
