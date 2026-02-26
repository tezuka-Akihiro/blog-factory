import { BlogPost, BlogStats } from '../types';

/**
 * Strips markdown symbols and whitespace to count "real" characters.
 */
function stripMarkdown(text: string): number {
  const stripped = text
    .replace(/!\[.*?\]\(.*?\)/g, '') // Remove images
    .replace(/\[(.*?)\]\(.*?\)/g, '$1') // Remove links, keep text
    .replace(/[#*_\-~`>|]/g, '') // Remove common MD symbols
    .replace(/\s/g, ''); // Remove all whitespace
  return stripped.length;
}

/**
 * Calculates blog statistics based on the provided articles.
 */
export function calculateStats(articles: BlogPost[]): BlogStats {
  const stats: BlogStats = {
    categories: {},
    total: {
      count: 0,
      premiumChars: 0,
    },
    updatedAt: new Date().toISOString(),
  };

  for (const article of articles) {
    const category = article.category || 'Uncategorized';

    // 3.1 Paid article identification logic
    // - Frontmatter has paywall: true
    // - Category name contains "ClaudeMix"
    const isPaidForStats = article.paywall === true || category.includes('ClaudeMix');

    let premiumChars = 0;
    if (isPaidForStats) {
      let paidContent = article.body;

      // 3.2 If freeContentHeading exists, paid part starts from that heading
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
