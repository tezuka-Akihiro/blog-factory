export interface BlogPost {
  title: string;
  description: string;
  category: string;
  path: string; // ファイル特定用
  lastModified?: string;
  isPaid: boolean;
  characterCount: number;
  tags: string[];
}

export interface SummaryData {
  totalPosts: number;
  categoryCounts: Record<string, number>;
  tagGroupCounts: Record<string, number>;
  paidPostsCount: number;
  totalPaidCharacterCount: number;
}

export interface InspectionResult {
  inspectedAt: string;
  category: string;
  totalCount: number;
  articles: BlogPost[];
}