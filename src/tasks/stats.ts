import { BlogPost, BlogStats } from '../types';

function stripMarkdown(text: string): number {
  const stripped = text
    .replace(/!\[.*?\]\(.*?\)/g, '')
    .replace(/\[(.*?)\]\(.*?\)/g, '$1')
    .replace(/[#*_\-~`>|]/g, '')
    .replace(/\s/g, '');
  return stripped.length;
}

export function calculateStats(articles: BlogPost[]): BlogStats {
  const stats: BlogStats = {
    categories: {},
    total: {
      count: 0,
      paidCount: 0,
      premiumChars: 0,
    },
    updatedAt: new Date().toISOString(),
  };

  for (const article of articles) {
    const category = article.category || 'Uncategorized';

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

    if (!stats.categories[category]) {
      stats.categories[category] = { count: 0, premiumChars: 0 };
    }

    stats.categories[category].count++;
    stats.categories[category].premiumChars += premiumChars;

    stats.total.count++;
    stats.total.premiumChars += premiumChars;
  }

  return stats;
}
