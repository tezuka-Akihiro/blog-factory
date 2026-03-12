import { BlogPost, SummaryData } from '../types';

export function calculateSummary(
  articles: BlogPost[],
  tagToGroupMap: Record<string, string>
): SummaryData {
  const summary: SummaryData = {
    totalPosts: articles.length,
    categoryCounts: {},
    tagGroupCounts: {},
    paidPostsCount: 0,
    totalPaidCharacterCount: 0,
  };

  for (const article of articles) {
    const category = article.category || '未設定';
    summary.categoryCounts[category] = (summary.categoryCounts[category] || 0) + 1;

    if (article.isPaid) {
      summary.paidPostsCount++;
      summary.totalPaidCharacterCount += article.characterCount;
    }

    const groupsInArticle = new Set<string>();
    if (article.tags.length > 0) {
      for (const tag of article.tags) {
        const group = tagToGroupMap[tag] ?? 'その他';
        groupsInArticle.add(group);
      }
    } else {
      groupsInArticle.add('タグなし');
    }

    for (const group of groupsInArticle) {
      summary.tagGroupCounts[group] = (summary.tagGroupCounts[group] || 0) + 1;
    }
  }

  return summary;
}

export function formatSummaryToMarkdown(summary: SummaryData): string {
  const now = new Date().toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' });
  let md = `# ブログ記事サマリー\n\n`;
  md += `生成日時: ${now}\n\n`;

  md += `## 📊 全体統計\n\n`;
  md += `| 項目 | 数値 |\n`;
  md += `| :--- | :--- |\n`;
  md += `| 記事総数 | ${summary.totalPosts} 件 |\n`;
  md += `| 有料記事数 | ${summary.paidPostsCount} 件 |\n`;
  md += `| 有料記事の総文字数 | ${summary.totalPaidCharacterCount.toLocaleString()} 文字 |\n\n`;

  md += `## 📂 カテゴリー別記事数\n\n`;
  const categories = Object.keys(summary.categoryCounts).sort();
  for (const cat of categories) {
    md += `- **${cat}**: ${summary.categoryCounts[cat]} 件\n`;
  }
  md += '\n';

  md += `## 🏷️ タググループ別記事数\n\n`;
  const groups = Object.keys(summary.tagGroupCounts).sort();
  for (const group of groups) {
    md += `- **${group}**: ${summary.tagGroupCounts[group]} 件\n`;
  }

  return md;
}
