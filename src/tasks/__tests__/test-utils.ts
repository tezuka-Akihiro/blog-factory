import type { Dirent } from 'fs';
import { BlogPost } from '../../types';

export function makeDirent(name: string, isDir: boolean): Dirent {
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

export function makePost(overrides: Partial<BlogPost> = {}): BlogPost {
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

export function makeFrontmatter(overrides: Record<string, unknown> = {}): string {
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
      if (v === undefined) return '';
      return `${k}: ${JSON.stringify(v)}`;
    })
    .filter(line => line !== '')
    .join('\n');
  return `---\n${yaml}\n---\n\n本文テキスト内容`;
}
