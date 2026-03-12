import { BlogPost, BlogStats } from '../types';
import { countArticlesByCategory } from '../utils/aggregation';

function stripMarkdown(text: string): number {
  const stripped = text
    .replace(/!\[.*?\]\(.*?\)/g, '')
    .replace(/\[(.*?)\]\(.*?\)/g, '$1')
    .replace(/[#*_\-~`>|]/g, '')
    .replace(/\s/g, '');
  return stripped.length;
}

export function calculateStats(articles: BlogPost[]): BlogStats {
  const categoryCounts = countArticlesByCategory(articles);
  const stats: BlogStats = {
    categories: Object.keys(categoryCounts).reduce((acc, cat) => {
      acc[cat] = { count: categoryCounts[cat] || 0, premiumChars: 0 };
      return acc;
    }, {} as BlogStats['categories']),
    total: {
      count: 0,
      paidCount: 0,
      premiumChars: 0,
    },
    updatedAt: new Date().toISOString(),
  };

  for (const article of articles) {
    const category = article.category || '未設定';

    const isPaidForStats = article.paywall === true || category.includes('ClaudeMix');

    let premiumChars = 0;
    if (isPaidForStats) {
      stats.total.paidCount++;
      let paidContent = article.body;

      if (article.freeContentHeading) {
        const escapedHeading = article.freeContentHeading.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const headingRegex = new RegExp(`^#{1,6}\\s+${escapedHeading}`, 'm');
        const match = article.body.match(headingRegex);
        if (match && match.index !== undefined) {
          paidContent = article.body.substring(match.index);
        }
      }
      premiumChars = stripMarkdown(paidContent);
    }

    stats.categories[category]!.premiumChars += premiumChars;

    stats.total.count++;
    stats.total.premiumChars += premiumChars;
  }

  return stats;
}
