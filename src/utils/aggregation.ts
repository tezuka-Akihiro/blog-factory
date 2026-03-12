import { BlogPost } from '../types';

/**
 * カテゴリーごとに記事数をカウントする
 */
export function countArticlesByCategory(articles: BlogPost[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const article of articles) {
    const category = article.category || '未設定';
    counts[category] = (counts[category] || 0) + 1;
  }
  return counts;
}

/**
 * 直近 N 日間に更新または公開された記事を抽出する
 */
export function filterRecentArticles(articles: BlogPost[], days: number): BlogPost[] {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);
  // 時間を 00:00:00.000 にリセット（必要に応じて調整）
  // ただし、Date オブジェクトの比較なのでそのままでも良い
  // メモリの情報に基づくと 30日前を含めるロジックがある

  return articles.filter((a) => {
    const d = a.lastModified ? new Date(a.lastModified) : new Date(a.publishedAt || 0);
    return d >= cutoffDate;
  });
}
