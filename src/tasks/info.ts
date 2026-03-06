import { BlogPost } from '../types';

export function formatInfoList(articles: BlogPost[]): string {
  const now = new Date().toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' });
  let md = `# インフォメーション記事一覧\n\n`;
  md += `生成日時: ${now}\n\n`;

  if (articles.length === 0) {
    md += `インフォメーションカテゴリの記事は見つかりませんでした。\n`;
    return md;
  }

  for (const article of articles) {
    md += `## ${article.title}\n`;
    md += `- **概要**: ${article.description}\n`;
    md += `- **パス**: ${article.path}\n\n`;
  }

  return md;
}
